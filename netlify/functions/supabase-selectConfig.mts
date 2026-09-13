import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../src/database.types"
import type { Config } from "@netlify/functions"
import { type SelectConfigBody, handlePostgrestResponseFailure } from "../../src/shared"

export default async (request: Request) => {
    let body: SelectConfigBody

    try {
        body = await request.json() as SelectConfigBody;
    } catch {
        return new Response(
            "Invalid SelectConfigBody",
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
        .select()
        .maybeSingle()

    if (!response.success) {
        return handlePostgrestResponseFailure(response)
    }

    return Response.json(response.data)
}

export const config: Config = {
    path: "/api/supabase/select-config",
    method: "POST"
}