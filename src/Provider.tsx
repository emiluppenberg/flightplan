import { useCallback, useEffect, useState, type PropsWithChildren } from "react";
import { HIGHLIGHTS_NOTAM, HIGHLIGHTS_OPERATIONAL_HOURS, HIGHLIGHTS_TAF_METAR, type AirportData, type AirportFormValues, type AppUser, type CodeHighlight, type CodeHighlightReport, type SupabaseAirport, type UserFormValues } from "./types";
import { FlightPathContext } from "./Context";
import { createAirport, refreshAirports, resolveHighlights, POLL_INTERVAL_TAF_METAR, searchAirportId, capture, POLL_INTERVAL_NOTAM, captureSyncNOTAM, fetchTAF, fetchMETAR, fetchNOTAM } from "./utilities";
import { fetchSelectAllAirports, fetchSelectHighlights, fetchInitializeUser, fetchUpsertHighlights, fetchInsertAirport, fetchDeleteAirport, fetchSignInUser, fetchSignUpUser, fetchRefreshedUser, fetchSignOutUser } from "./fetch/supabase";

export const FlightPathProvider = ({ children }: PropsWithChildren) => {
    const [airports, setAirports] = useState<AirportData[]>([createAirport(searchAirportId)])
    const [highlightsTAF, setHighlightsTAF] = useState<CodeHighlight[]>([])
    const [highlightsMETAR, setHighlightsMETAR] = useState<CodeHighlight[]>([])
    const [highlightsOPERATIONAL_HOURS, setHighlightsOPERATIONAL_HOURS] = useState<CodeHighlight[]>([])
    const [highlightsNOTAM, setHighlightsNOTAM] = useState<CodeHighlight[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [user, setUser] = useState<AppUser>()
    const [initialized, setInitialized] = useState(false);

    const loadUserData = async (accessToken: string) => {
        const supabaseAirports = await fetchSelectAllAirports({
            accessToken: accessToken
        })

        const airports = await refreshAirports(supabaseAirports)
        setAirports([...airports, createAirport(searchAirportId)])

        const highlightsTAF = await fetchSelectHighlights({
            accessToken: accessToken,
            report: "TAF"
        })
        setHighlightsTAF(resolveHighlights(highlightsTAF, HIGHLIGHTS_TAF_METAR))

        const highlightsMETAR = await fetchSelectHighlights({
            accessToken: accessToken,
            report: "METAR"
        })
        setHighlightsMETAR(resolveHighlights(highlightsMETAR, HIGHLIGHTS_TAF_METAR))

        const highlightsOPERATIONAL_HOURS = await fetchSelectHighlights({
            accessToken: accessToken,
            report: "OPERATIONAL HOURS"
        })
        setHighlightsOPERATIONAL_HOURS(resolveHighlights(highlightsOPERATIONAL_HOURS, HIGHLIGHTS_OPERATIONAL_HOURS))

        const highlightsNOTAM = await fetchSelectHighlights({
            accessToken: accessToken,
            report: "NOTAM"
        })
        setHighlightsNOTAM(resolveHighlights(highlightsNOTAM, HIGHLIGHTS_NOTAM))
    }

    useEffect(() => {
        if (initialized) return;

        const restoreSession = async () => {
            try {
                setIsLoading(true)
                const session = localStorage.getItem("session")

                if (session) {
                    const user = await fetchInitializeUser()
                    setUser(user)
                    await loadUserData(user.session.access_token);
                }
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

        setIsLoading(true)
        setAirports(current => current.map((_airport) => (
            _airport.id === airport.id
                ? { ..._airport, isLoading: true }
                : _airport
        )))

        const [TAF, METAR, NOTAM] = await Promise.all([
            capture(() => fetchTAF(airport.formValues)),
            capture(() => fetchMETAR(airport.formValues)),
            fetchNotam
                ? capture(() => fetchNOTAM(airport.formValues))
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
        setIsLoading(false)
    }, [user, airports])

    const handlePolling = useCallback(async () => {
        const now = Date.now()
        const refreshedUser = user
            ? await fetchRefreshedUser()
            : undefined;

        if (refreshedUser) {
            setUser(refreshedUser)
        }

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

    const handleSetHighlights = async (newHighlights: CodeHighlight[], report: CodeHighlightReport) => {
        try {
            if (user) {
                setIsLoading(true)
                setMessage('')

                const refreshedUser = await fetchRefreshedUser()

                if (refreshedUser) {
                    setUser(refreshedUser)
                }

                const accessToken = refreshedUser
                    ? refreshedUser.session.access_token
                    : user.session.access_token

                await fetchUpsertHighlights({
                    accessToken: accessToken,
                    highlights: newHighlights.map(highlight => highlight.class),
                    report: report
                })
            }
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "")
        } finally {
            if (report === "TAF") setHighlightsTAF(newHighlights)
            if (report === "METAR") setHighlightsMETAR(newHighlights)
            if (report === "NOTAM") setHighlightsNOTAM(newHighlights)
            if (report === "OPERATIONAL HOURS") setHighlightsOPERATIONAL_HOURS(newHighlights)
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
                const refreshedUser = await fetchRefreshedUser()

                if (refreshedUser) {
                    setUser(refreshedUser)
                }

                const accessToken = refreshedUser
                    ? refreshedUser.session.access_token
                    : user.session.access_token

                supabaseAirport = await fetchInsertAirport({
                    accessToken: accessToken,
                    icaoId: icaoId,
                    nextPollNOTAM: nextPollNOTAM
                })
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
                const icaoId = airport?.formValues.icaoId
                if (!icaoId) throw new Error(`Could not delete airport with id: ${id}`)

                const refreshedUser = await fetchRefreshedUser()

                if (refreshedUser) {
                    setUser(refreshedUser)
                }

                const accessToken = refreshedUser
                    ? refreshedUser.session.access_token
                    : user.session.access_token

                await fetchDeleteAirport({
                    accessToken: accessToken,
                    icaoId: icaoId
                })
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
            const user = await fetchSignInUser({ ...values });

            if (user && !user.user.email_confirmed_at) {
                throw new Error(`Please follow the link in the confirmation email sent to ${values.email} before logging in`)
            }
            if (!user) {
                throw new Error(`No user exists with email ${values.email} and your provided password`)
            }

            setUser(user)
            await loadUserData(user.session.access_token);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignOut = async () => {
        if (!user) return

        setIsLoading(true)
        setMessage('')

        try {
            const refreshedUser = await fetchRefreshedUser()
            const accessToken = refreshedUser
                ? refreshedUser.session.access_token
                : user.session.access_token

            await fetchSignOutUser({
                accessToken: accessToken
            })
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "")
        } finally {
            setIsLoading(false)
            setUser(undefined)
            setAirports([createAirport(searchAirportId)])
            setHighlightsTAF([])
            setHighlightsMETAR([])
            setHighlightsNOTAM([])
            setHighlightsOPERATIONAL_HOURS([])
            localStorage.removeItem("session")
        }
    }

    const handleSignUp = async (values: UserFormValues) => {
        setIsLoading(true)
        setMessage('')

        try {
            const responseMessage = await fetchSignUpUser({ ...values });
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
                highlightsOPERATIONAL_HOURS,
                highlightsNOTAM,
                handleSubmit,
                handleSetFormValues,
                handleSetHighlights,
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
