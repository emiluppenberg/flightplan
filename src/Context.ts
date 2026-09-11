import { createContext, useContext } from "react";
import type { AirportData, AirportFormValues, AppUser, CodeHighlight, CodeHighlightReport, UserFormValues } from "./types"

export type FlightPathState = {
    airports: AirportData[];
    highlightsTAF: CodeHighlight[];
    highlightsMETAR: CodeHighlight[];
    highlightsOPERATIONAL_HOURS: CodeHighlight[];
    highlightsNOTAM: CodeHighlight[];
    handleSubmit: (airport: AirportData, fetchNotam: boolean) => void;
    handleSetFormValues: (newValues: AirportFormValues, id: string) => void;
    handleSetHighlights: (newHighlights: CodeHighlight[], report: CodeHighlightReport) => Promise<void>;
    handleAddAirport: (icaoId: string | null) => void;
    handleDeleteAirport: (id: string) => void;
    handleSignIn: (values: UserFormValues) => Promise<void>;
    handleSignOut: () => void;
    handleSignUp: (values: UserFormValues) => Promise<void>;
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