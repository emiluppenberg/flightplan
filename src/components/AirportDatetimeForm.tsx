import { useFormContext, useWatch } from "react-hook-form";
import type { AirportFormValues } from "../types";
import { useFlightPathContext } from "../Context";

type AirportDatetimeFormProps = {
    airportIndex: number;
}

const AirportDatetimeForm = (props: AirportDatetimeFormProps) => {
    const { register, getValues, control } = useFormContext<AirportFormValues>();
    const context = useFlightPathContext()
    const useDatetime = useWatch({
        control,
        name: "useDatetime"
    })

    const saveFormValues = () => {
        context.handleSetFormValues(getValues(), props.airportIndex)
    }

    return (
        <div className="form">
            <div className="form-row">
                <div className={`form-datetime ${useDatetime ? "" : "disabled"}`}>
                    <input
                        type="date"
                        disabled={!useDatetime}
                        {...register("date", {
                            required: false,
                            onChange: saveFormValues
                        })} />
                    <input
                        type="time"
                        disabled={!useDatetime}
                        {...register("time", {
                            required: false,
                            onChange: saveFormValues
                        })} />
                        <input
                            type="checkbox"
                            {...register("useDatetime", {
                                onChange: saveFormValues
                            })} />
                </div>
            </div>
        </div>
    )
}

export default AirportDatetimeForm;
