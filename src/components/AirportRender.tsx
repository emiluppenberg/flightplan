import type { AirportData } from "../types";
import ReportRender from "./ReportRender";
import { useFlightPathContext } from "../Context";
import { useState } from "react";
import AirportDatetimeForm from "./AirportDatetimeForm";
import { FormProvider, useForm } from "react-hook-form";
import type { AirportFormValues } from "../types";
import AirportHeaderButtons from "./AirportHeaderButtons";
import { formatRawCodes, getOpeningHours } from "../utilities";
import Expand from "./Expand";
import NotamRender from "./NotamRender";

type AirportRenderProps = {
    airport: AirportData;
    airportIndex: number;
}

const AirportRender = (props: AirportRenderProps) => {
    const context = useFlightPathContext()
    const [reportsOpen, setReportsOpen] = useState(false)
    const [notamsOpen, setNotamsOpen] = useState(false)
    const form = useForm<AirportFormValues>({
        defaultValues: props.airport.formValues
    })

    const metarReports = [
        ...props.airport.METAR.map((metar, index) => (
            <ReportRender
                key={`airport-${props.airportIndex}-metar-${index}`}
                airportIndex={props.airportIndex}
                report="METAR"
                codes={formatRawCodes(metar.rawOb)}
                highlights={context.highlightsMETAR}
                isMostRecentMETAR={index === 0} />
        )),
    ];
    const tafReports = [
        ...props.airport.TAF.map((taf, index) => (
            <ReportRender
                key={`airport-${props.airportIndex}-taf-${index}`}
                airportIndex={props.airportIndex}
                report="TAF"
                codes={formatRawCodes(taf.rawTAF)}
                highlights={context.highlightsTAF} />
        ))
    ]
    const notams = [
        ...props.airport.NOTAMs.map((notam, index) => (
            <NotamRender
                key={`airport-${props.airportIndex}-notam-${index}`}
                notam={notam} />
        ))
    ]

    const airportOpeningHours = getOpeningHours(props.airport.NOTAMs)

    return (
        <FormProvider {...form}>
            <div className="airport-render-container">
                <div className="airport-header-container">
                    <AirportHeaderButtons
                        airport={props.airport}
                        airportIndex={props.airportIndex}
                        reportsOpen={reportsOpen}
                        notamsOpen={notamsOpen}
                        setReportsOpen={setReportsOpen}
                        setNotamsOpen={setNotamsOpen}
                    />
                    <AirportDatetimeForm airportIndex={props.airportIndex} />
                </div>
                <div className="airport-data-container">
                    {props.airport.messages.length > 0 && (
                        <p className="message warning">{props.airport.messages}</p>
                    )}
                    <p className="message operating-hours">{airportOpeningHours}</p>
                    <Expand
                        isOpen={notamsOpen}
                        rows={1}>
                        <div>
                            {notams}
                        </div>
                    </Expand>
                    {metarReports[0]}
                    {!reportsOpen && tafReports[0]}
                    <Expand
                        isOpen={reportsOpen}
                        rows={1}>
                        <div>
                            {metarReports.slice(1)}
                            {tafReports}
                        </div>
                    </Expand>
                </div>
            </div>
        </FormProvider>
    )
}

export default AirportRender;
