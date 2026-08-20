import { useCallback, useEffect, useState, type PropsWithChildren } from "react";
import type {
    AirportData,
    AirportFormValues,
    AppUser,
    CodeHighlight,
    SupabaseAirport,
    UserFormValues,
} from "./types";
import { FlightPathContext } from "./Context";
import { createAirport, refreshAirports, resolveHighlights, POLL_INTERVAL_TAF_METAR, searchAirportId, capture, POLL_INTERVAL_NOTAM, captureSyncNOTAM, fetchTAF, fetchMETAR, fetchNOTAMs } from "./utilities";
import { deleteAirport, initializeAppUser, insertAirport, selectAllAirports, selectHighlightsMETAR, selectHighlightsTAF, signInUser, signOutUser, signUpUser, upsertHighlightsMETAR, upsertHighlightsTAF } from "./supabase";

export const FlightPathProvider = ({ children }: PropsWithChildren) => {
    const [airports, setAirports] = useState<AirportData[]>([createAirport(searchAirportId)])
    const [highlightsTAF, setHighlightsTAF] = useState<CodeHighlight[]>([])
    const [highlightsMETAR, setHighlightsMETAR] = useState<CodeHighlight[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [user, setUser] = useState<AppUser>()
    const [initialized, setInitialized] = useState(false);

    const loadUserData = async () => {
        const supabaseAirports = await selectAllAirports()
        const airports = await refreshAirports(supabaseAirports)
        setAirports([...airports, createAirport(searchAirportId)])

        const highlightsTAF = await selectHighlightsTAF()
        setHighlightsTAF(resolveHighlights(highlightsTAF))

        const highlightsMETAR = await selectHighlightsMETAR()
        setHighlightsMETAR(resolveHighlights(highlightsMETAR))
    }

    useEffect(() => {
        if (initialized) return;

        const restoreSession = async () => {
            try {
                setIsLoading(true)
                const user = await initializeAppUser()
                setUser(user)
                await loadUserData();
            } catch (error) {
                setMessage(error instanceof Error ? error.message : "There was an unexpected error when checking your authentication token")
            } finally {
                setInitialized(true);
                setIsLoading(false)
            }
        }

        void restoreSession();
    }, [])

    const handleSubmit = useCallback(async (
        airport: AirportData,
        fetchNotam: boolean,
    ) => {
        if (airport.formValues.icaoId.length === 0) return;

        setAirports(current => current.map((_airport) => (
            _airport.id === airport.id
                ? { ..._airport, isLoading: true }
                : _airport
        )))

        const [TAF, METAR, NOTAM] = await Promise.all([
            capture(() => fetchTAF(airport.formValues)),
            capture(() => fetchMETAR(airport.formValues)),
            fetchNotam
                ? capture(() => fetchNOTAMs(airport.formValues))
                : Promise.resolve({ data: undefined, error: "" }),
        ])

        const nextPollReports = Date.now() + POLL_INTERVAL_TAF_METAR;
        const nextPollNOTAM = Date.now() + POLL_INTERVAL_NOTAM;

        const synced = user && NOTAM.data
            ? await captureSyncNOTAM(NOTAM.data, airport.supabaseId, airport.formValues.icaoId, nextPollNOTAM, airport.id)
            : ""

        setAirports(current => current.map(_airport => {
            if (_airport.id === airport.id) {
                const matchTAF = _airport.TAF.some(taf => taf.icaoId === airport.formValues.icaoId)
                const matchMETAR = _airport.METAR.some(metar => metar.icaoId === airport.formValues.icaoId)
                const matchNOTAM = _airport.NOTAM.some(notam => notam.location === airport.formValues.icaoId)

                return {
                    ..._airport,
                    icaoId: airport.formValues.icaoId,
                    TAF: TAF.data ?? (matchTAF ? _airport.TAF : []),
                    METAR: METAR.data ?? (matchMETAR ? _airport.METAR : []),
                    NOTAM: fetchNotam
                        ? NOTAM.data ?? (matchNOTAM ? _airport.NOTAM : [])
                        : (matchNOTAM ? _airport.NOTAM : []),
                    messages: (TAF.error ?? "") + (METAR.error ?? "") + (NOTAM.error ?? "") + synced,
                    nextPollReports: nextPollReports,
                    nextPollNOTAM: fetchNotam && NOTAM.data ? nextPollNOTAM : _airport.nextPollNOTAM,
                    isLoading: false
                }
            } else {
                return _airport
            }
        }))
    }, [user, airports])

    const handlePolling = useCallback(async () => {
        const now = Date.now()

        for (const airport of airports) {
            const pollReports =
                airport.formValues.icaoId.trim().length > 0 &&
                !airport.isLoading &&
                airport.id !== searchAirportId &&
                airport.nextPollReports <= now

            if (pollReports) {
                const pollNOTAM = airport.nextPollNOTAM <= now
                handleSubmit(airport, pollNOTAM)
            }
        }
    }, [airports, handleSubmit])

    useEffect(() => {
        const intervalId = setInterval(handlePolling, 5000)
        return (() => clearInterval(intervalId))
    }, [handlePolling])

    const handleSetFormValues = (values: AirportFormValues, id: string) => {
        setAirports(current => current.map((airport) => (
            airport.id === id
                ? { ...airport, formValues: values }
                : airport
        )))
    }

    const handleSetHighlightsTAF = async (newHighlights: CodeHighlight[]) => {
        try {
            if (user) {
                setIsLoading(true)
                setMessage('')

                await upsertHighlightsTAF(newHighlights)
            }
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "")
        } finally {
            setHighlightsTAF(newHighlights)
            setIsLoading(false)
        }
    }

    const handleSetHighlightsMETAR = async (newHighlights: CodeHighlight[]) => {
        try {
            if (user) {
                setIsLoading(true)
                setMessage('')

                await upsertHighlightsMETAR(newHighlights)
            }
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "")
        } finally {
            setHighlightsMETAR(newHighlights)
            setIsLoading(false)
        }
    }

    const handleAddAirport = async (icaoId: string) => {
        if (icaoId.length === 0) return

        let supabaseAirport: SupabaseAirport | undefined = undefined
        let nextPollNOTAM = Date.now()
        const searchAirport = airports.find(airport => airport.id === searchAirportId) ?? createAirport(searchAirportId)
        const isDuplicate = airports.some(airport =>
            airport.formValues.icaoId === icaoId &&
            airport.id !== searchAirportId
        );

        if (isDuplicate) {
            window.alert(`You have already saved ${icaoId}`)
            return;
        }

        if (user) {
            setIsLoading(true)
            setMessage('')

            try {
                supabaseAirport = await insertAirport(icaoId, nextPollNOTAM)
            } catch (error) {
                setMessage(error instanceof Error ? error.message : "")
            } finally {
                setIsLoading(false)
            }
        }

        const hasTAF = searchAirport.TAF.some(taf => taf.icaoId === icaoId)
        const hasMETAR = searchAirport.METAR.some(metar => metar.icaoId === icaoId)
        const hasNOTAM = searchAirport.NOTAM.some(notam => notam.location === icaoId)

        nextPollNOTAM = user && hasNOTAM
            ? nextPollNOTAM + POLL_INTERVAL_NOTAM
            : nextPollNOTAM

        const synced = user && hasNOTAM
            ? await captureSyncNOTAM(searchAirport.NOTAM, supabaseAirport?.id, icaoId, nextPollNOTAM)
            : ""

        setAirports(current => [...current, {
            ...searchAirport,
            id: crypto.randomUUID(),
            formValues: { ...searchAirport.formValues },
            TAF: hasTAF ? [...searchAirport.TAF] : [],
            METAR: hasMETAR ? [...searchAirport.METAR] : [],
            NOTAM: hasNOTAM ? [...searchAirport.NOTAM] : [],
            nextPollReports: Date.now() + POLL_INTERVAL_TAF_METAR,
            nextPollNOTAM: nextPollNOTAM,
            messages: synced,
            isLoading: false,
            supabaseId: supabaseAirport?.id
        }])
    }

    const handleDeleteAirport = async (id: string) => {
        if (user) {
            setIsLoading(true)
            setMessage('')

            try {
                const airport = airports.find(airport => airport.id === id)
                if (!airport) throw new Error(`Could not delete airport with id: ${id}`)
                await deleteAirport(airport.formValues.icaoId)
            } catch (error) {
                setMessage(error instanceof Error ? error.message : "")
            } finally {
                setIsLoading(false)
            }
        }

        setAirports(current => current.filter(airport => airport.id !== id))
    }

    const handleSignIn = async (values: UserFormValues) => {
        setIsLoading(true)
        setMessage('')

        try {
            const user = await signInUser(values);

            if (user && !user.user.email_confirmed_at) {
                throw new Error(`Please follow the link in the confirmation email sent to ${values.email} before logging in`)
            }
            if (!user) {
                throw new Error(`No user exists with email ${values.email} and your provided password`)
            }

            setUser(user)
            await loadUserData();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignOut = async () => {
        setIsLoading(true)
        setMessage('')

        try {
            await signOutUser()
            setUser(undefined)
            setAirports([createAirport(searchAirportId)])
            setHighlightsTAF([])
            setHighlightsMETAR([])
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignUp = async (values: UserFormValues) => {
        setIsLoading(true)
        setMessage('')

        try {
            const responseMessage = await signUpUser(values);
            setMessage(responseMessage)
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <FlightPathContext
            value={{
                airports,
                highlightsTAF,
                highlightsMETAR,
                handleSubmit,
                handleSetFormValues,
                handleSetHighlightsTAF,
                handleSetHighlightsMETAR,
                handleAddAirport,
                handleDeleteAirport,
                handleSignIn,
                handleSignOut,
                handleSignUp,
                isLoading,
                message,
                user
            }}>
            {children}
        </FlightPathContext>
    )
}
