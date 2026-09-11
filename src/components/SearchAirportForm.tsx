import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { useFlightPathContext } from "../Context"
import type { AirportFormValues, AirportsResourceResponse } from "../types"
import { searchAirportId } from "../utilities"
import Expand from "./Expand"
import AirportRender from "./AirportRender"
import { fetchAirports, fetchAirportsPage, PATH_AIRPORTS } from "../api/resources"

const SearchAirportForm = () => {
    const context = useFlightPathContext()
    const searchAirport = context.airports.find(airport => airport.id === searchAirportId)
    const form = useForm<AirportFormValues>({
        defaultValues: searchAirport?.formValues
    })
    const { register, getValues, setValue, watch, handleSubmit: formSubmit } = form;
    const selectedIcaoId = watch("icaoId")

    const [searchResponse, setSearchResponse] = useState<AirportsResourceResponse>()
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchParam, setSearchParam] = useState("")
    const [searchMessage, setSearchMessage] = useState("")

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
            setSearchMessage("")
            const searchId = ++previousSearchId.current
            const response = await fetchAirports(searchParam);

            if (searchId < previousSearchId.current) return

            setSearchResponse(response)
        } catch (error) {
            setSearchMessage(error instanceof Error ? error.message : "There was an unexpected error during search")
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
            context.handleSubmit({ ...searchAirport, formValues: values }, true);
        }
    }

    const handleSubmit = () => {
        if (searchAirport && !searchAirport.isLoading) {
            context.handleSubmit(searchAirport, true);
        }
    }

    const handleAddAirport = async () => {
        if (!searchAirport) return

        try {
            const response = await fetch(`${PATH_AIRPORTS}/${selectedIcaoId}`)

            if (!response.ok) {
                throw new Error(`Received status code ${response.status} while verifying ICAO code ${selectedIcaoId}`)
            }

            context.handleAddAirport(selectedIcaoId)
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : `There was an unexpected error while verifying ICAO code ${selectedIcaoId}`

            setSearchMessage(message)
        }
    }

    const airportRender = useMemo(() =>
        searchAirport && <AirportRender airport={searchAirport} form={form} />,
        [searchAirport])

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
                    {searchMessage.length > 0 && (
                        <p className="message warning">{searchMessage}</p>
                    )}
                    <div className="sticky">
                        <button
                            type="button"
                            disabled={selectedIcaoId.length === 0}
                            onClick={handleAddAirport}>
                            Save
                        </button>
                    </div>
                </div>
            </form>
        </FormProvider >
    )
}

export default SearchAirportForm;
