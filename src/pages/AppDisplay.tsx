import AirportRender from '../components/AirportRender'
import { useFlightPathContext } from '../Context'

const AppDisplay = () => {
  const context = useFlightPathContext()

  return (
    <div className="app-display">
      {context.isLoading && <p>Loading...</p>}
      {context.error && <p style={({whiteSpace: "pre-line"})}>{context.error}</p>}
      {context.airports.map((airport, index) => (
        <AirportRender
          key={`airport-render-${airport.id}`}
          airport={airport}
          airportIndex={index}
        />
      ))}
    </div>
  )
}

export default AppDisplay
