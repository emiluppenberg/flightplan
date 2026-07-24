import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import type { SignUpFormValues } from "../types";
import { signUpUser } from "../supabase";

type SignUpFormProps = {
    onClose: () => void;
}

const SignUpForm = (props: SignUpFormProps) => {
    const form = useForm<SignUpFormValues>()
    const { register, handleSubmit } = form;

    const handleSignUp: SubmitHandler<SignUpFormValues> = async (values) => {
        const authResponse = await signUpUser(values);

        console.log(authResponse.data)
        console.log(authResponse.error)
    }

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit(handleSignUp)}>
                <div className="form">
                    <div className="form-row">
                        <input
                            placeholder="Enter email"
                            type="email"
                            {...register("email", {
                                required: true
                            })}
                        />
                    </div>
                    <div className="form-row">
                        <input
                            placeholder="Enter password"
                            type="password"
                            {...register("password", {
                                required: true
                            })}
                        />
                    </div>
                    <div className="form-row">
                        <button type="submit">Submit</button>
                        <button type="button" onClick={props.onClose}>Cancel</button>
                    </div>
                </div>
            </form>
        </FormProvider>
    )
}

export default SignUpForm;