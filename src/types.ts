import type { Session, User } from "@supabase/supabase-js";

export interface Message {
  message: string
  status?: number
  time?: number
}

export interface UserAppData {
  aerodromes: AerodromeData[]
  highlightsTaf: CodeHighlight[]
  highlightsMetar: CodeHighlight[]
  highlightsNotam: CodeHighlight[]
  highlightsOperationalHours: CodeHighlight[]
  queryMetarPreviousHours: number
  errors?: string[] | undefined
}

export interface SupabaseAerodrome {
  icao: string
  id: string
  next_poll_snowtam: number
  user_id: string
}

export interface SupabaseConfig {
  query_metar_previous_hours: number
  highlights_taf: string[]
  highlights_metar: string[]
  highlights_notam: string[]
  highlights_operational_hours: string[]
}

export type FetchResult<T> = {
  data: T | undefined;
  error: string | undefined;
}

export interface EntryNOTAM {
  raw: string;
  notam_id?: string | null;
  notam_id_domestic?: string | null;
  type?: string | null;
  location?: string | null;
  effective?: string | null;
  expiration?: string | null;
  body?: string | null;
  schedule?: string | null;
  lower_limit?: string | null;
  upper_limit?: string | null;
  affected_fir?: string | null;
  q_code?: string | null;
  qline?: string | null;
  scope?: string | null;
  status?: string | null;
  id?: string | undefined;
}

export interface EntrySNOWTAM {
  raw: string;
  notam_id?: string | null;
  notam_id_domestic?: string | null;
  location?: string | null;
  effective?: string | null;
  expiration?: string | null;
  body?: string | null;
  status?: string | null;
  id?: string | undefined;
}

export interface ResponseNOTAM {
  icao: string;
  notams: EntryNOTAM[];
  total: number;
  error?: string;
}

export interface AerodromesResourceResponse {
  data: AerodromeResource[];
  links: {
    prev?: string;
    next?: string;
  }
}

export interface AerodromeResourceResponse {
  data: AerodromeResource
}

export interface AerodromeResource {
  id: string;
  type: string;
  attributes: {
    name: string;
    code: string;
    type: string;
    latitude?: string;
    longitude?: string;
    elevation?: number;
    gps_code?: string;
    icao_code?: string;
    iata_code?: string;
    local_code?: string;
  };
}

export type AerodromeFormValues = {
  icaoId: string;
  date?: string;
  time?: string;
  notamIncludeFIR: boolean;
  notamIncludeFuture: boolean;
}

export type EntryTAF = {
  icaoId: string;
  rawTAF: string;
}

export type EntryMETAR = {
  icaoId: string;
  receiptTime: string;
  rawOb: string;
}

export type AerodromeData = {
  id: string;
  icaoId: string | null;
  formValues: AerodromeFormValues;
  TAF: EntryTAF[];
  METAR: EntryMETAR[];
  NOTAM: EntryNOTAM[];
  SNOWTAM: EntrySNOWTAM[];
  messages: string;
  nextPollReports: number;
  nextPollSNOWTAM: number;
  isLoading: boolean;
  supabaseId?: string;
}

export type CodeHighlightReport = "TAF" | "METAR" | "NOTAM" | "OPERATIONAL HOURS"

export type CodeHighlight = {
  report: CodeHighlightReport | "TAF/METAR";
  label?: string;
  priority: number;
  class: string;
  regEx: RegExp;
  variants?: CodeHighlight[];
}

export const HIGHLIGHTS_TAF_METAR: CodeHighlight[] = [
  {
    report: "TAF/METAR",
    label: "wind",
    class: "highlight-wind",
    priority: 1,
    regEx: /\b(?:VRB|\d{3})P?\d{2,3}(?:GP?\d{2,3})?KT\b/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "visibility",
    class: "highlight-visibility",
    priority: 1,
    regEx: /^(?:CAVOK|P?6SM|(?:\d{1,2}\s)?M?\d\/\dSM|\d{1,2}SM|\d{4}|R\d{2}[LCR]?\/[MP]?\d{4}(?:FT)?[UDN]?)$/,
    variants: [
      {
        // <=400M | M1/4SM
        report: "METAR",
        class: "metar-visibility-lowest",
        priority: 1,
        regEx: /^(?:M1\/4SM|0[0-3]\d{2}|R\d{2}[LCR]?\/[MP]?0[0-3]\d{2}[UDN]?)$/
      },
      {
        // 400M-550M | 1/4SM
        report: "METAR",
        class: "metar-visibility-low",
        priority: 1,
        regEx: /^(?:1\/4SM|0(?:4\d{2}|5[0-4]\d)|R\d{2}[LCR]?\/[MP]?0(?:4\d{2}|5[0-4]\d)[UDN]?)$/
      },
      {
        // 550M-800M | 1/2SM
        report: "METAR",
        class: "metar-visibility-medium",
        priority: 1,
        regEx: /^(?:1\/2SM|0(?:55\d|5[6-9]\d|[67]\d{2})|R\d{2}[LCR]?\/[MP]?0(?:55\d|5[6-9]\d|[67]\d{2})[UDN]?)$/
      },
      {
        // 800M-1400M | 3/4SM
        report: "METAR",
        class: "metar-visibility-high",
        priority: 1,
        regEx: /^(?:3\/4SM|0[89]\d{2}|1[0-3]\d{2}|1400|R\d{2}[LCR]?\/[MP]?(?:0[89]\d{2}|1[0-3]\d{2}|1400)[UDN]?)$/
      },
      {
        // >=1400M | 1SM
        report: "METAR",
        class: "metar-visibility-highest",
        priority: 1,
        regEx: /^(?:P6SM|[1-9]\d?(?:\s\d\/\d)?SM|14(?:0[1-9]|[1-9]\d)|1[5-9]\d{2}|[2-9]\d{3}|CAVOK|R\d{2}[LCR]?\/[MP]?(?:14(?:0[1-9]|[1-9]\d)|1[5-9]\d{2}|[2-9]\d{3})[UDN]?)$/
      },
      {
        // <=550M | <=1/2SM
        report: "TAF",
        class: "taf-visibility-lowest",
        priority: 1,
        regEx: /^(?:M1\/4SM|(?:0|1\/4|1\/2)SM|0(?:[0-4]\d{2}|5[0-4]\d|550))$/
      },
      {
        // >550M-<1400M | >1/2SM-<1SM
        report: "TAF",
        class: "taf-visibility-low",
        priority: 1,
        regEx: /^(?:3\/4SM|05(?:5[1-9]|[6-9]\d)|0[6-9]\d{2}|1[0-3]\d{2})$/
      },
      {
        // 1400M-<2300M | 1SM-<1 1/2SM
        report: "TAF",
        class: "taf-visibility-medium",
        priority: 1,
        regEx: /^(?:1(?:\s1\/4)?SM|1[4-9]\d{2}|2[0-2]\d{2})$/
      },
      {
        // >=2300M | >=1 1/2SM
        report: "TAF",
        class: "taf-visibility-high",
        priority: 1,
        regEx: /^(?:P6SM|1\s(?:1\/2|3\/4)SM|(?:[2-9]|[1-9]\d)(?:\s\d\/\d)?SM|CAVOK|2[3-9]\d{2}|[3-9]\d{3})$/
      }
    ]
  },
  {
    report: "TAF/METAR",
    label: "weather",
    class: "highlight-weather",
    priority: 1,
    regEx: /^(?:(?:-|\+)?(?:VC|RE)?(?:(?:MI|PR|BC|DR|BL|SH|TS|FZ)?(?:DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|DS|SS)+|TS|SH)|NSW)$/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "forecast changes",
    class: "highlight-forecast-changes",
    priority: 1,
    regEx: /^(?:FM\d{6}|TEMPO|BECMG|PROB(?:30|40)|NOSIG|NSW|\d{4}\/\d{4})$/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "temperature",
    class: "highlight-temperature",
    priority: 1,
    regEx: /\b(?:M?\d{2}\/M?\d{2}|T(?:X|N)M?\d{2}\/\d{4}Z)\b/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "altimeter",
    class: "highlight-altimeter",
    priority: 1,
    regEx: /\b(?:A\d{4}|Q\d{4})\b/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "clouds",
    class: "highlight-clouds",
    priority: 1,
    regEx: /^(?:(?:FEW|SCT|BKN|OVC)\d{3}(?:CB|TCU|\/\/\/)?|VV(?:\d{3}|\/\/\/))$/,
    variants: []
  },
  {
    report: "TAF/METAR",
    label: "ceiling",
    class: "highlight-ceiling",
    priority: 1,
    regEx: /^(?:(?:BKN|OVC)\d{3}(?:CB|TCU|\/\/\/)?|VV(?:\d{3}|\/\/\/)|NSC)$/,
    variants: [
      {
        // <=200
        report: "METAR",
        class: "metar-ceiling-lowest",
        priority: 1,
        regEx: /^(?:(?:BKN|OVC)00[0-2](?:CB|TCU|\/\/\/)?|VV00[0-2])$/
      },
      {
        // >200-<400
        report: "METAR",
        class: "metar-ceiling-low",
        priority: 1,
        regEx: /^(?:(?:BKN|OVC)003(?:CB|TCU|\/\/\/)?|VV003)$/
      },
      {
        // 400-<3000
        report: "METAR",
        class: "metar-ceiling-medium",
        priority: 1,
        regEx: /^(?:(?:BKN|OVC)(?:00[4-9]|0[12]\d)(?:CB|TCU|\/\/\/)?|VV(?:00[4-9]|0[12]\d))$/
      },
      {
        // >=3000
        report: "METAR",
        class: "metar-ceiling-high",
        priority: 1,
        regEx: /^(?:(?:BKN|OVC)(?:0[3-9]\d|[1-9]\d{2})(?:CB|TCU|\/\/\/)?|VV(?:0[3-9]\d|[1-9]\d{2})|NSC)$/
      },
      {
        // <=200
        report: "TAF",
        class: "taf-ceiling-lowest",
        priority: 1,
        regEx: /^(?:(?:BKN|OVC)00[0-2](?:CB|TCU|\/\/\/)?|VV00[0-2])$/
      },
      {
        // >200-<400
        report: "TAF",
        class: "taf-ceiling-low",
        priority: 1,
        regEx: /^(?:(?:BKN|OVC)003(?:CB|TCU|\/\/\/)?|VV003)$/
      },
      {
        // 400-<800
        report: "TAF",
        class: "taf-ceiling-medium",
        priority: 1,
        regEx: /^(?:(?:BKN|OVC)00[4-7](?:CB|TCU|\/\/\/)?|VV00[4-7])$/
      },
      {
        // 800-<2400
        report: "TAF",
        class: "taf-ceiling-high",
        priority: 1,
        regEx: /^(?:(?:BKN|OVC)(?:00[89]|01\d|02[0-3])(?:CB|TCU|\/\/\/)?|VV(?:00[89]|01\d|02[0-3]))$/
      },
      {
        // >=2400
        report: "TAF",
        class: "taf-ceiling-highest",
        priority: 1,
        regEx: /^(?:(?:BKN|OVC)(?:02[4-9]|0[3-9]\d|[1-9]\d{2})(?:CB|TCU|\/\/\/)?|VV(?:02[4-9]|0[3-9]\d|[1-9]\d{2})|NSC)$/
      }
    ]
  },
  {
    report: "TAF/METAR",
    label: "convective",
    class: "highlight-convective",
    priority: 2,
    regEx: /^(?:(?:-|\+)?(?:VC|RE)?(?:TS(?:DZ|RA|SN|SG|IC|PL|GR|GS|UP)*|SHRA)|(?:FEW|SCT|BKN|OVC)\d{3}(?:CB|TCU)|\+?FC)$/,
    variants: [
      {
        report: "TAF/METAR",
        class: "convective-warning",
        priority: 1,
        regEx: /^(?:(?:-|\+)?(?:VC|RE)?TS(?:DZ|RA|SN|SG|IC|PL|GR|GS|UP)*|(?:FEW|SCT|BKN|OVC)\d{3}TCU|\+?FC)$/
      },
      {
        report: "TAF/METAR",
        class: "convective-danger",
        priority: 2,
        regEx: /^(?:(?:-|\+)?(?:VC|RE)?SHRA|(?:FEW|SCT|BKN|OVC)\d{3}CB)$/
      }
    ]
  },
  {
    report: "TAF/METAR",
    label: "wind shear",
    class: "highlight-wind-shear",
    priority: 1,
    regEx: /^WS(?:\d{3}\/(?:VRB|\d{3})\d{2,3}(?:G\d{2,3})?KT)?$/,
    variants: []
  },
]

export const HIGHLIGHTS_OPERATIONAL_HOURS: CodeHighlight[] = [
  {
    report: "NOTAM",
    label: "TWR",
    class: "highlight-operational-hours-twr",
    priority: 1,
    regEx: /\bQST(?:AH|AK|AL|AM|AO|AP|AR|AS|AU|AW|AX|LC|LS|LT|)\b/,
  },
  {
    report: "NOTAM",
    label: "AFIS",
    class: "highlight-operational-hours-afis",
    priority: 1,
    regEx: /\bQSF(?:AH|AK|AL|AM|AO|AP|AR|AS|AU|AW|AX|LC|LS|LT|)\b/,
  },
  {
    report: "NOTAM",
    label: "AERODROME",
    class: "highlight-operational-hours-aerodrome",
    priority: 1,
    regEx: /\bQFA(?:AH|AK|AL|AM|AO|AP|AR|AS|AU|AW|AX|LC|LS|LT|)\b/,
  },
  {
    report: "NOTAM",
    label: "APPROACH CONTROL",
    class: "highlight-operational-hours-approach-control",
    priority: 1,
    regEx: /\bQSP(?:AH|AK|AL|AM|AO|AP|AR|AS|AU|AW|AX|LC|LS|LT|)\b/,
  },
  {
    report: "NOTAM",
    label: "FUEL",
    class: "highlight-operational-hours-fuel",
    priority: 1,
    regEx: /\bQFU(?:AH|AK|AL|AM|AO|AP|AR|AS|AU|AW|AX|LC|LS|LT|)\b/,
  }
]

export const HIGHLIGHTS_NOTAM: CodeHighlight[] = [
  {
    report: "NOTAM",
    label: "SNOWTAM",
    class: "highlight-snowtam",
    priority: 1,
    regEx: /\bSNOWTAM\b/
  },
  {
    report: "NOTAM",
    label: "runway",
    class: "highlight-runway",
    priority: 1,
    regEx: /\bQ(?:PU|PI|MW|MU|MT|MS|MR|MO|MH|MD|MC|LZ|LV|LT|LS|LP|LM|LL|LK|LJ|LI|LH|LF|LE|LC|LA|IY|IX|IW|IU|IT|IS|IO|IM|IL|II|IG|IC|FT|CP|ID|LR)[A-Z]{2}\b/,
  },
  {
    report: "NOTAM",
    label: "taxiway",
    class: "highlight-taxiway",
    priority: 1,
    regEx: /\bQ(?:MX|MY|MG|MO)[A-Z]{2}\b/
  },
  {
    report: "NOTAM",
    label: "airspace activity",
    class: "highlight-airspace-activity",
    priority: 1,
    regEx: /\bQW[A-Z]{3}\b/
  },
  {
    report: "NOTAM",
    label: "obstacles",
    class: "highlight-obstacles",
    priority: 1,
    regEx: /\bQOB[A-Z]{2}\b/
  },
  {
    report: "NOTAM",
    label: "obstruction lights",
    class: "highlight-obstruction-lights",
    priority: 1,
    regEx: /\bQOL[A-Z]{2}\b/
  },
  {
    report: "NOTAM",
    label: "restricted/prohibited/danger",
    class: "highlight-restricted-prohibited-danger",
    priority: 1,
    regEx: /\bQ(?:RA|RD|RM|RO|RP|RR|RT)[A-Z]{2}\b/
  },
  {
    report: "NOTAM",
    label: "SID/STAR",
    class: "highlight-sid-star",
    priority: 1,
    regEx: /\bQ(?:PD|PA)[A-Z]{2}\b/
  },
  {
    report: "NOTAM",
    label: "approach procedure",
    class: "highlight-approach-procedure",
    priority: 1,
    regEx: /\bQ(?:PI|PK)[A-Z]{2}\b/
  },
  {
    report: "NOTAM",
    label: "operating minima",
    class: "highlight-operating-minima",
    priority: 1,
    regEx: /\bQ(?:PM|PO)[A-Z]{2}\b/
  }
]

export type UserFormValues = {
  email: string;
  password: string;
}

export type AppUser = {
  user: User;
  session: Session;
}