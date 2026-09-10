import type { AirportData } from "../types";
import ReportRender from "./ReportRender";
import { useFlightPathContext } from "../Context";
import { useMemo, useState } from "react";
import AirportDatetimeForm from "./AirportDatetimeForm";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import type { AirportFormValues } from "../types";
import AirportHeaderButtons from "./AirportHeaderButtons";
import { formatRawCodes, getOperationalHours, sortNOTAM } from "../utilities";
import Expand from "./Expand";
import NotamRender from "./NotamRender";

type AirportRenderProps = {
    airport: AirportData;
    form?: UseFormReturn<AirportFormValues>;
}

const AirportRender = (props: AirportRenderProps) => {
    const context = useFlightPathContext()
    const [reportsOpen, setReportsOpen] = useState(false)
    const [notamsOpen, setNotamsOpen] = useState(false)
    const [dateOpen, setDateOpen] = useState(false)
    const [operationalHoursOpen, setOperationalHoursOpen] = useState(false)
    const initialForm = useForm<AirportFormValues>({
        defaultValues: props.airport.formValues
    })
    const form = props.form ?? initialForm

    const highlightsNOTAM = useMemo(() =>
        [...context.highlightsOPERATIONAL_HOURS, ...context.highlightsNOTAM],
        [context.highlightsOPERATIONAL_HOURS, context.highlightsNOTAM])

    const sortedNOTAM = useMemo(() =>
        sortNOTAM([...props.airport.NOTAM, ...props.airport.SNOWTAM], highlightsNOTAM),
        [props.airport.NOTAM, highlightsNOTAM])

    const reportsMETAR = [
        ...props.airport.METAR.map((metar, index) => (
            <ReportRender
                key={`${props.airport.id}-metar-${index}`}
                icaoId={props.airport.formValues.icaoId}
                report="METAR"
                codes={formatRawCodes(metar.rawOb)}
                highlights={context.highlightsMETAR}
                isMostRecentMETAR={index === 0} />
        )),
    ];
    const reportsTAF = [
        ...props.airport.TAF.map((taf, index) => (
            <ReportRender
                key={`${props.airport.id}-taf-${index}`}
                icaoId={props.airport.formValues.icaoId}
                report="TAF"
                codes={formatRawCodes(taf.rawTAF)}
                highlights={context.highlightsTAF} />
        ))
    ]
    const reportsNOTAM = [
        sortedNOTAM.map((notam, index) => (
            <NotamRender
                key={`${props.airport.id}-notam-${index}`}
                notam={notam} />
        ))
    ]

    const date = form.watch("date")
    const time = form.watch("time")
    const targetDate = date && time
        ? new Date(`${date}T${time}Z`).getTime()
        : Date.now()

    const airportOpeningHours = getOperationalHours(props.airport.NOTAM, targetDate, context.highlightsOPERATIONAL_HOURS)

    return (
        <FormProvider {...form}>
            <div className="airport-render-container">
                <div className="airport-header-container">
                    <AirportHeaderButtons
                        airport={props.airport}
                        reportsOpen={reportsOpen}
                        notamsOpen={notamsOpen}
                        dateOpen={dateOpen}
                        operationalHoursOpen={operationalHoursOpen}
                        setReportsOpen={setReportsOpen}
                        setNotamsOpen={setNotamsOpen}
                        setDateOpen={setDateOpen}
                        setOperationalHoursOpen={setOperationalHoursOpen}
                    />
                    <Expand
                        isOpen={dateOpen}
                        rows={1}>
                        <AirportDatetimeForm id={props.airport.id} />
                    </Expand>
                    <Expand
                        isOpen={operationalHoursOpen}
                        rows={1}>
                        <div className="airport-operational-hours">
                            {airportOpeningHours.map((openingHours, index) => (
                                <p
                                    key={`${props.airport.id}-operational-hours-${index}`}
                                    className="message operational-hours">{openingHours}</p>
                            ))}
                        </div>
                    </Expand>
                </div>
                <div className="airport-data-container">
                    {props.airport.messages.length > 0 && (
                        <p className="message warning">{props.airport.messages}</p>
                    )}
                    <Expand
                        isOpen={notamsOpen}
                        rows={1}>
                        <div>
                            {reportsNOTAM}
                        </div>
                    </Expand>
                    {reportsMETAR[0]}
                    {!reportsOpen && reportsTAF[0]}
                    <Expand
                        isOpen={reportsOpen}
                        rows={1}>
                        <div>
                            {reportsMETAR.slice(1)}
                            {reportsTAF}
                        </div>
                    </Expand>
                </div>
            </div>
        </FormProvider>
    )
}

export default AirportRender;
