import type { Session } from "@supabase/supabase-js"
import type { InsertAirportBody, SupabaseAirport, DeleteAirportBody, SelectAllAirportsBody, UpdateAirportBody, NotamEntry, UpsertNOTAMBody, DeleteNOTAMBody, SelectAirportNOTAMBody, UpsertHighlightsBody, SelectHighlightsBody, AppUser, UserFormValues, InitializeUserBody, SignInBody, SignUpBody, SignOutBody } from "../types"
import { getAccessToken, getRefreshToken } from "../utilities"

export const PATH_INITIALIZE_USER = "/api/supabase/initialize-user"
export const PATH_SIGN_IN = "/api/supabase/sign-in"
export const PATH_SIGN_UP = "/api/supabase/sign-up"
export const PATH_SIGN_OUT = "/api/supabase/sign-out"
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
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const fetchDeleteAirport = async (body: DeleteAirportBody): Promise<SupabaseAirport> => {
  const response = await fetch(`${PATH_DELETE_AIRPORT}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const fetchSelectAllAirports = async (body: SelectAllAirportsBody): Promise<SupabaseAirport[]> => {
  const response = await fetch(`${PATH_SELECT_ALL_AIRPORTS}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const fetchUpdateAirportNextPollNOTAM = async (icaoId: string, nextPollNOTAM: number) => {
  const body: UpdateAirportBody = {
    accessToken: getAccessToken(),
    icaoId: icaoId,
    nextPollNOTAM: nextPollNOTAM
  }

  const response = await fetch(`${PATH_UPDATE_AIRPORT_NEXT_POLL_NOTAM}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const fetchUpsertNOTAM = async (notam: NotamEntry[], airportSupabaseId: string) => {
  const body: UpsertNOTAMBody = {
    accessToken: getAccessToken(),
    notam: notam,
    airportSupabaseId: airportSupabaseId
  }

  const response = await fetch(`${PATH_UPSERT_NOTAM}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const fetchDeleteNOTAM = async (airportSupabaseId: string) => {
  const body: DeleteNOTAMBody = {
    accessToken: getAccessToken(),
    airportSupabaseId: airportSupabaseId
  }

  const response = await fetch(`${PATH_DELETE_NOTAM}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const fetchSelectAirportNOTAM = async (airportSupabaseId: string): Promise<NotamEntry[]> => {
  const body: SelectAirportNOTAMBody = {
    accessToken: getAccessToken(),
    airportSupabaseId: airportSupabaseId
  }

  const response = await fetch(`${PATH_SELECT_AIRPORT_NOTAM}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const fetchUpsertHighlights = async (body: UpsertHighlightsBody) => {
  const response = await fetch(`${PATH_UPSERT_HIGHLIGHTS}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const fetchSelectHighlights = async (body: SelectHighlightsBody): Promise<string[]> => {
  const response = await fetch(`${PATH_SELECT_HIGHLIGHTS}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.json()
}

export const fetchInitializeUser = async (): Promise<AppUser> => {
  const body: InitializeUserBody = {
    refreshToken: getRefreshToken()
  }

  const response = await fetch(`${PATH_INITIALIZE_USER}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const user: AppUser = await response.json()
  localStorage.setItem("session", JSON.stringify(user.session))
  return user
}

export const fetchSignInUser = async (body: SignInBody): Promise<AppUser> => {
  const response = await fetch(`${PATH_SIGN_IN}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const user: AppUser = await response.json()
  localStorage.setItem("session", JSON.stringify(user.session))
  return user
}

export const fetchSignUpUser = async (body: SignUpBody): Promise<string> => {
  const response = await fetch(`${PATH_SIGN_UP}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return await response.text()
}

export const fetchSignOutUser = async (body: SignOutBody) => {
  const response = await fetch(`${PATH_SIGN_OUT}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }
}

export const fetchRefreshedUser = async (): Promise<AppUser | undefined> => {
  const session = localStorage.getItem("session")

  if (!session) {
    throw new Error("You are not logged in")
  }

  const expiresAtMilliseconds = (JSON.parse(session) as Session).expires_at

  if (!expiresAtMilliseconds) {
    throw new Error("Session is missing value: expires_at")
  }

  if (expiresAtMilliseconds * 1000 < Date.now()) {
    return await fetchInitializeUser()
  }

  return undefined
}