import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/database.types";
import type { Config } from "@netlify/functions";

export default async (request: Request) => {
    const supabase = createClient<Database>(
        process.env.SUPABASE_DATABASE_URL ?? "",
        process.env.SUPABASE_ANON_KEY ?? ""
    )

    const requestUrl = new URL(request.url)
    const refreshToken = requestUrl.searchParams.get("refreshToken")

    if (!refreshToken) {
        return new Response("You are not logged in")
    }

    const response = await supabase.auth.refreshSession({ refresh_token: refreshToken })

    if (response.error && response.error.name !== "AuthSessionMissingError") {
        console.error(response.error.message)
        return new Response(
            "Server configuration error",
            { status: 500 }
        )
    }

    if (!response.data.session || !response.data.user) {
        return new Response(
            "User and/or session was not found",
            { status: 500 }
        )
    }

    return Response.json({
        session: response.data.session,
        user: response.data.user
    })
}

export const config: Config = {
    path: "/api/supabase/initialize-user",
    method: "GET"
}