import { useForm } from "react-hook-form"
import type { FlightPathFormValues } from "../types"

type FlightPathFormProps = {
  onSubmit: (values: FlightPathFormValues) => void;
}

const FlightPathForm = ({ onSubmit }: FlightPathFormProps) => {
  const { register, handleSubmit } = useForm<FlightPathFormValues>()

  return (
    <form className="flight-path" onSubmit={handleSubmit(onSubmit)}>
      <label>Departure</label>
      <div className="form-row">
        <input type="date" {...register("departureDate", { required: true })} />
        <input type="time" {...register("departureTime", { required: false })} />
        <input type="text" {...register("departureICAO", { required: true })} />
      </div>
      <label>Destination</label>
      <div className="form-row">
        <input type="date" {...register("destinationDate", { required: true })} />
        <input type="time" {...register("destinationTime", { required: false })} />
        <input type="text" {...register("destinationICAO", { required: true })} />
      </div>
      <button type="submit">Fetch</button>
    </form>
  )
}

export default FlightPathForm
