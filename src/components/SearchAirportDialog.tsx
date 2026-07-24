import { FormProvider, useForm } from "react-hook-form"
import { useFlightPathContext } from "../Context"
import type { AirportFormValues } from "../types"
import ReportRender from "./ReportRender"
import { formatRawCodes, searchAirportIndex, SVG_URLS } from "../utilities"
import AirportDatetimeForm from "./AirportDatetimeForm"
import { useRef, type MouseEvent } from "react"


const SearchAirportDialog = () => {
    const context = useFlightPathContext()
    const form = useForm<AirportFormValues>({
        defaultValues: context.searchAirport.formValues
    })
    const { register, getValues, setFocus } = form;
    const hasData = context.searchAirport.TAF.length > 0 || context.searchAirport.METAR.length > 0;
    const dialogRef = useRef<HTMLDialogElement>(null)

    const reports = [
        ...context.searchAirport.METAR.map((metar, index) => (
            <ReportRender
                key={`search-airport-metar-${index}`}
                airportIndex={searchAirportIndex}
                report="METAR"
                codes={formatRawCodes(metar.rawOb)}
                highlights={context.highlightsMETAR}
                isMostRecentMETAR={index === 0} />
        )),
        ...context.searchAirport.TAF.map((taf, index) => (
            <ReportRender
                key={`search-airport--taf-${index}`}
                airportIndex={searchAirportIndex}
                report="TAF"
                codes={formatRawCodes(taf.rawTAF)}
                highlights={context.highlightsTAF} />
        ))
    ];

    const saveFormValues = () => {
        context.handleSetFormValues(getValues(), searchAirportIndex)
    }

    const handleOpenDialog = () => {
        dialogRef.current?.showModal();
        setFocus("icaoId");
    }

    const handleCloseDialog = () => {
        dialogRef.current?.close();
    }

    const handleDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const clickedOutside =
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom;

        if (clickedOutside) {
            handleCloseDialog();
        }
    }

    return (
        <>
            <button className="btn-search" onClick={handleOpenDialog}>
                <img src={SVG_URLS.search} width="20" />
            </button>
            <dialog
                className="search-dialog"
                ref={dialogRef}
                onClick={handleDialogClick}
            >
                <h2>Search</h2>
                <div className="search-dialog-content">
                    <FormProvider {...form}>
                        <div className="airport-render-container search">
                            <div className="airport-header-container search">
                                <div className="airport-header-buttons">
                                    <button
                                        type="button"
                                        className="btn-delete"
                                        onClick={handleCloseDialog}
                                    >
                                        <img src={SVG_URLS.close} width="20" />
                                    </button>
                                    <input
                                        type="text"
                                        className="btn-icao"
                                        placeholder="Enter ICAO"
                                        value={context.searchAirport.formValues.icaoId}
                                        {...register("icaoId", {
                                            required: true,
                                            setValueAs: (value: string) => value.trim().toUpperCase(),
                                            onChange: saveFormValues
                                        })}
                                    />
                                    <button
                                        type="button"
                                        className="btn-search"
                                        onClick={() => context.handleSubmit(context.searchAirport.formValues, searchAirportIndex)}
                                    >
                                        <img src={SVG_URLS.search} width="20" />
                                    </button>
                                </div>
                                <div className="airport-header-expand open">
                                    <div>
                                        <AirportDatetimeForm airportIndex={searchAirportIndex} />
                                    </div>
                                </div>
                            </div>
                            <div className="airport-data-container">
                                <div className="airport-data-expand open">
                                    <div>
                                        {context.searchAirport.messages.length > 0 && (
                                            <p className="message">{context.searchAirport.messages}</p>
                                        )}
                                        {reports}
                                    </div>
                                    <button
                                        className="airport-add"
                                        disabled={!hasData}
                                        onClick={context.handleAddAirport}>
                                        Save airport
                                    </button>
                                </div>
                            </div>
                        </div>
                    </FormProvider>
                </div>
            </dialog>
        </>
    )
}

export default SearchAirportDialog;
