import { useCallback, useEffect, useRef, useState } from "react";
import { type AerodromeData, type AerodromeFormValues, type AppUser, type CodeHighlight, type CodeHighlightReport, type SupabaseAerodrome, type UserAppData, type UserFormValues } from "./types";
import { FlightPathContext } from "./Context";
import { createAerodrome, searchAerodromeId, capture, captureSyncSNOWTAM, consumeSupabaseConfirmationLink, sessionStorageKey, ROUTES, getReportError, mergeErrors, mapUpsertConfigBody, defaultQueryMetarPreviousHours, captureUserData } from "./utilities";
import { fetchInitializeUser, fetchInsertAerodrome, fetchDeleteAerodrome, fetchSignInUser, fetchSignUpUser, fetchRefreshedUserAccessToken, fetchSignOutUser, fetchUpsertConfig } from "./api/supabase";
import { fetchTAF, fetchMETAR, fetchNOTAM, POLL_INTERVAL_TAF_METAR_NOTAM, POLL_INTERVAL_SNOWTAM, fetchSNOWTAM, } from "./api/resources";
import AppHeader from "./components/AppHeader";
import { Outlet, useLocation, useNavigate } from "react-router";

export const FlightPathProvider = () => {
    const [aerodromes, setAerodromes] = useState<AerodromeData[]>([createAerodrome(searchAerodromeId)])
    const [highlightsTAF, setHighlightsTAF] = useState<CodeHighlight[]>([])
    const [highlightsMETAR, setHighlightsMETAR] = useState<CodeHighlight[]>([])
    const [highlightsOPERATIONAL_HOURS, setHighlightsOPERATIONAL_HOURS] = useState<CodeHighlight[]>([])
    const [highlightsNOTAM, setHighlightsNOTAM] = useState<CodeHighlight[]>([])
    const [queryMetarPreviousHours, setQueryMetarPreviousHours] = useState<number>(defaultQueryMetarPreviousHours)
    const [isLoading, setIsLoading] = useState(false)
    const [messages, setMessages] = useState<string[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [user, setUser] = useState<AppUser>()
    const [initialized, setInitialized] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const inFlightPolling = useRef(false)
    const upsertConfig = useRef(false)
    const upsertConfigQueued = useRef(false)
    const preventRestoreSession = useRef(false)
    const pathname = useRef(location.pathname)
    const hasAerodromes = useRef(aerodromes.length > 1)
    const isUser = useRef(false)
    useEffect(() => {
        pathname.current = location.pathname
    }, [location.pathname])
    useEffect(() => {
        hasAerodromes.current = aerodromes.length > 1
    }, [aerodromes.length])
    useEffect(() => {
        isUser.current = user !== undefined
    }, [user])

    useEffect(() => {
        if (initialized) return;

        const restoreSession = async () => {
            try {
                let userData: UserAppData | undefined = undefined

                setIsLoading(true)

                const confirmedResult = await capture(() => consumeSupabaseConfirmationLink())

                if (confirmedResult.data) {
                    setMessages([...messages, "Welcome to FlyRep"])
                    setUser(confirmedResult.data)
                    userData = await captureUserData(confirmedResult.data.session.access_token)
                }
                if (confirmedResult.error) {
                    setErrors([...errors, confirmedResult.error])
                    localStorage.removeItem(sessionStorageKey)
                }

                const session = localStorage.getItem(sessionStorageKey)

                if (session && !confirmedResult.data) {
                    const initializeResult = await capture(() => fetchInitializeUser())

                    if (initializeResult.data) {
                        setUser(initializeResult.data)
                        userData = await captureUserData(initializeResult.data.session.access_token)
                    }
                    if (initializeResult.error) {
                        setErrors([...errors, initializeResult.error])
                        localStorage.removeItem(sessionStorageKey)
                    }
                }

                if (userData) {
                    setAerodromes([...userData.aerodromes, createAerodrome(searchAerodromeId)])
                    setHighlightsTAF([...userData.highlightsTaf])
                    setHighlightsMETAR([...userData.highlightsMetar])
                    setHighlightsNOTAM([...userData.highlightsNotam])
                    setHighlightsOPERATIONAL_HOURS([...userData.highlightsOperationalHours])
                    setQueryMetarPreviousHours(userData.queryMetarPreviousHours)
                    setErrors(userData.errors)
                    hasAerodromes.current = userData.aerodromes.length > 0
                }
            } catch (e) {
                setErrors([...errors, e instanceof Error ? e.message : "There was an unexpected error while restoring your session"])
            } finally {
                setInitialized(true);
                setIsLoading(false)

                if (!hasAerodromes.current && pathname.current === "/") {
                    navigate(`/${ROUTES.search}`)
                }
            }
        }

        if (!preventRestoreSession.current) {
            preventRestoreSession.current = true
            void restoreSession().finally(() => {
                preventRestoreSession.current = false
            });
        }
    }, [location.pathname])

    const handleSubmit = useCallback(async (
        aerodrome: AerodromeData,
        fetchFreshSNOWTAM: boolean,
    ) => {
        if (aerodrome.formValues.icaoId.length === 0) return;

        setIsLoading(true)
        setAerodromes(current => current.map((currentAerodrome) => (
            currentAerodrome.id === aerodrome.id
                ? { ...currentAerodrome, isLoading: true }
                : currentAerodrome
        )))

        try {
            const [TAF, METAR, NOTAM, SNOWTAM] = await Promise.all([
                capture(() => fetchTAF(aerodrome.formValues)),
                capture(() => fetchMETAR(aerodrome.formValues, queryMetarPreviousHours)),
                capture(() => fetchNOTAM(aerodrome.formValues)),
                fetchFreshSNOWTAM
                    ? capture(() => fetchSNOWTAM(aerodrome.formValues))
                    : Promise.resolve({ data: undefined, error: undefined }),
            ])

            const nextPollReports = Date.now() + POLL_INTERVAL_TAF_METAR_NOTAM;
            const nextPollSNOWTAM = Date.now() + POLL_INTERVAL_SNOWTAM;

            const refreshed = user
                ? await capture(() => fetchRefreshedUserAccessToken())
                : undefined

            const synced = ((refreshed && refreshed.data) || user) && SNOWTAM.data
                ? await captureSyncSNOWTAM(SNOWTAM.data, aerodrome.supabaseId, aerodrome.formValues.icaoId, nextPollSNOWTAM, aerodrome.id)
                : []

            if (refreshed?.data?.refreshedUser) {
                setUser(refreshed.data.refreshedUser)
            }

            const mergedErrors = mergeErrors(
                refreshed?.error,
                getReportError(TAF, "TAF"),
                getReportError(METAR, "METAR"),
                getReportError(NOTAM, "NOTAM"),
                fetchFreshSNOWTAM
                    ? getReportError(SNOWTAM, "SNOWTAM")
                    : undefined,
                ...synced
            )

            setAerodromes(current => current.map(currentAerodrome => {
                if (currentAerodrome.id === aerodrome.id) {
                    // matches preserve data during failed fetch AND prevents searchaerodrome from displaying reports for multiple icaoId
                    const hasTAF = currentAerodrome.TAF.some(taf => taf.icaoId === aerodrome.formValues.icaoId)
                    const hasMETAR = currentAerodrome.METAR.some(metar => metar.icaoId === aerodrome.formValues.icaoId)
                    const hasNOTAM = currentAerodrome.NOTAM.some(notam => notam.location === aerodrome.formValues.icaoId)
                    const hasSNOWTAM = currentAerodrome.SNOWTAM.some(snowtam => snowtam.location === aerodrome.formValues.icaoId)

                    return {
                        ...currentAerodrome,
                        icaoId: aerodrome.formValues.icaoId,
                        TAF: TAF.data ?? (hasTAF ? currentAerodrome.TAF : []),
                        METAR: METAR.data ?? (hasMETAR ? currentAerodrome.METAR : []),
                        NOTAM: NOTAM.data ?? (hasNOTAM ? currentAerodrome.NOTAM : []),
                        SNOWTAM: SNOWTAM.data ?? (hasSNOWTAM ? currentAerodrome.SNOWTAM : []),
                        messages: mergedErrors.join("\n"),
                        nextPollReports: nextPollReports,
                        nextPollSNOWTAM: fetchFreshSNOWTAM && SNOWTAM.data
                            ? nextPollSNOWTAM
                            : currentAerodrome.nextPollSNOWTAM,
                        isLoading: false
                    }
                } else {
                    return currentAerodrome
                }
            }))
        } catch (e) {
            setErrors([...errors, e instanceof Error ? e.message : `There was an unexpected error while fetch data for ${aerodrome.formValues.icaoId}`])
            setAerodromes(current => current.map((currentAerodrome) => (
                currentAerodrome.id === aerodrome.id
                    ? { ...currentAerodrome, isLoading: false }
                    : currentAerodrome
            )))
        } finally {
            setIsLoading(false)
        }
    }, [user, queryMetarPreviousHours])

    const handlePolling = useCallback(async () => {
        if (inFlightPolling.current) return

        try {
            inFlightPolling.current = true

            const errors: string[] = []
            const now = Date.now()
            const session = localStorage.getItem(sessionStorageKey)

            const refreshResult = user && session
                ? await capture(() => fetchRefreshedUserAccessToken())
                : { data: undefined, error: undefined };

            if (refreshResult?.data?.refreshedUser) {
                setUser(refreshResult.data.refreshedUser)
            }
            if (refreshResult.error) {
                errors.push(refreshResult.error)
            }

            for (const aerodrome of aerodromes) {
                const pollReports =
                    aerodrome.icaoId &&
                    !aerodrome.isLoading &&
                    aerodrome.id !== searchAerodromeId &&
                    aerodrome.nextPollReports <= now

                if (pollReports) {
                    const pollSNOWTAM = aerodrome.nextPollSNOWTAM <= now
                    handleSubmit(aerodrome, pollSNOWTAM)
                }
            }

            if (upsertConfig.current && isUser.current) {
                const bodyResult = await capture(() => mapUpsertConfigBody(
                    highlightsTAF,
                    highlightsMETAR,
                    highlightsNOTAM,
                    highlightsOPERATIONAL_HOURS
                    , queryMetarPreviousHours,
                    refreshResult.data?.accessToken))

                if (bodyResult.error) {
                    errors.push(bodyResult.error)
                }

                const body = bodyResult.data

                if (body) {
                    const upsert = await capture(() => fetchUpsertConfig(body))

                    if (upsert.error) {
                        errors.push(upsert.error)
                    } else {
                        upsertConfig.current = false
                    }
                }
            }

            if (errors.length > 0) {
                setErrors(mergeErrors(...errors))
            }
        } finally {
            inFlightPolling.current = false

            if (upsertConfigQueued.current && isUser.current) {
                upsertConfigQueued.current = false
                upsertConfig.current = true
            }
        }
    }, [aerodromes, handleSubmit, highlightsTAF, highlightsMETAR, highlightsNOTAM, highlightsOPERATIONAL_HOURS, queryMetarPreviousHours])

    useEffect(() => {
        const intervalId = setInterval(handlePolling, 5000)
        return (() => clearInterval(intervalId))
    }, [handlePolling])

    const handleSetFormValues = (values: AerodromeFormValues, id: string) => {
        setAerodromes(current => current.map((aerodrome) => (
            aerodrome.id === id
                ? { ...aerodrome, formValues: values }
                : aerodrome
        )))
    }

    const handleSetHighlights = async (newHighlights: CodeHighlight[], report: CodeHighlightReport) => {
        if (report === "TAF") setHighlightsTAF(newHighlights)
        if (report === "METAR") setHighlightsMETAR(newHighlights)
        if (report === "NOTAM") setHighlightsNOTAM(newHighlights)
        if (report === "OPERATIONAL HOURS") setHighlightsOPERATIONAL_HOURS(newHighlights)

        if (user) {
            if (inFlightPolling.current) {
                upsertConfigQueued.current = true
            } else {
                upsertConfig.current = true
            }
        }
    }

    const handleSetQueryMetarPreviousHours = async (newValue: number) => {
        setQueryMetarPreviousHours(newValue)

        if (user) {
            if (inFlightPolling.current) {
                upsertConfigQueued.current = true
            } else {
                upsertConfig.current = true
            }
        }
    }

    const handleAddAerodrome = async (icaoId: string | null) => {
        if (!icaoId) return

        let supabaseAerodrome: SupabaseAerodrome | undefined = undefined
        let nextPollSNOWTAM = Date.now()
        const searchAerodrome = aerodromes.find(aerodrome => aerodrome.id === searchAerodromeId) ?? createAerodrome(searchAerodromeId)
        const isDuplicate = aerodromes.some(aerodrome =>
            aerodrome.icaoId === icaoId &&
            aerodrome.id !== searchAerodromeId
        );

        if (isDuplicate) {
            window.alert(`You have already saved ${icaoId}`)
            return;
        }

        if (user) {
            setIsLoading(true)

            try {
                const { refreshedUser, accessToken } = await fetchRefreshedUserAccessToken()

                if (refreshedUser) {
                    setUser(refreshedUser)
                }

                supabaseAerodrome = await fetchInsertAerodrome({
                    accessToken: accessToken,
                    icaoId: icaoId,
                    nextPollSNOWTAM: nextPollSNOWTAM
                })
            } catch (e) {
                setErrors([...errors, e instanceof Error ? e.message : "There was an unexpected error while saving aerodrome"])
            } finally {
                setIsLoading(false)
            }
        }

        const hasTAF = searchAerodrome.TAF.some(taf => taf.icaoId === icaoId)
        const hasMETAR = searchAerodrome.METAR.some(metar => metar.icaoId === icaoId)
        const hasNOTAM = searchAerodrome.NOTAM.some(notam => notam.location === icaoId)
        const hasSNOWTAM = searchAerodrome.SNOWTAM.some(snowtam => snowtam.location === icaoId)

        nextPollSNOWTAM = user && hasSNOWTAM
            ? nextPollSNOWTAM + POLL_INTERVAL_SNOWTAM
            : nextPollSNOWTAM

        const synced = user && hasSNOWTAM
            ? await captureSyncSNOWTAM(searchAerodrome.SNOWTAM, supabaseAerodrome?.id, icaoId, nextPollSNOWTAM)
            : []

        setAerodromes(current => [...current, {
            ...searchAerodrome,
            id: crypto.randomUUID(),
            icaoId: icaoId,
            formValues: { ...searchAerodrome.formValues, icaoId: icaoId },
            TAF: hasTAF ? [...searchAerodrome.TAF] : [],
            METAR: hasMETAR ? [...searchAerodrome.METAR] : [],
            NOTAM: hasNOTAM ? [...searchAerodrome.NOTAM] : [],
            SNOWTAM: hasSNOWTAM ? [...searchAerodrome.SNOWTAM] : [],
            nextPollReports: Date.now() + POLL_INTERVAL_TAF_METAR_NOTAM,
            nextPollSNOWTAM: nextPollSNOWTAM,
            messages: mergeErrors(...synced).join("\n"),
            isLoading: false,
            supabaseId: supabaseAerodrome?.id
        }])
    }

    const handleDeleteAerodrome = async (id: string) => {
        if (user) {
            setIsLoading(true)

            try {
                const aerodrome = aerodromes.find(aerodrome => aerodrome.id === id)
                const icaoId = aerodrome?.formValues.icaoId
                if (!icaoId) throw new Error(`Could not delete aerodrome with id: ${id}`)

                const { refreshedUser, accessToken } = await fetchRefreshedUserAccessToken()

                if (refreshedUser) {
                    setUser(refreshedUser)
                }

                await fetchDeleteAerodrome({
                    accessToken: accessToken,
                    icaoId: icaoId
                })
            } catch (e) {
                setErrors([...errors, e instanceof Error ? e.message : "There was an unexpected error while deleting aerodrome"])
            } finally {
                setIsLoading(false)
            }
        }

        setAerodromes(current => current.filter(aerodrome => aerodrome.id !== id))
    }

    const handleSignIn = async (values: UserFormValues) => {
        setIsLoading(true)

        try {
            const signInResult = await capture(() => fetchSignInUser({ ...values }))

            if (signInResult.error) {
                throw new Error(signInResult.error)
            }

            if (signInResult.data) {
                setUser(signInResult.data)

                const userData = await captureUserData(signInResult.data!.session.access_token)

                setAerodromes([...userData.aerodromes, createAerodrome(searchAerodromeId)])
                setHighlightsTAF([...userData.highlightsTaf])
                setHighlightsMETAR([...userData.highlightsMetar])
                setHighlightsNOTAM([...userData.highlightsNotam])
                setHighlightsOPERATIONAL_HOURS([...userData.highlightsOperationalHours])
                setQueryMetarPreviousHours(userData.queryMetarPreviousHours)
                setErrors([...errors, ...userData.errors])
                hasAerodromes.current = userData.aerodromes.length > 0

                if (!hasAerodromes.current) {
                    navigate(`/${ROUTES.search}`)
                } else {
                    navigate("/")
                }
            }
        } catch (e) {
            setErrors([...errors, e instanceof Error ? e.message : "There was an unexpected error while signing in"])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignOut = async () => {
        if (!user) return

        setIsLoading(true)

        try {
            const { accessToken } = await fetchRefreshedUserAccessToken()

            await fetchSignOutUser({
                accessToken: accessToken
            })
        } catch (e) {
            setErrors([...errors, e instanceof Error ? e.message : "There was an unexpected error while signing out"])
        } finally {
            setIsLoading(false)
            setUser(undefined)
            setAerodromes([createAerodrome(searchAerodromeId)])
            setHighlightsTAF([])
            setHighlightsMETAR([])
            setHighlightsNOTAM([])
            setHighlightsOPERATIONAL_HOURS([])
            setQueryMetarPreviousHours(defaultQueryMetarPreviousHours)
            upsertConfig.current = false
            upsertConfigQueued.current = false
            localStorage.removeItem(sessionStorageKey)
        }
    }

    const handleSignUp = async (values: UserFormValues) => {
        setIsLoading(true)

        try {
            const responseMessage = await fetchSignUpUser({ ...values });
            setMessages([...messages, responseMessage])
            navigate("/")
        } catch (e) {
            setErrors([...errors, e instanceof Error ? e.message : "There was an unexpected error while signing up"])
        } finally {
            setIsLoading(false)
        }
    }

    const handleDiscardMessage = (index: number) => {
        setMessages(current => current.filter((_, currentIndex) => currentIndex !== index))
    }

    const handleDiscardError = (index: number) => {
        setErrors(current => current.filter((_, currentIndex) => currentIndex !== index))
    }
    return (
        <FlightPathContext
            value={{
                aerodromes,
                highlightsTAF,
                highlightsMETAR,
                highlightsOPERATIONAL_HOURS,
                highlightsNOTAM,
                queryMetarPreviousHours,
                handleSubmit,
                handleSetFormValues,
                handleSetHighlights,
                handleSetQueryMetarPreviousHours,
                handleAddAerodrome,
                handleDeleteAerodrome,
                handleSignIn,
                handleSignOut,
                handleSignUp,
                handleDiscardMessage,
                handleDiscardError,
                isLoading,
                messages,
                errors,
                user
            }}>
            <main className="page">
                <AppHeader />
                <Outlet />
            </main>
        </FlightPathContext>
    )
}
