import { createClient } from "@supabase/supabase-js"
import type { SignUpFormValues } from "./types";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_DATABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const signUpUser = async (values: SignUpFormValues) => {
    return await supabase.auth.signUp({
        email: values.email,
        password: values.password
    })
}

