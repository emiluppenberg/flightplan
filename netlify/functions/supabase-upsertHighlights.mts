import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import type { UpsertHighlightsBody } from "../../src/types"

export default async (request: Request) => {
    let body: UpsertHighlightsBody

    try {
        body = await request.json() as UpsertHighlightsBody;
    } catch {
        return new Response(
            "Invalid UpsertHighlightsBody",
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
        .from("user_highlights")
        .upsert({ highlights: body.highlights, report: body.report }, {onConflict: "user_id, report"})

    if (!response.success) {
        console.error(response.error.message)
        return new Response(
            response.error.message,
            { status: 500 }
        )
    }

    return new Response(null, { status: 204 })
}

export const config: Config = {
    path: "/api/supabase/upsert-highlights",
    method: "POST"
}