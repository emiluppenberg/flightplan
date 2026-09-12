import { createContext, useContext } from "react";
import type { AerodromeData, AerodromeFormValues, AppUser, CodeHighlight, CodeHighlightReport, UserFormValues } from "./types"

export type FlightPathState = {
    aerodromes: AerodromeData[];
    highlightsTAF: CodeHighlight[];
    highlightsMETAR: CodeHighlight[];
    highlightsOPERATIONAL_HOURS: CodeHighlight[];
    highlightsNOTAM: CodeHighlight[];
    queryMetarHoursBack: number;
    handleSubmit: (aerodrome: AerodromeData, fetchNotam: boolean) => void;
    handleSetFormValues: (newValues: AerodromeFormValues, id: string) => void;
    handleSetHighlights: (newHighlights: CodeHighlight[], report: CodeHighlightReport) => Promise<void>;
    handleSetQueryMetarHoursBack: (newValue: number) => Promise<void>;
    handleAddAerodrome: (icaoId: string | null) => void;
    handleDeleteAerodrome: (id: string) => void;
    handleSignIn: (values: UserFormValues) => Promise<void>;
    handleSignOut: () => void;
    handleSignUp: (values: UserFormValues) => Promise<void>;
    isLoading: boolean;
    message: string;
    error: string;
    user: AppUser | undefined;
}

export const FlightPathContext = createContext<FlightPathState | undefined>(undefined)

export const useFlightPathContext = () => {
    const context = useContext(FlightPathContext)

    if (!context) throw new Error("Context must be used within Provider")

    return context;
}