import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_DATABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const signUpUser = async (email: string, password: string) => {
    return await supabase.auth.signUp({
        email: email,
        password: password
    })
}