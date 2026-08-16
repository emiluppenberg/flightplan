import AirportRender from '../components/AirportRender'
import { useFlightPathContext } from '../Context'
import { searchAirportId } from '../utilities'

const AppDisplay = () => {
  const context = useFlightPathContext()

  return (
    <div className="app-display">
      {context.airports.length > 1 && (
        <h2>My Airports</h2>
      )}
      {context.isLoading && (
        <p className="message">Loading...</p>
      )}
      {context.message && (
        <p className="message warning">{context.message}</p>
      )}
      <div className="renders-container">
        {context.airports.map((airport) => {
          if (airport.id === searchAirportId) return
          return (<AirportRender
            key={airport.id}
            airport={airport}
          />)
        })}
      </div>
    </div>
  )
}

export default AppDisplay
