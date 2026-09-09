import type { Session } from "@supabase/supabase-js"
import { type AirportFormValues, type AirportData, HIGHLIGHTS_TAF_METAR, type NotamEntry, type FetchResult, type SupabaseAirport, type CodeHighlight, type AppUser } from "./types"
import { fetchDeleteNOTAM, fetchInitializeUser, fetchSelectAirportNOTAM, fetchUpdateAirportNextPollNOTAM, fetchUpsertNOTAM } from "./api/supabase"
import { fetchTAF, fetchMETAR, fetchNOTAM, POLL_INTERVAL_NOTAM, POLL_INTERVAL_TAF_METAR } from "./api/resources";

export const SVG_URLS = {
  logo: '/flygvader-logo.svg',
  highlight: '/ui/underline-text-editor-svgrepo-com.svg',
  search: '/ui/browse-svgrepo-com.svg',
  close: '/ui/close-lg-svgrepo-com.svg',
  reload: '/ui/reload-svgrepo-com.svg',
} as const;

export const sessionStorageKey = "sb-cgllylmfqjwakuhemjxv-auth-token"
export const searchAirportId = "search-airport"

export const capture = async<T>(
  request: () => Promise<T>
): Promise<FetchResult<T>> => {
  try {
    return {
      data: await request(),
      error: undefined
    };
  } catch (error) {
    return {
      data: undefined,
      error: error instanceof Error
        ? error.message
        : `There was unexpected error while executing ${request.name}`
    };
  }
}

export const captureSyncNOTAM = async (
  NOTAM: NotamEntry[],
  airportSupabaseId: string | undefined,
  icaoId: string,
  nextPollNOTAM: number,
  airportId: string = ""
): Promise<string> => {
  if (!airportSupabaseId) {
    return airportId === searchAirportId
      ? ""
      : "Airport is missing supabaseId"
  }

  const deleted = await capture(() => fetchDeleteNOTAM(airportSupabaseId))

  const upserted = !deleted.error
    ? await capture(() => fetchUpsertNOTAM(NOTAM, airportSupabaseId))
    : { data: undefined, error: "" }

  const updated = !deleted.error && !upserted.error
    ? await capture(() => fetchUpdateAirportNextPollNOTAM(icaoId, nextPollNOTAM))
    : { data: undefined, error: "" }

  return (deleted.error ?? "") + (upserted.error ?? "") + (updated.error ?? "")
}

export const refreshAirports = async (supabaseAirports: SupabaseAirport[]): Promise<AirportData[]> => {
  const now = Date.now()

  return await Promise.all(supabaseAirports.map(async airport => {
    const formValues: AirportFormValues = {
      icaoId: airport.icao,
      notamIncludeFIR: false,
      notamIncludeFuture: true
    }

    const fetchFreshNOTAM = airport.next_poll_notam <= now

    const [TAF, METAR, NOTAM] = await Promise.all([
      capture(() => fetchTAF(formValues)),
      capture(() => fetchMETAR(formValues)),
      fetchFreshNOTAM
        ? capture(() => fetchNOTAM(formValues))
        : Promise.resolve({ data: undefined, error: "" }),
    ])

    const nextPollNOTAM = fetchFreshNOTAM && NOTAM.data
      ? now + POLL_INTERVAL_NOTAM
      : airport.next_poll_notam

    const synced = fetchFreshNOTAM && NOTAM.data
      ? await captureSyncNOTAM(NOTAM.data, airport.id, airport.icao, nextPollNOTAM)
      : ""

    if (!fetchFreshNOTAM || (fetchFreshNOTAM && !NOTAM.data)) {
      NOTAM.data = await fetchSelectAirportNOTAM(airport.id)
    }

    return {
      id: crypto.randomUUID(),
      icaoId: airport.icao,
      formValues: formValues,
      TAF: TAF.data ? TAF.data : [],
      METAR: METAR.data ? METAR.data : [],
      NOTAM: NOTAM.data ? NOTAM.data : [],
      messages: (TAF.error ?? "") + (METAR.error ?? "") + (NOTAM.error ?? "") + synced,
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

export const resolveHighlights = (classes: string[], highlightCollection: CodeHighlight[]) => highlightCollection.filter(highlight => classes.includes(highlight.class));

export const matchesNotamHighlight = (
  notam: NotamEntry,
  highlight: CodeHighlight
): boolean => [notam.q_code, notam.raw].some(value => value != null && highlight.regEx.test(value))

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === "string");

export const formatRawCodes = (raw: string) => {
  const visibilityRegEx = HIGHLIGHTS_TAF_METAR.find(
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

export const getOperationalHours = (
  notams: NotamEntry[],
  targetDate: number,
  highlightsOPERATIONAL_HOURS: CodeHighlight[]
): string[] => {
  const activeNotams = notams.filter(notam => {
    if (!notam.effective || !notam.expiration) return false

    const effective = parseSkylinkDate(notam.effective)
    const expiration = parseSkylinkDate(notam.expiration)

    return effective <= targetDate && expiration >= targetDate
  })

  const nonMatches = highlightsOPERATIONAL_HOURS.filter(highlight =>
    !activeNotams.some(notam => matchesNotamHighlight(notam, highlight)))

  const candidates = activeNotams.filter(notam =>
    highlightsOPERATIONAL_HOURS.some(highlight => matchesNotamHighlight(notam, highlight)))

  const result = candidates.map(candidate => {
    const body = candidate.body?.replace(/\s+/g, " ").trim()
    return `${candidate.effective} - ${candidate.expiration}\n${body}`
  })

  return result.length > 0
    ? [...result, ...nonMatches.map(highlight => `OPERATIONAL HOURS not available for ${highlight.label}`)]
    : highlightsOPERATIONAL_HOURS.length > 0
      ? [`OPERATIONAL HOURS not available for ${nonMatches.map(highlight => highlight.label).join(", ")}`]
      : [""]
}

export const sortNOTAM = (notams: NotamEntry[], highlights: CodeHighlight[]): NotamEntry[] => {
  return notams.sort((a, b) => {
    const aIsHighlighted = highlights.some(highlight => matchesNotamHighlight(a, highlight))
    const bIsHighlighted = highlights.some(highlight => matchesNotamHighlight(b, highlight))

    return Number(bIsHighlighted) - Number(aIsHighlighted)
  })
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

export const getRefreshToken = (): string => {
  const session = localStorage.getItem(sessionStorageKey)

  if (!session) {
    throw new Error("Session was not found in localStorage")
  }

  return (JSON.parse(session) as Session).refresh_token
}

export const getAccessToken = (): string => {
  const session = localStorage.getItem(sessionStorageKey)

  if (!session) {
    throw new Error("Session was not found in localStorage")
  }

  return (JSON.parse(session) as Session).access_token
}

export const consumeSupabaseConfirmationLink = async (): Promise<AppUser | undefined> => {
  const params = new URLSearchParams(window.location.hash.slice(1))

  const hasAuthToken = params.has("access_token") || params.has("refresh_token")
  const hasAuthError = params.has("error") && (
    params.has("error_code") || params.has("error_description")
  )

  if (!hasAuthToken && !hasAuthError) {
    return undefined
  }

  window.history.replaceState(
    window.history.state,
    document.title,
    `${window.location.pathname}${window.location.search}`
  )

  const refreshToken = params.get("refresh_token")
  const error = params.get("error_description") ?? params.get("error")

  if (error) {
    throw new Error(error)
  }

  if (!refreshToken) {
    throw new Error("Confirmation link is missing a refresh token")
  }

  return await fetchInitializeUser(refreshToken)
}
