import AirportRender from '../components/AirportRender'
import { useFlightPathContext } from '../Context'

const AppDisplay = () => {
  const context = useFlightPathContext()

  return (
    <div className="app-display">
      <h2>Airports</h2>
      {context.isLoading && <p>Loading...</p>}
      {context.error && <p style={({ whiteSpace: "pre-line" })}>{context.error}</p>}
      <div className="renders-container">
      {context.airports.map((airport, index) => (
        <AirportRender
        key={`airport-render-${airport.id}`}
        airport={airport}
        airportIndex={index}
        />
      ))}
      </div>
    </div>
  )
}

export default AppDisplay
