import { FormProvider, useForm } from "react-hook-form";
import type { UserFormValues } from "../types";

type UserFormProps = {
    onSubmit: (values: UserFormValues) => void | Promise<void>;
    submitText: string;
}

const UserForm = (props: UserFormProps) => {
    const form = useForm<UserFormValues>()
    const { register, handleSubmit } = form;

    const handleFormSubmit = handleSubmit(async values => {
        await props.onSubmit(values)
    })

    return (
        <FormProvider {...form}>
            <form onSubmit={handleFormSubmit}>
                <div className="form">
                    <div className="form-row">
                        <label className="auth-field">
                            <span>Email address</span>
                            <input
                                placeholder="name@example.com"
                                type="email"
                                autoComplete="email"
                                {...register("email", { required: true })}
                            />
                        </label>
                    </div>
                    <div className="form-row">
                        <label className="auth-field">
                            <span>Password</span>
                            <input
                                placeholder="Enter your password"
                                type="password"
                                autoComplete={props.submitText === "Sign up" ? "new-password" : "current-password"}
                                {...register("password", { required: true })}
                            />
                        </label>
                    </div>
                    <div className="form-row">
                        <button type="submit">{props.submitText}</button>
                    </div>
                </div>
            </form>
        </FormProvider>
    )
}

export default UserForm;
