import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/database.types";
import type { Config } from "@netlify/functions";
import type { SignUpBody } from "../../src/types";

export default async (request: Request) => {
    let body: SignUpBody

    try {
        body = await request.json() as SignUpBody;
    } catch {
        return new Response(
            "Invalid SignUpBody",
            { status: 400 },
        );
    }

    const supabase = createClient<Database>(
        process.env.SUPABASE_DATABASE_URL ?? "",
        process.env.SUPABASE_ANON_KEY ?? ""
    )

    const response = await supabase.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
            emailRedirectTo: "https://flyrep.org"
        }
    })

    if (response.error) {
        return new Response(
            response.error.message,
            { status: response.error.status }
        )
    }

    return new Response(`A confirmation email has been sent to ${body.email}`)
}

export const config: Config = {
    path: "/api/supabase/sign-up",
    method: "POST"
}