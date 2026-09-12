import { useFormContext } from "react-hook-form";
import type { AerodromeFormValues } from "../types";
import { useFlightPathContext } from "../Context";

type AerodromeDatetimeFormProps = {
    id: string;
}

const AerodromeDatetimeForm = (props: AerodromeDatetimeFormProps) => {
    const { register, getValues, setValue } = useFormContext<AerodromeFormValues>();
    const context = useFlightPathContext()

    const clearDatetime = () => {
        setValue("date", undefined)
        setValue("time", undefined)
        context.handleSetFormValues(getValues(), props.id)
    }

    return (
        <div className="form">
            <div className="form-row">
                <div className="form-datetime">
                    <input
                        type="date"
                        {...register("date", {
                            required: false,
                            onChange: () => context.handleSetFormValues(getValues(), props.id)
                        })} />
                    <input
                        type="time"
                        {...register("time", {
                            required: false,
                            onChange: () => context.handleSetFormValues(getValues(), props.id)
                        })} />
                    <button
                        type="button"
                        className="btn-clear"
                        onClick={clearDatetime}>
                        Clear
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AerodromeDatetimeForm;
