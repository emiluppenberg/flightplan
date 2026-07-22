import type { Dispatch, SetStateAction } from "react"
import type { AirportData } from "../types";
import { useFlightPathContext } from "../Context";

type AirportHeaderButtonsProps = {
    airport: AirportData;
    airportIndex: number;
    airportOpen: boolean;
    setAirportOpen: Dispatch<SetStateAction<boolean>>;
}

const AirportHeaderButtons = (props: AirportHeaderButtonsProps) => {
    const context = useFlightPathContext();

    const handleDelete = () => {
        if (window.confirm(`Delete ${props.airport.icaoId}?`)) {
            context.handleDeleteAirport(props.airportIndex)
        }
    }

    return (
        <div className="airport-header-buttons">
            <button
                type="button"
                className="delete"
                onClick={handleDelete}
            >
                X
            </button>
            <button
                type="button"
                className={`icao ${props.airportOpen ? "open" : ""}`}
                onClick={() => props.setAirportOpen(value => !value)}
            >
                <h4>{props.airport.icaoId.length > 0 ? props.airport.icaoId.toUpperCase() : "New ICAO"}</h4>
            </button>
            <button
                type="button"
                className="refetch"
                onClick={() => context.handleSubmit(props.airport.formValues, props.airportIndex)}
            >
                O
            </button>
        </div>
    )
}

export default AirportHeaderButtons;