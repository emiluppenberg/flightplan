import { useFlightPathContext } from "../Context"
import { HIGHLIGHTS_NOTAM, HIGHLIGHTS_OPERATIONAL_HOURS, HIGHLIGHTS_TAF_METAR } from "../types"
import HighlightsField from "./HighlightsField"

const Config = () => {
    const context = useFlightPathContext()

    return (
        <div className="form">
            <div className="form-row highlights-row">
                <HighlightsField
                    title="METAR"
                    options={HIGHLIGHTS_TAF_METAR}
                    selections={context.highlightsMETAR}
                    onSelected={async (selections) => await context.handleSetHighlights(selections, "METAR")} />
                <HighlightsField
                    title="TAF"
                    options={HIGHLIGHTS_TAF_METAR}
                    selections={context.highlightsTAF}
                    onSelected={async (selections) => await context.handleSetHighlights(selections, "TAF")} />
                <HighlightsField
                    title="NOTAM"
                    options={HIGHLIGHTS_NOTAM}
                    selections={context.highlightsNOTAM}
                    onSelected={async (selections) => await context.handleSetHighlights(selections, "NOTAM")} />
                <HighlightsField
                    title="OPR. HOURS"
                    options={HIGHLIGHTS_OPERATIONAL_HOURS}
                    selections={context.highlightsOPERATIONAL_HOURS}
                    onSelected={async (selections) => await context.handleSetHighlights(selections, "OPERATIONAL HOURS")} />
            </div>
            <div className="form-row">
                <fieldset>
                    <label>
                        Query METAR previous hours
                        <input
                            type="number"
                            value={context.queryMetarPreviousHours}
                            onChange={async (e) => await context.handleSetQueryMetarPreviousHours(Number(e.target.value))} />
                    </label>
                </fieldset>
            </div>
        </div>
    )
}

export default Config;