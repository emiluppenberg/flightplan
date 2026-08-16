import { useFormContext, useWatch } from "react-hook-form";
import type { AirportFormValues } from "../types";
import { useFlightPathContext } from "../Context";

type AirportNotamFormProps = {
    id: string;
}

const AirportNotamForm = (props: AirportNotamFormProps) => {
    const { register, getValues, control } = useFormContext<AirportFormValues>();
    const context = useFlightPathContext()
    const useDatetime = useWatch({
        control,
        name: "useDatetime"
    })

    return (
        <div className="form">
            <div className="form-row">
                <div className={`form-datetime ${useDatetime ? "" : "disabled"}`}>
                    <input
                        type="date"
                        disabled={!useDatetime}
                        {...register("date", {
                            required: false,
                            onChange: () => context.handleSetFormValues(getValues(), props.id)
                        })} />
                    <input
                        type="time"
                        disabled={!useDatetime}
                        {...register("time", {
                            required: false,
                            onChange: () => context.handleSetFormValues(getValues(), props.id)
                        })} />
                    <input
                        type="checkbox"
                        {...register("useDatetime", {
                            onChange: () => context.handleSetFormValues(getValues(), props.id)
                        })} />
                </div>
            </div>
        </div>
    )
}

export default AirportNotamForm;