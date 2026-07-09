import type { ChangeEvent } from "react";
import { codeHighlights, type CodeHighlight } from "../types";

type HighlightsFieldProps = {
    title: string;
    selections: CodeHighlight[];
    onSelected: (selections: CodeHighlight[]) => void;
}

const HighlightsField = (props: HighlightsFieldProps) => {
    const handleSelect = (e: ChangeEvent<HTMLInputElement>, codeHighlight: CodeHighlight) => {
        const nextSelections = e.target.checked
            ? [...props.selections, codeHighlight]
            : props.selections.filter((selection) => selection.value !== codeHighlight.value)

        props.onSelected(nextSelections)
    }

    return (
        <fieldset>
            <div className="title">{props.title}</div>
            <div className="options">
                {codeHighlights.map((codeHighlight) => (
                    <label key={`code-highlight-picker-${codeHighlight.value}`}>
                        {codeHighlight.value}
                        <input
                            type="checkbox"
                            checked={props.selections.some((selection) => selection.value === codeHighlight.value)}
                            onChange={(e) => handleSelect(e, codeHighlight)}
                        />
                    </label>
                ))}
            </div>
        </fieldset>
    )
}

export default HighlightsField;
