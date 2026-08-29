import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/database.types";
import type { Config } from "@netlify/functions";

export default async (request: Request) => {
    const supabase = createClient<Database>(
        process.env.SUPABASE_DATABASE_URL ?? "",
        process.env.SUPABASE_ANON_KEY ?? ""
    )

    const requestUrl = new URL(request.url)
    const email = requestUrl.searchParams.get("email")
    const password = requestUrl.searchParams.get("password")

    if (!email || !password) {
        return new Response(
            "Email and password are required to log in",
            { status: 400 }
        )
    }

    const response = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })

    if (response.error) {
        console.error(response.error.message)
        return new Response(
            "Server configuration error",
            { status: 500 }
        )
    }

    return Response.json({
        user: response.data.user,
        session: response.data.session
    })
}

export const config: Config = {
    path: "/api/supabase/sign-in",
    method: "GET"
}
