export type AirportFormValues = {
  icaoId: string;
  date: string;
  time: string;
}

export type TAFJson = {
  icaoId: string;
  rawTAF: string;
}

export type METARJson = {
  icaoId: string;
  receiptTime: string;
  rawOb: string;
}

export type AirportData = {
  formValues: AirportFormValues;
  TAF: TAFJson[];
  METAR: METARJson[];
  highlightsTAF: CodeHighlight[];
  highlightsMETAR: CodeHighlight[];
}

export type CodeHighlight = {
  report: "TAF" | "METAR" | "TAF/METAR";
  value?: string;
  class: string;
  regEx: RegExp;
  variants?: CodeHighlight[];
}

export const codeHighlights: CodeHighlight[] = [
  {
    report: "TAF/METAR",
    value: "wind",
    class: "highlight-wind",
    regEx: /\b(?:VRB|\d{3})P?\d{2,3}(?:GP?\d{2,3})?KT\b/,
    variants: []
  },
  {
    report: "TAF/METAR",
    value: "visibility",
    class: "highlight-visibility",
    regEx: /^(?:CAVOK|P?6SM|(?:\d{1,2}\s)?M?\d\/\dSM|\d{1,2}SM|\d{4}|R\d{2}[LCR]?\/[MP]?\d{4}(?:FT)?[UDN]?)$/,
    variants: [
      {
        // <400M
        report: "METAR",
        class: "metar-visibility-lowest",
        regEx: /^(?:M1\/4SM|0[0-3]\d{2}|R\d{2}[LCR]?\/[MP]?0[0-3]\d{2}[UDN]?)$/
      },
      {
        // 400M-550M
        report: "METAR",
        class: "metar-visibility-low",
        regEx: /^(?:1\/4SM|0(?:4\d{2}|5[0-4]\d)|R\d{2}[LCR]?\/[MP]?0(?:4\d{2}|5[0-4]\d)[UDN]?)$/
      },
      {
        // 550M-800M
        report: "METAR",
        class: "metar-visibility-medium",
        regEx: /^(?:0(?:55\d|5[6-9]\d|[67]\d{2})|R\d{2}[LCR]?\/[MP]?0(?:55\d|5[6-9]\d|[67]\d{2})[UDN]?)$/
      },
      {
        // 800M-1400M
        report: "METAR",
        class: "metar-visibility-high",
        regEx: /^(?:(?:1\/2|3\/4)SM|0[89]\d{2}|1[0-3]\d{2}|1400|R\d{2}[LCR]?\/[MP]?(?:0[89]\d{2}|1[0-3]\d{2}|1400)[UDN]?)$/
      },
      {
        // >1400M
        report: "METAR",
        class: "metar-visibility-highest",
        regEx: /^(?:P6SM|[1-9]\d?SM|14(?:0[1-9]|[1-9]\d)|1[5-9]\d{2}|[2-9]\d{3}|CAVOK|R\d{2}[LCR]?\/[MP]?(?:14(?:0[1-9]|[1-9]\d)|1[5-9]\d{2}|[2-9]\d{3})[UDN]?)$/
      },
    ]
  },
  {
    report: "TAF/METAR",
    value: "weather",
    class: "highlight-weather",
    regEx: /^(?:(?:-|\+)?(?:VC|RE)?(?:(?:MI|PR|BC|DR|BL|SH|TS|FZ)?(?:DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|DS|SS)+|TS|SH)|NSW)$/,
    variants: []
  },
  {
    report: "TAF/METAR",
    value: "forecast changes",
    class: "highlight-forecast-changes",
    regEx: /^(?:FM\d{6}|TEMPO|BECMG|PROB(?:30|40)|NOSIG|NSW|\d{4}\/\d{4})$/,
    variants: []
  },
  {
    report: "TAF/METAR",
    value: "temperature",
    class: "highlight-temperature",
    regEx: /\b(?:M?\d{2}\/M?\d{2}|T(?:X|N)M?\d{2}\/\d{4}Z)\b/,
    variants: []
  },
  {
    report: "TAF/METAR",
    value: "altimeter",
    class: "highlight-altimeter",
    regEx: /\b(?:A\d{4}|Q\d{4})\b/,
    variants: []
  },
  {
    report: "TAF/METAR",
    value: "clouds",
    class: "highlight-clouds",
    regEx: /^(?:(?:FEW|SCT|BKN|OVC)\d{3}(?:CB|TCU|\/\/\/)?|VV(?:\d{3}|\/\/\/))$/,
    variants: []
  },
  {
    report: "TAF/METAR",
    value: "ceiling",
    class: "highlight-ceiling",
    regEx: /^(?:(?:BKN|OVC)\d{3}(?:CB|TCU|\/\/\/)?|VV(?:\d{3}|\/\/\/)|NSC)$/,
    variants: []
  },
  {
    report: "TAF/METAR",
    value: "convective",
    class: "highlight-convective",
    regEx: /^(?:(?:-|\+)?(?:VC|RE)?TS(?:DZ|RA|SN|SG|IC|PL|GR|GS|UP)*|(?:FEW|SCT|BKN|OVC)\d{3}(?:CB|TCU)|\+?FC)$/,
    variants: []
  },
  {
    report: "TAF/METAR",
    value: "wind shear",
    class: "highlight-wind-shear",
    regEx: /^WS(?:\d{3}\/(?:VRB|\d{3})\d{2,3}(?:G\d{2,3})?KT)?$/,
    variants: []
  }
]
