import { Navigate } from "react-router"
import UserForm from "../components/UserForm"
import { useFlightPathContext } from "../Context"
import type { UserFormValues } from "../types"
import Messages from "../components/Messages"

const SignUp = () => {
    const context = useFlightPathContext()

    if (context.user) {
        return <Navigate to="/" replace />
    }

    const handleSignUp = async (values: UserFormValues) => {
        await context.handleSignUp(values)
    }

    return (
        <>
            <Messages />
            <div className="sign-in-container">
                <div className="auth-card">
                    <span className="eyebrow">GET STARTED</span>
                    <h1>Create your account</h1>
                    <p>Keep your aerodromes and briefing preferences in one place.</p>
                    <UserForm
                        onSubmit={(values) => handleSignUp(values)}
                        submitText="Sign up" />
                </div>
            </div>
        </>
    )
}

export default SignUp
