import { useNavigate } from "react-router"
import UserForm from "../components/UserForm"
import { useFlightPathContext } from "../Context"
import type { UserFormValues } from "../types"

const SignUp = () => {
    const context = useFlightPathContext()
    const navigate = useNavigate()

    const handleSignUp = async (values: UserFormValues) => {
        await context.handleSignUp(values)
        navigate("/all")
    }
    
    return (
        <div className="sign-in-container">
            <UserForm
                onSubmit={(values) => handleSignUp(values)}
                submitText="Sign up" />
        </div>
    )
}

export default SignUp