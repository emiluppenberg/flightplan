import { createClient } from "@supabase/supabase-js"
import type { AppUser, CodeHighlight, CodeHighlightReport, NotamEntry, SupabaseAirport, UserFormValues } from "./types";
import type { Database } from "./database.types";

const supabase = createClient<Database>(
    import.meta.env.VITE_SUPABASE_DATABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const initializeAppUser = async (): Promise<AppUser | undefined> => {
    const { data, error } = await supabase.auth.refreshSession();

    if (error && error.name !== "AuthSessionMissingError") {
        throw new Error(error.message)
    }
    if (!data.session || !data.user) {
        return undefined
    }

    return {
        session: data.session,
        user: data.user
    }
}

export const signUpUser = async (values: UserFormValues): Promise<string> => {
    const response = await supabase.auth.signUp({
        email: values.email,
        password: values.password
    })

    if (response.error) {
        throw new Error(response.error.message)
    }

    return `A confirmation email has been sent to ${values.email}`
}

export const signInUser = async (values: UserFormValues): Promise<AppUser> => {
    const response = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
    })

    if (response.error) {
        throw new Error(response.error.message)
    }

    return { user: response.data.user, session: response.data.session }
}

export const signOutUser = async () => {
    const response = await supabase.auth.signOut({ scope: "local" })

    if (response.error) {
        throw new Error(response.error.message)
    }
}

export const insertAirport = async (icaoId: string, nextPollNOTAM: number): Promise<SupabaseAirport> => {
    const response = await supabase
        .from("user_airports")
        .insert({ icao: icaoId, next_poll_notam: nextPollNOTAM })
        .select()

    if (!response.success) {
        throw new Error(response.error.message)
    }

    return response.data[0]
}

export const deleteAirport = async (icaoId: string): Promise<SupabaseAirport> => {
    const response = await supabase
        .from("user_airports")
        .delete()
        .eq("icao", icaoId)
        .select()

    if (!response.success) {
        throw new Error(response.error.message)
    }

    return response.data[0]
}

export const selectAllAirports = async (): Promise<SupabaseAirport[]> => {
    const response = await supabase
        .from("user_airports")
        .select()

    if (!response.success) {
        throw new Error(response.error.message)
    }

    return response.data
}

export const updateAirportNextPollNOTAM = async (icaoId: string, nextPollNOTAM: number) => {
    const response = await supabase
        .from("user_airports")
        .update({ "next_poll_notam": nextPollNOTAM })
        .eq("icao", icaoId)

    if (!response.success) {
        throw new Error(response.error.message)
    }
}

export const upsertNOTAM = async (notam: NotamEntry[], airportSupabaseId: string) => {
    if (notam.length === 0) return

    const response = await supabase
        .from("user_airports_notam")
        .upsert(notam.map(notam => ({
            ...notam, airport_id: airportSupabaseId
        })), { onConflict: "id" })
        .select()

    if (!response.success) {
        throw new Error(response.error.message + "\n")
    }
}

export const deleteNOTAM = async (airportSupabaseId: string) => {
    const response = await supabase
        .from("user_airports_notam")
        .delete()
        .in("airport_id", [airportSupabaseId])

    if (!response.success) {
        throw new Error(response.error.message + "\n")
    }
}

export const selectAirportNOTAM = async (airportSupabaseId: string): Promise<NotamEntry[]> => {
    const response = await supabase
        .from("user_airports_notam")
        .select()
        .eq("airport_id", airportSupabaseId)

    if (!response.success) {
        throw new Error(response.error.message + "\n")
    }

    return response.data
}

export const upsertHighlights = async (
    highlights: CodeHighlight[],
    report: CodeHighlightReport
) => {
    const value = highlights.map(highlight => highlight.class)

    const response = await supabase
        .from("user_highlights")
        .upsert({ highlights: value, report: report }, {onConflict: "user_id, report"})

    if (!response.success) {
        throw new Error(response.error.message)
    }
}

export const selectHighlights = async (
    report: CodeHighlightReport
): Promise<string[]> => {
    const response = await supabase
        .from("user_highlights")
        .select()
        .eq("report", report)
        .maybeSingle()

    if (!response.success) {
        throw new Error(response.error.message)
    }

    return response.data?.highlights ?? []
}