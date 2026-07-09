import { useForm } from "react-hook-form"
import { type CodeHighlight, type FlightPathFormValues } from "../types"
import HighlightsField from "./HighlightsField";
import type { Dispatch, SetStateAction } from "react";

type FlightPathFormProps = {
  departureHighlightsTAF: CodeHighlight[];
  destinationHighlightsTAF: CodeHighlight[];
  departureHighlightsMETAR: CodeHighlight[];
  destinationHighlightsMETAR: CodeHighlight[];
  setDepartureHighlightsTAF: Dispatch<SetStateAction<CodeHighlight[]>>;
  setDestinationHighlightsTAF: Dispatch<SetStateAction<CodeHighlight[]>>;
  setDepartureHighlightsMETAR: Dispatch<SetStateAction<CodeHighlight[]>>;
  setDestinationHighlightsMETAR: Dispatch<SetStateAction<CodeHighlight[]>>;
  onSubmit: (values: FlightPathFormValues) => void;
}

const FlightPathForm = (props: FlightPathFormProps) => {
  const { register, handleSubmit } = useForm<FlightPathFormValues>()

  return (
    <form className="flight-path-form" onSubmit={handleSubmit(props.onSubmit)}>
      <h4>Departure</h4>
      <div className="form-row">
        <input type="date" {...register("departureDate", { required: false })} />
        <input type="time" {...register("departureTime", { required: false })} />
        <input type="text" {...register("departureICAO", { required: true })} />
      </div>
      <div className="form-row">
        <HighlightsField
          title="TAF highlights"
          selections={props.departureHighlightsTAF}
          onSelected={(selections) => props.setDepartureHighlightsTAF(selections)}
        />
      </div>
      <div className="form-row">
        <HighlightsField
          title="METAR highlights"
          selections={props.departureHighlightsMETAR}
          onSelected={(selections) => props.setDepartureHighlightsMETAR(selections)}
        />
      </div>
      <h4>Destination</h4>
      <div className="form-row">
        <input type="date" {...register("destinationDate", { required: false })} />
        <input type="time" {...register("destinationTime", { required: false })} />
        <input type="text" {...register("destinationICAO", { required: true })} />
      </div>
      <div className="form-row">
        <HighlightsField
          title="TAF highlights"
          selections={props.destinationHighlightsTAF}
          onSelected={(selections) => props.setDestinationHighlightsTAF(selections)}
        />
      </div>
      <div className="form-row">
        <HighlightsField
          title="METAR highlights"
          selections={props.destinationHighlightsMETAR}
          onSelected={(selections) => props.setDestinationHighlightsMETAR(selections)}
        />
      </div>
      <div className="form-row">
        <button type="submit">Fetch</button>
      </div>
    </form>
  )
}

export default FlightPathForm
