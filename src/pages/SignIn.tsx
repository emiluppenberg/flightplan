import { Navigate } from "react-router"
import UserForm from "../components/UserForm"
import { useFlightPathContext } from "../Context"
import type { UserFormValues } from "../types"
import Messages from "../components/Messages"

const SignIn = () => {
    const context = useFlightPathContext()

    if (context.user) {
        return <Navigate to="/" replace />
    }

    const handleSignIn = async (values: UserFormValues) => {
        await context.handleSignIn(values)
    }

    return (
        <>
            <Messages />
            <div className="sign-in-container">
                <UserForm
                    onSubmit={(values) => handleSignIn(values)}
                    submitText="Sign in" />
            </div>
        </>
    )
}

export default SignIn