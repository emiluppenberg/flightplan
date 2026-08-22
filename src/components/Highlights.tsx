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
                    onSelected={(selections) => context.handleSetHighlightsMETAR(selections)} />
                <HighlightsField
                    title="TAF"
                    options={HIGHLIGHTS_TAF_METAR}
                    selections={context.highlightsTAF}
                    onSelected={(selections) => context.handleSetHighlightsTAF(selections)} />
                <HighlightsField
                    title="NOTAM"
                    options={HIGHLIGHTS_NOTAM}
                    selections={context.highlightsNOTAM}
                    onSelected={(selections) => context.handleSetHighlightsNOTAM(selections)} />
                <HighlightsField
                    title="OPR. HOURS"
                    options={HIGHLIGHTS_OPERATIONAL_HOURS}
                    selections={context.highlightsOPERATIONAL_HOURS}
                    onSelected={(selections) => context.handleSetHighlightsOPERATIONAL_HOURS(selections)} />
            </div>
        </div>
    )
}

export default Highlights;