import type { CodeHighlight, METARJson, TAFJson } from "../types";
import RenderCodes from "./RenderCodes";

type FlightPathDataProps = {
    departureTAF: TAFJson[];
    destinationTAF: TAFJson[];
    departureMETAR: METARJson[];
    destinationMETAR: METARJson[];
    departureHighlightsTAF: CodeHighlight[];
    destinationHighlightsTAF: CodeHighlight[];
    departureHighlightsMETAR: CodeHighlight[];
    destinationHighlightsMETAR: CodeHighlight[];
}

const FlightPathData = (props: FlightPathDataProps) => {

    return (
        <div className="flight-path-data">
            {props.departureTAF.length > 0 && (
                <div className="airport-data">
                    <h4>{props.departureTAF[0].icaoId.toUpperCase()}</h4>
                    {props.departureTAF.map((taf, index) => (
                        <RenderCodes
                            key={`departure-taf-${index}`}
                            codes={taf.rawTAF.split(" ")}
                            highlights={props.departureHighlightsTAF} />
                    ))}
                    {props.departureMETAR.map((metar, index) => (
                        <RenderCodes
                            key={`departure-metar-${index}`}
                            isMostRecentMETAR={index === 0}
                            codes={metar.rawOb.split(" ")}
                            highlights={props.departureHighlightsMETAR} />
                    ))}
                </div>
            )}
            {props.destinationTAF.length > 0 && (
                <div className="airport-data">
                    <h4>{props.destinationTAF[0].icaoId.toUpperCase()}</h4>
                    {props.destinationTAF.map((taf, index) => (
                        <RenderCodes
                            key={`destination-taf-${index}`}
                            codes={taf.rawTAF.split(" ")}
                            highlights={props.destinationHighlightsTAF} />
                    ))}
                    {props.destinationMETAR.map((metar, index) => (
                        <RenderCodes
                            key={`destination-metar-${index}`}
                            isMostRecentMETAR={index === 0}
                            codes={metar.rawOb.split(" ")}
                            highlights={props.destinationHighlightsMETAR} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default FlightPathData;