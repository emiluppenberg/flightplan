import { useFlightPathContext } from "../Context"
import HighlightsField from "./HighlightsField"

const Highlights = () => {
    const context = useFlightPathContext()

    return (
        <div className="form">
            <div className="form-row highlights-row">
                <HighlightsField
                    title="METAR highlights"
                    selections={context.highlightsMETAR}
                    onSelected={(selections) => context.handleSetHighlightsMETAR(selections)}
                />
                <HighlightsField
                    title="TAF highlights"
                    selections={context.highlightsTAF}
                    onSelected={(selections) => context.handleSetHighlightsTAF(selections)}
                />
            </div>
        </div>
    )
}

export default Highlights;