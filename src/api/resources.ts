import type { AirportFormValues, TAFJson, METARJson, NotamEntry, NotamsResponse, AirportsResourceResponse } from "../types"

export const PATH_AIRPORTS = "/api/airports"
export const PATH_NOTAM = "/api/reports/notam"
export const PATH_SNOWTAM = "/api/reports/snowtam"
export const PATH_TAF = '/api/reports/taf'
export const PATH_METAR = '/api/reports/metar'

export const POLL_INTERVAL_TAF_METAR = 1 * 30 * 1000
export const POLL_INTERVAL_NOTAM =  1 * 30 * 60 * 1000

export const fetchTAF = async (values: AirportFormValues): Promise<TAFJson[]> => {
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

  const METAR: METARJson[] = await response.json()

  return METAR.toSorted((a, b) => {
    const aTime = Date.parse(a.receiptTime)
    const bTime = Date.parse(b.receiptTime)

    if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
      throw new Error("METAR contains an invalid receiptTime")
    }

    return bTime - aTime
  })
}

export const fetchNOTAM = async (values: AirportFormValues): Promise<NotamEntry[]> => {
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