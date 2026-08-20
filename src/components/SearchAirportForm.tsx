import { forwardRef, useCallback, useImperativeHandle, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { useFlightPathContext } from "../Context"
import type { AirportFormValues, AirportsResourceResponse } from "../types"
import ReportRender from "./ReportRender"
import { fetchAirportsPage, fetchAirports, formatRawCodes, SVG_URLS, getOpeningHours, searchAirportId } from "../utilities"
import AirportDatetimeForm from "./AirportDatetimeForm"
import Expand from "./Expand"
import NotamRender from "./NotamRender"

type SearchAirportFormProps = {
    onClose: () => void;
}

export type SearchAirportFormHandle = {
    onOpen: () => void;
}

const SearchAirportForm = forwardRef<SearchAirportFormHandle, SearchAirportFormProps>(({ onClose }, ref) => {
    const context = useFlightPathContext()
    const searchAirport = context.airports.find(airport => airport.id === searchAirportId)
    const form = useForm<AirportFormValues>({
        defaultValues: searchAirport?.formValues
    })
    const { register, getValues, setFocus, setValue, watch } = form;
    const selectedIcaoId = watch("icaoId");

    const reportsMETAR = searchAirport
        ? [
            ...searchAirport.METAR.map((metar, index) => (
                <ReportRender
                    key={`search-airport-metar-${index}`}
                    icaoId={searchAirport.formValues.icaoId}
                    report="METAR"
                    codes={formatRawCodes(metar.rawOb)}
                    highlights={context.highlightsMETAR}
                    isMostRecentMETAR={index === 0} />))
        ]
        : []

    const reportsTAF = searchAirport
        ? [
            ...searchAirport.TAF.map((taf, index) => (
                <ReportRender
                    key={`search-airport--taf-${index}`}
                    icaoId={searchAirport.formValues.icaoId}
                    report="TAF"
                    codes={formatRawCodes(taf.rawTAF)}
                    highlights={context.highlightsTAF} />))
        ]
        : []

    const reportsNOTAM = searchAirport
        ? [
            ...searchAirport.NOTAM.map((notam, index) => (
                <NotamRender
                    key={`search-airport-notam-${index}`}
                    notam={notam} />))
        ]
        : []

    const airportOpeningHours = searchAirport
        ? getOpeningHours(searchAirport.NOTAM)
        : ""

    const onOpen = useCallback(() => {
        setFocus("icaoId");
    }, [setFocus]);

    useImperativeHandle(ref, () => ({ onOpen }), [onOpen]);

    const [searchResponse, setSearchResponse] = useState<AirportsResourceResponse>()
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchParam, setSearchParam] = useState("")
    const [searchMessage, setSearchMessage] = useState("")

    const handleSearch = async () => {
        setSearchMessage("")
        try {
            const response = await fetchAirports(searchParam);
            setSearchResponse(response)
        } catch (error) {
            setSearchMessage(error instanceof Error ? error.message : "There was an unexpected error during search")
        }
    }

    const handlePagination = async (page: string) => {
        setSearchMessage("")
        try {
            const response = await fetchAirportsPage(page);
            setSearchResponse(response)
        } catch (error) {
            setSearchMessage(error instanceof Error ? error.message : "There was an unexpected error during pagination")
        }
    }

    const handleSelectSearchItem = (icao: string) => {
        const values: AirportFormValues = {
            ...getValues(),
            icaoId: icao.trim().toUpperCase(),
        };

        setValue("icaoId", values.icaoId, {
            shouldDirty: true,
            shouldValidate: true,
        });

        context.handleSetFormValues(values, searchAirportId);
        
        if (searchAirport) {
            context.handleSubmit(searchAirport!, true);
        }
    }

    const handleSubmit = () => {
        if (searchAirport && !searchAirport.isLoading) {
            context.handleSubmit(searchAirport, true);
        }
    }

    

    return (
        <FormProvider {...form}>
            <div className="airport-render-container search">
                <div className="airport-header-container search">
                    <div className="airport-header-buttons">
                        <input
                            type="text"
                            className="btn-icao"
                            placeholder="Search airports by name"
                            value={searchParam}
                            onChange={(e) => setSearchParam(e.target.value)}
                            onClick={() => setSearchOpen(true)} />
                        <button
                            type="button"
                            disabled={searchResponse?.links.prev ? false : true}
                            onClick={() => searchResponse?.links.prev && handlePagination(searchResponse.links.prev)}>
                            Back
                        </button>
                        <button
                            type="button"
                            disabled={searchResponse?.links.next ? false : true}
                            onClick={() => searchResponse?.links.next && handlePagination(searchResponse.links.next)}>
                            Next
                        </button>
                        <button
                            type="button"
                            className={`btn-search`}
                            onClick={() => handleSearch()}>
                            <img src={SVG_URLS.search} width="20" />
                        </button>
                    </div>
                    <Expand
                        isOpen={searchOpen}
                        rows={1}>
                        <div className="airport-header-search">
                            {searchMessage.length > 0 && (
                                <p className="message warning">{searchMessage}</p>
                            )}
                            {searchResponse?.data.map((airport, index) => (
                                <button
                                    key={`search-airport-${index}`}
                                    type="button"
                                    disabled={searchAirport?.isLoading ? true : false}
                                    className={`btn-search-item ${selectedIcaoId === airport.attributes.code ? "open" : ""}`}
                                    onClick={() => handleSelectSearchItem(airport.attributes.code)}>
                                    <span className="search-item-icao">{airport.attributes.code}</span>
                                    <span className="search-item-name">{airport.attributes.name}</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                className="btn-sticky"
                                onClick={() => setSearchOpen(false)}>
                                Close
                            </button>
                        </div>
                    </Expand>
                    {searchAirport && (
                        <>
                            <div className="airport-header-buttons">
                                <input
                                    type="text"
                                    className="btn-icao"
                                    placeholder="Enter ICAO"
                                    value={searchAirport.formValues.icaoId}
                                    {...register("icaoId", {
                                        required: true,
                                        setValueAs: (value: string) => value.trim().toUpperCase(),
                                        onChange: () => context.handleSetFormValues(getValues(), searchAirportId)
                                    })} />
                                <button
                                    type="button"
                                    className={`btn-search ${searchAirport.isLoading ? "loading" : ""}`}
                                    onClick={handleSubmit}>
                                    <img src={SVG_URLS.search} width="20" />
                                </button>
                            </div>
                            <div className="airport-header-expand open">
                                <div>
                                    <AirportDatetimeForm id={searchAirportId} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
                {searchAirport && (
                    <div className="airport-search-container">
                        {searchAirport.isLoading && (
                            <p className="message">Loading...</p>
                        )}
                        {searchAirport.messages.length > 0 && (
                            <p className="message warning">{searchAirport.messages}</p>
                        )}
                        <p className="message operating-hours">{airportOpeningHours}</p>
                        {reportsNOTAM}
                        {reportsMETAR}
                        {reportsTAF}
                    </div>
                )}
                <button
                    className="btn-sticky"
                    onClick={() => context.handleAddAirport(selectedIcaoId)}>
                    Add to My Airports
                </button>
            </div>
        </FormProvider>
    )
})

export default SearchAirportForm;
