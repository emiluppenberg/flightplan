import AirportRender from '../components/AirportRender'
import { useFlightPathContext } from '../Context'

const AppDisplay = () => {
  const context = useFlightPathContext()

  return (
    <div className="app-display">
      {context.isLoading && <p>Loading...</p>}
      {context.error && <p>{context.error}</p>}
      {context.airports.map((airport, index) => (
        <AirportRender
          key={`airport-render-${index}`}
          airport={airport}
          airportIndex={index}
        />
      ))}
    </div>
  )
}

export default AppDisplay
