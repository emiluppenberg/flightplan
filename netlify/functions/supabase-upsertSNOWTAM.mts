import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import type { UpsertSNOWTAMBody } from "../../src/types"

export default async (request: Request) => {
    let body: UpsertSNOWTAMBody

    try {
        body = await request.json() as UpsertSNOWTAMBody;
    } catch {
        return new Response(
            "Invalid UpsertSNOWTAMBody",
            { status: 400 },
        );
    }

    if (body.SNOWTAM.length === 0) {
        return new Response(null, { status: 204 })
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
        .from("user_aerodromes_notam")
        .upsert(body.SNOWTAM.map(snowtam => ({
            ...snowtam, aerodrome_id: body.aerodromeSupabaseId
        })), { onConflict: "id" })
        .select()

    if (!response.success) {
        console.error(response.error.message)
        return new Response(
            response.error.message,
            { status: response.status }
        )
    }

    return new Response(null, { status: 204 })
}

export const config: Config = {
    path: "/api/supabase/upsert-snowtam",
    method: "POST"
}