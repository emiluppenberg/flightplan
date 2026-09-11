import { useCallback, useEffect, useState } from "react";
import { HIGHLIGHTS_NOTAM, HIGHLIGHTS_OPERATIONAL_HOURS, HIGHLIGHTS_TAF_METAR, type AirportData, type AirportFormValues, type AppUser, type CodeHighlight, type CodeHighlightReport, type SupabaseAirport, type UserFormValues } from "./types";
import { FlightPathContext } from "./Context";
import { createAirport, refreshAirports, resolveHighlights, searchAirportId, capture, captureSyncSNOWTAM, consumeSupabaseConfirmationLink, sessionStorageKey, ROUTES } from "./utilities";
import { fetchSelectAllAirports, fetchSelectHighlights, fetchInitializeUser, fetchUpsertHighlights, fetchInsertAirport, fetchDeleteAirport, fetchSignInUser, fetchSignUpUser, fetchRefreshedUser, fetchSignOutUser } from "./api/supabase";
import { fetchTAF, fetchMETAR, fetchNOTAM, POLL_INTERVAL_TAF_METAR_NOTAM, POLL_INTERVAL_SNOWTAM, fetchSNOWTAM, } from "./api/resources";
import AppHeader from "./components/AppHeader";
import { Outlet, useLocation, useNavigate } from "react-router";

export const FlightPathProvider = () => {
    const [airports, setAirports] = useState<AirportData[]>([createAirport(searchAirportId)])
    const [highlightsTAF, setHighlightsTAF] = useState<CodeHighlight[]>([])
    const [highlightsMETAR, setHighlightsMETAR] = useState<CodeHighlight[]>([])
    const [highlightsOPERATIONAL_HOURS, setHighlightsOPERATIONAL_HOURS] = useState<CodeHighlight[]>([])
    const [highlightsNOTAM, setHighlightsNOTAM] = useState<CodeHighlight[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [user, setUser] = useState<AppUser>()
    const [initialized, setInitialized] = useState(false);
    const navigate = useNavigate()
    const location = useLocation()

    const loadUserData = async (accessToken: string): Promise<boolean> => {
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

        return airports.length > 0
    }

    useEffect(() => {
        if (initialized) return;

        const restoreSession = async () => {
            let hasAerodromes = false

            try {
                setIsLoading(true)

                const confirmedUser = await capture(() => consumeSupabaseConfirmationLink())

                if (confirmedUser.data) {
                    setMessage(`Welcome to FlyRep`)
                    setUser(confirmedUser.data)
                    hasAerodromes = await loadUserData(confirmedUser.data.session.access_token)
                }
                if (confirmedUser.error) {
                    setError(confirmedUser.error)
                    localStorage.removeItem(sessionStorageKey)
                }

                const session = localStorage.getItem(sessionStorageKey)

                if (session && !confirmedUser.data) {
                    const user = await capture(() => fetchInitializeUser())

                    if (user.data) {
                        setUser(user.data)
                        hasAerodromes = await loadUserData(user.data.session.access_token)
                    }
                    if (user.error) {
                        setError(user.error)
                        localStorage.removeItem(sessionStorageKey)
                    }
                }
            } catch (error) {
                setError(error instanceof Error ? error.message : "There was an unexpected error while restoring your session")
            } finally {
                setInitialized(true);
                setIsLoading(false)

                if (!hasAerodromes && location.pathname === "/") {
                    navigate(`/${ROUTES.search}`)
                }
            }
        }

        void restoreSession();
    }, [])

    const handleSubmit = useCallback(async (
        airport: AirportData,
        fetchFreshSNOWTAM: boolean,
    ) => {
        if (airport.formValues.icaoId.length === 0) return;

        setIsLoading(true)
        setAirports(current => current.map((_airport) => (
            _airport.id === airport.id
                ? { ..._airport, isLoading: true }
                : _airport
        )))

        try {
            const [TAF, METAR, NOTAM, SNOWTAM] = await Promise.all([
                capture(() => fetchTAF(airport.formValues)),
                capture(() => fetchMETAR(airport.formValues)),
                capture(() => fetchNOTAM(airport.formValues)),
                fetchFreshSNOWTAM
                    ? capture(() => fetchSNOWTAM(airport.formValues))
                    : Promise.resolve({ data: undefined, error: "" }),
            ])

            const nextPollReports = Date.now() + POLL_INTERVAL_TAF_METAR_NOTAM;
            const nextPollSNOWTAM = Date.now() + POLL_INTERVAL_SNOWTAM;

            const refreshedUser = user
                ? await capture(() => fetchRefreshedUser())
                : undefined

            const synced = ((refreshedUser && refreshedUser.data) || user) && SNOWTAM.data
                ? await captureSyncSNOWTAM(SNOWTAM.data, airport.supabaseId, airport.formValues.icaoId, nextPollSNOWTAM, airport.id)
                : ""

            if (refreshedUser && refreshedUser.data) {
                setUser(refreshedUser.data)
            }

            setAirports(current => current.map(_airport => {
                if (_airport.id === airport.id) {
                    // matches preserve data during failed fetch AND prevents searchAirport from displaying reports for multiple icaoId
                    const hasTAF = _airport.TAF.some(taf => taf.icaoId === airport.formValues.icaoId)
                    const hasMETAR = _airport.METAR.some(metar => metar.icaoId === airport.formValues.icaoId)
                    const hasNOTAM = _airport.NOTAM.some(notam => notam.location === airport.formValues.icaoId)
                    const hasSNOWTAM = _airport.SNOWTAM.some(snowtam => snowtam.location === airport.formValues.icaoId)

                    return {
                        ..._airport,
                        icaoId: airport.formValues.icaoId,
                        TAF: TAF.data ?? (hasTAF ? _airport.TAF : []),
                        METAR: METAR.data ?? (hasMETAR ? _airport.METAR : []),
                        NOTAM: NOTAM.data ?? (hasNOTAM ? _airport.NOTAM : []),
                        SNOWTAM: SNOWTAM.data ?? (hasSNOWTAM ? _airport.SNOWTAM : []),
                        messages: (TAF.error ?? "") + (METAR.error ?? "") + (NOTAM.error ?? "") + (SNOWTAM.error ?? "") + (refreshedUser?.error ?? "") + synced,
                        nextPollReports: nextPollReports,
                        nextPollSNOWTAM: fetchFreshSNOWTAM && SNOWTAM.data
                            ? nextPollSNOWTAM
                            : _airport.nextPollSNOWTAM,
                        isLoading: false
                    }
                } else {
                    return _airport
                }
            }))
        } catch (error) {
            setError(error instanceof Error ? error.message : `There was an unexpected error while fetch data for ${airport.formValues.icaoId}`)
            setAirports(current => current.map((_airport) => (
                _airport.id === airport.id
                    ? { ..._airport, isLoading: false }
                    : _airport
            )))
        } finally {
            setIsLoading(false)
        }
    }, [user, airports])

    const handlePolling = useCallback(async () => {
        const now = Date.now()

        try {
            const session = localStorage.getItem(sessionStorageKey)

            const refreshedUser = user && session
                ? await fetchRefreshedUser()
                : undefined;

            if (refreshedUser) {
                setUser(refreshedUser)
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "There was an unexpected error while polling")
        }

        try {
            for (const airport of airports) {
                const pollReports =
                    airport.icaoId &&
                    !airport.isLoading &&
                    airport.id !== searchAirportId &&
                    airport.nextPollReports <= now

                if (pollReports) {
                    const pollSNOWTAM = airport.nextPollSNOWTAM <= now
                    handleSubmit(airport, pollSNOWTAM)
                }
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "There was an unexpected error while polling")
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
            if (report === "TAF") setHighlightsTAF(newHighlights)
            if (report === "METAR") setHighlightsMETAR(newHighlights)
            if (report === "NOTAM") setHighlightsNOTAM(newHighlights)
            if (report === "OPERATIONAL HOURS") setHighlightsOPERATIONAL_HOURS(newHighlights)

            if (user) {
                setIsLoading(true)
                setError('')

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
            setError(error instanceof Error ? error.message : "")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddAirport = async (icaoId: string | null) => {
        if (!icaoId) return

        let supabaseAirport: SupabaseAirport | undefined = undefined
        let nextPollSNOWTAM = Date.now()
        const searchAirport = airports.find(airport => airport.id === searchAirportId) ?? createAirport(searchAirportId)
        const isDuplicate = airports.some(airport =>
            airport.icaoId === icaoId &&
            airport.id !== searchAirportId
        );

        if (isDuplicate) {
            window.alert(`You have already saved ${icaoId}`)
            return;
        }

        if (user) {
            setIsLoading(true)
            setError('')

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
                    nextPollSNOWTAM: nextPollSNOWTAM
                })
            } catch (error) {
                setError(error instanceof Error ? error.message : "")
            } finally {
                setIsLoading(false)
            }
        }

        const hasTAF = searchAirport.TAF.some(taf => taf.icaoId === icaoId)
        const hasMETAR = searchAirport.METAR.some(metar => metar.icaoId === icaoId)
        const hasNOTAM = searchAirport.NOTAM.some(notam => notam.location === icaoId)
        const hasSNOWTAM = searchAirport.SNOWTAM.some(snowtam => snowtam.location === icaoId)

        nextPollSNOWTAM = user && hasSNOWTAM
            ? nextPollSNOWTAM + POLL_INTERVAL_SNOWTAM
            : nextPollSNOWTAM

        const synced = user && hasSNOWTAM
            ? await captureSyncSNOWTAM(searchAirport.SNOWTAM, supabaseAirport?.id, icaoId, nextPollSNOWTAM)
            : ""

        setAirports(current => [...current, {
            ...searchAirport,
            id: crypto.randomUUID(),
            icaoId: icaoId,
            formValues: { ...searchAirport.formValues, icaoId: icaoId },
            TAF: hasTAF ? [...searchAirport.TAF] : [],
            METAR: hasMETAR ? [...searchAirport.METAR] : [],
            NOTAM: hasNOTAM ? [...searchAirport.NOTAM] : [],
            SNOWTAM: hasSNOWTAM ? [...searchAirport.SNOWTAM] : [],
            nextPollReports: Date.now() + POLL_INTERVAL_TAF_METAR_NOTAM,
            nextPollSNOWTAM: nextPollSNOWTAM,
            messages: synced,
            isLoading: false,
            supabaseId: supabaseAirport?.id
        }])
    }

    const handleDeleteAirport = async (id: string) => {
        if (user) {
            setIsLoading(true)
            setError('')

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
                setError(error instanceof Error ? error.message : "")
            } finally {
                setIsLoading(false)
            }
        }

        setAirports(current => current.filter(airport => airport.id !== id))
    }

    const handleSignIn = async (values: UserFormValues) => {
        setIsLoading(true)
        setError('')
        let hasAerodromes = false

        try {
            const user = await fetchSignInUser({ ...values });

            if (user && !user.user.email_confirmed_at) {
                throw new Error(`Please follow the link in the confirmation email sent to ${values.email} before logging in`)
            }
            if (!user) {
                throw new Error(`No user exists with email ${values.email} and your provided password`)
            }

            setUser(user)
            hasAerodromes = await loadUserData(user.session.access_token);

            if (!hasAerodromes) {
                navigate(`/${ROUTES.search}`)
            } else {
                navigate("/")
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignOut = async () => {
        if (!user) return

        setIsLoading(true)
        setError('')

        try {
            const refreshedUser = await fetchRefreshedUser()
            const accessToken = refreshedUser
                ? refreshedUser.session.access_token
                : user.session.access_token

            await fetchSignOutUser({
                accessToken: accessToken
            })
        } catch (error) {
            setError(error instanceof Error ? error.message : "")
        } finally {
            setIsLoading(false)
            setUser(undefined)
            setAirports([createAirport(searchAirportId)])
            setHighlightsTAF([])
            setHighlightsMETAR([])
            setHighlightsNOTAM([])
            setHighlightsOPERATIONAL_HOURS([])
            localStorage.removeItem(sessionStorageKey)
        }
    }

    const handleSignUp = async (values: UserFormValues) => {
        setIsLoading(true)
        setMessage("")
        setError("")

        try {
            const responseMessage = await fetchSignUpUser({ ...values });
            setMessage(responseMessage)
            navigate("/")
        } catch (error) {
            setError(error instanceof Error ? error.message : "")
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
                error,
                user
            }}>
            <main className="page">
                <AppHeader />
                <Outlet />
            </main>
        </FlightPathContext>
    )
}
