import type { Session } from "@supabase/supabase-js"
import type { InsertAirportBody, SupabaseAirport, DeleteAirportBody, SelectAllAirportsBody, UpdateAirportBody, NotamEntry, UpsertNOTAMBody, DeleteNOTAMBody, SelectAirportNOTAMBody, UpsertHighlightsBody, SelectHighlightsBody, AppUser, UserFormValues } from "../types"

export const PATH_INITIALIZE_USER = "/api/supabase/initialize-user"
export const PATH_SIGN_IN = "/api/supabase/sign-in"
export const PATH_SIGN_UP = "/api/supabase/sign-up"
export const PATH_INSERT_AIRPORT = "/api/supabase/insert-airport"
export const PATH_DELETE_AIRPORT = "/api/supabase/delete-airport"
export const PATH_SELECT_ALL_AIRPORTS = "/api/supabase/select-all-airports"
export const PATH_UPDATE_AIRPORT_NEXT_POLL_NOTAM = "/api/supabase/update-airport-next-poll-notam"
export const PATH_UPSERT_NOTAM = "/api/supabase/upsert-notam"
export const PATH_DELETE_NOTAM = "/api/supabase/delete-notam"
export const PATH_SELECT_AIRPORT_NOTAM = "/api/supabase/select-airport-notam"
export const PATH_UPSERT_HIGHLIGHTS = "/api/supabase/upsert-highlights"
export const PATH_SELECT_HIGHLIGHTS = "/api/supabase/select-highlights"

export const fetchInsertAirport = async (body: InsertAirportBody): Promise<SupabaseAirport> => {
  const response = await fetch(`${PATH_INSERT_AIRPORT}`, {
    method: "POST",
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const fetchDeleteAirport = async (body: DeleteAirportBody): Promise<SupabaseAirport> => {
  const response = await fetch(`${PATH_DELETE_AIRPORT}`, {
    method: "POST",
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const fetchSelectAllAirports = async (body: SelectAllAirportsBody): Promise<SupabaseAirport[]> => {
  const response = await fetch(`${PATH_SELECT_ALL_AIRPORTS}`, {
    method: "POST",
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const fetchUpdateAirportNextPollNOTAM = async (icaoId: string, nextPollNOTAM: number) => {
  const session = localStorage.getItem("session")

  if (!session) {
    throw new Error("Could not update next_poll_notam: You are not logged in")
  }

  const accessToken = (JSON.parse(session) as Session).access_token

  const body: UpdateAirportBody = {
    accessToken: accessToken,
    icaoId: icaoId,
    nextPollNOTAM: nextPollNOTAM
  }

  const response = await fetch(`${PATH_UPDATE_AIRPORT_NEXT_POLL_NOTAM}`, {
    method: "POST",
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const fetchUpsertNOTAM = async (notam: NotamEntry[], airportSupabaseId: string) => {
  const session = localStorage.getItem("session")

  if (!session) {
    throw new Error("Could not update next_poll_notam: You are not logged in")
  }

  const accessToken = (JSON.parse(session) as Session).access_token

  const body: UpsertNOTAMBody = {
    accessToken: accessToken,
    notam: notam,
    airportSupabaseId: airportSupabaseId
  }

  const response = await fetch(`${PATH_UPSERT_NOTAM}`, {
    method: "POST",
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const fetchDeleteNOTAM = async (airportSupabaseId: string) => {
  const session = localStorage.getItem("session")

  if (!session) {
    throw new Error("Could not update next_poll_notam: You are not logged in")
  }

  const accessToken = (JSON.parse(session) as Session).access_token

  const body: DeleteNOTAMBody = {
    accessToken: accessToken,
    airportSupabaseId: airportSupabaseId
  }

  const response = await fetch(`${PATH_DELETE_NOTAM}`, {
    method: "POST",
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const fetchSelectAirportNOTAM = async (airportSupabaseId: string): Promise<NotamEntry[]> => {
  const session = localStorage.getItem("session")

  if (!session) {
    throw new Error("Could not update next_poll_notam: You are not logged in")
  }

  const accessToken = (JSON.parse(session) as Session).access_token

  const body: SelectAirportNOTAMBody = {
    accessToken: accessToken,
    airportSupabaseId: airportSupabaseId
  }

  const response = await fetch(`${PATH_SELECT_AIRPORT_NOTAM}`, {
    method: "POST",
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const fetchUpsertHighlights = async (body: UpsertHighlightsBody) => {
  const response = await fetch(`${PATH_UPSERT_HIGHLIGHTS}`, {
    method: "POST",
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const fetchSelectHighlights = async (body: SelectHighlightsBody): Promise<string[]> => {
  const response = await fetch(`${PATH_SELECT_HIGHLIGHTS}`, {
    method: "POST",
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const fetchInitializeUser = async (): Promise<AppUser> => {
  const session = localStorage.getItem("session")
  if (!session) {
    throw new Error("You are not logged in - airports and highlights will not be saved for this session")
  }

  const refreshToken = JSON.parse(session).refresh_token

  const params = new URLSearchParams({
    refreshToken: String(refreshToken)
  })

  const response = await fetch(`${PATH_INITIALIZE_USER}?${params}`)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const user: AppUser = await response.json()
  localStorage.setItem("session", JSON.stringify(user.session))
  return user
}

export const fetchSignInUser = async (values: UserFormValues): Promise<AppUser> => {
  const params = new URLSearchParams({
    email: values.email,
    password: values.password
  })

  const response = await fetch(`${PATH_SIGN_IN}?${params}`)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const user: AppUser = await response.json()
  localStorage.setItem("session", JSON.stringify(user.session))
  return user
}

export const fetchSignUpUser = async (values: UserFormValues): Promise<string> => {
  const params = new URLSearchParams({
    email: values.email,
    password: values.password
  })

  const response = await fetch(`${PATH_SIGN_UP}?${params}`)

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.text()
}