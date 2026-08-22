import { useFlightPathContext } from "../Context"
import { HIGHLIGHTS_NOTAM, HIGHLIGHTS_OPERATIONAL_HOURS, HIGHLIGHTS_TAF_METAR } from "../types"
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
                    onSelected={(selections) => context.handleSetHighlights(selections, "METAR")} />
                <HighlightsField
                    title="TAF"
                    options={HIGHLIGHTS_TAF_METAR}
                    selections={context.highlightsTAF}
                    onSelected={(selections) => context.handleSetHighlights(selections, "TAF")} />
                <HighlightsField
                    title="NOTAM"
                    options={HIGHLIGHTS_NOTAM}
                    selections={context.highlightsNOTAM}
                    onSelected={(selections) => context.handleSetHighlights(selections, "NOTAM")} />
                <HighlightsField
                    title="OPR. HOURS"
                    options={HIGHLIGHTS_OPERATIONAL_HOURS}
                    selections={context.highlightsOPERATIONAL_HOURS}
                    onSelected={(selections) => context.handleSetHighlights(selections, "OPERATIONAL HOURS")} />
            </div>
        </div>
    )
}

export default Highlights;