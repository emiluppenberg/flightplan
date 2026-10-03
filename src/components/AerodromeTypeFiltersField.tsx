interface AerodromeTypeFiltersFieldProps {
    onClose: () => void
    onChecked: (checked: boolean, value: "large_airport" | "medium_airport" | "small_airport" | "seaplane_base" | "heliport" | "balloonport" | "closed") => void
    aerodromeTypeFilters: ("large_airport" | "medium_airport" | "small_airport" | "seaplane_base" | "heliport" | "balloonport" | "closed")[]
}

const AerodromeTypeFiltersField = (props: AerodromeTypeFiltersFieldProps) => {
    return (
        <div className="form">
            <div className="form-row">
                <fieldset>
                    <button
                        type="button"
                        className="title"
                        onClick={props.onClose}
                    >Close</button>
                    <div className="options">
                        <label className="config">
                            closed
                            <input
                                type="checkbox"
                                value="closed"
                                checked={props.aerodromeTypeFilters.includes("closed")}
                                onChange={(e) => props.onChecked(e.target.checked, "closed")} />
                        </label>
                        <label className="config">
                            balloonport
                            <input
                                type="checkbox"
                                value="balloonport"
                                checked={props.aerodromeTypeFilters.includes("balloonport")}
                                onChange={(e) => props.onChecked(e.target.checked, "balloonport")} />
                        </label>
                        <label className="config">
                            heliport
                            <input
                                type="checkbox"
                                value="heliport"
                                checked={props.aerodromeTypeFilters.includes("heliport")}
                                onChange={(e) => props.onChecked(e.target.checked, "heliport")} />
                        </label>
                        <label className="config">
                            seaplane base
                            <input
                                type="checkbox"
                                value="seaplane_base"
                                checked={props.aerodromeTypeFilters.includes("seaplane_base")}
                                onChange={(e) => props.onChecked(e.target.checked, "seaplane_base")} />
                        </label>
                        <label className="config">
                            small airport
                            <input
                                type="checkbox"
                                value="small_airport"
                                checked={props.aerodromeTypeFilters.includes("small_airport")}
                                onChange={(e) => props.onChecked(e.target.checked, "small_airport")} />
                        </label>
                        <label className="config">
                            medium airport
                            <input
                                type="checkbox"
                                value="medium_airport"
                                checked={props.aerodromeTypeFilters.includes("medium_airport")}
                                onChange={(e) => props.onChecked(e.target.checked, "medium_airport")} />
                        </label>
                        <label className="config">
                            large airport
                            <input
                                type="checkbox"
                                value="large_airport"
                                checked={props.aerodromeTypeFilters.includes("large_airport")}
                                onChange={(e) => props.onChecked(e.target.checked, "large_airport")} />
                        </label>
                    </div>
                </fieldset>
            </div>
        </div>
    )
}

export default AerodromeTypeFiltersField