import type { CSSProperties, PropsWithChildren } from "react";

type ExpandProps = PropsWithChildren<{
    isOpen: boolean;
    rows: number;
    mode?: "horizontal" | "vertical";
}>

type ExpandStyles = CSSProperties & { "--expand-track": string; }

const Expand = (props: ExpandProps) => {
    const style: ExpandStyles = { "--expand-track": props.isOpen ? `${props.rows}fr` : "0fr" }

    return (
        <div
            className={`expand ${props.mode ?? "vertical"} ${props.isOpen ? "open" : ""}`}
            aria-hidden={!props.isOpen}
            style={style}>
            <div className="expand-content">
                {props.children}
            </div>
        </div>
    )
}

export default Expand;
