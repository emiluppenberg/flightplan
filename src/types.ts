export type AirportFormValues = {
  icaoId: string;
  useDatetime: boolean;
  date?: string;
  time?: string;
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
  id: string;
  icaoId: string;
  formValues: AirportFormValues;
  TAF: TAFJson[];
  METAR: METARJson[];
}

export type AirportRefresh = {
  id: string;
  TAF: TAFJson[];
  METAR: METARJson[];
  TAFMessage: string;
  METARMessage: string;
}

export type CodeHighlight = {
  report: "TAF" | "METAR" | "TAF/METAR";
  label?: string;
  class: string;
  regEx: RegExp;
  variants?: CodeHighlight[];
}

export const codeHighlights: CodeHighlight[] = [
  {
    report: "TAF/METAR",
    label: "wind",
    class: "highlight-wind",
    regEx: /\b(?:VRB|\d{3})P?\d{2,3}(?:GP?\d{2,3})?KT\b/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "visibility",
    class: "highlight-visibility",
    regEx: /^(?:CAVOK|P?6SM|(?:\d{1,2}\s)?M?\d\/\dSM|\d{1,2}SM|\d{4}|R\d{2}[LCR]?\/[MP]?\d{4}(?:FT)?[UDN]?)$/,
    variants: [
      {
        // <=400M | M1/4SM
        report: "METAR",
        class: "metar-visibility-lowest",
        regEx: /^(?:M1\/4SM|0[0-3]\d{2}|R\d{2}[LCR]?\/[MP]?0[0-3]\d{2}[UDN]?)$/
      },
      {
        // 400M-550M | 1/4SM
        report: "METAR",
        class: "metar-visibility-low",
        regEx: /^(?:1\/4SM|0(?:4\d{2}|5[0-4]\d)|R\d{2}[LCR]?\/[MP]?0(?:4\d{2}|5[0-4]\d)[UDN]?)$/
      },
      {
        // 550M-800M | 1/2SM
        report: "METAR",
        class: "metar-visibility-medium",
        regEx: /^(?:1\/2SM|0(?:55\d|5[6-9]\d|[67]\d{2})|R\d{2}[LCR]?\/[MP]?0(?:55\d|5[6-9]\d|[67]\d{2})[UDN]?)$/
      },
      {
        // 800M-1400M | 3/4SM
        report: "METAR",
        class: "metar-visibility-high",
        regEx: /^(?:3\/4SM|0[89]\d{2}|1[0-3]\d{2}|1400|R\d{2}[LCR]?\/[MP]?(?:0[89]\d{2}|1[0-3]\d{2}|1400)[UDN]?)$/
      },
      {
        // >=1400M | 1SM
        report: "METAR",
        class: "metar-visibility-highest",
        regEx: /^(?:P6SM|[1-9]\d?(?:\s\d\/\d)?SM|14(?:0[1-9]|[1-9]\d)|1[5-9]\d{2}|[2-9]\d{3}|CAVOK|R\d{2}[LCR]?\/[MP]?(?:14(?:0[1-9]|[1-9]\d)|1[5-9]\d{2}|[2-9]\d{3})[UDN]?)$/
      },
      {
        // <=550M | <=1/2SM
        report: "TAF",
        class: "taf-visibility-lowest",
        regEx: /^(?:M1\/4SM|(?:0|1\/4|1\/2)SM|0(?:[0-4]\d{2}|5[0-4]\d|550))$/
      },
      {
        // >550M-<1400M | >1/2SM-<1SM
        report: "TAF",
        class: "taf-visibility-low",
        regEx: /^(?:3\/4SM|05(?:5[1-9]|[6-9]\d)|0[6-9]\d{2}|1[0-3]\d{2})$/
      },
      {
        // 1400M-<2300M | 1SM-<1 1/2SM
        report: "TAF",
        class: "taf-visibility-medium",
        regEx: /^(?:1(?:\s1\/4)?SM|1[4-9]\d{2}|2[0-2]\d{2})$/
      },
      {
        // >=2300M | >=1 1/2SM
        report: "TAF",
        class: "taf-visibility-high",
        regEx: /^(?:P6SM|1\s(?:1\/2|3\/4)SM|(?:[2-9]|[1-9]\d)(?:\s\d\/\d)?SM|CAVOK|2[3-9]\d{2}|[3-9]\d{3})$/
      }
    ]
  },
  {
    report: "TAF/METAR",
    label: "weather",
    class: "highlight-weather",
    regEx: /^(?:(?:-|\+)?(?:VC|RE)?(?:(?:MI|PR|BC|DR|BL|SH|TS|FZ)?(?:DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|DS|SS)+|TS|SH)|NSW)$/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "forecast changes",
    class: "highlight-forecast-changes",
    regEx: /^(?:FM\d{6}|TEMPO|BECMG|PROB(?:30|40)|NOSIG|NSW|\d{4}\/\d{4})$/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "temperature",
    class: "highlight-temperature",
    regEx: /\b(?:M?\d{2}\/M?\d{2}|T(?:X|N)M?\d{2}\/\d{4}Z)\b/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "altimeter",
    class: "highlight-altimeter",
    regEx: /\b(?:A\d{4}|Q\d{4})\b/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "clouds",
    class: "highlight-clouds",
    regEx: /^(?:(?:FEW|SCT|BKN|OVC)\d{3}(?:CB|TCU|\/\/\/)?|VV(?:\d{3}|\/\/\/))$/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "ceiling",
    class: "highlight-ceiling",
    regEx: /^(?:(?:BKN|OVC)\d{3}(?:CB|TCU|\/\/\/)?|VV(?:\d{3}|\/\/\/)|NSC)$/,
    variants: [
      {
        // <=200
        report: "METAR",
        class: "metar-ceiling-lowest",
        regEx: /^(?:(?:BKN|OVC)00[0-2](?:CB|TCU|\/\/\/)?|VV00[0-2])$/
      },
      {
        // >200-<400
        report: "METAR",
        class: "metar-ceiling-low",
        regEx: /^(?:(?:BKN|OVC)003(?:CB|TCU|\/\/\/)?|VV003)$/
      },
      {
        // 400-<3000
        report: "METAR",
        class: "metar-ceiling-medium",
        regEx: /^(?:(?:BKN|OVC)(?:00[4-9]|0[12]\d)(?:CB|TCU|\/\/\/)?|VV(?:00[4-9]|0[12]\d))$/
      },
      {
        // >=3000
        report: "METAR",
        class: "metar-ceiling-high",
        regEx: /^(?:(?:BKN|OVC)(?:0[3-9]\d|[1-9]\d{2})(?:CB|TCU|\/\/\/)?|VV(?:0[3-9]\d|[1-9]\d{2})|NSC)$/
      },
      {
        // <=200
        report: "TAF",
        class: "taf-ceiling-lowest",
        regEx: /^(?:(?:BKN|OVC)00[0-2](?:CB|TCU|\/\/\/)?|VV00[0-2])$/
      },
      {
        // >200-<400
        report: "TAF",
        class: "taf-ceiling-low",
        regEx: /^(?:(?:BKN|OVC)003(?:CB|TCU|\/\/\/)?|VV003)$/
      },
      {
        // 400-<800
        report: "TAF",
        class: "taf-ceiling-medium",
        regEx: /^(?:(?:BKN|OVC)00[4-7](?:CB|TCU|\/\/\/)?|VV00[4-7])$/
      },
      {
        // 800-<2400
        report: "TAF",
        class: "taf-ceiling-high",
        regEx: /^(?:(?:BKN|OVC)(?:00[89]|01\d|02[0-3])(?:CB|TCU|\/\/\/)?|VV(?:00[89]|01\d|02[0-3]))$/
      },
      {
        // >=2400
        report: "TAF",
        class: "taf-ceiling-highest",
        regEx: /^(?:(?:BKN|OVC)(?:02[4-9]|0[3-9]\d|[1-9]\d{2})(?:CB|TCU|\/\/\/)?|VV(?:02[4-9]|0[3-9]\d|[1-9]\d{2})|NSC)$/
      }
    ]
  },
  {
    report: "TAF/METAR",
    label: "convective",
    class: "highlight-convective",
    regEx: /^(?:(?:-|\+)?(?:VC|RE)?TS(?:DZ|RA|SN|SG|IC|PL|GR|GS|UP)*|(?:FEW|SCT|BKN|OVC)\d{3}(?:CB|TCU)|\+?FC)$/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "wind shear",
    class: "highlight-wind-shear",
    regEx: /^WS(?:\d{3}\/(?:VRB|\d{3})\d{2,3}(?:G\d{2,3})?KT)?$/,
    variants: []
  }
]
