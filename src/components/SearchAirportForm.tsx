import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { useFlightPathContext } from "../Context"
import type { AirportFormValues, AirportsResourceResponse } from "../types"
import { fetchAirportsPage, fetchAirports, SVG_URLS, searchAirportId, PATH_AIRPORTS } from "../utilities"
import Expand from "./Expand"
import AirportRender from "./AirportRender"

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
    const { register, getValues, setFocus, setValue, watch, handleSubmit: formSubmit } = form;
    const selectedIcaoId = watch("icaoId");

    const onOpen = useCallback(() => {
        setFocus("icaoId");
    }, [setFocus]);

    useImperativeHandle(ref, () => ({ onOpen }), [onOpen]);

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
            document.addEventListener("pointerdown", handleSearchOpen)
            document.addEventListener("focusin", handleSearchOpen)
        }
    }, [searchOpen])

    const previousSearchParam = useRef("")
    const handleSearch = async () => {
        try {
            setSearchMessage("")
            const response = await fetchAirports(searchParam);
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
                throw new Error(`Received status code ${response.status} while verifying airport ICAO code`)
            }

            context.handleAddAirport(selectedIcaoId)
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "There was an unexpected error while verifying airport ICAO code"

            setSearchMessage(message)
        }
    }

    return (
        <FormProvider {...form}>
            <form onSubmit={formSubmit(handleSubmit)}>
                <div className="airport-render-container search">
                    <div className="airport-header-container search">
                        {searchAirport && (
                            <div className="airport-header-buttons">
                                <input
                                    type="text"
                                    className="input-search"
                                    placeholder="Search airport by ICAO"
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
                                    placeholder="Search airports by name or city"
                                    value={searchParam}
                                    onChange={(e) => setSearchParam(e.target.value)}
                                    onFocus={() => setSearchOpen(true)} />
                                <button
                                    type="submit"
                                    className={`btn-search ${searchAirport.isLoading ? "loading" : ""}`}>
                                    <img src={SVG_URLS.search} width="20" />
                                </button>
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
                    {searchAirport && (
                        <AirportRender airport={searchAirport} />
                    )}
                    {searchMessage.length > 0 && (
                        <p className="message warning">{searchMessage}</p>
                    )}
                    <div className="sticky">
                        <button
                            type="button"
                            disabled={selectedIcaoId.length === 0}
                            onClick={handleAddAirport}>
                            Add to My Airports
                        </button>
                    </div>
                </div>
            </form>
        </FormProvider >
    )
})

export default SearchAirportForm;
