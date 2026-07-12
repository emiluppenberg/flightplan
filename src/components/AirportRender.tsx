import type { AirportData } from "../types";
import ReportRender from "./ReportRender";

type AirportRenderProps = {
    airport: AirportData;
    airportIndex: number;
}

const AirportRender = (props: AirportRenderProps) => {

    return (
        <div className="airport-render-container">
            {props.airport.TAF.length > 0 && (
                <div className="airport-data-container">
                    <h4>{props.airport.TAF[0].icaoId.toUpperCase()}</h4>
                    {props.airport.TAF.map((taf, index) => (
                        <ReportRender
                            key={`airport-${props.airportIndex}-taf-${index}`}
                            airportIndex={props.airportIndex}
                            codes={taf.rawTAF.split(" ")}
                            highlights={props.airport.highlightsTAF} />
                    ))}
                    {props.airport.METAR.map((metar, index) => (
                        <ReportRender
                            key={`airport-${props.airportIndex}-metar-${index}`}
                            airportIndex={props.airportIndex}
                            codes={metar.rawOb.split(" ")}
                            highlights={props.airport.highlightsMETAR}
                            isMostRecentMETAR={index === 0} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default AirportRender;