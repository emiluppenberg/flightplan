import { forwardRef, useCallback, useImperativeHandle, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { useFlightPathContext } from "../Context"
import type { AirportFormValues, AirportsResourceResponse } from "../types"
import ReportRender from "./ReportRender"
import { fetchAirportsPage, fetchAirports, formatRawCodes, searchAirportIndex, SVG_URLS, getOpeningHours } from "../utilities"
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
    const form = useForm<AirportFormValues>({
        defaultValues: context.searchAirport.formValues
    })
    const { register, getValues, setFocus, setValue, watch } = form;
    const selectedIcaoId = watch("icaoId");

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
    const notams = [
        ...context.searchAirport.NOTAMs.map((notam, index) => (
            <NotamRender
                key={`search-airport-notam-${index}`}
                notam={notam} />
        ))
    ]

    const airportOpeningHours = getOpeningHours(context.searchAirport.NOTAMs)

    const onOpen = useCallback(() => {
        setFocus("icaoId");
    }, [setFocus]);

    useImperativeHandle(ref, () => ({ onOpen }), [onOpen]);

    const [searchResponse, setSearchResponse] = useState<AirportsResourceResponse>()
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchParam, setSearchParam] = useState("")

    const handleSearch = async () => {
        const result = await fetchAirports(searchParam);
        const response = result[0];

        if (!response) {
            throw new Error(result[1])
        }

        setSearchResponse(response)
    }

    const handlePagination = async (page: string) => {
        const result = await fetchAirportsPage(page);
        const response = result[0];

        if (!response) {
            throw new Error(result[1])
        }

        setSearchResponse(response)
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

        context.handleSetFormValues(values, searchAirportIndex);
        context.handleSubmit(values, searchAirportIndex);
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
                            className="btn-search"
                            onClick={() => handleSearch()}>
                            <img src={SVG_URLS.search} width="20" />
                        </button>
                    </div>
                    <Expand
                        isOpen={searchOpen}
                        rows={1}>
                        <div className="airport-header-search">
                            {searchResponse?.data.map((airport, index) => (
                                <button
                                    key={`search-airport-${index}`}
                                    type="button"
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
                    <div className="airport-header-buttons">
                        <input
                            type="text"
                            className="btn-icao"
                            placeholder="Enter ICAO"
                            value={context.searchAirport.formValues.icaoId}
                            {...register("icaoId", {
                                required: true,
                                setValueAs: (value: string) => value.trim().toUpperCase(),
                                onChange: () => context.handleSetFormValues(getValues(), searchAirportIndex)
                            })} />
                        <button
                            type="button"
                            className="btn-search"
                            onClick={() => context.handleSubmit(context.searchAirport.formValues, searchAirportIndex)}>
                            <img src={SVG_URLS.search} width="20" />
                        </button>
                    </div>
                    <div className="airport-header-expand open">
                        <div>
                            <AirportDatetimeForm airportIndex={searchAirportIndex} />
                        </div>
                    </div>
                </div>
                <div className="airport-search-container">
                    {context.isLoading && (
                        <p className="message">Loading...</p>
                    )}
                    {context.message.length > 0 && (
                        <p className="message warning">{context.message}</p>
                    )}
                    {context.searchAirport.messages.length > 0 && (
                        <p className="message warning">{context.searchAirport.messages}</p>
                    )}
                    <p className="message operating-hours">{airportOpeningHours}</p>
                    {notams}
                    {reports}
                </div>
                <button
                    className="btn-sticky"
                    onClick={context.handleAddAirport}>
                    Add to My Airports
                </button>
            </div>
        </FormProvider>
    )
})

export default SearchAirportForm;
