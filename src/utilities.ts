import { deleteNOTAM, selectAirportNOTAM, updateAirportNextPollNOTAM, upsertNOTAM } from "./supabase"
import { type TAFJson, type METARJson, type AirportFormValues, type AirportData, codeHighlights, type NotamsResponse, type NotamEntry, type AirportsResourceResponse, type FetchResult, type SupabaseAirport } from "./types"

export const PATH_AIRPORTS = "https://airportsapi.com/api/airports"
export const PATH_NOTAM = "/api/reports/notam"
export const PATH_TAF = '/api/reports/taf'
export const PATH_METAR = '/api/reports/metar'
export const SVG_URLS = {
  logo: '/flygvader-logo.svg',
  highlight: '/ui/underline-text-editor-svgrepo-com.svg',
  search: '/ui/browse-svgrepo-com.svg',
  close: '/ui/close-lg-svgrepo-com.svg',
  reload: '/ui/reload-svgrepo-com.svg',
} as const;

export const searchAirportId = "search-airport"
export const POLL_INTERVAL_TAF_METAR = 1 * 30 * 1000;
export const POLL_INTERVAL_NOTAM = 24 * 60 * 60 * 1000

export const fetchTAF = async (values: AirportFormValues): Promise<TAFJson[]> => {
  const params = new URLSearchParams({
    ids: values.icaoId,
    format: "json",
    date: values.useDatetime && values.date && values.time ? `${values.date.replaceAll("-", "")}_${values.time.replace(":", "")}` : ""
  })

  const response = await fetch(`${PATH_TAF}?${params}`)

  if (response.status === 204) {
    throw new Error(`No TAF available for ${values.icaoId}${values.date && values.time ? ` at ${values.date} ${values.time}` : ""}\n`)
  }

  if (!response.ok) {
    throw new Error(`TAF request for ${values.icaoId}${values.date && values.time ? ` at ${values.date} ${values.time} ` : ""} failed with status ${response.status}\n`)
  }

  return await response.json()
}

export const fetchMETAR = async (values: AirportFormValues): Promise<METARJson[]> => {
  const params = new URLSearchParams({
    ids: values.icaoId,
    format: "json",
    hours: "5"
  })

  const response = await fetch(`${PATH_METAR}?${params}`)

  if (response.status === 204) {
    throw new Error(`No METAR available for ${values.icaoId}\n`)
  }

  if (!response.ok) {
    throw new Error(`METAR request for ${values.icaoId} failed with status ${response.status}\n`)
  }

  let METAR: METARJson[] = await response.json()

  try {
    METAR.sort((a, b) =>
      Date.parse(b.receiptTime) -
      Date.parse(a.receiptTime))
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "There was an unexpected error while sorting METAR")
  }

  return METAR
}

export const fetchNOTAMs = async (values: AirportFormValues): Promise<NotamEntry[]> => {
  const params = new URLSearchParams({
    icao: values.icaoId,
    includeFIR: String(values.notamIncludeFIR),
    includeFuture: String(values.notamIncludeFuture)
  })

  const response = await fetch(`${PATH_NOTAM}?${params}`)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const result: NotamsResponse = await response.json();
  return result.notams
}

export const fetchAirports = async (name: string): Promise<AirportsResourceResponse> => {
  const params = new URLSearchParams({
    "filter[name]": name
  })

  const response = await fetch(`${PATH_AIRPORTS}?${params}`)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const fetchAirportsPage = async (link: string): Promise<AirportsResourceResponse> => {
  const response = await fetch(link)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const capture = async<T>(
  request: () => Promise<T>
): Promise<FetchResult<T>> => {
  try {
    return {
      data: await request(),
      message: ""
    };
  } catch (error) {
    return {
      data: undefined,
      message: error instanceof Error
        ? error.message
        : `There was unexpected error while executing ${request.name}`
    };
  }
}

export const captureSyncNOTAM = async (
  NOTAM: NotamEntry[],
  airport: AirportData,
  nextPollNOTAM: number
): Promise<string> => {
  if (!airport.supabaseId) {
    return airport.id === searchAirportId
      ? ""
      : "Airport is missing supabaseId"
  }

  const deleted = await capture(
    () => deleteNOTAM(airport.supabaseId!),
  )

  const upserted = await capture(
    () => upsertNOTAM(NOTAM, airport.supabaseId!),
  )

  const updated = await capture(
    () => updateAirportNextPollNOTAM(airport.formValues.icaoId, nextPollNOTAM),
  )

  return deleted.message + upserted.message + updated.message
}

export const refreshAirports = async (supabaseAirports: SupabaseAirport[]): Promise<AirportData[]> => {
  const now = Date.now()

  return await Promise.all(supabaseAirports.map(async airport => {
    const formValues: AirportFormValues = {
      icaoId: airport.icao,
      useDatetime: false,
      notamIncludeFIR: false,
      notamIncludeFuture: true
    }

    const fetchFreshNOTAM = airport.next_poll_notam <= now

    const [TAF, METAR] = await Promise.all([
      await capture(() => fetchTAF(formValues)),
      await capture(() => fetchMETAR(formValues)),
    ])

    let NOTAM = fetchFreshNOTAM
      ? await capture(() => fetchNOTAMs(formValues))
      : { data: undefined, message: "" }

    let nextPollNOTAM = airport.next_poll_notam

    if (!NOTAM.data) {
      NOTAM.data = await selectAirportNOTAM(airport.id)
    } else {
      nextPollNOTAM = now + POLL_INTERVAL_NOTAM
      await deleteNOTAM(airport.id)
      await upsertNOTAM(NOTAM.data, airport.id)
      await updateAirportNextPollNOTAM(airport.icao, nextPollNOTAM)
    }

    return {
      id: crypto.randomUUID(),
      icaoId: airport.icao,
      formValues: formValues,
      TAF: TAF.data ? TAF.data : [],
      METAR: METAR.data ? METAR.data : [],
      NOTAM: NOTAM.data ? NOTAM.data : [],
      messages: TAF.message + METAR.message + NOTAM.message,
      nextPollReports: Date.now() + POLL_INTERVAL_TAF_METAR,
      nextPollNOTAM: nextPollNOTAM,
      isLoading: false,
      supabaseId: airport.id
    }
  }))
}

export const createAirport = (id: string): AirportData => {
  return {
    id: id,
    formValues: {
      icaoId: "",
      useDatetime: false,
      date: "",
      time: "",
      notamIncludeFIR: false,
      notamIncludeFuture: true
    },
    TAF: [],
    METAR: [],
    NOTAM: [],
    messages: "",
    nextPollReports: Date.now() + POLL_INTERVAL_TAF_METAR,
    nextPollNOTAM: Date.now(),
    isLoading: false
  }
}

export const resolveHighlights = (classes: string[]) =>
  codeHighlights.filter(highlight => classes.includes(highlight.class));

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === "string");

export const formatRawCodes = (raw: string) => {
  const visibilityRegEx = codeHighlights.find(
    highlight => highlight.label === "visibility"
  )?.regEx;

  const codes = raw.trim().split(/\s+/);
  const formatted: string[] = [];

  for (let index = 0; index < codes.length; index++) {
    const nextCode = codes[index + 1];
    const combined = nextCode ? `${codes[index]} ${nextCode}` : "";
    const isCombinedCode = visibilityRegEx?.test(combined) ?? false;

    if (isCombinedCode) {
      formatted.push(combined);
      index++;
    } else {
      formatted.push(codes[index]);
    }
  }

  return formatted;
};

export const getOpeningHours = (notams: NotamEntry[]): string => {
  const now = Date.now()

  const candidates = notams.filter(notam => {
    if (!notam.effective || !notam.expiration) return false
    // if (notam.q_code !== "QFAAH") return false

    const effective = parseSkylinkDate(notam.effective)
    const expiration = parseSkylinkDate(notam.expiration)

    return effective <= now && expiration >= now
  })

  const goodEnough = candidates.find(notam => notam.body?.startsWith("AERODROME OPERATING HOURS"))
  return goodEnough?.body ?? "OPERATING HOURS NOT AVAILABLE"
  // return candidates.at(0)?.body ?? undefined
}

export const parseSkylinkDate = (value: string): number => {
  return Date.UTC(
    Number(value.slice(0, 4)),      // year
    Number(value.slice(4, 6)) - 1,  // month is zero-based
    Number(value.slice(6, 8)),      // day
    Number(value.slice(8, 10)),     // hour
    Number(value.slice(10, 12))     // minute
  )
}
