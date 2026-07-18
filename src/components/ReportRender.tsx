import { type CodeHighlight } from "../types";

type ReportRenderProps = {
    airportIndex: number;
    codes: string[];
    highlights?: CodeHighlight[];
    isMostRecentMETAR?: boolean;
}

const ReportRender = (props: ReportRenderProps) => {

    return (
        <div className="airport-report-container">
            <div className="airport-report-type">{props.codes[0]}</div>
            <div className="airport-report-icao">{props.codes[1]}</div>
            <div className="airport-report-codes">
                {props.codes.map((code, index) => {
                    if (index === 0 || index === 1) return;

                    const match = props.highlights?.find(highlight => code.match(highlight.regEx))
                    const variant = match?.variants?.find(variant => code.match(variant.regEx))
                    const className = [
                        props.isMostRecentMETAR ? "most-recent" : "",
                        match ? match.class : "",
                        variant ? variant.class : ""
                    ].filter(Boolean).join(" ")

                    return (
                        <pre key={`airport-${props.airportIndex}-report-${index}`}>
                            <span className={className}>{code} </span>
                        </pre>
                    )
                })}
            </div>
        </div>
    )
}

export default ReportRender;