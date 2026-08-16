import { useCallback, useEffect, useState, type PropsWithChildren } from "react";
import type {
    AirportData,
    AirportFormValues,
    AppUser,
    CodeHighlight,
    UserFormValues,
} from "./types";
import { FlightPathContext } from "./Context";
import { createAirport, refreshAirports, resolveHighlights, POLL_INTERVAL, fetchReports, searchAirportId } from "./utilities";
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
        const airportIcaoIds = await selectAllAirports()
        const airports = await refreshAirports(airportIcaoIds)
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
        values: AirportFormValues,
        id: string,
        fetchNotam: boolean = true
    ) => {
        if (values.icaoId.length === 0) return;

        setAirports(current => current.map((airport) => (
            airport.id === id
                ? { ...airport, isLoading: true }
                : airport
        )))

        const [TAF, METAR, NOTAM, messages] = await fetchReports(values, fetchNotam)
        const nextPoll = Date.now() + POLL_INTERVAL;

        setAirports(current => current.map(airport => {
            if (airport.id === id) {
                const matchTAF = airport.TAF.some(taf => taf.icaoId === values.icaoId)
                const matchMETAR = airport.METAR.some(metar => metar.icaoId === values.icaoId)
                const matchNOTAM = airport.NOTAM.some(notam => notam.location === values.icaoId)

                return {
                    ...airport,
                    icaoId: values.icaoId,
                    TAF: TAF ?? (matchTAF ? airport.TAF : []),
                    METAR: METAR ?? (matchMETAR ? airport.METAR : []),
                    NOTAM: fetchNotam
                        ? NOTAM ?? (matchNOTAM ? airport.NOTAM : [])
                        : (matchNOTAM ? airport.NOTAM : []),
                    messages: messages,
                    nextPoll: nextPoll,
                    isLoading: false
                }
            } else {
                return airport
            }
        }))
    }, [])

    const handlePolling = useCallback(async () => {
        const now = Date.now()

        for (const airport of airports) {
            if (airport.formValues.icaoId.trim().length > 0 &&
                !airport.isLoading &&
                airport.nextPoll <= now) {
                handleSubmit(airport.formValues, airport.id, false)
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
                await insertAirport(icaoId)
            } catch (error) {
                setMessage(error instanceof Error ? error.message : "")
            } finally {
                setIsLoading(false)
            }
        }

        const searchAirport = airports.find(airport => airport.id === searchAirportId) ?? createAirport(crypto.randomUUID())
        const hasTAF = searchAirport.TAF.some(taf => taf.icaoId === icaoId)
        const hasMETAR = searchAirport.METAR.some(metar => metar.icaoId === icaoId)
        const hasNOTAM = searchAirport.NOTAM.some(notam => notam.location === icaoId)

        setAirports(current => [...current, {
            ...searchAirport,
            id: crypto.randomUUID(),
            formValues: { ...searchAirport.formValues },
            TAF: hasTAF ? [...searchAirport.TAF] : [],
            METAR: hasMETAR ? [...searchAirport.METAR] : [],
            NOTAM: hasNOTAM ? [...searchAirport.NOTAM] : [],
            nextPoll: Date.now() + POLL_INTERVAL,
            isLoading: false
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
