import { type TAFJson, type METARJson, type AirportFormValues, type AirportData, codeHighlights, type NotamsResponse, type NotamEntry, type AirportResource, type AirportsResourceResponse } from "./types"

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
export const searchAirportIndex = 999;

export const fetchTAF = async (values: AirportFormValues): Promise<[TAFJson[], string]> => {
  const params = new URLSearchParams({
    ids: values.icaoId,
    format: "json",
    date: values.useDatetime && values.date && values.time ? `${values.date.replaceAll("-", "")}_${values.time.replace(":", "")}` : ""
  })

  const response = await fetch(`${PATH_TAF}?${params}`)

  if (response.status === 204) {
    return [
      [],
      `No TAF available for ${values.icaoId}${values.date && values.time ? ` at ${values.date} ${values.time}` : ""}\n`
    ]
  }

  if (!response.ok) {
    return [
      [],
      `TAF request for ${values.icaoId}${values.date && values.time ? ` at ${values.date} ${values.time} ` : ""} failed with status ${response.status}\n`
    ]
  }

  return [await response.json(), ""]
}

export const fetchMETAR = async (values: AirportFormValues): Promise<[METARJson[], string]> => {
  const params = new URLSearchParams({
    ids: values.icaoId,
    format: "json",
    hours: "5"
  })

  const response = await fetch(`${PATH_METAR}?${params}`)

  if (response.status === 204) {
    return [
      [],
      `No METAR available for ${values.icaoId}\n`,
    ]
  }

  if (!response.ok) {
    return [
      [],
      `METAR request for ${values.icaoId} failed with status ${response.status}\n`
    ]
  }

  return [await response.json(), ""]
}

export const fetchNOTAMs = async (values: AirportFormValues): Promise<[NotamEntry[], string]> => {
  const params = new URLSearchParams({
    icao: values.icaoId,
    includeFIR: String(values.notamIncludeFIR),
    includeFuture: String(values.notamIncludeFuture)
  })

  const response = await fetch(`${PATH_NOTAM}?${params}`)

  
  if (!response.ok) {
    return [
      [],
      await response.text()
    ]
  }
  
  const result: NotamsResponse = await response.json();

  if (result.notams.length === 0) {
    return [
      [],
      `No NOTAMs available for ${values.icaoId}\n`,
    ]
  }
  return [result.notams, ""]
}

export const fetchAirports = async (name: string): Promise<[AirportsResourceResponse | undefined, string]> => {
  const params = new URLSearchParams({
    "filter[name]": name
  })

  const response = await fetch(`${PATH_AIRPORTS}?${params}`)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const result: AirportsResourceResponse = await response.json()
  return [result, ""]
}

export const fetchAirportsPage = async (link: string): Promise<[AirportsResourceResponse | undefined, string]> => {
  const response = await fetch(link)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const result: AirportsResourceResponse = await response.json()
  return [result, ""]
}

export const refreshAirports = async (icaoIds: string[]): Promise<AirportData[]> => {
  return await Promise.all(icaoIds.map(async icaoId => {
    const formValues: AirportFormValues = {
      icaoId: icaoId,
      useDatetime: false,
      notamIncludeFIR: false,
      notamIncludeFuture: true
    }

    const [TAF, TAFMessage] = await fetchTAF(formValues)
    const [METAR, METARMessage] = await fetchMETAR(formValues)
    const [NOTAMs, NOTAMsMessage] = await fetchNOTAMs(formValues)
    METAR.sort((a, b) => Date.parse(b.receiptTime) - Date.parse(a.receiptTime))

    return {
      icaoId: icaoId,
      formValues: formValues,
      TAF,
      METAR,
      NOTAMs: NOTAMs,
      messages: TAFMessage + METARMessage + NOTAMsMessage
    }
  }))
}

export const createAirport = (icaoId?: string): AirportData => {
  return {
    icaoId: icaoId ? icaoId : "",
    formValues: {
      icaoId: icaoId ? icaoId : "",
      useDatetime: false,
      date: "",
      time: "",
      notamIncludeFIR: false,
      notamIncludeFuture: true
    },
    TAF: [],
    METAR: [],
    NOTAMs: [],
    messages: ""
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
