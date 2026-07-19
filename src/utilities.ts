import type { TAFJson, METARJson, AirportFormValues } from "./types"

export const API_PATH_TAF = '/api/data/taf'
export const API_PATH_METAR = '/api/data/metar'

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
