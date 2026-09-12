import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/database.types";
import type { Config } from "@netlify/functions";
import type { InitializeUserBody } from "../../src/shared";

export default async (request: Request) => {
    let body: InitializeUserBody

    try {
        body = await request.json() as InitializeUserBody;
    } catch {
        return new Response(
            "Invalid InitializeUserBody",
            { status: 400 },
        );
    }

    const supabase = createClient<Database>(
        process.env.SUPABASE_DATABASE_URL ?? "",
        process.env.SUPABASE_ANON_KEY ?? ""
    )

    const response = await supabase.auth.refreshSession({ refresh_token: body.refreshToken })

    if (response.error) {
        return new Response(
            response.error.message,
            { status: response.error.status }
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
    method: "POST"
}