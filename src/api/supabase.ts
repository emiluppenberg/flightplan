import type { Session } from "@supabase/supabase-js"
import type {  SupabaseAerodrome, EntryNOTAM,  AppUser, EntrySNOWTAM } from "../types"
import { getAccessToken, getRefreshToken, sessionStorageKey } from "../utilities"
import type { InsertAerodromeBody, DeleteAerodromeBody, SelectAllAerodromesBody, UpdateAerodromeBody, UpsertSNOWTAMBody, DeleteSNOWTAMBody, SelectSNOWTAMBody, UpsertHighlightsBody, SelectHighlightsBody, InitializeUserBody, SignInBody, SignUpBody, SignOutBody } from "../shared"

export const PATH_INITIALIZE_USER = "/api/supabase/initialize-user"
export const PATH_SIGN_IN = "/api/supabase/sign-in"
export const PATH_SIGN_UP = "/api/supabase/sign-up"
export const PATH_SIGN_OUT = "/api/supabase/sign-out"
export const PATH_INSERT_AERODROME = "/api/supabase/insert-aerodrome"
export const PATH_DELETE_AERODROME = "/api/supabase/delete-aerodrome"
export const PATH_SELECT_AERODROMES = "/api/supabase/select-aerodromes"
export const PATH_UPDATE_NEXT_POLL_SNOWTAM = "/api/supabase/update-next-poll-snowtam"
export const PATH_UPSERT_SNOWTAM = "/api/supabase/upsert-snowtam"
export const PATH_DELETE_SNOWTAM = "/api/supabase/delete-snowtam"
export const PATH_SELECT_SNOWTAM = "/api/supabase/select-snowtam"
export const PATH_UPSERT_HIGHLIGHTS = "/api/supabase/upsert-highlights"
export const PATH_SELECT_HIGHLIGHTS = "/api/supabase/select-highlights"

export const EXPIRES_AT_SAFE_INTERVAL = 30 * 1000;

export const fetchInsertAerodrome = async (body: InsertAerodromeBody): Promise<SupabaseAerodrome> => {
  const response = await fetch(`${PATH_INSERT_AERODROME}`, {
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

export const fetchDeleteAerodrome = async (body: DeleteAerodromeBody): Promise<SupabaseAerodrome> => {
  const response = await fetch(`${PATH_DELETE_AERODROME}`, {
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

export const fetchSelectAllAerodromes = async (body: SelectAllAerodromesBody): Promise<SupabaseAerodrome[]> => {
  const response = await fetch(`${PATH_SELECT_AERODROMES}`, {
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

export const fetchUpdateAerodromeNextPollSNOWTAM = async (icaoId: string, nextPollSNOWTAM: number) => {
  const body: UpdateAerodromeBody = {
    accessToken: getAccessToken(),
    icaoId: icaoId,
    nextPollSNOWTAM: nextPollSNOWTAM
  }

  const response = await fetch(`${PATH_UPDATE_NEXT_POLL_SNOWTAM}`, {
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

export const fetchUpsertSNOWTAM = async (SNOWTAM: EntrySNOWTAM[], aerodromeSupabaseId: string) => {
  const body: UpsertSNOWTAMBody = {
    accessToken: getAccessToken(),
    SNOWTAM: SNOWTAM,
    aerodromeSupabaseId: aerodromeSupabaseId
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

export const fetchDeleteSNOWTAM = async (aerodromeSupabaseId: string) => {
  const body: DeleteSNOWTAMBody = {
    accessToken: getAccessToken(),
    aerodromeSupabaseId: aerodromeSupabaseId
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

export const fetchSelectSNOWTAM = async (aerodromeSupabaseId: string): Promise<EntryNOTAM[]> => {
  const body: SelectSNOWTAMBody = {
    accessToken: getAccessToken(),
    aerodromeSupabaseId: aerodromeSupabaseId
  }

  const response = await fetch(`${PATH_SELECT_SNOWTAM}`, {
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