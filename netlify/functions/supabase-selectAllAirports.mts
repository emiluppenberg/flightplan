import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import type { SelectAllAirportsBody } from "../../src/types"

export default async (request: Request) => {
    let body: SelectAllAirportsBody

    try {
        body = await request.json() as SelectAllAirportsBody;
    } catch {
        return new Response(
            "Invalid SelectAllAirportsBody",
            { status: 400 },
        );
    }

    const supabase = createClient<Database>(
        process.env.SUPABASE_DATABASE_URL ?? "",
        process.env.SUPABASE_ANON_KEY ?? "",
        {
            accessToken: async () => body.accessToken,
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    )

    const response = await supabase
        .from("user_airports")
        .select()

    if (!response.success) {
        console.error(response.error.message)
        return new Response(
            response.error.message,
            { status: 500 }
        )
    }

    return Response.json(response.data)
}

export const config: Config = {
    path: "/api/supabase/select-all-airports",
    method: "POST"
}