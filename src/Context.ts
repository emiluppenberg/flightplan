import { createContext, useContext } from "react";
import type { AirportData, AirportFormValues, CodeHighlight } from "./types"

export type FlightPathState = {
    airports: AirportData[];
    handleSubmit: (values: AirportFormValues, airportIndex: number) => void;
    handleSetFormValues: (newValues: AirportFormValues, airportIndex: number) => void;
    handleSetHighlightsTAF: (newHighlights: CodeHighlight[], airportIndex: number) => void;
    handleSetHighlightsMETAR: (newHighlights: CodeHighlight[], airportIndex: number) => void;
    handleAddAirport: () => void;
    handleDeleteAirport: (airportIndex: number) => void;
    isLoading: boolean;
    error: string;
}

export const FlightPathContext = createContext<FlightPathState | undefined>(undefined)

export const useFlightPathContext = () => {
    const context = useContext(FlightPathContext)

    if (!context) throw new Error("Context must be used within Provider")

    return context;
}