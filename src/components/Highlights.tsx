import { useFlightPathContext } from "../Context"
import { HIGHLIGHTS_OPERATIONAL_STATUS, HIGHLIGHTS_TAF_METAR } from "../types"
import HighlightsField from "./HighlightsField"

const Highlights = () => {
    const context = useFlightPathContext()

    return (
        <div className="form">
            <div className="form-row highlights-row">
                <HighlightsField
                    title="METAR"
                    options={HIGHLIGHTS_TAF_METAR}
                    selections={context.highlightsMETAR}
                    onSelected={(selections) => context.handleSetHighlightsMETAR(selections)} />
                <HighlightsField
                    title="TAF"
                    options={HIGHLIGHTS_TAF_METAR}
                    selections={context.highlightsTAF}
                    onSelected={(selections) => context.handleSetHighlightsTAF(selections)} />
                <HighlightsField
                    title="OPR.STS"
                    options={HIGHLIGHTS_OPERATIONAL_STATUS}
                    selections={context.highlightsOPERATIONAL_STATUS}
                    onSelected={(selections) => context.handleSetHighlightsOPERATIONAL_STATUS(selections)} />
            </div>
        </div>
    )
}

export default Highlights;