import type { AirportData } from "../types";
import ReportRender from "./ReportRender";
import { useFlightPathContext } from "../Context";
import { useState } from "react";
import AirportDatetimeForm from "./AirportDatetimeForm";
import { FormProvider, useForm } from "react-hook-form";
import type { AirportFormValues } from "../types";
import AirportHeaderButtons from "./AirportHeaderButtons";
import { formatRawCodes } from "../utilities";
import Expand from "./Expand";

type AirportRenderProps = {
    airport: AirportData;
    airportIndex: number;
}

const AirportRender = (props: AirportRenderProps) => {
    const context = useFlightPathContext()
    const [airportOpen, setAirportOpen] = useState(false)
    const form = useForm<AirportFormValues>({
        defaultValues: props.airport.formValues
    })

    const reports = [
        ...props.airport.METAR.map((metar, index) => (
            <ReportRender
                key={`airport-${props.airportIndex}-metar-${index}`}
                airportIndex={props.airportIndex}
                report="METAR"
                codes={formatRawCodes(metar.rawOb)}
                highlights={context.highlightsMETAR}
                isMostRecentMETAR={index === 0} />
        )),
        ...props.airport.TAF.map((taf, index) => (
            <ReportRender
                key={`airport-${props.airportIndex}-taf-${index}`}
                airportIndex={props.airportIndex}
                report="TAF"
                codes={formatRawCodes(taf.rawTAF)}
                highlights={context.highlightsTAF} />
        ))
    ];

    return (
        <FormProvider {...form}>
            <div className="airport-render-container">
                <div className="airport-header-container">
                    <AirportHeaderButtons
                        airport={props.airport}
                        airportIndex={props.airportIndex}
                        airportOpen={airportOpen}
                        setAirportOpen={setAirportOpen}
                    />
                    <Expand
                        isOpen={airportOpen}
                        rows={1}>
                        <div className="airport-header-datetime">
                            <AirportDatetimeForm
                                airportIndex={props.airportIndex}
                            />
                        </div>
                    </Expand>
                </div>
                <div className="airport-data-container">
                    {props.airport.messages.length > 0 && (
                        <p className="message">{props.airport.messages}</p>
                    )}
                    {reports[0]}
                    <Expand
                        isOpen={airportOpen}
                        rows={2}
                    >
                        <div>
                            {reports.slice(1)}
                        </div>
                    </Expand>
                </div>
            </div>
        </FormProvider>
    )
}

export default AirportRender;
