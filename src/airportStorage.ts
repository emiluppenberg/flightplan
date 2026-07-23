import { type AirportData } from "./types";

export const AIRPORT_STORAGE_KEY = "flygvader";

type StoredAirport = {
    id: string;
    icaoId: string;
}

export type StoredAirportsState = {
    airports: AirportData[];
    error?: string;
}

const isStoredAirport = (value: unknown): value is StoredAirport => {
    if (!value || typeof value !== "object") return false;

    const airport = value as Record<string, unknown>;
    return typeof airport.id === "string" && typeof airport.icaoId === "string"
}

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
                icaoId: storedAirport.icaoId,
                formValues: {
                    icaoId: storedAirport.icaoId.trim().toUpperCase(),
                    useDatetime: false,
                    date: "",
                    time: ""
                },
                TAF: [],
                METAR: [],
                messages: ""
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
        icaoId: airport.formValues.icaoId
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
