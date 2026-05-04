import { D } from "./theme";
import type { StatusMetaMap } from "./types";

export const WPS_SM: StatusMetaMap = {
  Active:         { dot: D.pass, bg: D.passBg,     text: D.pass },
  "Pending Review":{ dot: D.warn, bg: D.warnBg,   text: D.warn },
  Expired:        { dot: D.fail, bg: D.failBg,     text: D.fail },
};

export const WELDER_SM: StatusMetaMap = {
  Current:        { dot: D.pass, bg: D.passBg,     text: D.pass },
  "Expiring Soon":{ dot: D.warn, bg: D.warnBg,    text: D.warn },
  Expired:        { dot: D.fail, bg: D.failBg,     text: D.fail },
};

export const PROJ_SM: StatusMetaMap = {
  "On Track":     { dot: D.pass, bg: D.passBg,     text: D.pass },
  "At Risk":      { dot: D.warn, bg: D.warnBg,     text: D.warn },
  Delayed:        { dot: D.fail, bg: D.failBg,     text: D.fail },
};

export const NCR_SM: StatusMetaMap = {
  Open:           { dot: D.fail, bg: D.failBg,     text: D.fail },
  "In Progress":  { dot: D.warn, bg: D.warnBg,     text: D.warn },
  Closed:         { dot: D.pass, bg: D.passBg,     text: D.pass },
};

export const VT_SM: StatusMetaMap = {
  PASS:           { dot: D.pass, bg: D.passBg,     text: D.pass },
  FAIL:           { dot: D.fail, bg: D.failBg,     text: D.fail },
  CONDITIONAL:    { dot: D.warn, bg: D.warnBg,     text: D.warn },
};

export const OVERALL_SM: StatusMetaMap = {
  Accepted:           { dot: D.pass,   bg: D.passBg,     text: D.pass   },
  Released:           { dot: D.teal,   bg: D.tealBg,     text: D.teal   },
  "Under Repair":     { dot: D.warn,   bg: D.warnBg,     text: D.warn   },
  "NCR Open":         { dot: D.fail,   bg: D.failBg,     text: D.fail   },
  Conditional:        { dot: D.warn,   bg: D.warnBg,     text: D.warn   },
  Rejected:           { dot: D.fail,   bg: D.failBg,     text: D.fail   },
  "HT Non-Conformance":{ dot: D.warn,  bg: D.warnBg,     text: D.warn   },
};

export const CHECK_SM: StatusMetaMap = {
  pass:           { dot: D.pass, bg: D.passBg,     text: D.pass },
  fail:           { dot: D.fail, bg: D.failBg,     text: D.fail },
  warn:           { dot: D.warn, bg: D.warnBg,     text: D.warn },
};

export const CALIB_SM: StatusMetaMap = {
  Valid:          { dot: D.pass, bg: D.passBg,     text: D.pass },
  "Expiring Soon":{ dot: D.warn, bg: D.warnBg,    text: D.warn },
  Expired:        { dot: D.fail, bg: D.failBg,     text: D.fail },
};

export const TECH_SM: StatusMetaMap = {
  Current:        { dot: D.pass, bg: D.passBg,     text: D.pass },
  "Expiring Soon":{ dot: D.warn, bg: D.warnBg,    text: D.warn },
  Expired:        { dot: D.fail, bg: D.failBg,     text: D.fail },
};

export const MDR_SM: StatusMetaMap = {
  Draft:          { dot: D.textSoft, bg: D.surfaceAlt, text: D.textMid  },
  "For Review":   { dot: D.warn,     bg: D.warnBg,    text: D.warn      },
  Issued:         { dot: D.pass,     bg: D.passBg,    text: D.pass      },
  Superseded:     { dot: D.purple,   bg: D.purpleBg,  text: D.purple    },
};

export const ITP_STEP_SM: StatusMetaMap = {
  Completed:      { dot: D.pass,     bg: D.passBg,    text: D.pass      },
  "In Progress":  { dot: D.warn,     bg: D.warnBg,    text: D.warn      },
  Pending:        { dot: D.textSoft, bg: D.surfaceAlt, text: D.textSoft },
};

export const NDT_RESULT_SM: StatusMetaMap = {
  Pass:           { dot: D.pass, bg: D.passBg, text: D.pass },
  Fail:           { dot: D.fail, bg: D.failBg, text: D.fail },
};

export const HT_STATUS_SM: StatusMetaMap = {
  Pass:           { dot: D.pass, bg: D.passBg, text: D.pass },
  Pending:        { dot: D.warn, bg: D.warnBg, text: D.warn },
  Fail:           { dot: D.fail, bg: D.failBg, text: D.fail },
};

export const WELD_STATUS_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  "Not Started":          { fill: D.surfaceAlt, stroke: D.border,  text: D.textSoft },
  "Fit-up Complete":      { fill: "#1a2a3a",    stroke: D.blue,    text: "#6ea4f0"  },
  Welded:                 { fill: "#1a2a3a",    stroke: D.purple,  text: D.purple   },
  "Pending VT":           { fill: D.warnBg,     stroke: D.warn,    text: D.warn     },
  "Pending NDT":          { fill: D.warnBg,     stroke: "#f0a020", text: "#f0a020"  },
  "Pending Heat Treatment":{ fill: D.accentFaint, stroke: D.accent, text: D.accent  },
  "Repair Required":      { fill: D.failBg,     stroke: D.fail,    text: D.fail     },
  Accepted:               { fill: D.passBg,     stroke: D.pass,    text: D.pass     },
  "NCR Open":             { fill: D.failBg,     stroke: "#ff3030", text: "#ff3030"  },
  Released:               { fill: D.tealBg,     stroke: D.teal,    text: D.teal     },
};
