import { useCallback, useEffect, useRef, useState } from "react";
import { HIGHLIGHTS_NOTAM, HIGHLIGHTS_OPERATIONAL_HOURS, HIGHLIGHTS_TAF_METAR, type AerodromeData, type AerodromeFormValues, type AppUser, type CodeHighlight, type CodeHighlightReport, type SupabaseAerodrome, type UserFormValues } from "./types";
import { FlightPathContext } from "./Context";
import { createAerodrome, refreshAerodromes, resolveHighlights, searchAerodromeId, capture, captureSyncSNOWTAM, consumeSupabaseConfirmationLink, sessionStorageKey, ROUTES, getReportError, mergeErrors } from "./utilities";
import { fetchSelectAllAerodromes, fetchSelectHighlights, fetchInitializeUser, fetchUpsertHighlights, fetchInsertAerodrome, fetchDeleteAerodrome, fetchSignInUser, fetchSignUpUser, fetchRefreshedUser, fetchSignOutUser } from "./api/supabase";
import { fetchTAF, fetchMETAR, fetchNOTAM, POLL_INTERVAL_TAF_METAR_NOTAM, POLL_INTERVAL_SNOWTAM, fetchSNOWTAM, } from "./api/resources";
import AppHeader from "./components/AppHeader";
import { Outlet, useLocation, useNavigate } from "react-router";

export const FlightPathProvider = () => {
    const [aerodromes, setAerodromes] = useState<AerodromeData[]>([createAerodrome(searchAerodromeId)])
    const [highlightsTAF, setHighlightsTAF] = useState<CodeHighlight[]>([])
    const [highlightsMETAR, setHighlightsMETAR] = useState<CodeHighlight[]>([])
    const [highlightsOPERATIONAL_HOURS, setHighlightsOPERATIONAL_HOURS] = useState<CodeHighlight[]>([])
    const [highlightsNOTAM, setHighlightsNOTAM] = useState<CodeHighlight[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [user, setUser] = useState<AppUser>()
    const [initialized, setInitialized] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const preventRestoreSession = useRef(false)
    const pathname = useRef(location.pathname)
    const hasAerodromes = useRef(aerodromes.length > 1)
    useEffect(() => {
        pathname.current = location.pathname
    }, [location.pathname])
    useEffect(() => {
        hasAerodromes.current = aerodromes.length > 1
    }, [aerodromes.length])

    const loadUserData = async (accessToken: string) => {
        const [
            aerodromes,
            highlightsTAF,
            highlightsMETAR,
            highlightsOPERATIONAL_HOURS,
            highlightsNOTAM] = await Promise.all([
                capture(() => fetchSelectAllAerodromes({ accessToken: accessToken })
                    .then(async (supabaseAerodromes) => await refreshAerodromes(supabaseAerodromes))),
                capture(() => fetchSelectHighlights({
                    accessToken: accessToken,
                    report: "TAF"
                })),
                capture(() => fetchSelectHighlights({
                    accessToken: accessToken,
                    report: "METAR"
                })),
                capture(() => fetchSelectHighlights({
                    accessToken: accessToken,
                    report: "OPERATIONAL HOURS"
                })),
                capture(() => fetchSelectHighlights({
                    accessToken: accessToken,
                    report: "NOTAM"
                }))
            ])

        if (aerodromes.data) {
            hasAerodromes.current = aerodromes.data.length > 0
        }

        aerodromes.data && setAerodromes([...aerodromes.data, createAerodrome(searchAerodromeId)])
        highlightsTAF.data && setHighlightsTAF(resolveHighlights(highlightsTAF.data, HIGHLIGHTS_TAF_METAR))
        highlightsMETAR.data && setHighlightsMETAR(resolveHighlights(highlightsMETAR.data, HIGHLIGHTS_TAF_METAR))
        highlightsOPERATIONAL_HOURS.data && setHighlightsOPERATIONAL_HOURS(resolveHighlights(highlightsOPERATIONAL_HOURS.data, HIGHLIGHTS_OPERATIONAL_HOURS))
        highlightsNOTAM.data && setHighlightsNOTAM(resolveHighlights(highlightsNOTAM.data, HIGHLIGHTS_NOTAM))

        const mergedError = mergeErrors(
            aerodromes.error,
            highlightsTAF.error,
            highlightsMETAR.error,
            highlightsOPERATIONAL_HOURS.error,
            highlightsNOTAM.error
        )

        if (mergedError.length > 0) {
            throw new Error(mergedError)
        }
    }

    useEffect(() => {
        if (initialized) return;

        const restoreSession = async () => {
            try {
                setIsLoading(true)

                const confirmedUser = await capture(() => consumeSupabaseConfirmationLink())

                if (confirmedUser.data) {
                    setMessage(`Welcome to FlyRep`)
                    setUser(confirmedUser.data)
                    await loadUserData(confirmedUser.data.session.access_token)
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
                        await loadUserData(user.data.session.access_token)
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
                capture(() => fetchMETAR(aerodrome.formValues)),
                capture(() => fetchNOTAM(aerodrome.formValues)),
                fetchFreshSNOWTAM
                    ? capture(() => fetchSNOWTAM(aerodrome.formValues))
                    : Promise.resolve({ data: undefined, error: undefined }),
            ])

            const nextPollReports = Date.now() + POLL_INTERVAL_TAF_METAR_NOTAM;
            const nextPollSNOWTAM = Date.now() + POLL_INTERVAL_SNOWTAM;

            const refreshedUser = user
                ? await capture(() => fetchRefreshedUser())
                : undefined

            const synced = ((refreshedUser && refreshedUser.data) || user) && SNOWTAM.data
                ? await captureSyncSNOWTAM(SNOWTAM.data, aerodrome.supabaseId, aerodrome.formValues.icaoId, nextPollSNOWTAM, aerodrome.id)
                : []

            if (refreshedUser && refreshedUser.data) {
                setUser(refreshedUser.data)
            }

            const mergedError = mergeErrors(
                refreshedUser?.error,
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
                        messages: mergedError,
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
        } catch (error) {
            setError(error instanceof Error ? error.message : `There was an unexpected error while fetch data for ${aerodrome.formValues.icaoId}`)
            setAerodromes(current => current.map((currentAerodrome) => (
                currentAerodrome.id === aerodrome.id
                    ? { ...currentAerodrome, isLoading: false }
                    : currentAerodrome
            )))
        } finally {
            setIsLoading(false)
        }
    }, [user, aerodromes])

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
        } catch (error) {
            setError(error instanceof Error ? error.message : "There was an unexpected error while polling")
        }
    }, [aerodromes, handleSubmit])

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
            setError(error instanceof Error ? error.message : "There was an unexpected error while updating highlights")
        } finally {
            setIsLoading(false)
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
            setError('')

            try {
                const refreshedUser = await fetchRefreshedUser()

                if (refreshedUser) {
                    setUser(refreshedUser)
                }

                const accessToken = refreshedUser
                    ? refreshedUser.session.access_token
                    : user.session.access_token

                supabaseAerodrome = await fetchInsertAerodrome({
                    accessToken: accessToken,
                    icaoId: icaoId,
                    nextPollSNOWTAM: nextPollSNOWTAM
                })
            } catch (error) {
                setError(error instanceof Error ? error.message : "There was an unexpected error while saving aerodrome")
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
            messages: mergeErrors(...synced),
            isLoading: false,
            supabaseId: supabaseAerodrome?.id
        }])
    }

    const handleDeleteAerodrome = async (id: string) => {
        if (user) {
            setIsLoading(true)
            setError('')

            try {
                const aerodrome = aerodromes.find(aerodrome => aerodrome.id === id)
                const icaoId = aerodrome?.formValues.icaoId
                if (!icaoId) throw new Error(`Could not delete aerodrome with id: ${id}`)

                const refreshedUser = await fetchRefreshedUser()

                if (refreshedUser) {
                    setUser(refreshedUser)
                }

                const accessToken = refreshedUser
                    ? refreshedUser.session.access_token
                    : user.session.access_token

                await fetchDeleteAerodrome({
                    accessToken: accessToken,
                    icaoId: icaoId
                })
            } catch (error) {
                setError(error instanceof Error ? error.message : "There was an unexpected error while deleting aerodrome")
            } finally {
                setIsLoading(false)
            }
        }

        setAerodromes(current => current.filter(aerodrome => aerodrome.id !== id))
    }

    const handleSignIn = async (values: UserFormValues) => {
        setIsLoading(true)
        setError('')

        try {
            const user = await capture(() => fetchSignInUser({ ...values }))

            if (user.error) {
                throw new Error(user.error)
            }

            if (user.data) {
                setUser(user.data)

                const loaded = await capture(() => loadUserData(user.data!.session.access_token))

                if (loaded.error) {
                    setError(loaded.error)
                }

                if (!hasAerodromes.current) {
                    navigate(`/${ROUTES.search}`)
                } else {
                    navigate("/")
                }
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "There was an unexpected error while signing in")
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
            setError(error instanceof Error ? error.message : "There was an unexpected error while signing out")
        } finally {
            setIsLoading(false)
            setMessage("")
            setUser(undefined)
            setAerodromes([createAerodrome(searchAerodromeId)])
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
            setError(error instanceof Error ? error.message : "There was an unexpected error while signing up")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <FlightPathContext
            value={{
                aerodromes,
                highlightsTAF,
                highlightsMETAR,
                highlightsOPERATIONAL_HOURS,
                highlightsNOTAM,
                handleSubmit,
                handleSetFormValues,
                handleSetHighlights,
                handleAddAerodrome,
                handleDeleteAerodrome,
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
