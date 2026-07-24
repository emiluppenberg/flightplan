import { FormProvider, useForm } from "react-hook-form";
import type { UserFormValues } from "../types";

type UserFormProps = {
    onClose: () => void;
    onSubmit: (values: UserFormValues) => void;
    submitText: string;
}

const UserForm = (props: UserFormProps) => {
    const form = useForm<UserFormValues>()
    const { register, handleSubmit } = form;

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit(props.onSubmit)}>
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
                        <button type="submit">{props.submitText}</button>
                        <button type="button" onClick={props.onClose}>Cancel</button>
                    </div>
                </div>
            </form>
        </FormProvider>
    )
}

export default UserForm;