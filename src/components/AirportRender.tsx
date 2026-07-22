import type { AirportData } from "../types";
import ReportRender from "./ReportRender";
import { codeHighlights } from "../types";
import { useFlightPathContext } from "../Context";
import { useState } from "react";
import AirportDatetimeForm from "./AirportDatetimeForm";
import { FormProvider, useForm } from "react-hook-form";
import type { AirportFormValues } from "../types";
import AirportHeaderButtons from "./AirportHeaderButtons";
import upIcon from "/ui/arrow-ios-upward-outline-svgrepo-com.svg?url";

const visibilityRegEx = codeHighlights.find(
    highlight => highlight.label === "visibility"
)?.regEx;

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

    const formatRaw = (raw: string) => {
        const codes = raw.trim().split(/\s+/);
        const formatted: string[] = [];

        for (let index = 0; index < codes.length; index++) {
            const nextCode = codes[index + 1];
            const combined = nextCode ? `${codes[index]} ${nextCode}` : "";
            const isCombinedCode = visibilityRegEx?.test(combined) ?? false;

            if (isCombinedCode) {
                formatted.push(combined);
                index++;
            } else {
                formatted.push(codes[index]);
            }
        }

        return formatted;
    };

    const reports = [
        ...props.airport.METAR.map((metar, index) => (
            <ReportRender
                key={`airport-${props.airportIndex}-metar-${index}`}
                airportIndex={props.airportIndex}
                report="METAR"
                codes={formatRaw(metar.rawOb)}
                highlights={context.highlightsMETAR}
                isMostRecentMETAR={index === 0} />
        )),
        ...props.airport.TAF.map((taf, index) => (
            <ReportRender
                key={`airport-${props.airportIndex}-taf-${index}`}
                airportIndex={props.airportIndex}
                report="TAF"
                codes={formatRaw(taf.rawTAF)}
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
                    <div className={`airport-header-expand ${airportOpen ? "open" : ""}`}>
                        <div className="airport-header-datetime">
                            <AirportDatetimeForm
                                airportIndex={props.airportIndex}
                            />
                        </div>
                    </div>
                </div>
                <div className="airport-data-container">
                    {reports[0]}
                    <div className={`airport-data-expand ${airportOpen ? "open" : ""}`}>
                        <div>
                            {reports.slice(1)}
                        </div>
                        <button
                            className="airport-collapse"
                            onClick={() => setAirportOpen(value => !value)}>
                            <img src={upIcon} width="20" />
                        </button>
                    </div>
                </div>
            </div>
        </FormProvider>
    )
}

export default AirportRender;
