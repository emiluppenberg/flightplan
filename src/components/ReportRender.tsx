import { type CodeHighlight } from "../types";

type ReportRenderProps = {
    airportIndex: number;
    report: "TAF" | "METAR";
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

                    const match = props.highlights?.find(highlight =>
                        (highlight.report === props.report || highlight.report === "TAF/METAR") &&
                        highlight.regEx.test(code)
                    )
                    const variant = match?.variants?.find(variant =>
                        (variant.report === props.report || variant.report === "TAF/METAR") &&
                        variant.regEx.test(code)
                    )
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
