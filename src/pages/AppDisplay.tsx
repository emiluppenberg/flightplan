import AirportRender from '../components/AirportRender'
import { useFlightPathContext } from '../Context'

const AppDisplay = () => {
  const context = useFlightPathContext()

  return (
    <div className="app-display">
      <h2>My Airports</h2>
      {context.isLoading && (
        <p className="message">Loading...</p>
      )}
      {context.message && (
        <p className="message">{context.message}</p>
        )}
      {context.airports.length === 0 && (
        <p className="message">You have not added any airports</p>
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
