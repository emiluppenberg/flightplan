import { createClient } from "@supabase/supabase-js"
import type { AppUser, CodeHighlight, UserFormValues } from "./types";
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

export const insertAirport = async (icaoId: string) => {
    const response = await supabase
        .from("user_airports")
        .insert({ icao: icaoId })

    if (!response.success) {
        throw new Error(response.error.message)
    }
}

export const deleteAirport = async (icaoId: string) => {
    const response = await supabase
        .from("user_airports")
        .delete()
        .eq("icao", icaoId)

    if (!response.success) {
        throw new Error(response.error.message)
    }
}

export const selectAllAirports = async (): Promise<string[]> => {
    const response = await supabase
        .from("user_airports")
        .select()

    if (!response.success) {
        throw new Error(response.error.message)
    }

    return response.data.map(airport => (airport.icao))
}

export const upsertHighlightsTAF = async (highlights: CodeHighlight[]) => {
    const value = highlights.map(highlight => highlight.class)

    const response = await supabase
        .from("user_highlights_taf")
        .upsert({ highlights_taf: value }, { onConflict: "user_id" })

    if (!response.success) {
        throw new Error(response.error.message)
    }
}

export const upsertHighlightsMETAR = async (highlights: CodeHighlight[]) => {
    const value = highlights.map(highlight => highlight.class)

    const response = await supabase
        .from("user_highlights_metar")
        .upsert({ highlights_metar: value }, { onConflict: "user_id" })

    if (!response.success) {
        throw new Error(response.error.message)
    }
}

export const selectHighlightsTAF = async (): Promise<string[]> => {
    const response = await supabase
        .from("user_highlights_taf")
        .select()
        .maybeSingle()

    if (!response.success) {
        throw new Error(response.error.message)
    }

    return response.data?.highlights_taf ?? []
}

export const selectHighlightsMETAR = async (): Promise<string[]> => {
    const response = await supabase
        .from("user_highlights_metar")
        .select()
        .maybeSingle()

    if (!response.success) {
        throw new Error(response.error.message)
    }

    return response.data?.highlights_metar ?? []
}