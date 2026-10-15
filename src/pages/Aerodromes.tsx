import { useMemo, type RefObject } from 'react'
import AerodromeRender from '../components/AerodromeRender'
import { useFlightPathContext } from '../Context'
import { useWorkspaceWidth } from '../hooks'
import { searchAerodromeId } from '../utilities'
import Messages from '../components/Messages'
import LoadingSpinner from '../components/LoadingSpinner'
import { Link, useOutletContext } from 'react-router'

const Aerodromes = () => {
  const context = useFlightPathContext()
  const parentContainerRef = useOutletContext<RefObject<HTMLDivElement | null>>()
  const splitRender = useWorkspaceWidth(parentContainerRef) >= 960

  const aerodromes = useMemo(() =>
    context.aerodromes.filter(aerodrome => aerodrome.id !== searchAerodromeId),
    [context.aerodromes])

  const splitIndex = splitRender
    ? Math.ceil(aerodromes.length / 2)
    : -1

  return (
    <>
      <Messages />
      <div className="section-heading">
        <div>
          <div className="section-title">
            <h1 className="eyebrow">MY BRIEFINGS</h1>
            <LoadingSpinner />
          </div>
          <p>
            Saved aerodromes and live conditions.
          </p>
        </div>
        <Link className="primary-action" to="/search">+ Add aerodrome</Link>
      </div>
      <div className={`aerodromes-container ${splitRender && "split"}`}>
        {aerodromes.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-mark" aria-hidden="true">✳</div>
            <h2>Build your briefing board</h2>
            <p>Search for an aerodrome to review TAFs, METARs, NOTAMs, and operational hours. Save it here for a quick return.</p>
            <Link className="primary-action" to="/search">Search aerodromes <span aria-hidden="true">↗</span></Link>
          </div>
        )}
        {aerodromes.length > 0 && <div className={`renders-container ${splitRender && "split"}`}>
          {aerodromes.map((aerodrome, index) => {
            if (splitRender && index >= splitIndex) return

            return (
              <AerodromeRender
                key={aerodrome.id}
                aerodrome={aerodrome} />
            )
          })}
        </div>}
        {aerodromes.length > 0 && splitRender && (
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
