import { useForm } from "react-hook-form"
import { type CodeHighlight, type AirportFormValues, type AirportData } from "../types"
import HighlightsField from "./HighlightsField";

type AirportFormProps = {
  airport: AirportData;
  onSetFormValues: (values: AirportFormValues) => void;
  onSetHighlightsTAF: (newHighlights: CodeHighlight[]) => void;
  onSetHighlightsMETAR: (newHighlights: CodeHighlight[]) => void;
  onDelete: () => void;
  onSubmit: (values: AirportFormValues) => void;
}

const AirportForm = (props: AirportFormProps) => {
  const { register, handleSubmit, getValues } = useForm<AirportFormValues>()

  const handleDelete = () => {
    const icaoId = props.airport.formValues.icaoId.trim()
    const airportLabel = icaoId ? `airport ${icaoId}` : "this airport"

    if (window.confirm(`Delete ${airportLabel}?`)) {
      props.onDelete()
    }
  }

  return (
    <form className="airport-form" onSubmit={handleSubmit(props.onSubmit)}>
      <div className="airport-form-row">
        <input
          type="date"
          defaultValue={props.airport.formValues.date}
          {...register("date", {
            required: false,
            onChange: () => props.onSetFormValues(getValues())
          })} />
        <input
          type="time"
          defaultValue={props.airport.formValues.time}
          {...register("time", {
            required: false,
            onChange: () => props.onSetFormValues(getValues())
          })} />
        <input
          type="text"
          defaultValue={props.airport.formValues.icaoId}
          {...register("icaoId", {
            required: true,
            setValueAs: (value: string) => value.toUpperCase(),
            onChange: () => props.onSetFormValues(getValues())
          })} />
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
        <button className="btn-danger" type="button" onClick={handleDelete}>Delete</button>
        <button className="btn-success" type="submit">Fetch</button>
      </div>
    </form>
  )
}

export default AirportForm
