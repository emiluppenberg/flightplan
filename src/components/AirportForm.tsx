import { useForm } from "react-hook-form"
import { type CodeHighlight, type AirportFormValues, type AirportData } from "../types"
import HighlightsField from "./HighlightsField";

type AirportFormProps = {
  airport: AirportData;
  onSetHighlightsTAF: (newHighlights: CodeHighlight[]) => void;
  onSetHighlightsMETAR: (newHighlights: CodeHighlight[]) => void;
  onSubmit: (values: AirportFormValues) => void;
}

const AirportForm = (props: AirportFormProps) => {
  const { register, handleSubmit } = useForm<AirportFormValues>()

  return (
    <form className="airport-form" onSubmit={handleSubmit(props.onSubmit)}>
      <div className="airport-form-row">
        <input type="date" defaultValue={props.airport.formValues.date} {...register("date", { required: false })} />
        <input type="time" defaultValue={props.airport.formValues.time} {...register("time", { required: false })} />
        <input type="text" defaultValue={props.airport.formValues.icaoId} {...register("icaoId", { required: true })} />
      </div>
      <div className="airport-form-row highlights-row">
        <HighlightsField
          title="TAF highlights"
          selections={props.airport.highlightsTAF}
          onSelected={(selections) => props.onSetHighlightsTAF(selections)}
        />
        <HighlightsField
          title="METAR highlights"
          selections={props.airport.highlightsMETAR}
          onSelected={(selections) => props.onSetHighlightsMETAR(selections)}
        />
      </div>
      <div className="airport-form-row">
        <button type="submit">Fetch</button>
      </div>
    </form>
  )
}

export default AirportForm
