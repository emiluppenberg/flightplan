import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import type { InsertAirportBody } from "../../src/types"

export default async (request: Request) => {
    let body: InsertAirportBody

    try {
        body = await request.json() as InsertAirportBody;
    } catch {
        return new Response(
            "Invalid InsertAirportBody",
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
        .insert({ icao: body.icaoId, next_poll_snowtam: body.nextPollSNOWTAM })
        .select()

    if (!response.success) {
        console.error(response.error.message)
        return new Response(
            response.error.message,
            { status: 500 }
        )
    }

    return Response.json(response.data[0])
}

export const config: Config = {
    path: "/api/supabase/insert-airport",
    method: "POST"
}