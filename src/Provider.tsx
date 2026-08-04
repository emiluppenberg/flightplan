import { useEffect, useState, type PropsWithChildren } from "react";
import type {
    AirportData,
    AirportFormValues,
    AppUser,
    CodeHighlight,
    UserFormValues,
} from "./types";
import { FlightPathContext } from "./Context";
import { fetchTAF, fetchMETAR, createAirport, searchAirportIndex, refreshAirports, resolveHighlights } from "./utilities";
import { deleteAirport, initializeAppUser, insertAirport, selectAllAirports, selectHighlightsMETAR, selectHighlightsTAF, signInUser, signOutUser, signUpUser, upsertHighlightsMETAR, upsertHighlightsTAF } from "./supabase";

export const FlightPathProvider = ({ children }: PropsWithChildren) => {
    const [airports, setAirports] = useState<AirportData[]>([])
    const [searchAirport, setSearchAirport] = useState<AirportData>(createAirport())
    const [highlightsTAF, setHighlightsTAF] = useState<CodeHighlight[]>([])
    const [highlightsMETAR, setHighlightsMETAR] = useState<CodeHighlight[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [user, setUser] = useState<AppUser>()
    const [initialized, setInitialized] = useState(false);

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

    const loadUserData = async () => {
        const airportIcaoIds = await selectAllAirports()
        const airports = await refreshAirports(airportIcaoIds)
        setAirports(airports)

        const highlightsTAF = await selectHighlightsTAF()
        setHighlightsTAF(resolveHighlights(highlightsTAF))

        const highlightsMETAR = await selectHighlightsMETAR()
        setHighlightsMETAR(resolveHighlights(highlightsMETAR))
    }

    const handleSubmit = async (values: AirportFormValues, airportIndex: number) => {
        setIsLoading(true)
        setMessage('')

        try {
            const [TAF, TAFMessage] = await fetchTAF(values)
            const [METAR, METARMessage] = await fetchMETAR(values)

            METAR.sort((a, b) => Date.parse(b.receiptTime) - Date.parse(a.receiptTime))

            if (airportIndex === searchAirportIndex) {
                setSearchAirport(current => ({ ...current, formValues: values, icaoId: values.icaoId, TAF, METAR, messages: TAFMessage + METARMessage }))
            } else {
                setAirports(current => current.map((airport, index) =>
                    index === airportIndex
                        ? { ...airport, icaoId: values.icaoId, formValues: values, TAF, METAR, messages: TAFMessage + METARMessage }
                        : airport))
            }

        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'There was an unexpected error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSetFormValues = (values: AirportFormValues, airportIndex: number) => {
        if (airportIndex === searchAirportIndex) {
            setSearchAirport({ ...searchAirport, icaoId: values.icaoId, formValues: values })
            return;
        }

        setAirports(current => current.map((airport, index) => {
            if (index !== airportIndex) return airport;

            return {
                ...airport,
                formValues: values
            }
        }))
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

    const handleAddAirport = async () => {
        const isDuplicate = airports.some(airport => airport.icaoId === searchAirport.icaoId);

        if (isDuplicate) {
            window.alert(`You have already saved ${searchAirport.icaoId}`)
            return;
        }

        if (user) {
            setIsLoading(true)
            setMessage('')

            try {
                await insertAirport(searchAirport.icaoId)
            } catch (error) {
                setMessage(error instanceof Error ? error.message : "")
            } finally {
                setIsLoading(false)
            }
        }

        setAirports(current => [...current, {
            ...searchAirport,
            formValues: { ...searchAirport.formValues },
            METAR: [...searchAirport.METAR],
            TAF: [...searchAirport.TAF]
        }])
    }

    const handleDeleteAirport = async (airportIndex: number) => {
        if (user) {
            setIsLoading(true)
            setMessage('')

            try {
                await deleteAirport(airports[airportIndex].icaoId)
            } catch (error) {
                setMessage(error instanceof Error ? error.message : "")
            } finally {
                setIsLoading(false)
            }
        }

        setAirports(current => current.filter((_, index) => index !== airportIndex))
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
            setAirports([])
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
                searchAirport,
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
