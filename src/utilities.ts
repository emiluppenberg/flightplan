import { type TAFJson, type METARJson, type AirportFormValues, type AirportData, codeHighlights } from "./types"

export const API_PATH_TAF = '/api/data/taf'
export const API_PATH_METAR = '/api/data/metar'
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

  const response = await fetch(`${API_PATH_TAF}?${params}`)

  if (response.status === 204) {
    return [
      [],
      `No TAF available for ${values.icaoId} at ${values.date} ${values.time}\n`
    ]
  }

  if (!response.ok) {
    return [
      [],
      `TAF request for ${values.icaoId} at ${values.date} ${values.time} failed with status ${response.status}\n`
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

  const response = await fetch(`${API_PATH_METAR}?${params}`)

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
export const createAirportId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `airport-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createAirport = (icaoId?: string): AirportData => {
  return {
    id: createAirportId(),
    icaoId: icaoId ? icaoId : "",
    formValues: {
      icaoId: icaoId ? icaoId : "",
      useDatetime: false,
      date: "",
      time: ""
    },
    TAF: [],
    METAR: [],
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
