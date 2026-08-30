import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import type { UpsertNOTAMBody } from "../../src/types"

export default async (request: Request) => {
    let body: UpsertNOTAMBody

    try {
        body = await request.json() as UpsertNOTAMBody;
    } catch {
        return new Response(
            "Invalid UpsertNOTAMBody",
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
        .upsert(body.notam.map(notam => ({
            ...notam, airport_id: body.airportSupabaseId
        })), { onConflict: "id" })
        .select()

    if (!response.success) {
        console.error(response.error.message)
        return new Response(
            "Server configuration error",
            { status: 500 }
        )
    }

    return new Response(null, {status: 204})
}

export const config: Config = {
    path: "/api/supabase/upsert-notam",
    method: "POST"
}