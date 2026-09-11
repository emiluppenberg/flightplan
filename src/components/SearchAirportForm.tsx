import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { useFlightPathContext } from "../Context"
import type { AirportFormValues, AerodromesResourceResponse } from "../types"
import { searchAirportId } from "../utilities"
import Expand from "./Expand"
import AirportRender from "./AirportRender"
import { fetchAerodromes, fetchAerodromesPage, fetchAerodromeIcaoId } from "../api/resources"

const SearchAirportForm = () => {
    const context = useFlightPathContext()
    const searchAirport = context.airports.find(airport => airport.id === searchAirportId)
    const form = useForm<AirportFormValues>({
        defaultValues: searchAirport?.formValues
    })
    const { register, getValues, setValue, watch, handleSubmit: formSubmit } = form;
    const selectedIcaoId = watch("icaoId")

    const [error, setError] = useState("")
    const [searchResponse, setSearchResponse] = useState<AerodromesResourceResponse>()
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchParam, setSearchParam] = useState("")

    const searchInputRef = useRef<HTMLInputElement>(null)
    const searchPanelRef = useRef<HTMLDivElement>(null)
    const handleSearchOpen = (e: Event) => {
        if (!(e.target instanceof Node)) return

        const isInsideSearchPanel =
            searchInputRef.current?.contains(e.target) ||
            searchPanelRef.current?.contains(e.target)

        if (!isInsideSearchPanel) {
            setSearchOpen(false)
        }
    }

    useEffect(() => {
        if (!searchOpen) return

        document.addEventListener("pointerdown", handleSearchOpen)
        document.addEventListener("focusin", handleSearchOpen)

        return () => {
            document.removeEventListener("pointerdown", handleSearchOpen)
            document.removeEventListener("focusin", handleSearchOpen)
        }
    }, [searchOpen])

    const previousSearchParam = useRef("")
    const previousSearchId = useRef(0)
    const handleSearch = async () => {
        try {
            setError("")
            const searchId = ++previousSearchId.current
            const response = await fetchAerodromes(searchParam);

            if (searchId < previousSearchId.current) return

            setSearchResponse(response)
        } catch (error) {
            setError(error instanceof Error ? error.message : "There was an unexpected error during search")
        }
    }

    const searchInterval = useCallback(async () => {
        if (previousSearchParam.current === searchParam) return

        previousSearchParam.current = searchParam
        handleSearch()
    }, [searchParam])

    useEffect(() => {
        const intervalId = setInterval(searchInterval, 1000)
        return (() => clearInterval(intervalId))
    }, [searchInterval])

    const handlePagination = async (page: string) => {
        setError("")

        try {
            const response = await fetchAerodromesPage(page);
            setSearchResponse(response)
        } catch (error) {
            setError(error instanceof Error ? error.message : "There was an unexpected error during pagination")
        }
    }

    const handleSelectSearchItem = (icaoId: string) => {
        setError("")

        try {
            if (searchAirport) {
                const values: AirportFormValues = {
                    ...getValues(),
                    icaoId: icaoId.trim().toUpperCase(),
                }

                setValue("icaoId", values.icaoId, {
                    shouldDirty: true,
                    shouldValidate: true,
                })

                context.handleSetFormValues(values, searchAirportId);
                context.handleSubmit({ ...searchAirport, formValues: values }, true);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : `There was an unexpected error while fetching data for ICAO: ${icaoId}`)
        }
    }

    const handleSubmit = async () => {
        setError("")

        try {
            if (searchAirport && !searchAirport.isLoading) {
                const values: AirportFormValues = {
                    ...getValues(),
                    icaoId: await fetchAerodromeIcaoId(searchAirport.formValues.icaoId),
                }

                setValue("icaoId", values.icaoId, {
                    shouldDirty: true,
                    shouldValidate: true,
                })

                context.handleSetFormValues(values, searchAirportId);
                context.handleSubmit({ ...searchAirport, formValues: values }, true);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : `There was an unexpected error while fetching data for ICAO: ${searchAirport?.formValues.icaoId}`)
        }
    }

    const airportRender = useMemo(() =>
        searchAirport && <AirportRender airport={searchAirport} form={form} />,
        [searchAirport])

    const hasSearched = searchAirport && searchAirport.icaoId

    return (
        <FormProvider {...form}>
            <form onSubmit={formSubmit(handleSubmit)}>
                <div className="airport-render-container">
                    <div className="airport-header-container">
                        {searchAirport && (
                            <div className="airport-header-buttons">
                                <input
                                    type="text"
                                    className="input-search"
                                    placeholder="Search aerodrome by ICAO"
                                    value={searchAirport.formValues.icaoId}
                                    {...register("icaoId", {
                                        required: true,
                                        setValueAs: (value: string) => value.trim().toUpperCase(),
                                        onChange: () => context.handleSetFormValues(getValues(), searchAirportId)
                                    })} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    className="input-search"
                                    placeholder="Search aerodromes by name or city"
                                    value={searchParam}
                                    onChange={(e) => setSearchParam(e.target.value)}
                                    onFocus={() => setSearchOpen(true)} />
                                <button
                                    hidden={true}
                                    type="submit" />
                            </div>
                        )}
                        <Expand
                            isOpen={searchOpen}
                            rows={1}>
                            <div
                                ref={searchPanelRef}
                                className="airport-header-search">
                                {searchResponse?.data.map((airport, index) => (
                                    <button
                                        key={`${searchAirportId}-airport-${index}`}
                                        type="button"
                                        disabled={searchAirport?.isLoading ? true : false}
                                        className={`btn-search-item ${selectedIcaoId === airport.attributes.code ? "open" : ""}`}
                                        onClick={() => handleSelectSearchItem(airport.attributes.code)}>
                                        <span className="search-item-icao">{airport.attributes.code}</span>
                                        <span className="search-item-name">{airport.attributes.name}</span>
                                    </button>
                                ))}
                                <div className="sticky">
                                    <button
                                        type="button"
                                        className="btn-sticky sibling"
                                        disabled={searchResponse?.links.prev ? false : true}
                                        onClick={() => searchResponse?.links.prev && handlePagination(searchResponse.links.prev)}>
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-sticky sibling"
                                        disabled={searchResponse?.links.next ? false : true}
                                        onClick={() => searchResponse?.links.next && handlePagination(searchResponse.links.next)}>
                                        Next
                                    </button>
                                </div>
                            </div>
                        </Expand>
                    </div>
                    {airportRender && (airportRender)}
                    {error.length > 0 && (
                        <p className="message warning">{error}</p>
                    )}
                    <div className="sticky">
                        {hasSearched
                            ? (<button
                                type="button"
                                onClick={() => context.handleAddAirport(searchAirport.icaoId)}>
                                Save
                            </button>)
                            : (<p className="message">No data</p>)}
                    </div>
                </div>
            </form>
        </FormProvider >
    )
}

export default SearchAirportForm;
