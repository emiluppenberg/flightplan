import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/database.types";
import type { Config } from "@netlify/functions";
import type { SignInBody } from "../../src/shared";

export default async (request: Request) => {
    let body: SignInBody

    try {
        body = await request.json() as SignInBody;
    } catch {
        return new Response(
            "Invalid SignInBody",
            { status: 400 },
        );
    }

    const supabase = createClient<Database>(
        process.env.SUPABASE_DATABASE_URL ?? "",
        process.env.SUPABASE_ANON_KEY ?? ""
    )

    const response = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password
    })

    if (response.error) {
        return new Response(
            response.error.message,
            { status: response.error.status }
        )
    }

    return Response.json({
        user: response.data.user,
        session: response.data.session
    })
}

export const config: Config = {
    path: "/api/supabase/sign-in",
    method: "POST"
}
