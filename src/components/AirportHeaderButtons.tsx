import type { Dispatch, SetStateAction } from "react"
import type { AirportData } from "../types";
import { useFlightPathContext } from "../Context";
import deleteIcon from "/ui/close-lg-svgrepo-com.svg?url";
import reloadIcon from "/ui/reload-svgrepo-com.svg?url";

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
                className="btn-delete"
                onClick={handleDelete}
            >
                <img src={deleteIcon} width="20" />
            </button>
            <button
                type="button"
                className={`btn-icao ${props.airportOpen ? "open" : ""}`}
                onClick={() => props.setAirportOpen(value => !value)}
            >
                <h4>{props.airport.icaoId.length > 0 ? props.airport.icaoId.toUpperCase() : "New ICAO"}</h4>
            </button>
            <button
                type="button"
                className="btn-refetch"
                onClick={() => context.handleSubmit(props.airport.formValues, props.airportIndex)}
            >
                <img src={reloadIcon} width="20" />
            </button>
        </div>
    )
}

export default AirportHeaderButtons;
