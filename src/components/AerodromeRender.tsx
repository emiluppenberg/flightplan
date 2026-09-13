import type { AerodromeData } from "../types";
import ReportRender from "./ReportRender";
import { useFlightPathContext } from "../Context";
import { useMemo, useState } from "react";
import AerodromeDatetimeForm from "./AerodromeDatetimeForm";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import type { AerodromeFormValues } from "../types";
import AerodromeHeaderButtons from "./AerodromeHeaderButtons";
import { formatRawCodes, getOperationalHours, sortNOTAM } from "../utilities";
import Expand from "./Expand";
import NotamRender from "./NotamRender";

type AerodromeRenderProps = {
    aerodrome: AerodromeData;
    form?: UseFormReturn<AerodromeFormValues>;
}

const AerodromeRender = (props: AerodromeRenderProps) => {
    const context = useFlightPathContext()
    const [tafMetarOpen, setTafMetarOpen] = useState(false)
    const [notamsOpen, setNotamsOpen] = useState(false)
    const [dateOpen, setDateOpen] = useState(false)
    const [operationalHoursOpen, setOperationalHoursOpen] = useState(false)
    const initialForm = useForm<AerodromeFormValues>({
        defaultValues: props.aerodrome.formValues
    })
    const form = props.form ?? initialForm

    const highlightsNOTAM = useMemo(() =>
        [...context.highlightsOPERATIONAL_HOURS, ...context.highlightsNOTAM],
        [context.highlightsOPERATIONAL_HOURS, context.highlightsNOTAM])

    const sortedNOTAM = useMemo(() =>
        sortNOTAM([...props.aerodrome.NOTAM, ...props.aerodrome.SNOWTAM], highlightsNOTAM),
        [props.aerodrome.NOTAM, props.aerodrome.SNOWTAM, highlightsNOTAM])

    const reportsMETAR = [
        ...props.aerodrome.METAR.map((metar, index) => (
            <ReportRender
                key={`${props.aerodrome.id}-metar-${index}`}
                icaoId={props.aerodrome.formValues.icaoId}
                report="METAR"
                codes={formatRawCodes(metar.rawOb)}
                highlights={context.highlightsMETAR}
                isMostRecentMETAR={index === 0} />
        )),
    ]
    const reportsTAF = [
        ...props.aerodrome.TAF.map((taf, index) => (
            <ReportRender
                key={`${props.aerodrome.id}-taf-${index}`}
                icaoId={props.aerodrome.formValues.icaoId}
                report="TAF"
                codes={formatRawCodes(taf.rawTAF)}
                highlights={context.highlightsTAF} />
        ))
    ]
    const reportsNOTAM = [
        ...sortedNOTAM.map((notam, index) => (
            <NotamRender
                key={`${props.aerodrome.id}-notam-${index}`}
                notam={notam} />
        ))
    ]

    const date = form.watch("date")
    const time = form.watch("time")
    const targetDate = date && time
        ? new Date(`${date}T${time}Z`).getTime()
        : Date.now()

    const aerodromeOpeningHours = getOperationalHours(props.aerodrome.NOTAM, targetDate, context.highlightsOPERATIONAL_HOURS)

    const tafMetarDisabled = props.aerodrome.METAR.length === 0 && props.aerodrome.TAF.length === 0
    const notamsDisabled = props.aerodrome.NOTAM.length + props.aerodrome.SNOWTAM.length === 0
    const dateDisabled = props.aerodrome.icaoId === null
    const operationalHoursDisabled = props.aerodrome.icaoId === null

    return (
        <FormProvider {...form}>
            <div className="aerodrome-render-container">
                <div className="aerodrome-header-container">
                    <AerodromeHeaderButtons
                        aerodrome={props.aerodrome}
                        tafMetarOpen={tafMetarOpen}
                        notamsOpen={notamsOpen}
                        dateOpen={dateOpen}
                        operationalHoursOpen={operationalHoursOpen}
                        tafMetarDisabled={tafMetarDisabled}
                        notamsDisabled={notamsDisabled}
                        dateDisabled={dateDisabled}
                        operationalHoursDisabled={operationalHoursDisabled}
                        setTafMetarOpen={setTafMetarOpen}
                        setNotamsOpen={setNotamsOpen}
                        setDateOpen={setDateOpen}
                        setOperationalHoursOpen={setOperationalHoursOpen}
                    />
                    <Expand
                        isOpen={dateOpen}
                        rows={1}>
                        <AerodromeDatetimeForm id={props.aerodrome.id} />
                    </Expand>
                    <Expand
                        isOpen={operationalHoursOpen}
                        rows={1}>
                        <div className="aerodrome-operational-hours">
                            {aerodromeOpeningHours.map((openingHours, index) => (
                                <p
                                    key={`${props.aerodrome.id}-operational-hours-${index}`}
                                    className="message operational-hours">{openingHours}</p>
                            ))}
                        </div>
                    </Expand>
                </div>
                <div className="aerodrome-data-container">
                    {props.aerodrome.messages.length > 0 && (
                        <p className="message warning">{props.aerodrome.messages}</p>
                    )}
                    <Expand
                        isOpen={notamsOpen}
                        rows={1}>
                        <div>
                            {reportsNOTAM}
                        </div>
                    </Expand>
                    {reportsMETAR[0]}
                    {!tafMetarOpen && reportsTAF[0]}
                    <Expand
                        isOpen={tafMetarOpen}
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

export default AerodromeRender;
