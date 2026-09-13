import { useMemo } from 'react'
import AerodromeRender from '../components/AerodromeRender'
import { useFlightPathContext } from '../Context'
import { useWindowWidth } from '../hooks'
import { searchAerodromeId } from '../utilities'
import Messages from '../components/Messages'

const Aerodromes = () => {
  const context = useFlightPathContext()
  const splitRender = useWindowWidth() >= 500

  const aerodromes = useMemo(() =>
    context.aerodromes.filter(aerodrome => aerodrome.id !== searchAerodromeId),
    [context.aerodromes])

  const splitIndex = splitRender
    ? Math.ceil(aerodromes.length / 2)
    : -1

  return (
    <>
      <Messages />
      <div className={`aerodromes-container ${splitRender && "split"}`}>
        <div className={`renders-container ${splitRender && "split"}`}>
          {aerodromes.map((aerodrome, index) => {
            if (splitRender && index >= splitIndex) return

            return (
              <AerodromeRender
                key={aerodrome.id}
                aerodrome={aerodrome} />
            )
          })}
        </div>
        {splitRender && (
          <div className="renders-container split">
            {aerodromes.map((aerodrome, index) => {
              if (index < splitIndex) return

              return (
                <AerodromeRender
                  key={aerodrome.id}
                  aerodrome={aerodrome} />
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

export default Aerodromes
