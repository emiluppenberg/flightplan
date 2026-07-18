import { codeHighlights, type AirportData } from "./types";

export const AIRPORT_STORAGE_KEY = "flygvader";

type StoredAirport = {
    id: string;
    icaoId: string;
    highlightTAFClasses: string[];
    highlightMETARClasses: string[];
}

export type StoredAirportsState = {
    airports: AirportData[];
    error?: string;
}

export const createAirportId = () =>
    globalThis.crypto?.randomUUID?.() ??
    `airport-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(item => typeof item === "string");

const isStoredAirport = (value: unknown): value is StoredAirport => {
    if (!value || typeof value !== "object") return false;

    const airport = value as Record<string, unknown>;
    return typeof airport.id === "string" &&
        typeof airport.icaoId === "string" &&
        isStringArray(airport.highlightTAFClasses) &&
        isStringArray(airport.highlightMETARClasses);
}

const resolveHighlights = (classes: string[]) =>
    codeHighlights.filter(highlight => classes.includes(highlight.class));

export const loadStoredAirports = (): StoredAirportsState => {
    const rawState = localStorage.getItem(AIRPORT_STORAGE_KEY);
    if (!rawState) return { airports: [] };

    try {
        const state = JSON.parse(rawState) as StoredAirport[];
        const errors: string[] = [];
        const airports: AirportData[] = []

        for (const storedAirport of state) {
            if (!isStoredAirport(storedAirport)) {
                errors.push("Failed to restore airport: Malformed data\n")
                continue
            }

            airports.push({
                id: storedAirport.id,
                formValues: {
                    icaoId: storedAirport.icaoId,
                    date: "",
                    time: ""
                },
                TAF: [],
                METAR: [],
                highlightsTAF: resolveHighlights(storedAirport.highlightTAFClasses),
                highlightsMETAR: resolveHighlights(storedAirport.highlightMETARClasses)
            })
        }

        return {
            airports: airports,
            error: errors.length > 0
                ? errors.join('')
                : ""
        };
    } catch (error) {
        return {
            airports: [],
            error: error instanceof Error
                ? `Failed to restore airports: ${error.message}`
                : "Failed to restore airports"
        }
    }
}

export const saveStoredAirports = (airports: AirportData[]): string | undefined => {
    const newState: StoredAirport[] = airports.map(airport => ({
        id: airport.id,
        icaoId: airport.formValues.icaoId,
        highlightTAFClasses: airport.highlightsTAF.map(highlight => highlight.class),
        highlightMETARClasses: airport.highlightsMETAR.map(highlight => highlight.class)
    }))

    try {
        localStorage.setItem(AIRPORT_STORAGE_KEY, JSON.stringify(newState));
        return undefined;
    } catch (error) {
        return error instanceof Error
            ? `Failed to save airports: ${error.message}`
            : "Failed to save airports.";
    }
}
