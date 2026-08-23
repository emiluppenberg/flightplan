import { useMemo } from 'react'
import AirportRender from '../components/AirportRender'
import { useFlightPathContext } from '../Context'
import { useWindowWidth } from '../hooks'
import { searchAirportId } from '../utilities'

const AppDisplay = () => {
  const context = useFlightPathContext()
  const splitRender = useWindowWidth() >= 500

  const airports = useMemo(() =>
    context.airports.filter(airport => airport.id !== searchAirportId),
    [context.airports])

  const splitAirportsIndex = splitRender
    ? Math.ceil(airports.length / 2)
    : -1

  return (
    <>
      {context.message.length > 0 && (
        <p className="message warning">{context.message}</p>
      )}
      <div className={`app-display ${splitRender && "split"}`}>
        <div className={`renders-container ${splitRender && "split"}`}>
          {airports.map((airport, index) => {
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
            {airports.map((airport, index) => {
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
    </>
  )
}

export default AppDisplay
