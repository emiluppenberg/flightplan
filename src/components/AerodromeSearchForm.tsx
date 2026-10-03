import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { useFlightPathContext } from "../Context"
import { type RegionsResourceResponse, type AerodromeFormValues, type AerodromesResourceResponse } from "../types"
import { searchAerodromeId } from "../utilities"
import Expand from "./Expand"
import AerodromeRender from "./AerodromeRender"
import { fetchAerodromesName, fetchPage, fetchAerodromeIcaoId, fetchRegionsName, fetchAerodromesRegionId, fetchLocation } from "../api/resources"
import AerodromeTypeFiltersField from "./AerodromeTypeFiltersField"

const AerodromeSearchForm = () => {
    const context = useFlightPathContext()
    const searchAerodrome = context.aerodromes.find(aerodrome => aerodrome.id === searchAerodromeId)
    const form = useForm<AerodromeFormValues>({
        defaultValues: searchAerodrome?.formValues
    })
    const { register, getValues, setValue, handleSubmit: formSubmit } = form;

    const [error, setError] = useState("")
    const [searchOpen, setSearchOpen] = useState(false)
    const searchAerodromeNameRef = useRef<HTMLInputElement>(null)
    const searchRegionNameRef = useRef<HTMLInputElement>(null)
    const searchPanelRef = useRef<HTMLDivElement>(null)
    const handleSearchOpen = (e: Event) => {
        if (!(e.target instanceof Node)) return

        const isInsideSearchPanel =
            searchAerodromeNameRef.current?.contains(e.target) ||
            searchRegionNameRef.current?.contains(e.target) ||
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

    const [aerodromeResponse, setAerodromeResponse] = useState<AerodromesResourceResponse>()
    const [regionResponse, setRegionResponse] = useState<RegionsResourceResponse>()
    const [regionAerodromeResponse, setRegionAerodromeResponse] = useState<AerodromesResourceResponse>()
    const [aerodromeNameParam, setAerodromeNameParam] = useState("")
    const [regionNameParam, setRegionNameParam] = useState("")
    const [searchType, setSearchType] = useState<"aerodrome" | "region" | "region aerodromes">("aerodrome")
    const previousAerodromeNameParam = useRef("")
    const previousRegionNameParam = useRef("")

    const globalSearchId = useRef(0)

    const handleSearchAerodromesName = async () => {
        try {
            setError("")

            const searchId = ++globalSearchId.current
            const aerodromes = await fetchAerodromesName(aerodromeNameParam);

            if (searchId < globalSearchId.current) return
            setAerodromeResponse(aerodromes)

        } catch (error) {
            setError(error instanceof Error ? error.message : "There was an unexpected error during search")
        }
    }

    const handleSearchRegionsName = async () => {
        try {
            setError("")

            const searchId = ++globalSearchId.current
            const regions = await fetchRegionsName(regionNameParam)

            if (searchId < globalSearchId.current) return
            setRegionAerodromeResponse(undefined)
            setRegionResponse(regions)
        } catch (error) {
            setError(error instanceof Error ? error.message : "There was an unexpected error during search")
        }
    }

    const handleSearchInterval = useCallback(async () => {
        if (previousAerodromeNameParam.current !== aerodromeNameParam) {
            previousAerodromeNameParam.current = aerodromeNameParam
            handleSearchAerodromesName()
        }
        if (previousRegionNameParam.current !== regionNameParam) {
            previousRegionNameParam.current = regionNameParam
            handleSearchRegionsName()
        }

    }, [aerodromeNameParam, regionNameParam])

    useEffect(() => {
        const intervalId = setInterval(handleSearchInterval, 1000)
        return (() => clearInterval(intervalId))
    }, [handleSearchInterval])

    const handlePaginationAerodromes = async (page: string) => {
        try {
            setError("")

            const searchId = ++globalSearchId.current
            const response = await fetchPage(page) as AerodromesResourceResponse;

            if (searchId < globalSearchId.current) return
            setAerodromeResponse(response)
        } catch (error) {
            setError(error instanceof Error ? error.message : "There was an unexpected error during aerodrome pagination")
        }
    }

    const handlePaginationRegionAerodromes = async (page: string) => {
        try {
            setError("")

            const searchId = ++globalSearchId.current
            const response = await fetchPage(page) as AerodromesResourceResponse;

            if (searchId < globalSearchId.current) return
            setRegionAerodromeResponse(response)
        } catch (error) {
            setError(error instanceof Error ? error.message : "There was an unexpected error during region-aerodrome pagination")
        }
    }

    const handlePaginationRegions = async (page: string) => {
        try {
            setError("")

            const searchId = ++globalSearchId.current
            const response = await fetchPage(page) as RegionsResourceResponse;

            if (searchId < globalSearchId.current) return
            setRegionResponse(response)
        } catch (error) {
            setError(error instanceof Error ? error.message : "There was an unexpected error during regions pagination")
        }
    }

    const handleSelectAerodrome = async (id: string) => {
        if (!searchAerodrome) return

        ++globalSearchId.current

        try {
            setError("")

            const values: AerodromeFormValues = {
                ...getValues(),
                icaoId: id.trim().toUpperCase(),
            }

            setValue("icaoId", values.icaoId, {
                shouldDirty: true,
                shouldValidate: true,
            })

            context.handleSetFormValues(values, searchAerodromeId);
            context.handleSubmit({ ...searchAerodrome, formValues: values }, true);
        } catch (error) {
            setError(error instanceof Error ? error.message : `There was an unexpected error while fetching data for ICAO: ${id}`)
        }
    }

    const handleSelectRegion = async (regionId: string) => {
        try {
            setError("")

            const searchId = ++globalSearchId.current
            const resourceResponse = await fetchAerodromesRegionId(regionId)

            if (searchId < globalSearchId.current) return
            setRegionAerodromeResponse(resourceResponse)
            setSearchType("region aerodromes")
            return true
        } catch (error) {
            setError(error instanceof Error ? error.message : `There was an unexpected error while fetching data for ICAO: ${regionId}`)
        }
        return false
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

    const [initialized, setInitialized] = useState(false)
    useEffect(() => {
        if (initialized) return

        const searchId = ++globalSearchId.current
        navigator.geolocation.getCurrentPosition(async (data) => {
            const location = await fetchLocation(data.coords)

            if (searchId < globalSearchId.current) return
            if (await handleSelectRegion(location.address["ISO3166-2-lvl4"])) {
                setSearchOpen(true)
            }
        })

        setInitialized(true)
    }, [initialized])

    const [aerodromeTypeFiltersOpen, setAerodromeTypeFiltersOpen] = useState(false)
    const [aerodromeTypeFilters, setAerodromeTypeFilters] = useState<("large_airport" | "medium_airport" | "small_airport" | "seaplane_base" | "heliport" | "balloonport" | "closed")[]>(["large_airport", "medium_airport", "small_airport"])
    const filteredAerodromes = useMemo(() =>
        aerodromeResponse?.data.filter(aerodrome =>
            aerodromeTypeFilters.some(filter => filter === aerodrome.attributes.type))
        , [aerodromeTypeFilters, aerodromeResponse])
    const filteredRegionAerodromes = useMemo(() =>
        regionAerodromeResponse?.data.filter(aerodrome =>
            aerodromeTypeFilters.some(filter => filter === aerodrome.attributes.type))
        , [aerodromeTypeFilters, regionAerodromeResponse])

    return (
        <FormProvider {...form}>
            <form onSubmit={formSubmit(handleSubmit)}>
                <div className="aerodrome-render-container">
                    <div className="aerodrome-header-container">
                        {!aerodromeTypeFiltersOpen && (
                            <button
                                type="button"
                                onClick={() => setAerodromeTypeFiltersOpen(true)}
                            >Filter aerodrome types</button>
                        )}
                        <Expand
                            isOpen={aerodromeTypeFiltersOpen}
                            rows={1}>
                            <AerodromeTypeFiltersField
                                aerodromeTypeFilters={aerodromeTypeFilters}
                                onClose={() => setAerodromeTypeFiltersOpen(false)}
                                onChecked={(checked, value) => setAerodromeTypeFilters(filters => checked
                                    ? [...filters, value]
                                    : filters.filter(filter => filter !== value)
                                )} />
                        </Expand>
                        {searchAerodrome && (
                            <div className="aerodrome-header-buttons search-header-buttons">
                                <input
                                    type="text"
                                    className="input-search"
                                    placeholder="Search aerodrome by code"
                                    value={searchAerodrome.formValues.icaoId}
                                    {...register("icaoId", {
                                        required: true,
                                        setValueAs: (value: string) => value.trim().toUpperCase(),
                                        onChange: () => context.handleSetFormValues(getValues(), searchAerodromeId)
                                    })} />
                                <input
                                    ref={searchAerodromeNameRef}
                                    type="text"
                                    className="input-search"
                                    placeholder="Search aerodromes by name"
                                    value={aerodromeNameParam}
                                    onChange={(e) => {
                                        ++globalSearchId.current
                                        setSearchType("aerodrome")
                                        setAerodromeNameParam(e.target.value)
                                    }}
                                    onFocus={async () => {
                                        ++globalSearchId.current
                                        setSearchType("aerodrome")
                                        setSearchOpen(true)
                                    }} />
                                <input
                                    ref={searchRegionNameRef}
                                    type="text"
                                    className="input-search"
                                    placeholder="Search aerodromes by region"
                                    value={regionNameParam}
                                    onChange={(e) => {
                                        ++globalSearchId.current
                                        setSearchType("region")
                                        setRegionNameParam(e.target.value)
                                    }}
                                    onFocus={async () => {
                                        ++globalSearchId.current
                                        if (regionAerodromeResponse) {
                                            setSearchType("region aerodromes")
                                        } else {
                                            setSearchType("region")
                                        }

                                        setSearchOpen(true)
                                    }} />
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
                                {searchType === "aerodrome" && aerodromeResponse && (
                                    filteredAerodromes && filteredAerodromes.length > 0
                                        ? filteredAerodromes.map((aerodrome, index) => (
                                            <button
                                                key={`${searchAerodromeId}-aerodrome-${index}`}
                                                type="button"
                                                disabled={searchAerodrome?.isLoading ? true : false}
                                                className={`btn-search-item ${searchAerodrome?.formValues.icaoId === aerodrome.attributes.code ? "open" : ""}`}
                                                onClick={() => handleSelectAerodrome(aerodrome.attributes.code)}>
                                                <span className="search-item-icao">{aerodrome.attributes.code}</span>
                                                <span className="search-item-name">{aerodrome.attributes.name}</span>
                                            </button>
                                        ))
                                        : <p className="message">
                                            {aerodromeTypeFilters.length > 0
                                                ? `No aerodromes found matching types: ${aerodromeTypeFilters.map(filter => filter.replaceAll("_", " ")).join(", ")}`
                                                : "Select at least one aerodrome type"}
                                        </p>
                                )}
                                {searchType === "aerodrome" && (
                                    <div className="sticky">
                                        <button
                                            type="button"
                                            className="btn-sticky sibling"
                                            disabled={aerodromeResponse?.links.prev ? false : true}
                                            onClick={() => aerodromeResponse?.links.prev && handlePaginationAerodromes(aerodromeResponse.links.prev)}>
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-sticky sibling"
                                            disabled={aerodromeResponse?.links.next ? false : true}
                                            onClick={() => aerodromeResponse?.links.next && handlePaginationAerodromes(aerodromeResponse.links.next)}>
                                            Next
                                        </button>
                                    </div>
                                )}
                                {searchType === "region" && regionResponse?.data.map((region, index) => (
                                    <button
                                        key={`region-${index}`}
                                        type="button"
                                        className={`btn-search-item`}
                                        onClick={() => handleSelectRegion(region.id)}>
                                        <span className="search-item-icao">{region.id}</span>
                                        <span className="search-item-name">{region.attributes.name}</span>
                                    </button>
                                ))}
                                {searchType === "region" && (
                                    <div className="sticky">
                                        <button
                                            type="button"
                                            className="btn-sticky sibling"
                                            disabled={regionResponse?.links.prev ? false : true}
                                            onClick={() => regionResponse?.links.prev && handlePaginationRegions(regionResponse.links.prev)}>
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-sticky sibling"
                                            disabled={regionResponse?.links.next ? false : true}
                                            onClick={() => regionResponse?.links.next && handlePaginationRegions(regionResponse.links.next)}>
                                            Next
                                        </button>
                                    </div>
                                )}
                                {searchType === "region aerodromes" && regionAerodromeResponse && (
                                    filteredRegionAerodromes && filteredRegionAerodromes.length > 0
                                        ? filteredRegionAerodromes.map((aerodrome, index) => (
                                            <button
                                                key={`region-aerodrome-${index}`}
                                                type="button"
                                                disabled={searchAerodrome?.isLoading ? true : false}
                                                className={`btn-search-item ${searchAerodrome?.formValues.icaoId === aerodrome.attributes.code ? "open" : ""}`}
                                                onClick={() => handleSelectAerodrome(aerodrome.attributes.code)}>
                                                <span className="search-item-icao">{aerodrome.attributes.code}</span>
                                                <span className="search-item-name">{aerodrome.attributes.name}</span>
                                            </button>
                                        ))
                                        : <div>
                                            <p className="message">
                                                {regionAerodromeResponse.data.length > 0
                                                    ? aerodromeTypeFilters.length > 0
                                                        ? `No aerodromes found matching types: ${aerodromeTypeFilters.map(filter => filter.replaceAll("_", " ")).join(", ")}`
                                                        : "Select at least one aerodrome type"
                                                    : "No airports for selected region"}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    ++globalSearchId.current
                                                    setRegionAerodromeResponse(undefined)
                                                    setSearchType("region")
                                                }}>
                                                OK
                                            </button>
                                        </div>
                                )}
                                {searchType === "region aerodromes" && (
                                    <div className="sticky">
                                        <button
                                            type="button"
                                            className="btn-sticky sibling"
                                            onClick={() => {
                                                ++globalSearchId.current
                                                setRegionAerodromeResponse(undefined)
                                                setSearchType("region")
                                            }}>
                                            Regions
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-sticky sibling"
                                            disabled={regionAerodromeResponse?.links.prev ? false : true}
                                            onClick={() => regionAerodromeResponse?.links.prev && handlePaginationRegionAerodromes(regionAerodromeResponse.links.prev)}>
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-sticky sibling"
                                            disabled={regionAerodromeResponse?.links.next ? false : true}
                                            onClick={() => regionAerodromeResponse?.links.next && handlePaginationRegionAerodromes(regionAerodromeResponse.links.next)}>
                                            Next
                                        </button>
                                    </div>
                                )}

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
                            : (<p className="message info">Search aerodrome to display data</p>)}
                    </div>
                </div>
            </form>
        </FormProvider >
    )
}

export default AerodromeSearchForm;
