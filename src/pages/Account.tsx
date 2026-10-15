import { Navigate, useSearchParams } from "react-router"
import UserForm from "../components/UserForm"
import { useFlightPathContext } from "../Context"
import type { UserFormValues } from "../types"
import Messages from "../components/Messages"
import LoadingSpinner from "../components/LoadingSpinner"

const Account = () => {
    const context = useFlightPathContext()
    const [searchParams, setSearchParams] = useSearchParams()
    const isSignUp = searchParams.get("mode") === "sign-up"

    if (context.user) {
        return <Navigate to="/" replace />
    }

    const setMode = (mode: "sign-in" | "sign-up") => {
        setSearchParams(mode === "sign-up" ? { mode: "sign-up" } : {}, { replace: true })
    }

    const handleSubmit = async (values: UserFormValues) => {
        if (isSignUp) {
            await context.handleSignUp(values)
        } else {
            await context.handleSignIn(values)
        }
    }

    return (
        <>
            <Messages />
            <div className="sign-in-container">
                <div className="auth-card">
                    <div className="auth-mode-switch" role="group" aria-label="Account access">
                        <button
                            type="button"
                            className="control-button"
                            aria-pressed={!isSignUp}
                            onClick={() => setMode("sign-in")}>Sign in</button>
                        <button
                            type="button"
                            className="control-button"
                            aria-pressed={isSignUp}
                            onClick={() => setMode("sign-up")}>Create account</button>
                    </div>
                    <span className="eyebrow">{isSignUp ? "GET STARTED" : "WELCOME BACK"}</span>
                    <h1>{isSignUp ? "Create your account" : "Sign in to FlyRep"}</h1>
                    <p>{isSignUp
                        ? "Keep your aerodromes and briefing preferences in one place."
                        : "Pick up where your last briefing left off."}</p>
                    <UserForm
                        key={isSignUp ? "sign-up" : "sign-in"}
                        onSubmit={handleSubmit}
                        submitText={isSignUp ? "Sign up" : "Sign in"} />
                    <LoadingSpinner />
                </div>
            </div>
        </>
    )
}

export default Account
