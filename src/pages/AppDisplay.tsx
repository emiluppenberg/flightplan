import AirportRender from '../components/AirportRender'
import { useFlightPathContext } from '../Context'

const AppDisplay = () => {
  const context = useFlightPathContext()

  return (
    <div className="app-display">
      {context.airports.length > 0 && (
        <h2>My Airports</h2>
      )}
      {context.isLoading && (
        <p className="message">Loading...</p>
      )}
      {context.message && (
        <p className="message warning">{context.message}</p>
      )}
      <div className="renders-container">
        {context.airports.map((airport, index) => (
          <AirportRender
            key={`airport-render-${index}`}
            airport={airport}
            airportIndex={index}
          />
        ))}
      </div>
    </div>
  )
}

export default AppDisplay
