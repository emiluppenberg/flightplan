import type { AirportData } from "../types";
import ReportRender from "./ReportRender";
import { codeHighlights } from "../types";
import { useFlightPathContext } from "../Context";
import AirportForm from "./AirportForm";
import { useState } from "react";

const visibilityRegEx = codeHighlights.find(
    highlight => highlight.label === "visibility"
)?.regEx;


type AirportRenderProps = {
    airport: AirportData;
    airportIndex: number;
}

const AirportRender = (props: AirportRenderProps) => {
    const context = useFlightPathContext()
    const [formOpen, setFormOpen] = useState(false)
    const [airportOpen, setAirportOpen] = useState(false)

    const formatRaw = (raw: string) => {
        const codes = raw.trim().split(/\s+/);
        const formatted: string[] = [];

        for (let index = 0; index < codes.length; index++) {
            const nextCode = codes[index + 1];
            const combined = nextCode ? `${codes[index]} ${nextCode}` : "";
            const isCombinedCode = visibilityRegEx?.test(combined) ?? false;

            if (isCombinedCode) {
                formatted.push(combined);
                index++;
            } else {
                formatted.push(codes[index]);
            }
        }

        return formatted;
    };

    const reports = [
        ...props.airport.METAR.map((metar, index) => (
            <ReportRender
                key={`airport-${props.airportIndex}-metar-${index}`}
                airportIndex={props.airportIndex}
                report="METAR"
                codes={formatRaw(metar.rawOb)}
                highlights={context.highlightsMETAR}
                isMostRecentMETAR={index === 0} />
        )),
        ...props.airport.TAF.map((taf, index) => (
            <ReportRender
                key={`airport-${props.airportIndex}-taf-${index}`}
                airportIndex={props.airportIndex}
                report="TAF"
                codes={formatRaw(taf.rawTAF)}
                highlights={context.highlightsTAF} />
        ))
    ];

    return (
        <div className="airport-render-container">
            <div className="airport-header">
                <button
                    type="button"
                    className={`${airportOpen ? "open" : ""}`}
                    onClick={() => setAirportOpen(value => !value)}
                >
                    <h4>{props.airport.icaoId.length > 0 ? props.airport.icaoId.toUpperCase() : "New ICAO"}</h4>
                </button>
                <button
                    type="button"
                    className={`${formOpen ? "open" : ""}`}
                    onClick={() => setFormOpen(value => !value)}>
                    Controls
                </button>
            </div>
            <div className={`airport-form-container ${formOpen ? "open" : ""}`}>
                <div className="airport-form-content">
                    <AirportForm
                        airport={props.airport}
                        onSetFormValues={(newValues) => context.handleSetFormValues(newValues, props.airportIndex)}
                        onSetHighlightsTAF={(newHighlights) => context.handleSetHighlightsTAF(newHighlights, props.airportIndex)}
                        onSetHighlightsMETAR={(newHighlights) => context.handleSetHighlightsMETAR(newHighlights, props.airportIndex)}
                        onDelete={() => context.handleDeleteAirport(props.airportIndex)}
                        onSubmit={(values) => context.handleSubmit(values, props.airportIndex)}
                    />
                </div>
            </div>
            <div className="airport-data-container">
                <div className="airport-data-content">
                    {reports[0]}
                    <div className={`airport-data-expand ${airportOpen ? "open" : ""}`}>
                        <div>
                            {reports.slice(1)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AirportRender;
