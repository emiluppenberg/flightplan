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
                <div className="airports-container">
                    {context.airports.map((airport, index) => {
                        const className = [
                            "app-header-button",
                            index === openFormIndex ? "open" : ""
                        ].join(" ")

                        return (
                            <button
                                key={`airport-form-button-${airport.id}`}
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
            </div>
            {openFormIndex !== undefined &&
                context.airports[openFormIndex] && (
                    <>
                        <AirportForm
                            key={`airport-form-${context.airports[openFormIndex].id}`}
                            airport={context.airports[openFormIndex]}
                            onSetFormValues={(newValues) => context.handleSetFormValues(newValues, openFormIndex)}
                            onSetHighlightsTAF={(newHighlights) => context.handleSetHighlightsTAF(newHighlights, openFormIndex)}
                            onSetHighlightsMETAR={(newHighlights) => context.handleSetHighlightsMETAR(newHighlights, openFormIndex)}
                            onDelete={() => context.handleDeleteAirport(openFormIndex)}
                            onSubmit={(values) => context.handleSubmit(values, openFormIndex)}
                        />
                    </>
                )}
        </div>
    )
}

export default AppHeader;
