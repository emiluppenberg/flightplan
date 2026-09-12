import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import type { UpdateAerodromeBody } from "../../src/types"

export default async (request: Request) => {
    let body: UpdateAerodromeBody

    try {
        body = await request.json() as UpdateAerodromeBody;
    } catch {
        return new Response(
            "Invalid UpdateAerodromeBody",
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
        .from("user_aerodromes")
        .update({ "next_poll_snowtam": body.nextPollSNOWTAM })
        .eq("icao", body.icaoId)

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
    path: "/api/supabase/update-next-poll-snowtam",
    method: "POST"
}