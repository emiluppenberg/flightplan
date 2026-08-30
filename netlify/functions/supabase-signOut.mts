import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/database.types";
import type { Config } from "@netlify/functions";
import type { SignOutBody } from "../../src/types";

export default async (request: Request) => {
    let body: SignOutBody

    try {
        body = await request.json() as SignOutBody;
    } catch {
        return new Response(
            "Invalid SignOutBody",
            { status: 400 },
        );
    }

    const supabase = createClient<Database>(
        process.env.SUPABASE_DATABASE_URL ?? "",
        process.env.SUPABASE_ANON_KEY ?? "",
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    )

    const response = await supabase.auth.admin.signOut(body.accessToken, "local")

    if (response.error) {
        console.error(response.error.message)
        return new Response(
            "Server configuration error",
            { status: 500 }
        )
    }

    return new Response(null, { status: 204 })
}

export const config: Config = {
    path: "/api/supabase/sign-out",
    method: "POST"
}