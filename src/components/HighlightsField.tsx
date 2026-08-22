import { useMemo, type ChangeEvent } from "react";
import { type CodeHighlight } from "../types";

type HighlightsFieldProps = {
    title: string;
    options: CodeHighlight[];
    selections: CodeHighlight[];
    onSelected: (selections: CodeHighlight[]) => void;
}

const HighlightsField = (props: HighlightsFieldProps) => {
    const isToggled = useMemo(() => props.selections.length === props.options.length, [props.selections])

    const handleSelect = (e: ChangeEvent<HTMLInputElement>, codeHighlight: CodeHighlight) => {
        const nextSelections = e.target.checked
            ? [...props.selections, codeHighlight]
            : props.selections.filter((selection) => selection.label !== codeHighlight.label)

        props.onSelected(nextSelections)
    }

    const handleToggleAll = () => {
        const nextSelections = isToggled
            ? []
            : props.options

        props.onSelected(nextSelections)
    }

    return (
        <fieldset>
            <div className="title">{props.title}</div>
            <div className="options">
                <label className="toggle-all">
                    Select all
                    <input
                        type="checkbox"
                        checked={isToggled}
                        onChange={handleToggleAll}
                    />
                </label>
                {props.options.map((codeHighlight) => (
                    <label key={`code-highlight-picker-${codeHighlight.label}`}>
                        {codeHighlight.label}
                        <input
                            type="checkbox"
                            checked={props.selections.some((selection) => selection.label === codeHighlight.label)}
                            onChange={(e) => handleSelect(e, codeHighlight)}
                        />
                    </label>
                ))}
            </div>
        </fieldset>
    )
}

export default HighlightsField;
