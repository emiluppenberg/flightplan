import { type AirportFormValues, type EntryTAF, type EntryMETAR, type EntryNOTAM, type ResponseNOTAM, type AirportsResourceResponse, HIGHLIGHTS_NOTAM, type EntrySNOWTAM } from "../types"
import { matchesNotamHighlight } from "../utilities"

export const PATH_AIRPORTS = "/api/airports"
export const PATH_NOTAM = "/api/reports/notam"
export const PATH_SNOWTAM = "/api/reports/snowtam"
export const PATH_TAF = '/api/reports/taf'
export const PATH_METAR = '/api/reports/metar'

export const POLL_INTERVAL_TAF_METAR_NOTAM = 5 * 60 * 1000
export const POLL_INTERVAL_SNOWTAM = 60 * 60 * 1000

export const fetchTAF = async (values: AirportFormValues): Promise<EntryTAF[]> => {
  const params = new URLSearchParams({
    ids: values.icaoId,
    format: "json",
    date: values.date && values.time ? `${values.date.replaceAll("-", "")}_${values.time.replace(":", "")}` : ""
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

export const fetchMETAR = async (values: AirportFormValues): Promise<EntryMETAR[]> => {
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

export const fetchNOTAM = async (values: AirportFormValues): Promise<EntryNOTAM[]> => {
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

export const fetchSNOWTAM = async (values: AirportFormValues): Promise<EntrySNOWTAM[]> => {
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