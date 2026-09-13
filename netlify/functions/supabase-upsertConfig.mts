import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import { handlePostgrestResponseFailure, type UpsertConfigBody } from "../../src/shared"

export default async (request: Request) => {
    let body: UpsertConfigBody

    try {
        body = await request.json() as UpsertConfigBody;
    } catch {
        return new Response(
            "Invalid UpsertConfigBody",
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
        .upsert({
            "query_metar_previous_hours": body.queryMetarPreviousHours,
            "highlights_taf": body.highlightsTaf,
            "highlights_metar": body.highlightsMetar,
            "highlights_notam": body.highlightsNotam,
            "highlights_operational_hours": body.highlightsOperationalHours,
            "updated_at": body.updatedAt
        }, { onConflict: "user_id" })
        .lt("updated_at", body.updatedAt)

    if (!response.success) {
        return handlePostgrestResponseFailure(response)
    }

    return new Response(null, { status: 204 })
}

export const config: Config = {
    path: "/api/supabase/upsert-config",
    method: "POST"
}
