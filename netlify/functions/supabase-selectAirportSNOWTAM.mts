import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import type { SelectAirportSNOWTAMBody } from "../../src/types"

export default async (request: Request) => {
    let body: SelectAirportSNOWTAMBody

    try {
        body = await request.json() as SelectAirportSNOWTAMBody;
    } catch {
        return new Response(
            "Invalid SelectAirportSNOWTAMBody",
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
        .from("user_airports_notam")
        .select()
        .eq("airport_id", body.airportSupabaseId)

    if (!response.success) {
        console.error(response.error.message)
        return new Response(
            response.error.message,
            { status: response.status }
        )
    }

    return Response.json(response.data)
}

export const config: Config = {
    path: "/api/supabase/select-airport-snowtam",
    method: "POST"
}