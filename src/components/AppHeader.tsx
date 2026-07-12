import { useState } from "react"
import { useFlightPathContext } from "../Context"
import AirportForm from "./AirportForm"
import AppLogo from "./AppLogo"

const AppHeader = () => {
    const context = useFlightPathContext()
    const [openFormIndex, setOpenFormIndex] = useState<number | undefined>(undefined)

    const handleClickFormButton = (airportIndex: number) => {
        if (openFormIndex === airportIndex) setOpenFormIndex(undefined)
        else setOpenFormIndex(airportIndex)
    }

    return (
        <div className="app-header">
            <div className="app-header-row">
                <AppLogo />
                <button
                    className="app-header-button"
                    onClick={context.handleAddAirport}>
                    Add airport
                </button>
                {context.airports.map((airport, index) => {
                    const className = [
                        "app-header-button",
                        index === openFormIndex ? "open" : ""
                    ].join(" ")

                    return (
                        <button
                            key={`airport-form-button-${index}`}
                            className={className}
                            onClick={() => handleClickFormButton(index)}>
                            {
                                airport.formValues.icaoId.length > 0
                                    ? airport.formValues.icaoId
                                    : "ICAO"
                            }
                        </button>
                    )
                })}
            </div>
            {openFormIndex !== undefined &&
                context.airports[openFormIndex] && (
                    <>
                        <AirportForm
                            key={`airport-form-${openFormIndex}`}
                            airport={context.airports[openFormIndex]}
                            onSetHighlightsTAF={(newHighlights) => context.handleSetHighlightsTAF(newHighlights, openFormIndex)}
                            onSetHighlightsMETAR={(newHighlights) => context.handleSetHighlightsMETAR(newHighlights, openFormIndex)}
                            onSubmit={(values) => context.handleSubmit(values, openFormIndex)}
                        />
                    </>
                )}
        </div>
    )
}

export default AppHeader;