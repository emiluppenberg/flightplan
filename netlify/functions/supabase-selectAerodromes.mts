import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import type { SelectAllAerodromesBody } from "../../src/types"
import { handlePostgrestResponseFailure } from "../../src/api/supabase"

export default async (request: Request) => {
    let body: SelectAllAerodromesBody

    try {
        body = await request.json() as SelectAllAerodromesBody;
    } catch {
        return new Response(
            "Invalid SelectAllAerodromesBody",
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
        .select()

    if (!response.success) {
        return handlePostgrestResponseFailure(response)
    }

    return Response.json(response.data)
}

export const config: Config = {
    path: "/api/supabase/select-aerodromes",
    method: "POST"
}