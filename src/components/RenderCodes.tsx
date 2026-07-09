import { type CodeHighlight } from "../types";

type RenderCodesProps = {
    isMostRecentMETAR?: boolean;
    codes: string[];
    highlights?: CodeHighlight[];
}

const RenderCodes = (props: RenderCodesProps) => {

    return (
        <div className="report-container">
            <div className="report-type">{props.codes[0]}</div>
            <div className="report-icao">{props.codes[1]}</div>
            <div className="report-codes">
                {props.codes.map((code, index) => {
                    if (index === 0 || index === 1) return;

                    const isMatch = props.highlights?.some(highlight => code.match(highlight.regEx))
                    const className = [
                        props.isMostRecentMETAR ? "most-recent" : "",
                        isMatch ? "code-highlight" : ""
                    ].filter(Boolean).join(" ")

                    return (<pre><span key={index} className={className}>{code} </span></pre>)
                })}
            </div>
        </div>
    )
}

export default RenderCodes;