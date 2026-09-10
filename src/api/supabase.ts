import type { Session } from "@supabase/supabase-js"
import type { InsertAirportBody, SupabaseAirport, DeleteAirportBody, SelectAllAirportsBody, UpdateAirportBody, EntryNOTAM, UpsertSNOWTAMBody, DeleteSNOWTAMBody, SelectAirportSNOWTAMBody, UpsertHighlightsBody, SelectHighlightsBody, AppUser, UserFormValues, InitializeUserBody, SignInBody, SignUpBody, SignOutBody, EntrySNOWTAM } from "../types"
import { getAccessToken, getRefreshToken, sessionStorageKey } from "../utilities"

export const PATH_INITIALIZE_USER = "/api/supabase/initialize-user"
export const PATH_SIGN_IN = "/api/supabase/sign-in"
export const PATH_SIGN_UP = "/api/supabase/sign-up"
export const PATH_SIGN_OUT = "/api/supabase/sign-out"
export const PATH_INSERT_AIRPORT = "/api/supabase/insert-airport"
export const PATH_DELETE_AIRPORT = "/api/supabase/delete-airport"
export const PATH_SELECT_ALL_AIRPORTS = "/api/supabase/select-all-airports"
export const PATH_UPDATE_AIRPORT_NEXT_POLL_SNOWTAM = "/api/supabase/update-airport-next-poll-snowtam"
export const PATH_UPSERT_SNOWTAM = "/api/supabase/upsert-snowtam"
export const PATH_DELETE_SNOWTAM = "/api/supabase/delete-snowtam"
export const PATH_SELECT_AIRPORT_SNOWTAM = "/api/supabase/select-airport-snowtam"
export const PATH_UPSERT_HIGHLIGHTS = "/api/supabase/upsert-highlights"
export const PATH_SELECT_HIGHLIGHTS = "/api/supabase/select-highlights"

export const EXPIRES_AT_SAFE_INTERVAL = 30 * 1000;

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

export const fetchUpdateAirportNextPollSNOWTAM = async (icaoId: string, nextPollSNOWTAM: number) => {
  const body: UpdateAirportBody = {
    accessToken: getAccessToken(),
    icaoId: icaoId,
    nextPollSNOWTAM: nextPollSNOWTAM
  }

  const response = await fetch(`${PATH_UPDATE_AIRPORT_NEXT_POLL_SNOWTAM}`, {
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

export const fetchUpsertSNOWTAM = async (SNOWTAM: EntrySNOWTAM[], airportSupabaseId: string) => {
  const body: UpsertSNOWTAMBody = {
    accessToken: getAccessToken(),
    SNOWTAM: SNOWTAM,
    airportSupabaseId: airportSupabaseId
  }

  const response = await fetch(`${PATH_UPSERT_SNOWTAM}`, {
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

export const fetchDeleteSNOWTAM = async (airportSupabaseId: string) => {
  const body: DeleteSNOWTAMBody = {
    accessToken: getAccessToken(),
    airportSupabaseId: airportSupabaseId
  }

  const response = await fetch(`${PATH_DELETE_SNOWTAM}`, {
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

export const fetchSelectAirportSNOWTAM = async (airportSupabaseId: string): Promise<EntryNOTAM[]> => {
  const body: SelectAirportSNOWTAMBody = {
    accessToken: getAccessToken(),
    airportSupabaseId: airportSupabaseId
  }

  const response = await fetch(`${PATH_SELECT_AIRPORT_SNOWTAM}`, {
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

export const fetchInitializeUser = async (refreshToken?: string): Promise<AppUser> => {
  const body: InitializeUserBody = {
    refreshToken: refreshToken ?? getRefreshToken()
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
  localStorage.setItem(sessionStorageKey, JSON.stringify(user.session))
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
  localStorage.setItem(sessionStorageKey, JSON.stringify(user.session))
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
  const session = localStorage.getItem(sessionStorageKey)

  if (!session) {
    throw new Error("You are not logged in")
  }

  const expiresAtSeconds = (JSON.parse(session) as Session).expires_at

  if (!expiresAtSeconds) {
    throw new Error("Session is missing value: expires_at")
  }

  if (expiresAtSeconds * 1000 - EXPIRES_AT_SAFE_INTERVAL < Date.now()) {
    return await fetchInitializeUser()
  }

  return undefined
}