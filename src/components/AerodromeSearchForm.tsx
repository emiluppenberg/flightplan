import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { useFlightPathContext } from "../Context"
import type { AerodromeFormValues, AerodromesResourceResponse } from "../types"
import { searchAerodromeId } from "../utilities"
import Expand from "./Expand"
import AerodromeRender from "./AerodromeRender"
import { fetchAerodromes, fetchAerodromesPage, fetchAerodromeIcaoId } from "../api/resources"

const AerodromeSearchForm = () => {
    const context = useFlightPathContext()
    const searchAerodrome = context.aerodromes.find(aerodrome => aerodrome.id === searchAerodromeId)
    const form = useForm<AerodromeFormValues>({
        defaultValues: searchAerodrome?.formValues
    })
    const { register, getValues, setValue, handleSubmit: formSubmit } = form;

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

    const handleSearchInterval = useCallback(async () => {
        if (previousSearchParam.current === searchParam) return

        previousSearchParam.current = searchParam
        handleSearch()
    }, [searchParam])

    useEffect(() => {
        const intervalId = setInterval(handleSearchInterval, 1000)
        return (() => clearInterval(intervalId))
    }, [handleSearchInterval])

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
            if (searchAerodrome) {
                const values: AerodromeFormValues = {
                    ...getValues(),
                    icaoId: icaoId.trim().toUpperCase(),
                }

                setValue("icaoId", values.icaoId, {
                    shouldDirty: true,
                    shouldValidate: true,
                })

                context.handleSetFormValues(values, searchAerodromeId);
                context.handleSubmit({ ...searchAerodrome, formValues: values }, true);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : `There was an unexpected error while fetching data for ICAO: ${icaoId}`)
        }
    }

    const handleSubmit = async () => {
        setError("")

        try {
            if (searchAerodrome && !searchAerodrome.isLoading) {
                const values: AerodromeFormValues = {
                    ...getValues(),
                    icaoId: await fetchAerodromeIcaoId(searchAerodrome.formValues.icaoId),
                }

                setValue("icaoId", values.icaoId, {
                    shouldDirty: true,
                    shouldValidate: true,
                })

                context.handleSetFormValues(values, searchAerodromeId);
                context.handleSubmit({ ...searchAerodrome, formValues: values }, true);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : `There was an unexpected error while fetching data for ICAO: ${searchAerodrome?.formValues.icaoId}`)
        }
    }

    const aerodromeRender = useMemo(() =>
        searchAerodrome && <AerodromeRender aerodrome={searchAerodrome} form={form} />,
        [searchAerodrome])

    const hasSearched = searchAerodrome && searchAerodrome.icaoId

    return (
        <FormProvider {...form}>
            <form onSubmit={formSubmit(handleSubmit)}>
                <div className="aerodrome-render-container">
                    <div className="aerodrome-header-container">
                        {searchAerodrome && (
                            <div className="aerodrome-header-buttons">
                                <input
                                    type="text"
                                    className="input-search"
                                    placeholder="Search aerodrome by ICAO"
                                    value={searchAerodrome.formValues.icaoId}
                                    {...register("icaoId", {
                                        required: true,
                                        setValueAs: (value: string) => value.trim().toUpperCase(),
                                        onChange: () => context.handleSetFormValues(getValues(), searchAerodromeId)
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
                                className="aerodrome-header-search">
                                {searchResponse?.data.map((aerodrome, index) => (
                                    <button
                                        key={`${searchAerodromeId}-aerodrome-${index}`}
                                        type="button"
                                        disabled={searchAerodrome?.isLoading ? true : false}
                                        className={`btn-search-item ${searchAerodrome?.formValues.icaoId === aerodrome.attributes.code ? "open" : ""}`}
                                        onClick={() => handleSelectSearchItem(aerodrome.attributes.code)}>
                                        <span className="search-item-icao">{aerodrome.attributes.code}</span>
                                        <span className="search-item-name">{aerodrome.attributes.name}</span>
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
                    {aerodromeRender && (aerodromeRender)}
                    {error.length > 0 && (
                        <p className="message warning">{error}</p>
                    )}
                    <div className="sticky">
                        {hasSearched
                            ? (<button
                                type="button"
                                onClick={() => context.handleAddAerodrome(searchAerodrome.icaoId)}>
                                Save {searchAerodrome.icaoId}
                            </button>)
                            : (<p className="message">No data</p>)}
                    </div>
                </div>
            </form>
        </FormProvider >
    )
}

export default AerodromeSearchForm;
