import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import type {
    AirportData,
    AirportFormValues,
    AirportRefresh,
    CodeHighlight,
} from "./types";
import { FlightPathContext } from "./Context";
import { fetchTAF, fetchMETAR, createAirportId, createAirport, searchAirportIndex } from "./utilities";
import {
    loadStoredAirports,
    saveStoredAirports
} from "./airportStorage";

export const FlightPathProvider = ({ children }: PropsWithChildren) => {
    const [loadedState] = useState(loadStoredAirports)
    const [airports, setAirports] = useState<AirportData[]>(loadedState.airports)
    const [searchAirport, setSearchAirport] = useState<AirportData>(createAirport())
    const [highlightsTAF, setHighlightsTAF] = useState<CodeHighlight[]>([])
    const [highlightsMETAR, setHighlightsMETAR] = useState<CodeHighlight[]>([])
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
                    const [TAF, TAFMessage] = await fetchTAF(airport.formValues)
                    const [METAR, METARMessage] = await fetchMETAR(airport.formValues)

                    METAR.sort((a, b) => Date.parse(b.receiptTime) - Date.parse(a.receiptTime))

                    return {
                        id: airport.id,
                        TAF,
                        METAR,
                        TAFMessage,
                        METARMessage
                    }
                } catch (error) {
                    setError(error instanceof Error ? error.message : 'Failed to fetch TAF and/or METAR data.')
                }
            }))

            const resultsMap = new Map<string, AirportRefresh>()

            results.forEach(result => {
                result && resultsMap.set(result.id, result)
            })

            setAirports(current => current.map(airport => {
                const result = resultsMap.get(airport.id)
                if (!result) return airport;

                return {
                    ...airport,
                    TAF: result.TAF,
                    METAR: result.METAR
                }
            }))

            setError(results
                .flatMap(result => [result?.TAFMessage, result?.METARMessage])
                .filter((message): message is string => Boolean(message))
                .join(""))

            setIsLoading(false)
        }

        void refreshAirports()
    }, [])

    const handleSubmit = async (values: AirportFormValues, airportIndex: number) => {
        setIsLoading(true)
        setError('')

        try {
            const [TAF, TAFMessage] = await fetchTAF(values)
            const [METAR, METARMessage] = await fetchMETAR(values)

            METAR.sort((a, b) => Date.parse(b.receiptTime) - Date.parse(a.receiptTime))

            if (airportIndex === searchAirportIndex) {
                setSearchAirport(current => ({ ...current, formValues: values, icaoId: values.icaoId, TAF, METAR }))
            } else {
                setAirports(current => current.map((airport, index) =>
                    index === airportIndex
                        ? { ...airport, icaoId: values.icaoId, formValues: values, TAF, METAR }
                        : airport))
            }

            setError(TAFMessage + METARMessage)
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch TAF and/or METAR data.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSetFormValues = (values: AirportFormValues, airportIndex: number) => {
        if (airportIndex === searchAirportIndex) {
            setSearchAirport({ ...searchAirport, icaoId: values.icaoId, formValues: values })
            return;
        }

        setAirports(current => current.map((airport, index) => {
            if (index !== airportIndex) return airport;

            return {
                ...airport,
                icaoId: values.icaoId,
                formValues: values
            }
        }))
    }

    const handleSetHighlightsTAF = (newHighlights: CodeHighlight[]) => {
        setHighlightsTAF(newHighlights)
    }

    const handleSetHighlightsMETAR = (newHighlights: CodeHighlight[]) => {
        setHighlightsMETAR(newHighlights)
    }

    const handleAddAirport = () => {
        const isDuplicate = airports.some(airport => airport.icaoId === searchAirport.icaoId);

        if (isDuplicate) {
            window.alert(`You have already saved ${searchAirport.icaoId}`)
            return;
        }

        setAirports(current => [...current, createAirport(searchAirport.icaoId)])
    }

    const handleDeleteAirport = (airportIndex: number) => {
        setAirports(current => current.filter((_, index) => index !== airportIndex))
    }
    return (
        <FlightPathContext
            value={{
                airports,
                searchAirport,
                highlightsTAF,
                highlightsMETAR,
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
