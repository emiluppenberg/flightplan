export type FlightPathFormValues = {
    departureDate: string;
    departureTime: string;
    departureICAO: string;
    destinationDate: string;
    destinationTime: string;
    destinationICAO: string;
}

export type FlightPathData = {
    departureTAF: string;
    destinationTAF: string;
}
