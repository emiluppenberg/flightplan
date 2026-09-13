import type { Session } from "@supabase/supabase-js"
import { type AerodromeFormValues, type AerodromeData, HIGHLIGHTS_TAF_METAR, type EntryNOTAM, type FetchResult, type SupabaseAerodrome, type CodeHighlight, type AppUser, type EntrySNOWTAM, HIGHLIGHTS_NOTAM, HIGHLIGHTS_OPERATIONAL_HOURS, type UserAppData } from "./types"
import { fetchDeleteSNOWTAM, fetchInitializeUser, fetchRefreshedUserAccessToken, fetchSelectAllAerodromes, fetchSelectConfig, fetchSelectSNOWTAM, fetchUpdateAerodromeNextPollSNOWTAM, fetchUpsertSNOWTAM } from "./api/supabase"
import { fetchTAF, fetchMETAR, fetchNOTAM, fetchSNOWTAM, POLL_INTERVAL_SNOWTAM, POLL_INTERVAL_TAF_METAR_NOTAM } from "./api/resources";
import type { UpsertConfigBody } from "./shared";

export const SVG_URLS = {
  logo: '/flygvader-logo.svg',
  highlight: '/ui/underline-text-editor-svgrepo-com.svg',
  search: '/ui/browse-svgrepo-com.svg',
  close: '/ui/close-lg-svgrepo-com.svg',
  reload: '/ui/reload-svgrepo-com.svg',
  aerodromes: '/ui/globe-svgrepo-com.svg',
  trash: '/ui/trash-svgrepo-com.svg'
} as const;

export const ROUTES = {
  search: 'search',
  signIn: "sign-in",
  signUp: "sign-up",
}

export const sessionStorageKey = "sb-cgllylmfqjwakuhemjxv-auth-token"
export const searchAerodromeId = "search-aerodrome"
export const defaultQueryMetarPreviousHours = 5

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
        : `There was an unexpected error while executing a request`
    };
  }
}

export const captureSyncSNOWTAM = async (
  SNOWTAM: EntrySNOWTAM[],
  aerodromeSupabaseId: string | undefined,
  icaoId: string,
  nextPollSNOWTAM: number,
  aerodromeId: string = ""
): Promise<string[]> => {
  if (!aerodromeSupabaseId) {
    return aerodromeId === searchAerodromeId
      ? []
      : ["Aerodrome is missing supabaseId"]
  }

  const deleted = await capture(() => fetchDeleteSNOWTAM(aerodromeSupabaseId))

  const upserted = !deleted.error
    ? await capture(() => fetchUpsertSNOWTAM(SNOWTAM, aerodromeSupabaseId))
    : { data: undefined, error: undefined }

  const updated = !deleted.error && !upserted.error
    ? await capture(() => fetchUpdateAerodromeNextPollSNOWTAM(icaoId, nextPollSNOWTAM))
    : { data: undefined, error: undefined }

  return [
    deleted.error,
    upserted.error,
    updated.error
  ].filter(error => error !== undefined)
}

export const captureUserData = async (accessToken: string): Promise<UserAppData> => {
  const [aerodromesResult, configResult] = await Promise.all([
    capture(() => fetchSelectAllAerodromes({ accessToken: accessToken })),
    capture(() => fetchSelectConfig({ accessToken: accessToken }))
  ])

  const refreshResult = await capture(() => refreshAerodromes(aerodromesResult.data ?? [], configResult.data?.query_metar_previous_hours ?? defaultQueryMetarPreviousHours))
  const [aerodromesError, configError] = [aerodromesResult.error, configResult.error]

  if (!aerodromesError) {
    if (!configError) {
      if (refreshResult?.data) {
        return {
          aerodromes: refreshResult.data,
          highlightsTaf: resolveHighlights(configResult.data?.highlights_taf ?? [], HIGHLIGHTS_TAF_METAR),
          highlightsMetar: resolveHighlights(configResult.data?.highlights_metar ?? [], HIGHLIGHTS_TAF_METAR),
          highlightsNotam: resolveHighlights(configResult.data?.highlights_notam ?? [], HIGHLIGHTS_NOTAM),
          highlightsOperationalHours: resolveHighlights(configResult.data?.highlights_operational_hours ?? [], HIGHLIGHTS_OPERATIONAL_HOURS),
          queryMetarPreviousHours: configResult.data?.query_metar_previous_hours ?? defaultQueryMetarPreviousHours,
        }
      }
    }
  }

  return {
    aerodromes: [],
    highlightsTaf: [],
    highlightsMetar: [],
    highlightsNotam: [],
    highlightsOperationalHours: [],
    queryMetarPreviousHours: 0,
    errors: mergeErrors(
      aerodromesResult.error,
      configResult.error,
      refreshResult?.error
    )
  }
}

export const refreshAerodromes = async (supabaseAerodromes: SupabaseAerodrome[], queryMetarPreviousHours: number): Promise<AerodromeData[]> => {
  const now = Date.now()

  return await Promise.all(supabaseAerodromes.map(async aerodrome => {
    const formValues: AerodromeFormValues = {
      icaoId: aerodrome.icao,
      notamIncludeFIR: false,
      notamIncludeFuture: true
    }

    const fetchFreshSNOWTAM = aerodrome.next_poll_snowtam <= now

    const [TAF, METAR, NOTAM, SNOWTAM] = await Promise.all([
      capture(() => fetchTAF(formValues)),
      capture(() => fetchMETAR(formValues, queryMetarPreviousHours)),
      capture(() => fetchNOTAM(formValues)),
      fetchFreshSNOWTAM
        ? capture(() => fetchSNOWTAM(formValues))
        : Promise.resolve({ data: undefined, error: undefined }),
    ])

    const nextPollSNOWTAM = fetchFreshSNOWTAM && SNOWTAM.data
      ? now + POLL_INTERVAL_SNOWTAM
      : aerodrome.next_poll_snowtam

    const synced = fetchFreshSNOWTAM && SNOWTAM.data
      ? await captureSyncSNOWTAM(SNOWTAM.data, aerodrome.id, aerodrome.icao, nextPollSNOWTAM)
      : []

    if (!fetchFreshSNOWTAM || (fetchFreshSNOWTAM && !SNOWTAM.data)) {
      SNOWTAM.data = await fetchSelectSNOWTAM(aerodrome.id)
    }

    const mergedError = mergeErrors(
      getReportError(TAF, "TAF"),
      getReportError(METAR, "METAR"),
      getReportError(NOTAM, "NOTAM"),
      fetchFreshSNOWTAM
        ? getReportError(SNOWTAM, "SNOWTAM")
        : undefined,
      ...synced
    ).join("\n")

    return {
      id: crypto.randomUUID(),
      icaoId: aerodrome.icao,
      formValues: formValues,
      TAF: TAF.data ? TAF.data : [],
      METAR: METAR.data ? METAR.data : [],
      NOTAM: NOTAM.data ? NOTAM.data : [],
      SNOWTAM: SNOWTAM.data ? SNOWTAM.data : [],
      messages: mergedError,
      nextPollReports: Date.now() + POLL_INTERVAL_TAF_METAR_NOTAM,
      nextPollSNOWTAM: nextPollSNOWTAM,
      isLoading: false,
      supabaseId: aerodrome.id
    }
  }))
}

export const createAerodrome = (id: string): AerodromeData => {
  return {
    id: id,
    icaoId: null,
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
    SNOWTAM: [],
    messages: "",
    nextPollReports: Date.now() + POLL_INTERVAL_TAF_METAR_NOTAM,
    nextPollSNOWTAM: Date.now(),
    isLoading: false
  }
}

export const resolveHighlights = (classes: string[], highlightCollection: CodeHighlight[]) => highlightCollection.filter(highlight => classes.includes(highlight.class));

export const matchesNotamHighlight = (
  notam: EntryNOTAM,
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
  notams: EntryNOTAM[],
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

export const sortNOTAM = (notams: EntryNOTAM[], highlights: CodeHighlight[]): EntryNOTAM[] => {
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

export const parseFormDate = (date: string, time: string): number => {
  // date = yyyy-mm-dd, time = hh:mm
  return Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1, // month is zero-based
    Number(date.slice(8, 10)),
    Number(time.slice(0, 2)),
    Number(time.slice(3, 5))
  )
}

export const parseDateQuery = (date: string, time: string) =>
  `${date.replaceAll("-", "")}_${time.replace(":", "")}`

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

export const getReportError = <T>(
  fetchResult: FetchResult<Array<T>>,
  report: "TAF" | "METAR" | "NOTAM" | "SNOWTAM")
  : string | undefined => {
  if (fetchResult.error) {
    return fetchResult.error
  }

  if (fetchResult.data === undefined ||
    fetchResult.data.length === 0
  ) {
    return `${report} not available`
  }

  return undefined
}

export const mergeErrors = (...errors: Array<string | undefined>) => {
  return errors
    .map(error => error?.trim())
    .filter((error): error is string => Boolean(error))
}

export const mapUpsertConfigBody = async (
  highlightsTaf: CodeHighlight[],
  highlightsMetar: CodeHighlight[],
  highlightsNotam: CodeHighlight[],
  highlightsOperationalHours: CodeHighlight[],
  queryMetarPreviousHours: number,
  accessToken?: string)
  : Promise<UpsertConfigBody> => {
  if (!accessToken) {
    accessToken = (await fetchRefreshedUserAccessToken()).accessToken
  }

  return {
    accessToken: accessToken,
    queryMetarPreviousHours: queryMetarPreviousHours,
    highlightsTaf: highlightsTaf.map(highlight => highlight.class),
    highlightsMetar: highlightsMetar.map(highlight => highlight.class),
    highlightsNotam: highlightsNotam.map(highlight => highlight.class),
    highlightsOperationalHours: highlightsOperationalHours.map(highlight => highlight.class),
    updatedAt: Date.now()
  }
}