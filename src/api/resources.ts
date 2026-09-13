import { type AerodromeFormValues, type EntryTAF, type EntryMETAR, type EntryNOTAM, type ResponseNOTAM, type AerodromesResourceResponse, HIGHLIGHTS_NOTAM, type EntrySNOWTAM, type AerodromeResourceResponse } from "../types"
import { matchesNotamHighlight, parseDateQuery } from "../utilities"

export const PATH_AERODROMES = "/api/aerodromes"
export const PATH_NOTAM = "/api/reports/notam"
export const PATH_SNOWTAM = "/api/reports/snowtam"
export const PATH_TAF = '/api/reports/taf'
export const PATH_METAR = '/api/reports/metar'

export const POLL_INTERVAL_TAF_METAR_NOTAM = 5 * 60 * 1000
export const POLL_INTERVAL_SNOWTAM = 60 * 60 * 1000

export const fetchTAF = async (values: AerodromeFormValues): Promise<EntryTAF[]> => {
  const params = new URLSearchParams({
    ids: values.icaoId,
    format: "json",
  })

  if (values.date && values.time) {
    params.set("date", parseDateQuery(values.date, values.time))
  }

  const response = await fetch(`${PATH_TAF}?${params}`)

  if (response.status === 204) {
    throw new Error(`No TAF available${(values.date && values.time) ? ` for ${values.date} ${values.time}` : ""}`)
  }

  if (!response.ok) {
    throw new Error(`TAF request${(values.date && values.time) ? ` for ${values.date} ${values.time}` : ""} failed with status ${response.status}`)
  }

  return await response.json()
}

export const fetchMETAR = async (values: AerodromeFormValues, queryPreviousHours: number): Promise<EntryMETAR[]> => {
  const params = new URLSearchParams({
    ids: values.icaoId,
    format: "json",
    hours: queryPreviousHours.toString()
  })

  if (values.date && values.time) {
    params.set("date", parseDateQuery(values.date, values.time))
  }

  const response = await fetch(`${PATH_METAR}?${params}`)

  if (response.status === 204) {
    throw new Error(`No METAR available${(values.date && values.time) ? ` for ${values.date} ${values.time}` : ""}`)
  }

  if (!response.ok) {
    throw new Error(`METAR request${(values.date && values.time) ? ` for ${values.date} ${values.time}` : ""} failed with status ${response.status}`)
  }

  const METAR: EntryMETAR[] = await response.json()

  return METAR.toSorted((a, b) => {
    const aTime = Date.parse(a.receiptTime)
    const bTime = Date.parse(b.receiptTime)

    if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
      throw new Error("METAR contains an invalid receiptTime")
    }

    return bTime - aTime
  })
}

export const fetchNOTAM = async (values: AerodromeFormValues): Promise<EntryNOTAM[]> => {
  const params = new URLSearchParams({
    icao: values.icaoId,
  })

  const response = await fetch(`${PATH_NOTAM}?${params}`)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const result: ResponseNOTAM = await response.json();
  return result.notams
}

export const fetchSNOWTAM = async (values: AerodromeFormValues): Promise<EntrySNOWTAM[]> => {
  const params = new URLSearchParams({
    icao: values.icaoId,
    includeFIR: String(values.notamIncludeFIR),
    includeFuture: String(values.notamIncludeFuture)
  })

  const response = await fetch(`${PATH_SNOWTAM}?${params}`)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const highlightSNOWTAM = HIGHLIGHTS_NOTAM.find(highlight => highlight.label === "SNOWTAM")

  if (!highlightSNOWTAM) {
    throw new Error("Unable to load highlightSNOWTAM")
  }

  const result: ResponseNOTAM = await response.json();
  const SNOWTAM: EntrySNOWTAM[] = result.notams.filter(notam => matchesNotamHighlight(notam, highlightSNOWTAM))
  return SNOWTAM
}

export const fetchAerodromeIcaoId = async (formIcaoId: string) => {
  const response = await fetch(`${PATH_AERODROMES}/${formIcaoId}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`No aerodrome found for ICAO: ${formIcaoId}`)
    } else {
      throw new Error(`There was an unexpected error while fetching ${formIcaoId}: ${response.statusText}`)
    }
  }

  const result: AerodromeResourceResponse = await response.json()
  return result.data.attributes.code.trim().toUpperCase()
}

export const fetchAerodromes = async (name: string): Promise<AerodromesResourceResponse> => {
  const params = new URLSearchParams({
    "filter[name]": name
  })

  const response = await fetch(`${PATH_AERODROMES}?${params}`)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const fetchAerodromesPage = async (link: string): Promise<AerodromesResourceResponse> => {
  const response = await fetch(link)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}