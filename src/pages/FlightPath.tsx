import { useState } from 'react'
import FlightPathForm from '../components/FlightPathForm'
import { type CodeHighlight, type FlightPathFormValues, type METARJson, type TAFJson } from '../types'
import FlightPathData from '../components/FlightPathData'

const API_PATH_TAF = '/api/data/taf'
const API_PATH_METAR = '/api/data/metar'

const fetchTAF = async (
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

const fetchMETAR = async (icao: string): Promise<METARJson[]> => {
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

const FlightPath = () => {
  const [departureTAF, setDepartureTAF] = useState<TAFJson[]>([])
  const [destinationTAF, setDestinationTAF] = useState<TAFJson[]>([])
  const [departureMETAR, setDepartureMETAR] = useState<METARJson[]>([])
  const [destinationMETAR, setDestinationMETAR] = useState<METARJson[]>([])
  const [departureHighlightsTAF, setDepartureHighlightsTAF] = useState<CodeHighlight[]>([])
  const [destinationHighlightsTAF, setDestinationHighlightsTAF] = useState<CodeHighlight[]>([])
  const [departureHighlightsMETAR, setDepartureHighlightsMETAR] = useState<CodeHighlight[]>([])
  const [destinationHighlightsMETAR, setDestinationHighlightsMETAR] = useState<CodeHighlight[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isVerticalView, setIsVerticalView] = useState(false)

  const handleSubmit = async (values: FlightPathFormValues) => {

    setLoading(true)
    setError('')
    setDepartureTAF([])
    setDestinationTAF([])
    setDepartureMETAR([])
    setDestinationMETAR([])

    try {
      const [departureTAF, destinationTAF] = await Promise.all([
        fetchTAF(
          values.departureICAO,
          values.departureDate,
          values.departureTime,),
        fetchTAF(
          values.destinationICAO,
          values.destinationDate,
          values.destinationTime,),
      ])

      setDepartureTAF(departureTAF)
      setDestinationTAF(destinationTAF)

      const [departureMETAR, destinationMETAR] = await Promise.all([
        fetchMETAR(values.departureICAO),
        fetchMETAR(values.destinationICAO)
      ])

      destinationMETAR.sort((a, b) => Date.parse(b.receiptTime) - Date.parse(a.receiptTime))
      departureMETAR.sort((a, b) => Date.parse(b.receiptTime) - Date.parse(a.receiptTime))

      setDepartureMETAR(departureMETAR)
      setDestinationMETAR(destinationMETAR)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch TAF and/or METAR data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={`page ${isVerticalView ? 'vertical' : ''}`}>
      <button
        className="toggle-view"
        type="button"
        onClick={() => setIsVerticalView((currentValue) => !currentValue)}
      >
        Switch to {isVerticalView ? "horizontal" : "vertical"} view
      </button>
      <FlightPathForm
        departureHighlightsTAF={departureHighlightsTAF}
        destinationHighlightsTAF={destinationHighlightsTAF}
        departureHighlightsMETAR={departureHighlightsMETAR}
        destinationHighlightsMETAR={destinationHighlightsMETAR}
        setDepartureHighlightsTAF={setDepartureHighlightsTAF}
        setDestinationHighlightsTAF={setDestinationHighlightsTAF}
        setDepartureHighlightsMETAR={setDepartureHighlightsMETAR}
        setDestinationHighlightsMETAR={setDestinationHighlightsMETAR}
        onSubmit={handleSubmit}
      />
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      <FlightPathData
        departureTAF={departureTAF}
        destinationTAF={destinationTAF}
        departureMETAR={departureMETAR}
        destinationMETAR={destinationMETAR}
        departureHighlightsTAF={departureHighlightsTAF}
        destinationHighlightsTAF={destinationHighlightsTAF}
        departureHighlightsMETAR={departureHighlightsMETAR}
        destinationHighlightsMETAR={destinationHighlightsMETAR}
      />
    </main>
  )
}

export default FlightPath
