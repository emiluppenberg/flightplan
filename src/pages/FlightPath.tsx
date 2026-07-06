import { useState } from 'react'
import FlightPathForm from '../components/FlightPathForm'
import { FlightPathFormValues } from '../types'

const TAF_API_PATH = '/api/taf'

const buildTafParams = (icao: string, date: string, time: string) => {
  const params = new URLSearchParams({
    ids: icao.trim().toUpperCase(),
  })
  console.log(time)
  if (date && time) {
    params.set('time', `${date}T${time}:00Z`)
  }

  return params
}

const fetchTaf = async (params: URLSearchParams) => {
  const response = await fetch(`${TAF_API_PATH}?${params}`)

  if (response.status === 204) {
    return 'No TAF available.'
  }

  if (!response.ok) {
    throw new Error(`TAF request failed with status ${response.status}.`)
  }

  return response.text()
}

const FlightPath = () => {
  const [data, setData] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: FlightPathFormValues) => {
    setLoading(true)
    setError('')
    setData('')

    try {
      const departureParams = buildTafParams(
        values.departureICAO,
        values.departureDate,
        values.departureTime,
      )
      const destinationParams = buildTafParams(
        values.destinationICAO,
        values.destinationDate,
        values.destinationTime,
      )

      const [departureTAF, destinationTAF] = await Promise.all([
        fetchTaf(departureParams),
        fetchTaf(destinationParams),
      ])

      setData(`${departureTAF}\n\n${destinationTAF}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch TAF data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <FlightPathForm
        onSubmit={handleSubmit}
      />

      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {data && <pre>{data}</pre>}
    </main>
  )
}

export default FlightPath
