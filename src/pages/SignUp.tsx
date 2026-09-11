import { useNavigate } from "react-router"
import UserForm from "../components/UserForm"
import { useFlightPathContext } from "../Context"
import type { UserFormValues } from "../types"

const SignUp = () => {
    const context = useFlightPathContext()
    const navigate = useNavigate()

    const handleSignUp = async (values: UserFormValues) => {
        await context.handleSignUp(values)
        navigate(`/`)
    }

    return (
        <>
            {context.message.length > 0 && (<p className="message">{context.message}</p>)}
            {context.error.length > 0 && (<p className="message warning">{context.error}</p>)}
            <div className="sign-in-container">
                <UserForm
                    onSubmit={(values) => handleSignUp(values)}
                    submitText="Sign up" />
            </div>
        </>
    )
}

export default SignUp