import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import { handlePostgrestResponseFailure, type UpsertQueryMetarPreviousHoursBody } from "../../src/shared"

export default async (request: Request) => {
    let body: UpsertQueryMetarPreviousHoursBody

    try {
        body = await request.json() as UpsertQueryMetarPreviousHoursBody;
    } catch {
        return new Response(
            "Invalid UpsertQueryMetarPreviousHoursBody",
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
        .from("user_config")
        .upsert({ "query_metar_previous_hours": body.queryMetarPreviousHours }, { onConflict: "user_id" })

    if (!response.success) {
        return handlePostgrestResponseFailure(response)
    }

    return new Response(null, { status: 204 })
}

export const config: Config = {
    path: "/api/supabase/upsert-query-metar-previous-hours",
    method: "POST"
}
