import { useMemo } from "react";
import { useFlightPathContext } from "../Context";
import type { NotamEntry } from "../types";

type NotamRenderProps = {
    notam: NotamEntry;
}

const NotamRender = (props: NotamRenderProps) => {
    const context = useFlightPathContext()
    const classes = useMemo(() =>
        [...context.highlightsOPERATIONAL_HOURS, ...context.highlightsNOTAM]
            .filter(highlight => highlight.regEx.test(props.notam.q_code ?? props.notam.raw))
            .map(highlight => highlight.class),
        [context.highlightsOPERATIONAL_HOURS, context.highlightsNOTAM])

    return (
        <div className="airport-notam-container">
            <pre>
                <span className={classes.join(" ")}>{props.notam.raw}</span>
            </pre>
        </div>
    )
}

export default NotamRender;