import { useState } from 'react'
import FlightPathForm from '../components/FlightPathForm'
import { type FlightPathFormValues } from '../types'

const TAF_API_PATH = '/api/taf'

const fetchTaf = async (icao: string, date: string, time: string) => {
  const params = new URLSearchParams({
    ids: icao.trim().toUpperCase(),
    date: `${date.replaceAll("-", "")}_${time.replace(":", "")}`
  })

  const response = await fetch(`${TAF_API_PATH}?${params}`)

  if (response.status === 204) {
    return `No TAF available for ${icao} at ${date} ${time}`
  }

  if (!response.ok) {
    throw new Error(`TAF request for ${icao} at ${date} ${time} failed with status ${response.status}.`)
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
      const [departureTAF, destinationTAF] = await Promise.all([
        fetchTaf(values.departureICAO,
          values.departureDate,
          values.departureTime,),
        fetchTaf(values.destinationICAO,
          values.destinationDate,
          values.destinationTime,),
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
