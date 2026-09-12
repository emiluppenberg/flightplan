import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import { handlePostgrestResponseFailure, type SelectSNOWTAMBody } from "../../src/shared"

export default async (request: Request) => {
    let body: SelectSNOWTAMBody

    try {
        body = await request.json() as SelectSNOWTAMBody;
    } catch {
        return new Response(
            "Invalid SelectSNOWTAMBody",
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
        .from("user_aerodromes_notam")
        .select()
        .eq("aerodrome_id", body.aerodromeSupabaseId)

    if (!response.success) {
        return handlePostgrestResponseFailure(response)
    }

    return Response.json(response.data)
}

export const config: Config = {
    path: "/api/supabase/select-snowtam",
    method: "POST"
}
