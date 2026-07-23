import type { CSSProperties, PropsWithChildren } from "react";

type ExpandProps = PropsWithChildren<{
    isOpen: boolean;
    rows: number;
}>

type ExpandStyles = CSSProperties & { "--expand-rows": string; }

const Expand = (props: ExpandProps) => {
    const style: ExpandStyles = { "--expand-rows": props.isOpen ? `${props.rows}fr` : "0fr" }

    return (
        <div
            className={`expand ${props.isOpen ? "open" : ""}`}
            style={style}>
            <div className="expand-content">
                {props.children}
            </div>
        </div>
    )
}

export default Expand;