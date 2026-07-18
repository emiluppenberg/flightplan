import type { AirportData } from "../types";
import ReportRender from "./ReportRender";
import { codeHighlights } from "../types";

const visibilityRegEx = codeHighlights.find(
    highlight => highlight.value === "visibility"
)?.regEx;


type AirportRenderProps = {
    airport: AirportData;
    airportIndex: number;
}

const AirportRender = (props: AirportRenderProps) => {
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

    return (
        <div className="airport-render-container">
            {props.airport.TAF.length > 0 && (
                <div className="airport-data-container">
                    <h4>{props.airport.TAF[0].icaoId.toUpperCase()}</h4>
                    {props.airport.TAF.map((taf, index) => (
                        <ReportRender
                            key={`airport-${props.airportIndex}-taf-${index}`}
                            airportIndex={props.airportIndex}
                            report="TAF"
                            codes={formatRaw(taf.rawTAF)}
                            highlights={props.airport.highlightsTAF} />
                    ))}
                    {props.airport.METAR.map((metar, index) => (
                        <ReportRender
                            key={`airport-${props.airportIndex}-metar-${index}`}
                            airportIndex={props.airportIndex}
                            report="METAR"
                            codes={formatRaw(metar.rawOb)}
                            highlights={props.airport.highlightsMETAR}
                            isMostRecentMETAR={index === 0} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default AirportRender;
