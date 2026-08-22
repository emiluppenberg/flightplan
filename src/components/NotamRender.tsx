import { useMemo } from "react";
import { useFlightPathContext } from "../Context";
import type { NotamEntry } from "../types";
import { matchesNotamHighlight } from "../utilities";

type NotamRenderProps = {
    notam: NotamEntry;
}

const NotamRender = (props: NotamRenderProps) => {
    const context = useFlightPathContext()
    const classes = useMemo(() =>
        [...context.highlightsOPERATIONAL_HOURS, ...context.highlightsNOTAM]
            .filter(highlight => matchesNotamHighlight(props.notam, highlight))
            .map(highlight => highlight.class),
        [context.highlightsOPERATIONAL_HOURS, context.highlightsNOTAM, props.notam])

    return (
        <div className="airport-notam-container">
            <pre>
                <span className={classes.join(" ")}>{props.notam.raw}</span>
            </pre>
        </div>
    )
}

export default NotamRender;