import type { Dispatch, SetStateAction } from "react"
import type { AerodromeData } from "../types";
import { useFlightPathContext } from "../Context";
import { searchAerodromeId, SVG_URLS } from "../utilities";

type AerodromeHeaderButtonsProps = {
    aerodrome: AerodromeData;
    tafMetarOpen: boolean;
    notamsOpen: boolean;
    dateOpen: boolean;
    operationalHoursOpen: boolean;
    tafMetarDisabled: boolean;
    notamsDisabled: boolean;
    dateDisabled: boolean;
    operationalHoursDisabled: boolean;
    setTafMetarOpen: Dispatch<SetStateAction<boolean>>;
    setNotamsOpen: Dispatch<SetStateAction<boolean>>;
    setDateOpen: Dispatch<SetStateAction<boolean>>;
    setOperationalHoursOpen: Dispatch<SetStateAction<boolean>>;
}

const AerodromeHeaderButtons = (props: AerodromeHeaderButtonsProps) => {
    const context = useFlightPathContext();

    const handleDelete = () => {
        if (window.confirm(`Delete ${props.aerodrome.formValues.icaoId}?`)) {
            context.handleDeleteAerodrome(props.aerodrome.id)
        }
    }

    const handleSubmit = () => {
        if (!props.aerodrome.isLoading) {
            context.handleSubmit(props.aerodrome, true)
        }
    }

    return (
        <>
            {props.aerodrome.id !== searchAerodromeId && (
                <div className="aerodrome-header-buttons">
                    <button
                        type="button"
                        className="btn-delete"
                        onClick={handleDelete}>
                        <img src={SVG_URLS.trash} width="20" />
                    </button>
                    <div className="aerodrome-header-icao">
                        <h4>{props.aerodrome.formValues.icaoId}</h4>
                    </div>
                    <button
                        type="button"
                        className={`btn-refetch ${props.aerodrome.isLoading ? "loading" : ""}`}
                        onClick={handleSubmit}>
                        <img src={SVG_URLS.reload} width="20" />
                    </button>
                </div>
            )}
            <div className="aerodrome-header-buttons">
                <button
                    type="button"
                    disabled={props.tafMetarDisabled}
                    className={`btn-taf-metar ${props.tafMetarOpen ? "open" : ""}`}
                    onClick={() => props.setTafMetarOpen(value => !value)}>
                    <h4>TAF/METAR</h4>
                </button>
                <button
                    type="button"
                    disabled={props.notamsDisabled}
                    className={`btn-notam ${props.notamsOpen ? "open" : ""}`}
                    onClick={() => props.setNotamsOpen(value => !value)}>
                    <h4>NOTAM</h4>
                </button>
                <button
                    type="button"
                    disabled={props.dateDisabled}
                    className={`btn-date ${props.dateOpen ? "open" : ""}`}
                    onClick={() => props.setDateOpen(value => !value)}>
                    <h4>DATE</h4>
                </button>
                <button
                    type="button"
                    disabled={props.operationalHoursDisabled}
                    className={`btn-operational-hours ${props.operationalHoursOpen ? "open" : ""}`}
                    onClick={() => props.setOperationalHoursOpen(value => !value)}>
                    <h4>O. HOURS</h4>
                </button>
            </div>
        </>
    )
}

export default AerodromeHeaderButtons;
