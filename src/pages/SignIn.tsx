import { useNavigate } from "react-router"
import UserForm from "../components/UserForm"
import { useFlightPathContext } from "../Context"
import type { UserFormValues } from "../types"

const SignIn = () => {
    const context = useFlightPathContext()
    const navigate = useNavigate()

    const handleSignIn = async (values: UserFormValues) => {
        await context.handleSignIn(values)
        navigate("/all")
    }
    
    return (
        <div className="sign-in-container">
            <UserForm
                onSubmit={(values) => handleSignIn(values)}
                submitText="Sign in" />
        </div>
    )
}

export default SignIn