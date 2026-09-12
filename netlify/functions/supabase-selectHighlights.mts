import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import type { SelectHighlightsBody } from "../../src/types"
import { handlePostgrestResponseFailure } from "../../src/api/supabase"

export default async (request: Request) => {
    let body: SelectHighlightsBody

    try {
        body = await request.json() as SelectHighlightsBody;
    } catch {
        return new Response(
            "Invalid SelectHighlightsBody",
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
        .select()
        .eq("report", body.report)
        .maybeSingle()

    if (!response.success) {
        return handlePostgrestResponseFailure(response)
    }

    return Response.json(response.data?.highlights ?? [])
}

export const config: Config = {
    path: "/api/supabase/select-highlights",
    method: "POST"
}