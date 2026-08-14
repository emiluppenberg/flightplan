import type { NotamEntry } from "../types";

type NotamRenderProps = {
    notam: NotamEntry;
}

const NotamRender = (props: NotamRenderProps) => {
    return (
        <div className="airport-notam-container">
            <pre>
                <span>{props.notam.raw}</span>
            </pre>
        </div>
    )
}

export default NotamRender;