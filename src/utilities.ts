import { type TAFJson, type METARJson, type AirportFormValues, type AirportData, codeHighlights, type NotamsResponse, type NotamEntry, type AirportsResourceResponse, type FetchResult } from "./types"

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
export const POLL_INTERVAL = 1 * 30 * 1000;

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

  return await response.json()
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

const capture = async<T>(
  request: () => Promise<T>,
  fallbackMessage: string
): Promise<FetchResult<T>> => {
  try {
    return {
      data: await request(),
      message: ""
    };
  } catch (error) {
    return {
      data: undefined,
      message:
        error instanceof Error
          ? error.message
          : fallbackMessage
    };
  }
}

export const fetchReports = async (
  formValues: AirportFormValues,
  fetchNotam: boolean = true
): Promise<[TAFJson[] | undefined, METARJson[] | undefined, NotamEntry[] | undefined, string]> => {
  const skippedNotams: FetchResult<NotamEntry[]> = {
    data: undefined,
    message: ""
  };

  const [TAF, METAR, NOTAM] = await Promise.all([
    capture(
      () => fetchTAF(formValues),
      "There was an unexpected error while fetching TAF\n"
    ),
    capture(
      () => fetchMETAR(formValues),
      "There was an unexpected error while fetching METAR\n"
    ),
    fetchNotam
      ? capture(
        () => fetchNOTAMs(formValues),
        "There was an unexpected error while fetching NOTAMs\n"
      )
      : Promise.resolve(skippedNotams)
  ]);

  const sortedMETAR = METAR.data
  ? await capture(
    () => Promise.resolve(METAR.data?.sort((a, b) =>
      Date.parse(b.receiptTime) -
      Date.parse(a.receiptTime))),
    METAR.message + "There was an unexpected error while sorting METAR\n"
  )
  : {
    data: undefined,
    message: METAR.message
  };

  const messages = [
    TAF.message,
    sortedMETAR.message,
    NOTAM.message
  ].join("");

  return [
    TAF.data,
    sortedMETAR.data,
    NOTAM.data,
    messages
  ];
}

export const refreshAirports = async (icaoIds: string[]): Promise<AirportData[]> => {
  return await Promise.all(icaoIds.map(async icaoId => {
    const formValues: AirportFormValues = {
      icaoId: icaoId,
      useDatetime: false,
      notamIncludeFIR: false,
      notamIncludeFuture: true
    }

    const [TAF, METAR, NOTAMs, messages] = await fetchReports(formValues)

    return {
      id: crypto.randomUUID(),
      icaoId: icaoId,
      formValues: formValues,
      TAF: TAF ? TAF : [],
      METAR: METAR ? METAR : [],
      NOTAM: NOTAMs ? NOTAMs : [],
      messages: messages,
      nextPoll: Date.now() + POLL_INTERVAL,
      isLoading: false
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
    nextPoll: Date.now() + POLL_INTERVAL,
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
