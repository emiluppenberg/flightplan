import type { Dispatch, SetStateAction } from "react"
import type { AirportData } from "../types";
import { useFlightPathContext } from "../Context";
import { SVG_URLS } from "../utilities";

type AirportHeaderButtonsProps = {
    airport: AirportData;
    airportIndex: number;
    reportsOpen: boolean;
    notamsOpen: boolean;
    setReportsOpen: Dispatch<SetStateAction<boolean>>;
    setNotamsOpen: Dispatch<SetStateAction<boolean>>;
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
                onClick={handleDelete}>
                <img src={SVG_URLS.close} width="20" />
            </button>
            <button
                type="button"
                className={`btn-icao ${props.reportsOpen ? "open" : ""}`}
                onClick={() => props.setReportsOpen(value => !value)}>
                <h4>{props.airport.icaoId.length > 0 ? props.airport.icaoId.toUpperCase() : "New ICAO"}</h4>
            </button>
            <button
                type="button"
                className={`btn-notam ${props.notamsOpen ? "open" : ""}`}
                onClick={() => props.setNotamsOpen(value => !value)}>
                <h4>NOTAM</h4>
            </button>
            <button
                type="button"
                className="btn-refetch"
                onClick={() => context.handleSubmit(props.airport.formValues, props.airportIndex)}>
                <img src={SVG_URLS.reload} width="20" />
            </button>
        </div>
    )
}

export default AirportHeaderButtons;
