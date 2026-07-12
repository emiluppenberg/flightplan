import type { TAFJson, METARJson } from "./types"

export const API_PATH_TAF = '/api/data/taf'
export const API_PATH_METAR = '/api/data/metar'

export const fetchTAF = async (
  icao: string,
  date?: string,
  time?: string): Promise<TAFJson[]> => {
  const params = new URLSearchParams({
    ids: icao.trim().toUpperCase(),
    format: "json",
    date: date && time ? `${date.replaceAll("-", "")}_${time.replace(":", "")}` : ""
  })

  const response = await fetch(`${API_PATH_TAF}?${params}`)

  if (response.status === 204) {
    throw new Error(`No TAF available for ${icao} at ${date} ${time}`)
  }

  if (!response.ok) {
    throw new Error(`TAF request for ${icao} at ${date} ${time} failed with status ${response.status}.`)
  }

  return response.json()
}

export const fetchMETAR = async (icao: string): Promise<METARJson[]> => {
  const params = new URLSearchParams({
    ids: icao.trim().toUpperCase(),
    format: "json",
    hours: "5"
  })

  const response = await fetch(`${API_PATH_METAR}?${params}`)

  if (response.status === 204) {
    throw new Error(`No METAR available for ${icao}`)
  }

  if (!response.ok) {
    throw new Error(`METAR request for ${icao} failed with status ${response.status}.`)
  }

  return response.json()
}