import { createContext, useContext } from "react";
import type { AirportData, AirportFormValues, AppUser, CodeHighlight, UserFormValues } from "./types"

export type FlightPathState = {
    airports: AirportData[];
    highlightsTAF: CodeHighlight[];
    highlightsMETAR: CodeHighlight[];
    highlightsOPERATIONAL_HOURS: CodeHighlight[];
    highlightsNOTAM: CodeHighlight[];
    handleSubmit: (airport: AirportData, fetchNotam: boolean) => void;
    handleSetFormValues: (newValues: AirportFormValues, id: string) => void;
    handleSetHighlightsTAF: (newHighlights: CodeHighlight[]) => void;
    handleSetHighlightsMETAR: (newHighlights: CodeHighlight[]) => void;
    handleSetHighlightsNOTAM: (newHighlights: CodeHighlight[]) => void;
    handleSetHighlightsOPERATIONAL_HOURS: (newHighlights: CodeHighlight[]) => void;
    handleAddAirport: (icaoId: string) => void;
    handleDeleteAirport: (id: string) => void;
    handleSignIn: (values: UserFormValues) => void;
    handleSignOut: () => void;
    handleSignUp: (values: UserFormValues) => void;
    isLoading: boolean;
    message: string;
    user: AppUser | undefined;
}

export const FlightPathContext = createContext<FlightPathState | undefined>(undefined)

export const useFlightPathContext = () => {
    const context = useContext(FlightPathContext)

    if (!context) throw new Error("Context must be used within Provider")

    return context;
}