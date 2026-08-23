import type { Dispatch, SetStateAction } from "react"
import type { AirportData } from "../types";
import { useFlightPathContext } from "../Context";
import { searchAirportId, SVG_URLS } from "../utilities";

type AirportHeaderButtonsProps = {
    airport: AirportData;
    reportsOpen: boolean;
    notamsOpen: boolean;
    dateOpen: boolean;
    operationalHoursOpen: boolean;
    setReportsOpen: Dispatch<SetStateAction<boolean>>;
    setNotamsOpen: Dispatch<SetStateAction<boolean>>;
    setDateOpen: Dispatch<SetStateAction<boolean>>;
    setOperationalHoursOpen: Dispatch<SetStateAction<boolean>>;
}

const AirportHeaderButtons = (props: AirportHeaderButtonsProps) => {
    const context = useFlightPathContext();

    const handleDelete = () => {
        if (window.confirm(`Delete ${props.airport.formValues.icaoId}?`)) {
            context.handleDeleteAirport(props.airport.id)
        }
    }

    const handleSubmit = () => {
        if (!props.airport.isLoading) {
            context.handleSubmit(props.airport, true)
        }
    }

    return (
        <>
            {props.airport.id !== searchAirportId && (
                <div className="airport-header-buttons">
                    <button
                        type="button"
                        className="btn-delete"
                        onClick={handleDelete}>
                        <img src={SVG_URLS.close} width="20" />
                    </button>
                    <div className="airport-header-icao">
                        <h4>{props.airport.formValues.icaoId}</h4>
                    </div>
                    <button
                        type="button"
                        className={`btn-refetch ${props.airport.isLoading ? "loading" : ""}`}
                        onClick={handleSubmit}>
                        <img src={SVG_URLS.reload} width="20" />
                    </button>
                </div>
            )}
            <div className="airport-header-buttons">
                <button
                    type="button"
                    className={`btn-taf-metar ${props.reportsOpen ? "open" : ""}`}
                    onClick={() => props.setReportsOpen(value => !value)}>
                    <h4>TAF/METAR</h4>
                </button>
                <button
                    type="button"
                    className={`btn-notam ${props.notamsOpen ? "open" : ""}`}
                    onClick={() => props.setNotamsOpen(value => !value)}>
                    <h4>NOTAM</h4>
                </button>
                <button
                    type="button"
                    className={`btn-date ${props.dateOpen ? "open" : ""}`}
                    onClick={() => props.setDateOpen(value => !value)}>
                    <h4>DATE</h4>
                </button>
                <button
                    type="button"
                    className={`btn-operational-hours ${props.operationalHoursOpen ? "open" : ""}`}
                    onClick={() => props.setOperationalHoursOpen(value => !value)}>
                    <h4>O. HOURS</h4>
                </button>
            </div>
        </>
    )
}

export default AirportHeaderButtons;
