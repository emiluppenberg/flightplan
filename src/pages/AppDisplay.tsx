import AirportRender from '../components/AirportRender'
import { useFlightPathContext } from '../Context'
import { useWindowWidth } from '../hooks'
import { searchAirportId } from '../utilities'

const AppDisplay = () => {
  const context = useFlightPathContext()
  const splitRender = useWindowWidth() >= 500

  const splitAirportsIndex = splitRender
    ? Math.floor(context.airports.length / 2)
    : -1

  return (
    <div className={`app-display ${splitRender && "split"}`}>
      {context.message && (
        <p className="message warning">{context.message}</p>
      )}
      <div className={`renders-container ${splitRender && "split"}`}>
        {context.airports.map((airport, index) => {
          if (airport.id === searchAirportId) return
          if (splitRender && index >= splitAirportsIndex) return

          return (
            <AirportRender
              key={airport.id}
              airport={airport} />
          )
        })}
      </div>
      {splitRender && (
        <div className="renders-container split">
          {context.airports.map((airport, index) => {
            if (airport.id === searchAirportId) return
            if (index < splitAirportsIndex) return

            return (
              <AirportRender
                key={airport.id}
                airport={airport} />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AppDisplay
