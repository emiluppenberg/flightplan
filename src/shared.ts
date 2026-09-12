import type { PostgrestResponseFailure } from "@supabase/postgrest-js"
import type { CodeHighlightReport, EntrySNOWTAM } from "./types";

export type InsertAerodromeBody = {
  accessToken: string;
  icaoId: string;
  nextPollSNOWTAM: number;
}

export type DeleteAerodromeBody = {
  accessToken: string;
  icaoId: string;
}

export type UpdateAerodromeBody = {
  accessToken: string;
  icaoId: string;
  nextPollSNOWTAM: number;
}

export type SelectAllAerodromesBody = {
  accessToken: string;
}

export type UpsertSNOWTAMBody = {
  accessToken: string;
  SNOWTAM: EntrySNOWTAM[];
  aerodromeSupabaseId: string;
}

export type DeleteSNOWTAMBody = {
  accessToken: string;
  aerodromeSupabaseId: string;
}

export type SelectSNOWTAMBody = {
  accessToken: string;
  aerodromeSupabaseId: string;
}

export type UpsertHighlightsBody = {
  accessToken: string;
  highlights: string[];
  report: CodeHighlightReport
}

export type SelectHighlightsBody = {
  accessToken: string;
  report: CodeHighlightReport;
}

export type UpsertQueryMetarPreviousHoursBody = {
  accessToken: string;
  queryMetarPreviousHours: number;
}

export type SignInBody = {
  email: string;
  password: string;
}

export type SignUpBody = {
  email: string;
  password: string;
}

export type SignOutBody = {
  accessToken: string
}

export type InitializeUserBody = {
  refreshToken: string;
}

export const handlePostgrestResponseFailure = (response: PostgrestResponseFailure): Response => {
  console.error(response.error.message)

  const status = response.status >= 400 && response.status <= 599
    ? response.status
    : 500

  return new Response(
    response.error.message,
    { status }
  )
}