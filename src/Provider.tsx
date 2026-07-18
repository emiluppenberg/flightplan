import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import type {
    AirportData,
    AirportFormValues,
    CodeHighlight,
    METARJson,
    TAFJson
} from "./types";
import { FlightPathContext } from "./Context";
import { fetchTAF, fetchMETAR } from "./utilities";
import {
    createAirportId,
    loadStoredAirports,
    saveStoredAirports
} from "./airportStorage";

type AirportRefreshResult = {
    status: "fulfilled";
    id: string;
    TAF: TAFJson[];
    METAR: METARJson[];
} | {
    status: "rejected";
    id: string;
    icaoId: string;
}

export const FlightPathProvider = ({ children }: PropsWithChildren) => {
    const [loadedState] = useState(loadStoredAirports)
    const [airports, setAirports] = useState<AirportData[]>(loadedState.airports)
    const [isLoading, setIsLoading] = useState(
        loadedState.airports.some(airport => airport.formValues.icaoId.trim().length > 0)
    )
    const [error, setError] = useState(loadedState.error ?? "")
    const hasInitalizedState = useRef(false)

    useEffect(() => {
        const storageError = saveStoredAirports(airports)
        if (!storageError) return;

        const errorTimeout = window.setTimeout(() => setError(storageError), 0)
        return () => window.clearTimeout(errorTimeout)
    }, [airports])

    useEffect(() => {
        if (hasInitalizedState.current) return;
        hasInitalizedState.current = true;

        const refreshAirports = async () => {
            const results = await Promise.all(loadedState.airports.map(async airport => {
                try {
                    const [TAF, METAR] = await Promise.all([
                        fetchTAF(airport.formValues.icaoId),
                        fetchMETAR(airport.formValues.icaoId)
                    ])
                    METAR.sort((a, b) => Date.parse(b.receiptTime) - Date.parse(a.receiptTime))

                    return {
                        status: "fulfilled",
                        id: airport.id,
                        TAF,
                        METAR
                    } satisfies AirportRefreshResult
                } catch {
                    return {
                        status: "rejected",
                        id: airport.id,
                        icaoId: airport.formValues.icaoId
                    } satisfies AirportRefreshResult
                }
            }))

            const successfulResults = new Map<string, Extract<AirportRefreshResult, { status: "fulfilled" }>>()
            const failedIcaoIds: string[] = []

            results.forEach(result => {
                if (result.status === "fulfilled") {
                    successfulResults.set(result.id, result)
                } else {
                    failedIcaoIds.push(result.icaoId.length > 0
                        ? result.icaoId.toUpperCase()
                        : "unspecified ICAO")
                }
            })

            setAirports(current => current.map(airport => {
                const result = successfulResults.get(airport.id)
                if (!result) return airport;

                return {
                    ...airport,
                    TAF: result.TAF,
                    METAR: result.METAR
                }
            }))

            if (failedIcaoIds.length > 0) {
                setError(`Failed to refresh: ${failedIcaoIds.join(", ")}`)
            }
            setIsLoading(false)
        }

        void refreshAirports()
    }, [])

    const handleSubmit = async (values: AirportFormValues, airportIndex: number) => {
        setIsLoading(true)
        setError('')

        try {
            const TAF = await fetchTAF(values.icaoId, values.date, values.time)
            const METAR = await fetchMETAR(values.icaoId)

            METAR.sort((a, b) => Date.parse(b.receiptTime) - Date.parse(a.receiptTime))

            setAirports(current => current.map((airport, index) =>
                index === airportIndex
                    ? { ...airport, formValues: values, TAF, METAR }
                    : airport))
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch TAF and/or METAR data.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSetFormValues = (values: AirportFormValues, airportIndex: number) => {
        setAirports(current => current.map((airport, index) => {
            if (index !== airportIndex) return airport;

            return {
                ...airport,
                formValues: values
            }
        }))
    }

    const handleSetHighlightsTAF = (newHighlights: CodeHighlight[], airportIndex: number) => {
        setAirports(current => current.map((airport, index) => {
            if (index !== airportIndex) return airport;

            return {
                ...airport,
                highlightsTAF: newHighlights
            }
        }))
    }

    const handleSetHighlightsMETAR = (newHighlights: CodeHighlight[], airportIndex: number) => {
        setAirports(current => current.map((airport, index) => {
            if (index !== airportIndex) return airport;

            return {
                ...airport,
                highlightsMETAR: newHighlights
            }
        }))
    }

    const handleAddAirport = () => {
        setAirports(current => [...current, {
            id: createAirportId(),
            formValues: {
                icaoId: "",
                date: "",
                time: ""
            },
            TAF: [],
            METAR: [],
            highlightsTAF: [],
            highlightsMETAR: []
        }])
    }

    const handleDeleteAirport = (airportIndex: number) => {
        setAirports(current => current.filter((airport, index) => index !== airportIndex))
    }
    return (
        <FlightPathContext
            value={{
                airports,
                handleSubmit,
                handleSetFormValues,
                handleSetHighlightsTAF,
                handleSetHighlightsMETAR,
                handleAddAirport,
                handleDeleteAirport,
                isLoading,
                error
            }}>
            {children}
        </FlightPathContext>
    )
}
