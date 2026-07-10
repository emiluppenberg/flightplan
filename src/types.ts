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

export type TAFJson = {
  icaoId: string;
  issueTime: string;
  validTimeFrom: number;
  validTimeTo: number;
  rawTAF: string;
}

export type METARJson = {
  icaoId: string;
  receiptTime: string;
  rawOb: string;
}

export type CodeHighlight = {
  value: string;
  regEx: RegExp;
}

export const codeHighlights: CodeHighlight[] = [
  {
    value: "wind",
    regEx: /\b(?:VRB|\d{3})P?\d{2,3}(?:GP?\d{2,3})?KT\b/
  },
  {
    value: "visibility",
    regEx: /^(?:CAVOK|P?6SM|(?:\d{1,2}\s)?\d\/\dSM|\d{1,2}SM|\d{4}|R\d{2}[LCR]?\/[MP]?\d{4}(?:FT)?[UDN]?)$/
  },
  {
    value: "weather",
    regEx: /^(?:(?:-|\+)?(?:VC|RE)?(?:(?:MI|PR|BC|DR|BL|SH|TS|FZ)?(?:DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|DS|SS)+|TS|SH)|NSW)$/
  },
  {
    value: "forecast changes",
    regEx: /^(?:FM\d{6}|TEMPO|BECMG|PROB(?:30|40)|NOSIG|NSW|\d{4}\/\d{4})$/
  },
  {
    value: "temperature",
    regEx: /\b(?:M?\d{2}\/M?\d{2}|T(?:X|N)M?\d{2}\/\d{4}Z)\b/
  },
  {
    value: "altimeter",
    regEx: /\b(?:A\d{4}|Q\d{4})\b/
  },
  {
    value: "clouds",
    regEx: /^(?:(?:FEW|SCT|BKN|OVC)\d{3}(?:CB|TCU|\/\/\/)?|VV(?:\d{3}|\/\/\/))$/
  },
  {
    value: "ceiling",
    regEx: /^(?:(?:BKN|OVC)\d{3}(?:CB|TCU|\/\/\/)?|VV(?:\d{3}|\/\/\/)|NSC)$/
  },
  {
    value: "convective",
    regEx: /^(?:(?:-|\+)?(?:VC|RE)?TS(?:DZ|RA|SN|SG|IC|PL|GR|GS|UP)*|(?:FEW|SCT|BKN|OVC)\d{3}(?:CB|TCU)|\+?FC)$/
  },
  {
    value: "wind shear",
    regEx: /^WS(?:\d{3}\/(?:VRB|\d{3})\d{2,3}(?:G\d{2,3})?KT)?$/
  }
]
