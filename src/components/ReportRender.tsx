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

                    const isMatch = props.highlights?.some(highlight => code.match(highlight.regEx))
                    const className = [
                        props.isMostRecentMETAR ? "most-recent" : "",
                        isMatch ? "code-highlight" : ""
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