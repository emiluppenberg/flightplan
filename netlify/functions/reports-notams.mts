import type { Config } from "@netlify/functions";

const SKYLINK_BASE_URL = "https://data.skylinkapi.com/v3.1";
const apiKey = process.env.SKYLINK_API_KEY;

export default async (request: Request) => {
    if (!apiKey) {
        console.error("SKYLINK_API_KEY is undefined")
        return new Response(
            "Server configuration error",
            { status: 500 }
        );
    }

    const requestUrl = new URL(request.url)
    const icao = requestUrl.searchParams.get("icao")
    const includeFIR = requestUrl.searchParams.get("includeFIR")
    const includeFuture = requestUrl.searchParams.get("includeFuture")

    const url = new URL(`${SKYLINK_BASE_URL}/notams/${icao}`)
    includeFIR === "false" && url.searchParams.set("exclude_scope", "FIR")
    includeFuture === "true" && url.searchParams.set("include_future", "true")

    const response = await fetch(url, {
        headers: { "x-api-key": apiKey },
    });

    if (!response.ok) {
        console.error(`Skylink request failed: ${await response.text()}`)
        return new Response(
            `NOTAM request for ${icao} failed with status ${response.status}`,
            { status: response.status }
        );
    }

    return Response.json(await response.json())
}

// export const config: Config = {
//     path: "/api/reports/notam",
//     method: "GET",
// }
