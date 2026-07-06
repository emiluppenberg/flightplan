import { useForm } from "react-hook-form"
import { FlightPathFormValues } from "../types"

type FlightPathFormProps = {
  onSubmit: (values: FlightPathFormValues) => void;
}

const FlightPathForm = ({ onSubmit }: FlightPathFormProps) => {
  const { register, handleSubmit } = useForm<FlightPathFormValues>()

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>
        Departure date
        <input type="date" {...register("departureDate", { required: true })} />
      </label>
      <label>
        Departure time
        <input type="time" {...register("departureTime", { required: false })} />
      </label>
      <label>
        Departure ICAO
        <input type="text" {...register("departureICAO", { required: true })} />
      </label>
      <label>
        Destination date
        <input type="date" {...register("destinationDate", { required: true })} />
      </label>
      <label>
        Destination time
        <input type="time" {...register("destinationTime", { required: false })} />
      </label>
      <label>
        Destination ICAO
        <input type="text" {...register("destinationICAO", { required: true })} />
      </label>
      <button type="submit">Fetch</button>
    </form>
  )
}

export default FlightPathForm
