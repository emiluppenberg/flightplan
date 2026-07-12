import { useState, type PropsWithChildren } from "react";
import type { AirportData, AirportFormValues, CodeHighlight } from "./types";
import { FlightPathContext } from "./Context";
import { fetchTAF, fetchMETAR } from "./utilities";

export const FlightPathProvider = ({ children }: PropsWithChildren) => {
    const [airports, setAirports] = useState<AirportData[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (values: AirportFormValues, airportIndex: number) => {
        setIsLoading(true)
        setError('')

        try {
            const TAF = await fetchTAF(values.icaoId, values.date, values.time)
            const METAR = await fetchMETAR(values.icaoId)

            METAR.sort((a, b) => Date.parse(b.receiptTime) - Date.parse(a.receiptTime))

            const newAirport: AirportData = {
                formValues: values,
                TAF: TAF,
                METAR: METAR,
                highlightsTAF: airports[airportIndex].highlightsTAF,
                highlightsMETAR: airports[airportIndex].highlightsMETAR
            }

            setAirports(current => current.map((airport, index) =>
                index === airportIndex ? newAirport : airport))
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch TAF and/or METAR data.')
        } finally {
            setIsLoading(false)
        }
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