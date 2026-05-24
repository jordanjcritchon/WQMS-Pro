import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";

// ── Design Tokens ─────────────────────────────────────────────────────────
const D = {
  bg:"#09090f", surface:"#101018", surfaceAlt:"#15151f", surfaceHov:"#1c1c2a",
  border:"#222235", borderSoft:"#1a1a2a",
  text:"#f0f0f8", textMid:"#7a7a9a", textSoft:"#45455a",
  accent:"#6366f1", accentFaint:"rgba(99,102,241,0.08)", accentBorder:"rgba(99,102,241,0.22)",
  blue:"#3b82f6", blueFaint:"rgba(59,130,246,0.08)", blueBorder:"rgba(59,130,246,0.22)",
  pass:"#10b981", passBg:"rgba(16,185,129,0.08)", passBorder:"rgba(16,185,129,0.20)",
  fail:"#ef4444", failBg:"rgba(239,68,68,0.08)", failBorder:"rgba(239,68,68,0.20)",
  warn:"#f59e0b", warnBg:"rgba(245,158,11,0.08)", warnBorder:"rgba(245,158,11,0.20)",
  purple:"#8b5cf6", purpleBg:"rgba(139,92,246,0.08)", purpleBorder:"rgba(139,92,246,0.20)",
  shadow:"0 1px 3px rgba(0,0,0,0.5)", shadowMd:"0 8px 32px rgba(0,0,0,0.7)",
};

const INP = {
  background:D.surfaceAlt, border:`1px solid ${D.border}`, color:D.text,
  padding:"8px 12px", borderRadius:6, fontSize:13, width:"100%",
  outline:"none", fontFamily:"'Inter',sans-serif", colorScheme:"dark",
};

const TH = {
  color:D.textSoft, fontWeight:600, fontSize:11, textAlign:"left",
  padding:"8px 12px", borderBottom:`1px solid ${D.border}`,
  background:D.surfaceAlt, whiteSpace:"nowrap",
};
const TD = { padding:"8px 10px", borderBottom:`1px solid ${D.borderSoft}`, verticalAlign:"top" };

const GLOBAL_CSS = `
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:#09090f}
  ::-webkit-scrollbar-thumb{background:#222235;border-radius:10px}
  input::placeholder,textarea::placeholder{color:#45455a;opacity:.7}
  input:focus,select:focus,textarea:focus{border-color:#6366f1!important;box-shadow:0 0 0 2px rgba(99,102,241,0.12)}
  button{transition:opacity .12s;cursor:pointer}
  button:hover:not(:disabled){opacity:.82}
  button:disabled{cursor:not-allowed;opacity:.45}
  select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2345455a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px!important}
  @media print{.no-print{display:none!important}body{background:#fff!important;color:#000!important}}
`;

// ── Constants ─────────────────────────────────────────────────────────────
const PROCESSES  = ["GMAW","GTAW","SMAW","FCAW","SAW"];
const POSITIONS  = ["1G/PA","2G/PC","3G/PF","4G/PE","5G","6G","1F","2F","3F","4F"];
const POS_MAP = {
  PA:"1G/PA","1G":"1G/PA",
  PB:"2F",
  PC:"2G/PC","2G":"2G/PC",
  PD:"3F",
  PE:"4G/PE","4G":"4G/PE",
  PF:"3G/PF","3G":"3G/PF",PG:"3G/PF",
};
function parsePositions(val) {
  if (!val) return [];
  const raw = Array.isArray(val) ? val : String(val).split(/[\s,;/()]+/);
  const seen = new Set();
  return raw.map(s => s.trim().replace(/[()]/g,"").toUpperCase()).filter(Boolean)
    .map(s => POS_MAP[s] || s)
    .filter(s => POSITIONS.includes(s) && !seen.has(s) && seen.add(s));
}
const JOINT_TYPES = ["Butt","Fillet","T-joint","Corner","Lap"];
const STANDARDS   = ["ASME_IX","ISO_15614_1","AS_1554_1","AS_3992","AWS_D1_1","AWS_B2_1"];
const STD_LABEL   = {ASME_IX:"ASME IX",ISO_15614_1:"ISO 15614-1",AS_1554_1:"AS 1554.1",AS_3992:"AS 3992",AWS_D1_1:"AWS D1.1",AWS_B2_1:"AWS B2.1"};
const EDITIONS    = {
  ASME_IX:       ["2019","2021","2023"],
  ISO_15614_1:   ["2004","2017","2017+AMD1:2019"],
  AS_1554_1:     ["2014","2014+AMD1"],
  AS_3992:       ["1998","2020"],
  AWS_D1_1:      ["2015","2020","2022"],
  AWS_B2_1:      ["2014","2019","2021"],
};
const SUPP_PRESETS = [
  {id:"sour",  label:"Sour Service (NACE MR0175)"},
  {id:"cryo",  label:"Cryogenic Service"},
  {id:"hitemp",label:"High Temp / Creep Range"},
  {id:"h2",    label:"Hydrogen Service"},
  {id:"seismic",label:"Seismic (AS 1170)"},
];
const mkLayer  = () => ({process:"GMAW",fillerClass:"",fillerDia:"",shieldGas:"",gasFlow:"",currentType:"DCEP",transferMode:"Spray",ampsMin:"",ampsMax:"",voltsMin:"",voltsMax:"",travelSpeedMin:"",travelSpeedMax:"",travelSpeedUnit:"mm/min",wireFeedMin:"",wireFeedMax:"",hiMin:"",hiMax:"",hiUnit:"kJ/mm"});
const mkParams = () => ({wpsNumber:"",qualificationStandard:"",materialSpec:"",baseMtlGroup:"",pNumber:"",asmeGroupNumber:"",thickness:"",preheat:"",interpass:"",pwht:false,pwhtTempMin:"",pwhtTempMax:"",pwhtHold:"",jointType:"Butt",positions:[],multiPass:true,multiWire:false,backing:false,backingMtl:"",validatedBy:"",linkedPqr:""});

// ── Standard Detection (local, no API cost) ───────────────────────────────
const STD_KEYWORDS = {
  ASME_IX: [
    [/\bqw-\d{3}\b/i, 5], [/asme.{0,8}(?:section|sec\.?).{0,5}ix\b/i, 5],
    [/\bbpv\b|\bbpvc\b/i, 4], [/\bqw-4[0-9][0-9]\b/i, 4],
    [/section ix/i, 5], [/\bp-number\b/i, 3], [/\bf-number\b/i, 3],
    [/\ba-number\b/i, 2], [/qw-[24]/i, 2],
  ],
  ISO_15614_1: [
    [/iso.{0,5}15614/i, 6], [/en.{0,5}iso.{0,5}15614/i, 6],
    [/\bwpqr\b/i, 5], [/iso.{0,5}15608/i, 4], [/iso.{0,5}6947/i, 3],
    [/\b(?:EN\s*)?ISO\s*15614/i, 6],
  ],
  AS_1554_1: [
    [/as[\s/]?nzs.{0,5}1554/i, 6], [/\bas\s*1554\b/i, 6],
    [/weldability category/i, 5], [/\bwpar\b/i, 5], [/category [1-4]/i, 3],
  ],
  AS_3992: [
    [/\bas\s*3992\b/i, 6], [/pressure equipment/i, 3],
  ],
  AWS_D1_1: [
    [/aws.{0,5}d1\.1\b/i, 6], [/\bd1\.1\b/i, 5],
    [/structural welding code/i, 5], [/prequalified wps/i, 4],
  ],
  AWS_B2_1: [
    [/aws.{0,5}b2\.1\b/i, 6], [/\bb2\.1\b/i, 5],
  ],
};

function detectStandard(params, layers, pqrData) {
  // Include qualificationStandard from document (high-signal text) twice for weight
  const stdText = params.qualificationStandard || "";
  const text = [
    stdText, stdText,
    params.wpsNumber, params.materialSpec, params.baseMtlGroup,
    params.pNumber, params.asmeGroupNumber,
    (layers||[]).map(l=>`${l.process} ${l.fillerClass} ${l.shieldGas}`).join(" "),
    pqrData ? `${pqrData.pqrNumber} ${pqrData.testPieceMaterial}` : "",
  ].join(" ");

  const scores = {};
  for (const [std, patterns] of Object.entries(STD_KEYWORDS)) {
    scores[std] = 0;
    for (const [re, w] of patterns) { if (re.test(text)) scores[std] += w; }
  }

  const sorted = Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  const [topStd, topScore] = sorted[0];
  const [,secondScore] = sorted[1];

  if (topScore === 0) return { standard: "ASME_IX", confidence: "LOW", scores };
  const confidence = topScore >= 5 && topScore >= secondScore * 2 ? "HIGH"
    : topScore >= 3 && topScore > secondScore ? "MEDIUM" : "LOW";
  return { standard: topStd, confidence, scores };
}

// ── Compliance Scoring ────────────────────────────────────────────────────
function computeScore(result) {
  if (!result) return { score: 0, earned: 0, total: 0 };
  let earned = 0, total = 0;
  for (const c of (result.essential_variable_checks||[])) {
    if (c.status === "NOT_APPLICABLE") continue;
    const w = c.weight === "essential" ? 2 : 1;
    total += w;
    if (c.status === "COMPLIANT") earned += w;
    else if (c.status === "REQUIRES_VERIFICATION") earned += w * 0.5;
  }
  for (const t of (result.pqr_tests||[])) {
    if (t.status === "NOT_APPLICABLE") continue;
    total += 1.5;
    if (t.status === "COMPLETE") earned += 1.5;
  }
  const score = total === 0 ? 100 : Math.round((earned / total) * 100);
  return { score, earned, total };
}

function scoreGrade(score) {
  if (score >= 90) return { grade:"A", color:D.pass,   label:"Excellent" };
  if (score >= 80) return { grade:"B", color:"#22c55e", label:"Good" };
  if (score >= 70) return { grade:"C", color:D.warn,   label:"Acceptable" };
  if (score >= 60) return { grade:"D", color:"#f97316", label:"Poor" };
  return               { grade:"F", color:D.fail,   label:"Failing" };
}

// ── System Prompt Builder ─────────────────────────────────────────────────
const VALIDATION_JSON_SCHEMA = `{
  "detected_standard":"string",
  "edition":"string",
  "prequalified":false,
  "prequalified_basis":"string",
  "essential_variable_checks":[
    {"variable":"string","clause":"string","recorded_value":"string","required_range":"string","status":"COMPLIANT|NON_COMPLIANT|REQUIRES_VERIFICATION|NOT_APPLICABLE","weight":"essential|standard","confidence":"HIGH|MEDIUM|LOW","note":"string (max 8 words)"}
  ],
  "pqr_tests":[
    {"test":"string","clause":"string","requirement":"string","status":"COMPLETE|INCOMPLETE|NOT_APPLICABLE","result":"string","confidence":"HIGH|MEDIUM|LOW"}
  ],
  "qualification_ranges":{"thickness":"string","positions":"string","heat_input":"string","filler_diameter":"string","pwht":"string"},
  "welder_scope":{"positions":"string","thickness":"string","process":"string","material_group":"string","clause":"string"},
  "recommendations":[
    {"priority":"critical|high|medium|low","issue":"string (max 10 words)","fix":"string (max 15 words, actionable)","clause":"string"}
  ],
  "overall_confidence":"HIGH|MEDIUM|LOW",
  "overall_summary":"string (max 20 words)"
}`;

const STD_EXTRA = {
  ASME_IX: `EDITION: Validate against ASME BPVC Section IX 2023 edition.
PREQUALIFICATION: ASME IX has NO prequalified WPS route. A supporting PQR is ALWAYS mandatory per QW-200.1. Set prequalified=false always.
TESTING REQUIREMENTS — STANDARD GROOVE/FILLET (PQR, QW-200.2): tensile (QW-150), guided bend (QW-160). Impact per referencing Code (UCS-66/UHA-51). Hardness per referencing Code. RT/UT may substitute bends per QW-191.
KEY ESSENTIAL VARIABLES (GTAW QW-255, GMAW QW-256, SMAW QW-253): base metal P-Number (QW-403.5), filler F-Number (QW-404.4), A-Number (QW-404.5), thickness range per QW-451, positions per QW-405, preheat per QW-406, PWHT per QW-407, shielding gas type (QW-408), heat input direction of change (QW-409).
STANDARD GROOVE/FILLET THICKNESS QUALIFICATION — QW-451.1: qualified range = 0.5T to 2T for all standard procedures. Use this rule for procedure types A and B only.
POSITIONS: 6G qualifies all; 2G+3G qualifies all butt.
SPECIAL WELDING PROCEDURES — OVERLAY / CLADDING / HARDFACING (QW-214 / QW-216):
  Apply the following ONLY when Step 0 identifies the procedure type as C, D, E, or F (overlay, hardfacing, repair, or other special).
  THICKNESS QUALIFICATION (special procedures only): T ≥ 19 mm (¾ in) → qualified range = 0.5T to UNLIMITED. T < 19 mm → 0.5T to 2T. Do NOT apply this unlimited rule to standard groove or fillet procedures.
  CORROSION-RESISTANT OVERLAY (QW-216): required PQR tests = chemical analysis of overlay surface (QW-462.5), ferrite determination for austenitic SS (QW-260) if specified, corrosion test if required by referencing Code. Tensile and bend tests NOT required for the overlay deposit. Essential variables per QW-250: base metal P-Number, overlay filler, process, shielding gas, heat input, preheat, PWHT. Thickness qualification based on DEPOSIT thickness, not base metal thickness.
  HARDFACING (QW-214): required PQR tests = hardness survey per QW-287 (traverse across overlay, HAZ, base metal) and macroscopic examination. Tensile and bend tests NOT required. Record hardness values from PQR as proof of compliance.`,

  ISO_15614_1: `EDITION: Validate against ISO 15614-1:2017+AMD1:2019 (latest edition).
PREQUALIFICATION: ISO 15614-1 has NO prequalified route. A WPQR is ALWAYS required per Clause 5.1. Set prequalified=false always.
TESTING REQUIREMENTS — STANDARD GROOVE/FILLET (WPQR, Table 1): butt weld: visual (6.1), RT or UT (6.2), transverse tensile ×2 (7.4.1), transverse bend ×2 root and ×2 face (7.4.2), impact if t≥12mm or required by application standard (7.4.3), hardness survey (7.4.4), macroscopic (7.4.5). Fillet weld: visual, macroscopic, fracture test.
KEY ESSENTIAL VARIABLES (Clause 7): parent material group (ISO/TR 15608), thickness range (Table 2), filler material designation, shielding gas group, heat input (±25% of WPQR value), welding position, PWHT condition.
STANDARD GROOVE/FILLET THICKNESS QUALIFICATION — Table 2: 3–12 mm → 3 mm to 2t; >12 mm → 0.5t to 2t. Max is always 2t for standard procedures — ISO 15614-1 has no unlimited upper provision for standard welds.
POSITIONS: per Table 9. Heat input: 0.5× to 2× recorded WPQR value (Clause 8.4.5).
SPECIAL WELDING PROCEDURES — HARDFACING / HARD OVERLAY:
  Apply the following ONLY when Step 0 identifies the procedure as type C, D, or F (overlay, hardfacing, or special).
  ISO 15614-7:2016 is the specific standard for hard-surfacing. If the WPS cites ISO 15614-1 for a hardfacing procedure, flag that ISO 15614-7 is more appropriate.
  THICKNESS QUALIFICATION (special procedures only): ISO 15614-7 qualifies based on deposit thickness — t ≥ 25 mm → unlimited upper range. Do NOT apply this to standard groove/fillet welds.
  Testing per ISO 15614-7: hardness survey (traverse across overlay and HAZ), macroscopic examination, chemical analysis. Tensile and bend tests NOT required for hardfacing deposits.`,

  AS_1554_1: `EDITION: Validate against AS/NZS 1554.1:2014 including Amendment 1 (latest edition).
PREQUALIFICATION CHECK (mandatory — do this FIRST per Clause 4.5):
A WPS is PREQUALIFIED (no PQR or testing of any kind required) if ALL of the following are met:
  1. Process is one of: MMAW (SMAW), SAW, GTAW, or GMAW using Spray or Pulsed transfer only (short-circuit/dip transfer cannot be prequalified)
  2. Base metal weldability Category 1, 2, or 3 per Table 2.2 (Category 4 is never prequalified)
  3. Heat input is within the limits of Table 4.5.1 for the specific process and category
  4. Minimum preheat meets or exceeds Table 4.7.1 for the base metal type and material thickness
  5. Joint design complies with Clause 5 prequalified joint geometry requirements
If ALL 5 conditions are satisfied → set prequalified=true, prequalified_basis="AS/NZS 1554.1:2014 Clause 4.5 — Prequalified WPS".
CRITICAL: For a prequalified WPS, NO qualification testing is required whatsoever — no PQR test weld, no tensile test, no bend test, NO macroscopic examination, no hardness, no impact. Set every pqr_tests entry to status NOT_APPLICABLE with note "Not required — prequalified WPS per Clause 4.5". The AS 1554.1 macroscopic examination requirement (Clause 4.4.6) applies ONLY to the full procedure qualification test route, not to prequalified WPS.
NOTE: Welder/operator qualification under AS 2980 is a SEPARATE requirement from WPS prequalification and is outside the scope of this WPS validation.
If ANY of the 5 conditions fails → full procedure qualification per Clause 4.4 is required — set prequalified=false.
TESTING REQUIREMENTS (fully qualified path only, Clause 4.4): transverse tensile ×2 (Clause 4.4.3), bend tests ×4 transverse or ×2 longitudinal (Clause 4.4.4), macroscopic examination ×1 (Clause 4.4.6), impact if required by application standard (Clause 4.4.5), hardness optional.
STANDARD GROOVE/FILLET THICKNESS QUALIFICATION — Table 4.8.1: qualified range = 0.5t to 2t for all standard procedures (types A and B). Use this for all standard groove and fillet welds.
POSITIONS: as tested per Table 4.9. Heat input: must not exceed the qualified test piece maximum.
SPECIAL WELDING PROCEDURES — OVERLAY / HARDFACING (AS 1554.6):
  Apply the following ONLY when Step 0 identifies the procedure as type C, D, or F (overlay, hardfacing, or special).
  AS/NZS 1554.6 is the specific Australian Standard for hard overlay and hardfacing. Flag if the WPS cites 1554.1 for an overlay procedure — 1554.6 is more appropriate.
  THICKNESS QUALIFICATION (special procedures only): t ≥ 25 mm → qualified range = 0.5t to UNLIMITED (per special welding procedure clause). t < 25 mm → 0.5t to 2t. Apply ONLY for procedure types C, D, F — never for standard groove/fillet welds.
  Testing per AS 1554.6: hardness (Clause 4.6), chemical analysis (Clause 4.5), macroscopic (Clause 4.7). Tensile and bend tests NOT required for hardfacing deposits. Record any hardness, chemistry, or macro results from the PQR as proof of compliance.`,

  AS_3992: `EDITION: Validate against AS 3992:2020 (current edition — supersedes AS 3992:1998). If the document cites AS 3992:1998, flag this as the superseded edition and note that 2020 requirements apply.
PREQUALIFICATION: AS 3992 has NO prequalified route. A PQR is ALWAYS required per Clause 4.1. Set prequalified=false always.
TESTING REQUIREMENTS — STANDARD GROOVE/FILLET (PQR, Clause 7): transverse tensile ×2, guided bend ×4 (root ×2, face ×2 or side ×4 if t≥12mm), macroscopic ×1, impact if required by design standard (T<0°C or notch-toughness specified), hardness survey if required by design or application standard. Radiographic or ultrasonic examination of test weld per Clause 7.2.
KEY ESSENTIAL VARIABLES (Clause 6): base material group, filler classification and designation, shielding gas, heat input range (0.5× to 1.25× PQR value), welding position, PWHT condition, preheat temperature.
STANDARD GROOVE/FILLET THICKNESS QUALIFICATION — Clause 7.4: qualified range = 0.5t to 2t for all standard procedures (types A and B). Material grouping per AS 3992 Table 1. Heat input: 0.5× to 1.25× of the PQR recorded value.
SPECIAL WELDING PROCEDURES — OVERLAY / SPECIAL PROCESS (Clauses 7.6 / 7.7):
  Apply the following ONLY when Step 0 identifies the procedure as type C, D, E, or F (overlay, hardfacing, repair, or special).
  THICKNESS QUALIFICATION (special procedures only): t ≥ 25 mm → qualified range = 0.5t to UNLIMITED (per special welding procedure clause). t < 25 mm → 0.5t to 2t. Apply ONLY for procedure types C, D, E, F — NEVER for standard groove or fillet welds.
  CORROSION-RESISTANT OVERLAY (Clause 7.6): required tests = chemical analysis of the overlay (ferrite for austenitic overlays if specified), hardness of base metal HAZ, visual examination. Tensile and bend tests of the overlay deposit NOT required by Clause 7.6. Essential variables: base metal group, filler classification, process, shielding gas, heat input (dilution control), preheat, PWHT. Record chemistry/hardness results from PQR as satisfying applicable test requirements.`,

  AWS_D1_1: `EDITION: Validate against AWS D1.1/D1.1M:2020 Structural Welding Code — Steel (latest ratified edition as of 2025; 2022 edition also available — note edition on document and flag if 2022 applies).
PREQUALIFICATION CHECK (mandatory — do this FIRST per Clause 7):
A WPS is PREQUALIFIED if ALL of the following are met:
  1. Base metal is from Table 3.1 approved prequalified base metal list
  2. Welding process is SMAW, SAW, GMAW (excluding Short-Circuit transfer), or FCAW
  3. Joint design matches a prequalified detail from Clause 7.9 / Figure 7.1–7.4
  4. Minimum preheat meets Table 3.2 for the base metal and thickness
  5. Filler metal meets Table 3.4 minimum strength matching requirements
  6. All essential variable limits of Clause 7.6 are satisfied
If ALL met → set prequalified=true, prequalified_basis="AWS D1.1 Clause 7 prequalified WPS", pqr_tests=[].
If ANY fails → qualification test (PQR) required per Clause 6. Short-Circuit GMAW ALWAYS requires a PQR regardless of other conditions.
TESTING REQUIREMENTS (PQR, Clause 6.9): groove weld — RT or bend tests, tensile test; fillet weld — fracture and macroscopic.
STANDARD GROOVE/FILLET THICKNESS QUALIFICATION — Table 4.5: qualified range = 0.5t to 2t for standard procedures. Prequalified WPS for structural joints have no upper thickness limit when the production weld thickness meets the joint design requirements.
SPECIAL WELDING PROCEDURES — OVERLAY / HARDFACING:
  Apply the following ONLY when Step 0 identifies the procedure as type C, D, or F.
  AWS D1.1 is a structural steel code and does NOT cover hardfacing or corrosion-resistant overlay procedures. Flag prominently if the WPS describes an overlay/hardfacing application — AWS D1.1 is not the appropriate standard. Recommend AWS D16.0 (hard overlay) or ASME IX QW-216 (pressure equipment cladding) instead.
  THICKNESS QUALIFICATION (special procedures): t ≥ 10 mm → unlimited upper range per the applicable overlay standard. Apply ONLY for overlay/special procedure types, never for standard groove/fillet welds.`,

  AWS_B2_1: `EDITION: Validate against AWS B2.1/B2.1M:2021 (latest edition).
PREQUALIFICATION: AWS B2.1 has NO prequalified route. A PQR is ALWAYS required per Clause 4.1. Set prequalified=false always.
TESTING REQUIREMENTS — STANDARD GROOVE/FILLET (PQR, Clause 6): transverse tensile ×2, guided bend ×4 (or side bends ×4 if t≥3/4 in), macroscopic if fillet. Impact if required by referencing document. RT or UT may substitute bend tests per Clause 6.3.
KEY ESSENTIAL VARIABLES (Clause 5.4): base metal P-Number per QW/QB-422, filler F-Number, thickness range per Table 5.1, positions, preheat, PWHT, shielding gas, heat input direction.
STANDARD GROOVE/FILLET THICKNESS QUALIFICATION — Table 5.1: qualified range = 0.5T to 2T for all standard procedures (types A and B). Use this for all standard groove and fillet welds only.
SPECIAL WELDING PROCEDURES — OVERLAY / CLADDING / HARDFACING (Clause 8):
  Apply the following ONLY when Step 0 identifies the procedure as type C, D, or F (overlay, hardfacing, or special).
  THICKNESS QUALIFICATION (special procedures only): T ≥ 19 mm (¾ in) → qualified range = 0.5T to UNLIMITED. T < 19 mm → 0.5T to 2T. Apply ONLY for overlay/special procedure types — NEVER for standard groove or fillet welds.
  Testing per Clause 8.2: hardness survey (traverse across overlay and HAZ), macroscopic examination, chemical analysis for corrosion-resistant overlays. Tensile and bend tests NOT required for overlay deposit per Clause 8.2.1. Record hardness, macro, and chemistry results from PQR as satisfying qualification test requirements.`,
};

function buildValidationSystemPrompt(std, edition, documentStatedStandard, hasDocument, hasPqrDoc) {
  const stdNote = documentStatedStandard
    ? `\nNOTE: The document states it was qualified under "${documentStatedStandard}". Validate against ${STD_LABEL[std]} ${edition} as instructed.`
    : "";
  const srcRule = hasDocument
    ? `\nDATA SOURCE: The WPS document is attached${hasPqrDoc ? " and the supporting PQR document is also attached" : ""}. Read BOTH documents directly — every corner, every table row, every test result section. The "recorded_value" for each check must reflect what is actually written on the document(s). Only set status to NON_COMPLIANT after you have confirmed the information is genuinely absent from ALL attached documents.`
    : `\nDATA SOURCE: Validate from the supplied JSON parameters.`;
  return `You are a senior welding engineer and ${STD_LABEL[std]} codes specialist with deep expertise in all procedure qualification routes including standard groove/fillet welds, overlay/cladding, hardfacing, and repair procedures.
Validate this WPS/PQR against ${STD_LABEL[std]} ${edition} ONLY.${stdNote}${srcRule}
Return strict JSON only — no markdown, no preamble, no trailing text after the closing brace.

STEP 0 — IDENTIFY PROCEDURE TYPE (do this FIRST — it controls which clauses apply):
Examine the WPS and any attached PQR document. Identify the procedure type:
  A) STANDARD GROOVE WELD — full penetration butt weld, partial penetration weld
  B) FILLET / STRUCTURAL WELD — fillet, T-joint, corner, lap joints
  C) WELD OVERLAY / CLADDING — corrosion-resistant overlay (CRO), butter layer, transition layer applied to a base metal surface
  D) HARDFACING / HARD OVERLAY — wear-resistant deposit applied to a base metal surface for hardness/abrasion resistance
  E) REPAIR WELD — in-service or post-fabrication repair procedure
  F) OTHER SPECIAL — stud welding, electroslag, thermite, or proprietary process
Clues: look for words like "overlay", "cladding", "hardface", "hard overlay", "deposit", "wear", "corrosion resistant weld metal", "butter", "transition layer" in the title, scope, or application notes.
Record the identified type in "overall_summary". This MUST change which tests and essential variables you evaluate (see overlay/hardfacing section in the standard guidance below).

STEP 1 — PREQUALIFICATION DECISION (applies to type A and B only — overlays have no prequalified route):
Follow the prequalification rules for ${STD_LABEL[std]} in the standard guidance below. Set prequalified=true or false. If prequalified=true, PQR tests are not required (set pqr_tests to appropriate NOT_APPLICABLE entries). This determination affects ALL subsequent scoring.

STEP 2 — EDITION COMPLIANCE:
Validate against ${STD_LABEL[std]} ${edition} specifically. If the document references an older edition, note the delta and flag any requirements added in ${edition} that may not be satisfied.

STEP 3 — ESSENTIAL VARIABLE ASSESSMENT:
Apply ONLY the essential variable checks relevant to the procedure type identified in Step 0.
- weight "essential" = code-listed essential variable (change requires new PQR); "standard" = required record but non-essential
- TRANSFER MODE: GMAW/FCAW only → assess; SMAW/GTAW/SAW → NOT_APPLICABLE
- POSITIONS: check entire document including qualification ranges section; genuinely absent = NON_COMPLIANT
- PREHEAT / INTERPASS: if stated anywhere on document → assess value; completely absent = NON_COMPLIANT
- HEAT INPUT: check qualification ranges table AND welding parameters table (amps × volts ÷ travel speed × 60/1000 = kJ/mm); if calculable from parameters → use calculated value; absent entirely = NON_COMPLIANT
- LINKED PQR: check all four corners, header, title block, "Supporting PQR", "PQR No.", "WPQR No." — absent = NON_COMPLIANT (unless prequalified)
- THICKNESS QUALIFIED RANGE (standard groove/fillet — types A and B): apply 0.5t to 2t. This is the standard rule for groove and fillet weld procedures.
- THICKNESS QUALIFIED RANGE (special procedures — types C, D, E, F only): do NOT use the flat 2t cap. Instead, apply the unlimited-threshold rule from the standard guidance below (the threshold varies by standard — e.g. 25 mm for AS standards, 19 mm for ASME/AWS B2.1). If the WPS states "unlimited" on the upper side AND the PQR test piece meets the threshold, this is COMPLIANT — do not flag it as NON_COMPLIANT.
- NON_COMPLIANT = field genuinely absent from the entire document OR value clearly violates the code
- REQUIRES_VERIFICATION = data present but requires independent engineering confirmation
- NOT_APPLICABLE = not relevant to this process, joint type, or standard
- recorded_value: write what you actually found in the document, not "not found"
- PQR DOCUMENT: if a PQR is attached, read ALL test result tables, ALL run data, hardness surveys, chemical analysis results. Cross-reference WPS qualified ranges against PQR actual values. A test is COMPLETE if the PQR shows the result — do NOT mark INCOMPLETE merely because the WPS itself doesn't state test results.

STEP 4 — RECOMMENDATIONS:
Include ONLY NON_COMPLIANT and REQUIRES_VERIFICATION items. Sort critical (safety/code-mandatory) → high → medium → low. Each recommendation must cite the exact clause.

${STD_EXTRA[std] || ""}

Return ONLY this JSON (no text before or after):
${VALIDATION_JSON_SCHEMA}`;
}

// ── JSON Repair + Parse ───────────────────────────────────────────────────
function repairTruncatedJSON(s) {
  let result = s.trimEnd();

  // ── Step 1: strip incomplete trailing tokens ──
  // "key": "partial_or_empty — cut mid-value string
  result = result.replace(/,?\s*"(?:[^"\\]|\\.|\r?\n)*"\s*:\s*"(?:[^"\\]|\\.|\r?\n)*$/, '');
  // "key": — key with colon but no value
  result = result.replace(/,?\s*"(?:[^"\\]|\\.|\r?\n)*"\s*:\s*$/, '');
  // bare incomplete string at end
  result = result.replace(/,?\s*"(?:[^"\\]|\\.|\r?\n)*$/, '');
  // trailing comma (possibly left after stripping above)
  result = result.replace(/,\s*$/, '');

  // ── Step 2: stack-based walk — tracks EXACT nesting order ──
  // Closing all ]s before all }s (old approach) is wrong when they interleave:
  // e.g. {"a":[{"b":"c" needs } ] } not ] } }
  const stack = [];
  let inStr = false, escaped = false;
  for (const c of result) {
    if (escaped)             { escaped = false; continue; }
    if (c === '\\' && inStr) { escaped = true;  continue; }
    if (c === '"')           { inStr = !inStr;  continue; }
    if (inStr)               continue;
    if      (c === '{')      stack.push('}');
    else if (c === '[')      stack.push(']');
    else if (c === '}' || c === ']') stack.pop();
  }

  // Close any unterminated string, then close brackets/braces in correct order
  if (inStr) result += '"';
  while (stack.length) result += stack.pop();
  return result;
}

function parseJSON(raw) {
  const stripped = raw.replace(/^```(?:json)?\s*/i,"").replace(/\s*```\s*$/,"").trim();
  try { return JSON.parse(stripped); } catch(_) {}
  try { return JSON.parse(repairTruncatedJSON(stripped)); } catch(e) {
    throw new Error("JSON parse failed after repair attempt: "+e.message);
  }
}

// ── API Helpers ───────────────────────────────────────────────────────────
const ANTHROPIC_URL = window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"
  ? "/api/anthropic/v1/messages"
  : "https://api.anthropic.com/v1/messages";

async function callClaude(userContent, apiKey, systemOverride, maxTokens=1500, model="claude-opus-4-7") {
  const r = await fetch(ANTHROPIC_URL, {
    method:"POST",
    headers:{
      "x-api-key":apiKey,
      "anthropic-version":"2023-06-01",
      "content-type":"application/json",
      "anthropic-dangerous-direct-browser-access":"true",
    },
    body:JSON.stringify({ model, max_tokens:maxTokens, system:systemOverride, messages:[{role:"user",content:userContent}] }),
  });
  if (!r.ok) { const t=await r.text(); const err=new Error(`API ${r.status}: ${t}`); err.status=r.status; throw err; }
  return (await r.json()).content[0].text;
}

const OPUS = "claude-opus-4-7";

async function extractFromDoc(b64, mimeType, apiKey) {
  const block = mimeType.startsWith("image/")
    ? {type:"image",source:{type:"base64",media_type:mimeType,data:b64}}
    : {type:"document",source:{type:"base64",media_type:mimeType,data:b64}};
  return callClaude(
    [block,{type:"text",text:EXTRACTION_PROMPT}],
    apiKey,
    "You are a welding document specialist. Read every part of the document thoroughly — every table, corner, header, and section. Extract all WPS parameters. Return strict JSON only — no markdown, no extra text. Never fabricate data.",
    4000, OPUS
  );
}

// Converts an Excel/XLS file (File object) to a plain-text representation for Claude
async function excelToText(file) {
  const buf = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsArrayBuffer(file);
  });
  const wb = XLSX.read(buf, { type: "array" });
  return wb.SheetNames.map(name => {
    const ws = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
    return `=== Sheet: ${name} ===\n${csv}`;
  }).join("\n\n");
}

// Detect whether a file is an Excel workbook by extension or MIME type
function isExcelFile(f) {
  return /\.(xlsx?|xlsm|xlsb)$/i.test(f.name) ||
    f.type === "application/vnd.ms-excel" ||
    f.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

const EXTRACTION_PROMPT = `You are extracting data from a welding document. Read EVERY part of the document — headers, footers, all four corners, every table row, every column in every table, qualification ranges sections, and welding parameter/essential variables tables. Do not skip any section.

CRITICAL — PQR RULE: Only populate "pqr" if this document contains a clearly labelled Procedure Qualification Record section with ACTUAL test results (tensile, bend, impact, hardness, macro, radiography values). A WPS that references a PQR number does NOT contain PQR data — set "pqr": null.

Return strict JSON:
{
  "wps": { each field as {value, confidence:'HIGH'|'MEDIUM'|'LOW'} },
  "pqr": { each field as {value, confidence} } or null if no PQR section
}

WPS fields to extract (search the ENTIRE document for each):
- wpsNumber: WPS/procedure number — check header, top corners, title block
- revisionNumber: revision or version number
- qualificationStandard: code/standard this WPS was qualified under (e.g. "ASME Section IX", "ISO 15614-1", "AS 1554.1", "AWS D1.1") — check stamps, approval boxes, title block
- linkedPqr: the supporting PQR/WPQR number that qualifies this WPS — check ALL corners, header, title block, "Supported by" or "Qualified by" fields. This is often in the top-left or top-right corner labelled "PQR No.", "Supporting PQR", "WPQR No.", or similar.
- validatedBy: name of approver/signatory
- process: welding process code (GMAW, GTAW, SMAW, FCAW, SAW)
- materialSpec: full base material specification as written
- baseMtlGroup: material group/category (P-Number, ISO group, AS category)
- pNumber: P-Number if stated
- asmeGroupNumber: ASME Group Number if stated
- thickness: qualified thickness range (e.g. "3–20 mm") — check qualification ranges section
- fillerClass: filler metal classification/designation
- fillerDia: filler diameter range
- shieldGas: shielding gas type and composition
- gasFlow: gas flow rate range
- preheat: minimum preheat temperature
- interpass: maximum interpass temperature
- pwht: true/false whether PWHT is required
- pwhtTempMin, pwhtTempMax, pwhtHold: PWHT parameters if applicable
- heatInputMin: minimum heat input — check BOTH the qualification ranges section AND the welding parameters table. May be labelled "Min HI", "Heat Input Min", or calculable from amps×volts÷speed.
- heatInputMax: maximum heat input — same sources as above
- heatInputUnit: unit (kJ/mm or kJ/cm)
- currentType: polarity (DCEP, DCEN, AC)
- transferMode: for GMAW only — Spray, Short Circuit/Dip, Pulse/Pulsed, Globular. For SMAW/GTAW/SAW set "N/A".
- jointType: joint type (Butt, Fillet, T-joint, etc.)
- positions: ALL welding positions qualified — check the qualification ranges section AND any position diagrams. ASME: 1G,2G,3G,4G,5G,6G,1F,2F,3F,4F. ISO: PA,PB,PC,PD,PE,PF,PG.
- multiPass: true/false
- multiWire: true/false
- backing: true/false whether backing is used
- backingMtl: backing material if applicable

WELDING PARAMETERS (from the parameters/essential variables table — usually at the bottom or a dedicated section):
- ampsMin, ampsMax: amperage range
- voltsMin, voltsMax: voltage range
- travelSpeedMin, travelSpeedMax: travel speed range and unit
- wireFeedMin, wireFeedMax: wire feed speed range (GMAW/FCAW only)

PQR fields (only if PQR section found): pqrNumber, pqrLinkedWps, pqrTestDate, pqrWitnessedBy, pqrTestPieceThickness, pqrTestPieceMaterial, pqrActualHeatInputMin, pqrActualHeatInputMax, pqrActualPreheat, pqrActualInterpass, pqrTensileResult (PASS/FAIL/PENDING), pqrTensileValues, pqrBendResult (PASS/FAIL/PENDING), pqrBendType, pqrImpactResult (PASS/FAIL/PENDING/NOT_REQUIRED), pqrImpactValues, pqrImpactTemp, pqrHardnessResult (PASS/FAIL/PENDING/NOT_REQUIRED), pqrHardnessValues, pqrMacroResult (PASS/FAIL/PENDING/NOT_REQUIRED), pqrRadiographyResult (PASS/FAIL/PENDING/NOT_REQUIRED), pqrNDTOther, pqrOverallResult (ACCEPTED/REJECTED/UNKNOWN), pqrApprovedBy.

Missing/not stated fields: value empty string, confidence LOW.`;

async function extractFromText(textContent, apiKey) {
  return callClaude(
    [{type:"text", text:`${EXTRACTION_PROMPT}\n\nDOCUMENT CONTENT (converted from Excel spreadsheet):\n\n${textContent}`}],
    apiKey,
    "You are a welding document specialist. Read the document content thoroughly. Extract all WPS parameters. Return strict JSON only — no markdown, no extra text. Never fabricate data.",
    4000, OPUS
  );
}

// ── Primitive Components ──────────────────────────────────────────────────
function ConfBadge({level,small}) {
  const sz=small?{fontSize:9,padding:"1px 5px"}:{fontSize:10,padding:"2px 7px"};
  const s={
    HIGH:{background:D.pass,color:"#fff",border:"none"},
    MEDIUM:{background:"transparent",color:D.warn,border:`1px solid ${D.warn}`},
    LOW:{background:"transparent",color:D.fail,border:`1px solid ${D.fail}`,animation:"pulse 1.5s infinite"},
  };
  return <span style={{...sz,borderRadius:4,fontWeight:700,letterSpacing:"0.04em",fontFamily:"'DM Mono',monospace",...(s[level]||s.LOW)}}>{level||"?"}</span>;
}

function StatusBadge({status}) {
  const cfg={
    COMPLIANT:            {bg:D.passBg,border:D.passBorder,color:D.pass,   label:"COMPLIANT"},
    NON_COMPLIANT:        {bg:D.failBg,border:D.failBorder,color:D.fail,   label:"NON-COMPLIANT"},
    REQUIRES_VERIFICATION:{bg:D.warnBg,border:D.warnBorder,color:D.warn,   label:"VERIFY"},
    COMPLETE:             {bg:D.passBg,border:D.passBorder,color:D.pass,   label:"COMPLETE"},
    INCOMPLETE:           {bg:D.failBg,border:D.failBorder,color:D.fail,   label:"INCOMPLETE"},
    NOT_APPLICABLE:       {bg:"rgba(100,100,120,.1)",border:"rgba(100,100,120,.2)",color:D.textSoft,label:"N/A"},
  };
  const c=cfg[status]||cfg.NOT_APPLICABLE;
  return <span style={{background:c.bg,border:`1px solid ${c.border}`,color:c.color,fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,fontFamily:"'DM Mono',monospace",letterSpacing:"0.04em",whiteSpace:"nowrap"}}>{c.label}</span>;
}

function SH({children,mt=16}) {
  return <div style={{color:D.textMid,fontSize:11,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginTop:mt,marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${D.border}`}}>{children}</div>;
}
function Lbl({c,req}) {
  return <div style={{color:D.textMid,fontSize:11,fontWeight:500,marginBottom:4}}>{c}{req&&<span style={{color:D.fail,marginLeft:2}}>*</span>}</div>;
}
function Card({children,style={}}) {
  return <div style={{background:D.surface,border:`1px solid ${D.border}`,borderRadius:8,padding:16,...style}}>{children}</div>;
}
function Spinner({label="Running validation…"}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:40,flexDirection:"column"}}>
      <div style={{width:22,height:22,border:`2px solid ${D.border}`,borderTopColor:D.accent,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
      <span style={{color:D.textMid,fontSize:13}}>{label}</span>
    </div>
  );
}
function Btn({children,onClick,color,outline,disabled,style={},small}) {
  const c=color||D.accent;
  const base={border:`1px solid ${c}`,borderRadius:6,fontWeight:600,fontSize:small?11:13,padding:small?"4px 10px":"8px 16px",fontFamily:"'Inter',sans-serif",...style};
  return <button onClick={onClick} disabled={disabled} style={outline?{...base,background:"transparent",color:c}:{...base,background:c,color:"#fff"}}>{children}</button>;
}
function TabBar({tabs,active,setActive}) {
  return (
    <div style={{display:"flex",borderBottom:`1px solid ${D.border}`,background:D.surfaceAlt,overflowX:"auto",flexShrink:0}}>
      {tabs.map(([id,label,badge])=>(
        <button key={id} onClick={()=>setActive(id)} style={{background:"none",border:"none",padding:"10px 16px",fontSize:12,fontWeight:active===id?700:500,color:active===id?D.accent:D.textMid,borderBottom:active===id?`2px solid ${D.accent}`:"2px solid transparent",whiteSpace:"nowrap",fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:6}}>
          {label}
          {badge&&<span style={{background:D.failBg,border:`1px solid ${D.failBorder}`,color:D.fail,fontSize:10,fontWeight:700,padding:"1px 5px",borderRadius:10}}>{badge}</span>}
        </button>
      ))}
    </div>
  );
}
function Tip({text,children}) {
  const [show,setShow]=useState(false);
  return (
    <span style={{position:"relative",display:"inline-block"}} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      {show&&text&&<div style={{position:"absolute",bottom:"calc(100% + 4px)",left:"50%",transform:"translateX(-50%)",background:D.surfaceHov,border:`1px solid ${D.border}`,borderRadius:6,padding:"6px 10px",fontSize:11,color:D.text,whiteSpace:"normal",zIndex:100,boxShadow:D.shadowMd,maxWidth:280,lineHeight:1.5,width:"max-content"}}>{text}</div>}
    </span>
  );
}

// ── LowConfVerify ─────────────────────────────────────────────────────────
function LowConfVerify({id}) {
  const key=`lcv_${id}`;
  const [name,setName]=useState(()=>localStorage.getItem(key)||"");
  const [done,setDone]=useState(()=>!!localStorage.getItem(key));
  const confirm=()=>{
    if(!name.trim())return;
    localStorage.setItem(key,`${name} — ${new Date().toLocaleString()}`);
    setDone(true);
  };
  if(done) return <div style={{marginTop:4,color:D.pass,fontSize:9}}>✓ Verified: {localStorage.getItem(key)}</div>;
  return (
    <div style={{marginTop:6,background:"rgba(239,68,68,.06)",border:`1px solid ${D.failBorder}`,borderRadius:5,padding:"5px 7px"}}>
      <div style={{color:D.fail,fontSize:9,fontWeight:600,marginBottom:3}}>⚠ LOW confidence — reviewer sign-off required</div>
      <div style={{display:"flex",gap:5}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Reviewer name" style={{...INP,padding:"3px 7px",fontSize:10}}/>
        <Btn small disabled={!name.trim()} onClick={confirm} color={D.pass}>Confirm</Btn>
      </div>
    </div>
  );
}

// ── Process Layer Form ────────────────────────────────────────────────────
function LayerForm({layer,idx,onChange,total,onAdd,onRemove}) {
  const set=(k,v)=>onChange(idx,{...layer,[k]:v});
  const LABELS=["ROOT PASS","FILL PASS","CAP PASS"];
  return (
    <Card style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{color:D.accent,fontSize:11,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>LAYER {idx+1} — {LABELS[idx]||`PASS ${idx+1}`}</span>
        <div style={{display:"flex",gap:6}}>
          {idx===total-1&&total<3&&<Btn small onClick={onAdd} color={D.pass}>+ Layer</Btn>}
          {total>1&&<Btn small outline onClick={()=>onRemove(idx)} color={D.fail}>Remove</Btn>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <div><Lbl c="Process"/><select value={layer.process} onChange={e=>set("process",e.target.value)} style={INP}>{PROCESSES.map(p=><option key={p}>{p}</option>)}</select></div>
        <div><Lbl c="Filler Classification"/><input value={layer.fillerClass} onChange={e=>set("fillerClass",e.target.value)} placeholder="e.g. ER70S-6" style={INP}/></div>
        <div><Lbl c="Filler Diameter"/><input value={layer.fillerDia} onChange={e=>set("fillerDia",e.target.value)} placeholder="e.g. 1.2 mm" style={INP}/></div>
        <div><Lbl c="Shielding Gas"/><input value={layer.shieldGas} onChange={e=>set("shieldGas",e.target.value)} placeholder="e.g. 75%Ar/25%CO₂" style={INP}/></div>
        <div><Lbl c="Gas Flow Rate"/><input value={layer.gasFlow} onChange={e=>set("gasFlow",e.target.value)} placeholder="e.g. 15 L/min" style={INP}/></div>
        <div><Lbl c="Current/Polarity"/><select value={layer.currentType} onChange={e=>set("currentType",e.target.value)} style={INP}>{["DCEP","DCEN","AC"].map(c=><option key={c}>{c}</option>)}</select></div>
        {layer.process==="GMAW"&&<div><Lbl c="Transfer Mode"/><select value={layer.transferMode} onChange={e=>set("transferMode",e.target.value)} style={INP}>{["Spray","Short Circuit","Pulse","Globular"].map(m=><option key={m}>{m}</option>)}</select></div>}
        <div><Lbl c={`Heat Input Min (${layer.hiUnit})`}/><input value={layer.hiMin} onChange={e=>set("hiMin",e.target.value)} placeholder="0.8" style={INP}/></div>
        <div>
          <Lbl c="Heat Input Max"/>
          <div style={{display:"flex",gap:6}}>
            <input value={layer.hiMax} onChange={e=>set("hiMax",e.target.value)} placeholder="2.5" style={{...INP,flex:1}}/>
            <select value={layer.hiUnit} onChange={e=>set("hiUnit",e.target.value)} style={{...INP,width:72}}><option>kJ/mm</option><option>kJ/in</option></select>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Manual Input Panel ────────────────────────────────────────────────────
function ManualInput({params,setParams,layers,setLayers,editions,setEditions,suppReqs,setSuppReqs,errors,targetStd,setTargetStd}) {
  const set=k=>e=>setParams(p=>({...p,[k]:e.target.value}));
  const setBool=k=>e=>setParams(p=>({...p,[k]:e.target.checked}));
  const togglePos=pos=>setParams(p=>({...p,positions:p.positions.includes(pos)?p.positions.filter(x=>x!==pos):[...p.positions,pos]}));
  return (
    <div style={{padding:20,overflowY:"auto",flex:1}}>
      {/* Identity & Material */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SH mt={0}>WPS Identity</SH>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><Lbl c="WPS Number" req/><input value={params.wpsNumber} onChange={set("wpsNumber")} placeholder="WPS-042" style={{...INP,borderColor:errors.wpsNumber?D.fail:undefined}}/></div>
            <div><Lbl c="Linked PQR"/><input value={params.linkedPqr} onChange={set("linkedPqr")} placeholder="PQR-012" style={INP}/></div>
          </div>
          <Lbl c="Validated By" req/><input value={params.validatedBy} onChange={set("validatedBy")} placeholder="Full name" style={{...INP,borderColor:errors.validatedBy?D.fail:undefined}}/>
        </Card>
        <Card>
          <SH mt={0}>Base Material</SH>
          <div style={{marginBottom:10}}>
            <Lbl c="Material Specification"/>
            <input value={params.materialSpec} onChange={set("materialSpec")} placeholder="e.g. SA-516 Grade 70 / AS 1548-7-430" style={INP}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            <div><Lbl c="P-Number (ASME IX)"/><input value={params.pNumber} onChange={set("pNumber")} placeholder="e.g. P-1" style={INP}/></div>
            <div><Lbl c="Group No. (ASME IX)"/><input value={params.asmeGroupNumber} onChange={set("asmeGroupNumber")} placeholder="e.g. 1" style={INP}/></div>
            <div><Lbl c="AS / ISO Group"/><input value={params.baseMtlGroup} onChange={set("baseMtlGroup")} placeholder="e.g. 1.1" style={INP}/></div>
          </div>
          <Lbl c="Base Metal Thickness (mm)" req/><input value={params.thickness} onChange={set("thickness")} placeholder="20" style={{...INP,borderColor:errors.thickness?D.fail:undefined}}/>
        </Card>
      </div>

      {/* Process layers */}
      <div style={{marginBottom:16}}>
        <div style={{color:D.textMid,fontSize:11,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${D.border}`}}>Process Layers</div>
        {layers.map((l,i)=><LayerForm key={i} layer={l} idx={i} onChange={(i,v)=>setLayers(ls=>ls.map((x,j)=>j===i?v:x))} total={layers.length} onAdd={()=>setLayers(ls=>[...ls,mkLayer()])} onRemove={i=>setLayers(ls=>ls.filter((_,j)=>j!==i))}/>)}
      </div>

      {/* Joint, positions, thermal */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SH mt={0}>Joint & Configuration</SH>
          <Lbl c="Joint Type"/><select value={params.jointType} onChange={set("jointType")} style={{...INP,marginBottom:10}}>{JOINT_TYPES.map(j=><option key={j}>{j}</option>)}</select>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            {[["multiPass","Multi-Pass"],["multiWire","Multi-Wire"],["backing","Backing Used"]].map(([k,l])=>(
              <label key={k} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"6px 8px",background:params[k]?D.accentFaint:D.surfaceAlt,border:`1px solid ${params[k]?D.accentBorder:D.border}`,borderRadius:6}}>
                <input type="checkbox" checked={params[k]} onChange={setBool(k)} style={{accentColor:D.accent}}/>
                <span style={{color:params[k]?D.accent:D.textMid,fontSize:12}}>{l}</span>
              </label>
            ))}
          </div>
          {params.backing&&<><Lbl c="Backing Material"/><input value={params.backingMtl} onChange={set("backingMtl")} placeholder="Ceramic / Steel / Flux" style={INP}/></>}
        </Card>
        <Card>
          <SH mt={0}>Welding Positions</SH>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {POSITIONS.map(pos=>{const s=params.positions.includes(pos);return(
              <label key={pos} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 8px",background:s?D.accentFaint:D.surfaceAlt,border:`1px solid ${s?D.accentBorder:D.border}`,borderRadius:5,cursor:"pointer"}}>
                <input type="checkbox" checked={s} onChange={()=>togglePos(pos)} style={{accentColor:D.accent}}/>
                <span style={{color:s?D.accent:D.textMid,fontSize:11,fontFamily:"'DM Mono',monospace"}}>{pos}</span>
              </label>
            );})}
          </div>
        </Card>
      </div>

      {/* Thermal */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SH mt={0}>Thermal Parameters</SH>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><Lbl c="Preheat Min (°C)"/><input value={params.preheat} onChange={set("preheat")} placeholder="50" style={INP}/></div>
            <div><Lbl c="Interpass Max (°C)"/><input value={params.interpass} onChange={set("interpass")} placeholder="250" style={INP}/></div>
          </div>
        </Card>
        <Card>
          <SH mt={0}>Post Weld Heat Treatment</SH>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:params.pwht?10:0}}>
            <input type="checkbox" checked={params.pwht} onChange={setBool("pwht")} style={{accentColor:D.accent}}/>
            <span style={{color:D.textMid,fontSize:12}}>PWHT Required</span>
          </label>
          {params.pwht&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:6}}>
            <div><Lbl c="Temp Min °C"/><input value={params.pwhtTempMin} onChange={set("pwhtTempMin")} placeholder="580" style={INP}/></div>
            <div><Lbl c="Temp Max °C"/><input value={params.pwhtTempMax} onChange={set("pwhtTempMax")} placeholder="620" style={INP}/></div>
            <div><Lbl c="Hold (hr)"/><input value={params.pwhtHold} onChange={set("pwhtHold")} placeholder="1" style={INP}/></div>
          </div>}
        </Card>
      </div>

      {/* Target Standard + Edition */}
      <Card style={{marginBottom:16}}>
        <SH mt={0}>Target Standard</SH>
        <div style={{color:D.textSoft,fontSize:11,marginBottom:10}}>Auto-detected from document content. Override if needed.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <Lbl c="Standard"/>
            <select value={targetStd} onChange={e=>setTargetStd(e.target.value)} style={INP}>
              {STANDARDS.map(s=><option key={s} value={s}>{STD_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <Lbl c="Edition"/>
            <select value={editions[targetStd]} onChange={e=>setEditions(ed=>({...ed,[targetStd]:e.target.value}))} style={INP}>
              {(EDITIONS[targetStd]||[]).map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Supplementary */}
      <Card>
        <SH mt={0}>Supplementary Requirements</SH>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:suppReqs.length?10:0}}>
          {SUPP_PRESETS.map(p=>{const a=suppReqs.some(r=>r.id===p.id);return(
            <Btn key={p.id} small outline={!a} color={a?D.pass:D.textMid} onClick={()=>setSuppReqs(sr=>a?sr.filter(r=>r.id!==p.id):[...sr,p])}>{p.label}</Btn>
          );})}
        </div>
        {suppReqs.length>0&&<div style={{display:"flex",flexDirection:"column",gap:5}}>
          {suppReqs.map(r=><div key={r.id} style={{background:D.passBg,border:`1px solid ${D.passBorder}`,borderRadius:5,padding:"5px 10px",fontSize:12,color:D.pass,display:"flex",justifyContent:"space-between"}}>
            <span>{r.label}</span>
            <button onClick={()=>setSuppReqs(sr=>sr.filter(x=>x.id!==r.id))} style={{background:"none",border:"none",color:D.textSoft,cursor:"pointer"}}>✕</button>
          </div>)}
        </div>}
      </Card>
    </div>
  );
}

// ── Document Upload Panel ─────────────────────────────────────────────────
function DocUpload({apiKey,onExtracted,onError}) {
  const [loading,setLoading]=useState(false);
  const [extracted,setExtracted]=useState(null);
  const [docData,setDocData]=useState(null);
  const [confirmed,setConfirmed]=useState(false);
  const [localErr,setLocalErr]=useState(null);
  const ref=useRef();

  const handle=async f=>{
    setLocalErr(null);
    if(!apiKey){setLocalErr("API key required — click 'API Key' in the header first.");return;}
    setLoading(true);
    try {
      let raw, docDataVal;
      if(isExcelFile(f)){
        const text=await excelToText(f);
        raw=await extractFromText(text,apiKey);
        docDataVal={b64:text,mimeType:"text/excel"};
      } else {
        const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(f);});
        raw=await extractFromDoc(b64,f.type,apiKey);
        docDataVal={b64,mimeType:f.type};
      }
      setExtracted(parseJSON(raw));
      setDocData(docDataVal);
    } catch(e){
      const is401=e.status===401;
      const msg=is401?"Invalid API key — your key was rejected (401). Use the 'API Key' button in the header to update it.":"Extraction failed: "+e.message;
      setLocalErr(msg);
      onError(msg);
    }
    finally{setLoading(false);}
  };

  const wpsFields=extracted?Object.entries(extracted.wps||extracted).filter(([k])=>k!=="pqr"):[];
  const pqrFields=extracted?.pqr?Object.entries(extracted.pqr):[];
  const lowFields=[...wpsFields,...pqrFields].filter(([,v])=>v?.confidence==="LOW");

  return (
    <div style={{padding:20,overflowY:"auto",flex:1}}>
      {localErr&&<div style={{background:D.failBg,border:`1px solid ${D.failBorder}`,borderRadius:7,padding:"8px 12px",color:D.fail,fontSize:12,marginBottom:12}}>⚠ {localErr}</div>}
      {!extracted&&!loading&&(
        <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handle(f);}} onDragOver={e=>e.preventDefault()} onClick={()=>ref.current.click()}
          style={{border:`2px dashed ${localErr?D.failBorder:D.accentBorder}`,borderRadius:10,padding:48,textAlign:"center",cursor:"pointer",background:D.accentFaint}}>
          <div style={{fontSize:36,marginBottom:10}}>📄</div>
          <div style={{color:D.text,fontWeight:600,marginBottom:4}}>Drop WPS document here or click to upload</div>
          <div style={{color:D.textMid,fontSize:12}}>PDF, JPG, PNG, XLS, or XLSX — AI auto-extracts all fields</div>
          <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.xlsm" style={{display:"none"}} onChange={e=>e.target.files[0]&&handle(e.target.files[0])}/>
        </div>
      )}
      {loading&&<Spinner label="Extracting WPS parameters…"/>}
      {extracted&&!confirmed&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{color:D.text,fontWeight:700}}>Extracted Fields — Review Required</div>
            <Btn small outline onClick={()=>{setExtracted(null);}}>Re-upload</Btn>
          </div>
          {lowFields.length>0&&<div style={{background:D.failBg,border:`1px solid ${D.failBorder}`,borderRadius:7,padding:"8px 12px",color:D.fail,fontSize:12,marginBottom:12}}>⚠ {lowFields.length} field(s) have LOW confidence — review before proceeding.</div>}
          <div style={{color:D.textMid,fontSize:11,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>WPS Fields</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
            {wpsFields.map(([key,val])=>(
              <div key={key} style={{background:D.surfaceAlt,border:`1px solid ${val?.confidence==="LOW"?D.failBorder:D.border}`,borderRadius:6,padding:"7px 10px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{color:D.textMid,fontSize:10,textTransform:"uppercase",letterSpacing:".05em"}}>{key}</span>
                  <ConfBadge level={val?.confidence||"LOW"} small/>
                </div>
                <div style={{color:val?.value?D.text:D.textSoft,fontSize:12,fontFamily:"'DM Mono',monospace"}}>{String(val?.value??"—")||"—"}</div>
              </div>
            ))}
          </div>
          {pqrFields.length>0&&<>
            <div style={{color:D.blue,fontSize:11,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6,paddingTop:8,borderTop:`1px solid ${D.border}`}}>PQR Fields Extracted</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
              {pqrFields.map(([key,val])=>(
                <div key={key} style={{background:D.surfaceAlt,border:`1px solid ${val?.confidence==="LOW"?D.failBorder:D.blueBorder}`,borderRadius:6,padding:"7px 10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{color:D.blue,fontSize:10,textTransform:"uppercase",letterSpacing:".05em"}}>{key.replace("pqr","")}</span>
                    <ConfBadge level={val?.confidence||"LOW"} small/>
                  </div>
                  <div style={{color:val?.value?D.text:D.textSoft,fontSize:12,fontFamily:"'DM Mono',monospace"}}>{String(val?.value??"—")||"—"}</div>
                </div>
              ))}
            </div>
          </>}
          <Btn color={D.pass} onClick={()=>{onExtracted(extracted,docData?.b64,docData?.mimeType);setConfirmed(true);}}>Confirm All Fields & Proceed to Validation</Btn>
        </div>
      )}
      {confirmed&&<div style={{background:D.passBg,border:`1px solid ${D.passBorder}`,borderRadius:7,padding:"10px 14px",color:D.pass,fontSize:13}}>Fields confirmed. Use the Validate button to run validation.</div>}
    </div>
  );
}

// ── PQR Upload Section ────────────────────────────────────────────────────
function PQRSection({apiKey,pqrData,onPqrExtracted,onClear}) {
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState(null);
  const ref=useRef();

  const PQR_PROMPT = `Extract PQR (Procedure Qualification Record) data from this document. Return strict JSON where each field is {value,confidence:'HIGH'|'MEDIUM'|'LOW'}. Fields: pqrNumber, pqrLinkedWps, pqrTestDate, pqrWitnessedBy, pqrApprovedBy, pqrTestPieceThickness, pqrTestPieceMaterial, pqrActualHeatInputMin, pqrActualHeatInputMax, pqrActualPreheat, pqrActualInterpass, pqrTensileResult, pqrTensileValues, pqrBendResult, pqrBendType, pqrImpactResult, pqrImpactValues, pqrImpactTemp, pqrHardnessResult, pqrHardnessValues, pqrMacroResult, pqrRadiographyResult, pqrNDTOther, pqrOverallResult. For result fields use PASS/FAIL/PENDING/NOT_REQUIRED. Missing fields: value empty string, confidence LOW.`;

  const handle=async f=>{
    setErr(null);
    if(!apiKey){setErr("API key required — click 'API Key' in the header.");return;}
    setLoading(true);
    try {
      let raw, rawDocData, rawDocMime;
      if(isExcelFile(f)){
        const text=await excelToText(f);
        raw=await callClaude(
          [{type:"text",text:`${PQR_PROMPT}\n\nDOCUMENT CONTENT (converted from Excel spreadsheet):\n\n${text}`}],
          apiKey,
          "You are a welding engineer. Extract PQR test data from the document content. Return strict JSON only — no markdown, no preamble.",
          2500, OPUS
        );
        rawDocData=text; rawDocMime="text/excel";
      } else {
        const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(f);});
        raw=await callClaude(
          [{type:f.type.startsWith("image/")?"image":"document",source:{type:"base64",media_type:f.type,data:b64}},{type:"text",text:PQR_PROMPT}],
          apiKey,
          "You are a welding engineer. Extract PQR test data from the document. Return strict JSON only — no markdown, no preamble.",
          2500, OPUS
        );
        rawDocData=b64; rawDocMime=f.type;
      }
      const ex=parseJSON(raw);
      const mpq=k=>ex[k]?.value||"";
      const pqrExtracted={pqrNumber:mpq("pqrNumber"),linkedWps:mpq("pqrLinkedWps"),testDate:mpq("pqrTestDate"),witnessedBy:mpq("pqrWitnessedBy"),approvedBy:mpq("pqrApprovedBy"),testPieceThickness:mpq("pqrTestPieceThickness"),testPieceMaterial:mpq("pqrTestPieceMaterial"),actualHeatInputMin:mpq("pqrActualHeatInputMin"),actualHeatInputMax:mpq("pqrActualHeatInputMax"),actualPreheat:mpq("pqrActualPreheat"),actualInterpass:mpq("pqrActualInterpass"),tensileResult:mpq("pqrTensileResult"),tensileValues:mpq("pqrTensileValues"),bendResult:mpq("pqrBendResult"),bendType:mpq("pqrBendType"),impactResult:mpq("pqrImpactResult"),impactValues:mpq("pqrImpactValues"),impactTemp:mpq("pqrImpactTemp"),hardnessResult:mpq("pqrHardnessResult"),hardnessValues:mpq("pqrHardnessValues"),macroResult:mpq("pqrMacroResult"),radiographyResult:mpq("pqrRadiographyResult"),ndtOther:mpq("pqrNDTOther"),overallResult:mpq("pqrOverallResult")||"UNKNOWN"};
      onPqrExtracted(pqrExtracted, rawDocData, rawDocMime);
    } catch(e){setErr("PQR extraction failed: "+e.message);}
    finally{setLoading(false);}
  };

  const rc=pqrData?.overallResult==="ACCEPTED"?D.pass:pqrData?.overallResult==="REJECTED"?D.fail:D.warn;
  const rb=pqrData?.overallResult==="ACCEPTED"?D.passBg:pqrData?.overallResult==="REJECTED"?D.failBg:D.warnBg;
  const rbr=pqrData?.overallResult==="ACCEPTED"?D.passBorder:pqrData?.overallResult==="REJECTED"?D.failBorder:D.warnBorder;

  return (
    <div style={{padding:"10px 16px",borderTop:`1px solid ${D.border}`,background:D.surfaceAlt,flexShrink:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{color:D.textMid,fontSize:11,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>PQR Document</span>
        {pqrData&&<button onClick={onClear} style={{background:"none",border:"none",color:D.textSoft,fontSize:11,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>✕ Remove</button>}
      </div>
      {pqrData?(
        <div style={{background:rb,border:`1px solid ${rbr}`,borderRadius:6,padding:"7px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:rc,fontWeight:700,fontSize:12,fontFamily:"'DM Mono',monospace"}}>{pqrData.pqrNumber||"PQR"}</div>
            <div style={{color:D.textMid,fontSize:11}}>{pqrData.testDate||"No date"}{pqrData.witnessedBy?" · "+pqrData.witnessedBy:""}</div>
          </div>
          <span style={{background:rb,border:`1px solid ${rbr}`,color:rc,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4}}>{pqrData.overallResult}</span>
        </div>
      ):(
        <>
          {err&&<div style={{color:D.fail,fontSize:11,marginBottom:6}}>⚠ {err}</div>}
          {loading?<div style={{color:D.textMid,fontSize:12,padding:"8px 0"}}>Extracting PQR…</div>:(
            <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handle(f);}} onDragOver={e=>e.preventDefault()} onClick={()=>ref.current.click()}
              style={{border:`2px dashed ${D.border}`,borderRadius:6,padding:"10px 12px",textAlign:"center",cursor:"pointer",color:D.textMid,fontSize:12}}>
              Drop PQR document here or <span style={{color:D.accent}}>click to upload</span>
              <div style={{color:D.textSoft,fontSize:10,marginTop:3}}>PDF, JPG, PNG, XLS, XLSX</div>
              <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.xlsm" style={{display:"none"}} onChange={e=>e.target.files[0]&&handle(e.target.files[0])}/>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Result: Score Gauge ───────────────────────────────────────────────────
function ScoreGauge({score, std, edition, confidence, prequalified}) {
  const {grade, color, label} = scoreGrade(score);
  const r=44, cx=54, cy=54, circ=2*Math.PI*r;
  const dash=(score/100)*circ;
  return (
    <div style={{display:"flex",alignItems:"center",gap:20,padding:"14px 20px",background:D.surfaceAlt,borderBottom:`1px solid ${D.border}`,flexShrink:0}}>
      <svg width={108} height={108} style={{flexShrink:0}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={D.border} strokeWidth={8}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ-dash}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="round"/>
        <text x={cx} y={cy-7} textAnchor="middle" fill={color} fontSize={20} fontWeight={800} fontFamily="Inter,sans-serif">{score}%</text>
        <text x={cx} y={cy+12} textAnchor="middle" fill={D.textMid} fontSize={11} fontFamily="Inter,sans-serif">Grade {grade}</text>
      </svg>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:D.text,fontWeight:800,fontSize:18,letterSpacing:"-0.02em"}}>{STD_LABEL[std]||std||"—"}</div>
        <div style={{color:D.textMid,fontSize:12,marginTop:2}}>{edition}</div>
        <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{background:color+"22",border:`1px solid ${color}55`,color,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:5}}>{label} Compliance</span>
          <ConfBadge level={confidence}/>
          {prequalified&&<span style={{background:D.passBg,border:`1px solid ${D.passBorder}`,color:D.pass,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:5}}>✓ Prequalified</span>}
        </div>
      </div>
    </div>
  );
}

// ── Result: Recommendations Tab ───────────────────────────────────────────
function RecommendationsTab({result}) {
  const PRIO_CFG = {
    critical:{color:D.fail,  bg:D.failBg,  border:D.failBorder,  icon:"🚨",order:0},
    high:    {color:D.warn,  bg:D.warnBg,  border:D.warnBorder,  icon:"⚠️",order:1},
    medium:  {color:D.blue,  bg:D.blueFaint,border:D.blueBorder, icon:"ℹ️",order:2},
    low:     {color:D.textMid,bg:D.surfaceAlt,border:D.border,   icon:"💡",order:3},
  };
  const aiRecs = result.recommendations || [];
  const checks = result.essential_variable_checks || [];

  // Any NON_COMPLIANT check the AI omitted from recommendations must still appear
  const missing = checks
    .filter(c => c.status === "NON_COMPLIANT")
    .filter(c => !aiRecs.some(r => {
      const rv = (r.issue||"").toLowerCase();
      const cv = (c.variable||"").toLowerCase();
      return rv.includes(cv.slice(0,12)) || cv.includes(rv.slice(0,12));
    }))
    .map(c => ({
      priority: c.weight === "essential" ? "critical" : "high",
      issue: c.variable,
      fix: `${c.note ? c.note + ". " : ""}Rectify this ${c.weight==="essential"?"essential ":""}variable to achieve compliance — ${c.recorded_value&&c.recorded_value!=="—"?"recorded value: "+c.recorded_value+". ":""}Required: ${c.required_range||"per code"}. Review and correct before use.`,
      clause: c.clause,
      _autoAdded: true,
    }));

  const recs = [...missing, ...aiRecs].sort((a,b)=>(PRIO_CFG[a.priority]?.order??9)-(PRIO_CFG[b.priority]?.order??9));
  const summary = result.overall_summary;

  // "All passed" only when there genuinely are no issues anywhere
  const anyIssues = recs.length > 0 || checks.some(c=>c.status==="NON_COMPLIANT"||c.status==="REQUIRES_VERIFICATION");
  if(!anyIssues) return (
    <div style={{padding:24,textAlign:"center"}}>
      <div style={{fontSize:32,marginBottom:8}}>✅</div>
      <div style={{color:D.pass,fontWeight:700,fontSize:15,marginBottom:6}}>All checks passed</div>
      {summary&&<div style={{color:D.textMid,fontSize:13}}>{summary}</div>}
    </div>
  );

  return (
    <div style={{overflowY:"auto",flex:1,padding:16}}>
      {summary&&<div style={{background:D.surfaceAlt,border:`1px solid ${D.border}`,borderRadius:7,padding:"10px 14px",color:D.text,fontSize:13,marginBottom:14,lineHeight:1.5}}>{summary}</div>}
      {recs.map((rec,i)=>{
        const p=PRIO_CFG[rec.priority]||PRIO_CFG.low;
        return (
          <div key={i} style={{background:p.bg,border:`1px solid ${p.border}`,borderRadius:7,padding:"10px 14px",marginBottom:8,display:"flex",gap:10}}>
            <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{p.icon}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <span style={{color:p.color,fontWeight:700,fontSize:12}}>{rec.issue}</span>
                {rec._autoAdded&&<span style={{background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",color:D.accent,fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:3,letterSpacing:".05em"}}>FROM CHECKS</span>}
              </div>
              <div style={{color:D.text,fontSize:12,marginBottom:rec.clause?4:0,lineHeight:1.5}}>{rec.fix}</div>
              {rec.clause&&<span style={{color:D.textSoft,fontSize:10,fontFamily:"'DM Mono',monospace"}}>Clause: {rec.clause}</span>}
            </div>
            <span style={{flexShrink:0,background:p.bg,border:`1px solid ${p.border}`,color:p.color,fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,height:"fit-content",letterSpacing:".05em"}}>{(rec.priority||"").toUpperCase()}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Result: Compliance Checks Tab ─────────────────────────────────────────
function ComplianceChecksTab({result, onVerify}) {
  const checks = result.essential_variable_checks || [];
  // Preserve original index so onVerify targets the right check after sorting
  const indexed = checks.map((c,i) => ({...c, _origIdx:i}));
  const sorted = [
    ...indexed.filter(c=>c.status==="NON_COMPLIANT"),
    ...indexed.filter(c=>c.status==="REQUIRES_VERIFICATION"),
    ...indexed.filter(c=>c.status==="COMPLIANT"),
    ...indexed.filter(c=>c.status==="NOT_APPLICABLE"),
  ];
  const lowCount = checks.filter(c=>c.confidence==="LOW").length;

  const VBtn = ({label, color, onClick}) => (
    <button onClick={onClick} style={{
      background:color, border:"none", borderRadius:4, color:"#fff",
      fontSize:10, fontWeight:700, padding:"3px 8px", cursor:"pointer",
      fontFamily:"'Inter',sans-serif", letterSpacing:".02em",
    }}>{label}</button>
  );

  return (
    <div style={{overflowY:"auto",flex:1,padding:16}}>
      {lowCount>0&&<div style={{background:D.warnBg,border:`1px solid ${D.warnBorder}`,borderRadius:6,padding:"7px 12px",color:D.warn,fontSize:12,marginBottom:12,fontWeight:600}}>⚠ {lowCount} LOW confidence check(s) — independent engineering review required before use.</div>}
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr>
              <th style={{...TH,width:190}}>Variable</th>
              <th style={TH}>Clause</th>
              <th style={TH}>Recorded</th>
              <th style={TH}>Required Range</th>
              <th style={{...TH,minWidth:150}}>Status / Verify</th>
              <th style={TH}>Wt</th>
              <th style={TH}>Conf</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c,i)=>{
              const isVerify = c.status === "REQUIRES_VERIFICATION";
              const wasVerified = !!c._verified;
              const rowBg = c.status==="NON_COMPLIANT"?D.failBg
                : isVerify?"rgba(245,158,11,0.06)"
                : i%2===0?D.surface:"transparent";
              return (
                <tr key={i} style={{background:rowBg}}>
                  <td style={{...TD,fontWeight:600,color:D.text}}>
                    {c.variable}
                    {c.note&&<div style={{color:D.textSoft,fontSize:10,marginTop:2,fontWeight:400}}>{c.note}</div>}
                    {c.confidence==="LOW"&&<LowConfVerify id={`chk_${i}_${c.variable}`}/>}
                  </td>
                  <td style={{...TD,color:D.textSoft,fontFamily:"'DM Mono',monospace",fontSize:10}}>{c.clause||"—"}</td>
                  <td style={{...TD,color:D.textMid}}>{c.recorded_value||"—"}</td>
                  <td style={{...TD,color:D.textMid,fontSize:11}}>{c.required_range||"—"}</td>
                  <td style={TD}>
                    <StatusBadge status={c.status}/>
                    {isVerify && onVerify && (
                      <div style={{marginTop:6}}>
                        <div style={{color:D.textSoft,fontSize:9,fontWeight:600,marginBottom:4,letterSpacing:".05em"}}>VERIFY AS:</div>
                        <div style={{display:"flex",gap:5}}>
                          <VBtn label="✓ Compliant" color={D.pass} onClick={()=>onVerify(c._origIdx,"COMPLIANT")}/>
                          <VBtn label="✗ Non-Compliant" color={D.fail} onClick={()=>onVerify(c._origIdx,"NON_COMPLIANT")}/>
                        </div>
                      </div>
                    )}
                    {wasVerified && (
                      <div style={{marginTop:4,display:"flex",alignItems:"center",gap:5}}>
                        <span style={{color:D.textSoft,fontSize:9}}>Manually verified</span>
                        <button onClick={()=>onVerify(c._origIdx,"REQUIRES_VERIFICATION")}
                          style={{background:"none",border:"none",color:D.textSoft,fontSize:9,cursor:"pointer",textDecoration:"underline",padding:0,fontFamily:"'Inter',sans-serif"}}>
                          Reset
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={{...TD,color:D.textSoft,fontSize:10,fontFamily:"'DM Mono',monospace",textAlign:"center"}}>{c.weight==="essential"?"2×":"1×"}</td>
                  <td style={TD}><ConfBadge level={c.confidence} small/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length===0&&<div style={{textAlign:"center",padding:32,color:D.textSoft,fontSize:13}}>No essential variable checks returned.</div>}
      </div>
    </div>
  );
}

// ── Result: Qualification Ranges Tab ─────────────────────────────────────
function QualRangesTab({result}) {
  const qr=result.qualification_ranges||{};
  const fields=[["thickness","Base Metal Thickness"],["positions","Positions Covered"],["heat_input","Heat Input"],["filler_diameter","Filler Diameter"],["pwht","PWHT Applicability"]];
  return (
    <div style={{overflowY:"auto",flex:1,padding:16}}>
      <div style={{color:D.text,fontWeight:700,fontSize:14,marginBottom:14}}>Qualification Ranges</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {fields.map(([key,label])=>(
          <Card key={key}>
            <div style={{color:D.textSoft,fontSize:10,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>{label}</div>
            <div style={{color:qr[key]?D.text:D.textSoft,fontSize:13,fontFamily:"'DM Mono',monospace",fontWeight:600}}>{qr[key]||"—"}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Result: PQR Tests Tab ─────────────────────────────────────────────────
function PQRTestsTab({result, onToggle}) {
  const tests=result.pqr_tests||[];
  if(result.prequalified) return (
    <div style={{padding:24,textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:8}}>✅</div>
      <div style={{color:D.pass,fontWeight:700,fontSize:14,marginBottom:6}}>Prequalified WPS — no PQR required</div>
      {result.prequalified_basis&&<div style={{color:D.textMid,fontSize:12}}>{result.prequalified_basis}</div>}
    </div>
  );
  const incomplete=tests.filter(t=>t.status==="INCOMPLETE");
  return (
    <div style={{overflowY:"auto",flex:1,padding:16}}>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
        <div style={{color:D.text,fontWeight:700,fontSize:14}}>PQR Test Requirements</div>
        {incomplete.length>0&&<span style={{background:D.failBg,border:`1px solid ${D.failBorder}`,color:D.fail,fontSize:11,padding:"2px 8px",borderRadius:5}}>{incomplete.length} incomplete</span>}
      </div>
      {tests.length===0&&<div style={{textAlign:"center",padding:32,color:D.textSoft,fontSize:13}}>No PQR test data — upload a PQR document to cross-reference.</div>}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {tests.map((t,i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",background:D.surfaceAlt,borderRadius:6,border:`1px solid ${t.status==="INCOMPLETE"?D.failBorder:t.status==="COMPLETE"?D.passBorder:D.border}`}}>
            <input type="checkbox" checked={t.status==="COMPLETE"} onChange={()=>onToggle(i)} style={{accentColor:D.pass,marginTop:2,flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3}}>
                <span style={{color:D.text,fontWeight:600,fontSize:12}}>{t.test}</span>
                <StatusBadge status={t.status}/><ConfBadge level={t.confidence} small/>
              </div>
              <div style={{color:D.textMid,fontSize:11,marginBottom:t.result?3:0}}>{t.requirement}</div>
              {t.result&&<div style={{background:t.status==="COMPLETE"?D.passBg:D.warnBg,border:`1px solid ${t.status==="COMPLETE"?D.passBorder:D.warnBorder}`,borderRadius:4,padding:"2px 8px",fontSize:11,color:t.status==="COMPLETE"?D.pass:D.warn,display:"inline-block"}}>PQR result: {t.result}</div>}
              <div style={{color:D.textSoft,fontSize:10,fontFamily:"'DM Mono',monospace",marginTop:3}}>{t.clause}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Result: Welder Scope Tab ──────────────────────────────────────────────
function WelderScopeTab({result}) {
  const ws=result.welder_scope||{};
  const fields=[["positions","Qualified Positions"],["thickness","Qualified Thickness"],["process","Process"],["material_group","Material Group"],["clause","Clause Reference"]];
  return (
    <div style={{overflowY:"auto",flex:1,padding:16}}>
      <div style={{color:D.text,fontWeight:700,fontSize:14,marginBottom:14}}>Derived Welder Qualification Scope (WPQ)</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {fields.map(([key,label])=>(
          <Card key={key}>
            <div style={{color:D.textSoft,fontSize:10,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>{label}</div>
            <div style={{color:ws[key]?D.text:D.textSoft,fontSize:13,fontFamily:key==="clause"?"'DM Mono',monospace":"inherit",fontWeight:600}}>{ws[key]||"—"}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Register (Tab6) ───────────────────────────────────────────────────────
function Tab6({register, onLoad, onDelete}) {
  const [search,setSearch]=useState("");
  const [filt,setFilt]=useState("all");

  const filtered=register.filter(r=>{
    const q=search.toLowerCase();
    const matchQ=!q||r.wpsNumber?.toLowerCase().includes(q)||r.process?.toLowerCase().includes(q)||(r.standardLabel||r.standards||"").toLowerCase().includes(q);
    if(!matchQ)return false;
    if(filt==="all")return true;
    if(r.v===2){
      if(filt==="QUALIFIED")return(r.score||0)>=80;
      if(filt==="PARTIAL")  return(r.score||0)>=60&&(r.score||0)<80;
      if(filt==="NOT_QUALIFIED")return(r.score||0)<60;
    }
    return r.overallStatus===filt;
  });

  const exportCSV=()=>{
    const hdr=["WPS No.","Process","Standard","Score/Status","Confidence","Linked PQR","Date","Validated By"];
    const rows=filtered.map(r=>[r.wpsNumber,r.process,r.v===2?`${r.standardLabel} ${r.edition}`:r.standards,r.v===2?`${r.score}%`:r.overallStatus,r.confidence,r.linkedPqr||"",r.dateValidated,r.validatedBy]);
    const csv=[hdr,...rows].map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="wps_register.csv";a.click();
  };

  return (
    <div style={{overflowY:"auto",flex:1,padding:16}}>
      <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{color:D.text,fontWeight:700,fontSize:14}}>WPS Qualification Register</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{...INP,width:160}}/>
        <select value={filt} onChange={e=>setFilt(e.target.value)} style={{...INP,width:160}}><option value="all">All</option><option value="QUALIFIED">Score ≥ 80%</option><option value="PARTIAL">Score 60–79%</option><option value="NOT_QUALIFIED">Score &lt; 60%</option></select>
        <div style={{marginLeft:"auto"}}><Btn small outline onClick={exportCSV} color={D.blue}>Export CSV</Btn></div>
      </div>
      {filtered.length===0
        ?<div style={{textAlign:"center",padding:48,color:D.textSoft,fontSize:13}}>No records yet. Complete a validation to populate the register.</div>
        :<div style={{overflowX:"auto",background:D.surface,border:`1px solid ${D.border}`,borderRadius:10}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>{["WPS No.","Process","Standard","Score","Conf","PQR","Date","Validated By",""].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((r,i)=>{
                const isV2=r.v===2;
                const score=isV2?r.score:null;
                const {color:sc}=score!=null?scoreGrade(score):{color:D.textMid};
                return (
                  <tr key={r.id} style={{background:i%2===0?D.surface:"transparent"}}>
                    <td style={{...TD,color:D.accent,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{r.wpsNumber}</td>
                    <td style={{...TD,color:D.textMid}}>{r.process}</td>
                    <td style={{...TD,color:D.textMid,fontSize:11}}>{isV2?`${r.standardLabel} ${r.edition}`:r.standards}</td>
                    <td style={{...TD,fontWeight:700,color:sc,fontFamily:"'DM Mono',monospace"}}>{isV2?`${score}%`:r.overallStatus}</td>
                    <td style={TD}><ConfBadge level={r.confidence} small/></td>
                    <td style={{...TD,color:D.textMid,fontFamily:"'DM Mono',monospace"}}>{r.linkedPqr||"—"}</td>
                    <td style={{...TD,color:D.textMid}}>{r.dateValidated}</td>
                    <td style={{...TD,color:D.textMid}}>{r.validatedBy}</td>
                    <td style={TD}><div style={{display:"flex",gap:5}}><Btn small outline onClick={()=>onLoad(r)} color={D.accent}>Load</Btn><Btn small outline onClick={()=>onDelete(r.id)} color={D.fail}>Del</Btn></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>}
    </div>
  );
}

// ── Revision Comparison ───────────────────────────────────────────────────
function RevCompare({apiKey, onBack}) {
  const [orig,setOrig]=useState(mkParams());
  const [rev,setRev]=useState(mkParams());
  const [origL,setOrigL]=useState([mkLayer()]);
  const [revL,setRevL]=useState([mkLayer()]);
  const [ed,setEd]=useState({ASME_IX:"2023",ISO_15614_1:"2017+AMD1:2019",AS_1554_1:"2014+AMD1",AS_3992:"1998"});
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState(null);

  const CMP_FIELDS=[["wpsNumber","WPS Number"],["baseMtlGroup","Material Group"],["pNumber","P-Number"],["thickness","Thickness (mm)"],["preheat","Preheat Min (°C)"],["interpass","Interpass Max (°C)"],["jointType","Joint Type"],["pwht","PWHT"],["backing","Backing"]];
  const changed=CMP_FIELDS.filter(([k])=>String(orig[k])!==String(rev[k]));

  const COMP_STANDARDS=["ASME_IX","ISO_15614_1","AS_1554_1","AS_3992"];

  const run=async()=>{
    setLoading(true);setErr(null);
    try {
      const prompt=`Compare these WPS revisions and determine requalification under each standard.\n\nORIGINAL:\n${JSON.stringify({params:orig,layers:origL,editions:ed},null,2)}\n\nREVISED:\n${JSON.stringify({params:rev,layers:revL,editions:ed},null,2)}\n\nChanged fields: ${changed.map(([k,l])=>`${l}: ${orig[k]} → ${rev[k]}`).join(", ")}\n\nReturn strict JSON: {"ASME_IX":{"requalification_required":bool,"type":"new_pqr|amendment_only|none","triggered_by":["string"],"clause_basis":"string","confidence":"HIGH|MEDIUM|LOW"},"ISO_15614_1":{},"AS_1554_1":{},"AS_3992":{},"summary":"string"}`;
      const raw=await callClaude([{type:"text",text:prompt}],apiKey,"You are a senior welding engineer. Assess requalification requirements for WPS revisions. Return strict JSON only.");
      setResult(parseJSON(raw));
    } catch(e){setErr(e.message);}
    finally{setLoading(false);}
  };

  return (
    <div style={{flex:1,overflowY:"auto",padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{color:D.text,fontWeight:700,fontSize:16}}>WPS Revision Comparison</div>
          <div style={{color:D.textMid,fontSize:12,marginTop:2}}>Determine requalification requirements for WPS amendments</div>
        </div>
        <Btn outline onClick={onBack}>← Back</Btn>
      </div>
      {changed.length>0&&<div style={{background:D.warnBg,border:`1px solid ${D.warnBorder}`,borderRadius:7,padding:"8px 14px",marginBottom:14,color:D.warn,fontSize:12}}><b>{changed.length} changed variable(s):</b> {changed.map(([,l])=>l).join(", ")}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        {[["ORIGINAL",orig,setOrig],["REVISED",rev,setRev]].map(([title,p,setP])=>(
          <div key={title}>
            <div style={{color:D.textMid,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>{title} WPS</div>
            <Card>
              {CMP_FIELDS.map(([k,l])=>(
                <div key={k} style={{marginBottom:8}}>
                  <Lbl c={l}/>
                  <input value={String(p[k])} onChange={e=>setP(pp=>({...pp,[k]:e.target.value}))} style={{...INP,borderColor:String(orig[k])!==String(rev[k])?D.warn:undefined}}/>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>
      <Btn color={D.accent} onClick={run} disabled={loading||!apiKey}>{loading?"Analysing…":"Run Requalification Assessment"}</Btn>
      {err&&<div style={{marginTop:10,color:D.fail,fontSize:12}}>{err}</div>}
      {result&&<div style={{marginTop:20}}>
        <div style={{color:D.text,fontWeight:700,fontSize:14,marginBottom:10}}>Requalification Assessment</div>
        {result.summary&&<div style={{background:D.surfaceAlt,border:`1px solid ${D.border}`,borderRadius:7,padding:"10px 14px",color:D.text,fontSize:12,marginBottom:14}}>{result.summary}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {COMP_STANDARDS.map(std=>{const r=result[std]||{};const nr=r.requalification_required;const isNew=r.type==="new_pqr";return(
            <Card key={std}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{color:D.blue,fontWeight:700,fontSize:13}}>{STD_LABEL[std]}</span>
                <div style={{display:"flex",gap:6}}>
                  <span style={{background:nr?(isNew?D.failBg:D.warnBg):D.passBg,border:`1px solid ${nr?(isNew?D.failBorder:D.warnBorder):D.passBorder}`,color:nr?(isNew?D.fail:D.warn):D.pass,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4}}>{nr?(isNew?"NEW PQR REQUIRED":"AMENDMENT ONLY"):"NO REQUALIFICATION"}</span>
                  <ConfBadge level={r.confidence} small/>
                </div>
              </div>
              {r.triggered_by?.length>0&&<div style={{marginBottom:6}}>
                <div style={{color:D.textMid,fontSize:10,textTransform:"uppercase",marginBottom:3}}>Triggered By</div>
                {r.triggered_by.map((t,i)=><div key={i} style={{color:D.text,fontSize:11,marginBottom:1}}>• {t}</div>)}
              </div>}
              {r.clause_basis&&<div style={{color:D.textSoft,fontSize:10,fontFamily:"'DM Mono',monospace"}}>{r.clause_basis}</div>}
            </Card>
          );})}
        </div>
      </div>}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
const REG_KEY     = "wps_val_register";
const APIKEY_KEY  = "wqms_api_key";
const WPS_MAIN_KEY = "wqms_wps_main_register";
const PQR_MAIN_KEY = "wqms_pqr_main_register";

export default function WPSValidationEngine() {
  const [appMode,setAppMode]   = useState("main");
  const [inputMode,setInputMode] = useState("manual");
  const [leftTab,setLeftTab]   = useState("input");
  const [resTab,setResTab]     = useState("recs");

  const [apiKey,setApiKey]     = useState(()=>localStorage.getItem(APIKEY_KEY)||"");
  const [showKey,setShowKey]   = useState(!localStorage.getItem(APIKEY_KEY));
  const [keyDraft,setKeyDraft] = useState("");
  const [showKeyText,setShowKeyText] = useState(false);

  const [params,setParams]     = useState(mkParams());
  const [layers,setLayers]     = useState([mkLayer()]);
  const [editions,setEditions] = useState({ASME_IX:"2023",ISO_15614_1:"2017+AMD1:2019",AS_1554_1:"2014+AMD1",AS_3992:"2020",AWS_D1_1:"2022",AWS_B2_1:"2021"});
  const [suppReqs,setSuppReqs] = useState([]);
  const [pqrData,setPqrData]   = useState(null);
  const [pqrDocB64,setPqrDocB64] = useState(null);
  const [pqrDocMime,setPqrDocMime] = useState(null);
  const [docB64,setDocB64]     = useState(null);
  const [docMime,setDocMime]   = useState(null);
  const [errors,setErrors]     = useState({});

  const [targetStd,setTargetStd] = useState("ASME_IX");
  const [detectedConf,setDetectedConf] = useState(null);

  const [loading,setLoading]   = useState(false);
  const [progress,setProgress] = useState(0);
  const [progressMsg,setProgressMsg] = useState("");
  const [result,setResult]     = useState(null);
  const [rawResp,setRawResp]   = useState(null);
  const [apiError,setApiError] = useState(null);

  const [register,setRegister] = useState(()=>{try{return JSON.parse(localStorage.getItem(REG_KEY)||"[]");}catch{return [];}});

  const currentRegId = useRef(null);

  const syncResult=(updatedResult)=>{
    if(!currentRegId.current)return;
    const {score}=computeScore(updatedResult);
    const {_std,_detConf,...fullResult}=updatedResult;
    setRegister(prev=>{
      const nr=prev.map(e=>e.id===currentRegId.current?{...e,fullResult,score}:e);
      localStorage.setItem(REG_KEY,JSON.stringify(nr));
      return nr;
    });
  };

  const saveKey=()=>{
    const k=keyDraft.trim();if(!k)return;
    setApiKey(k);localStorage.setItem(APIKEY_KEY,k);setShowKey(false);setKeyDraft("");
  };

  const validate=()=>{
    const e={};
    if(!params.wpsNumber)  e.wpsNumber=true;
    if(!params.thickness)  e.thickness=true;
    if(!params.validatedBy)e.validatedBy=true;
    if(Object.keys(e).length){setErrors(e);return;}
    setErrors({});

    // Auto-detect standard; user override via targetStd dropdown takes precedence
    const det=detectStandard(params,layers,pqrData);
    if(det.confidence!=="LOW") setTargetStd(det.standard);
    setDetectedConf(det.confidence);

    runTargetedVal(det.confidence!=="LOW"?det.standard:targetStd, det.confidence);
  };

  const runTargetedVal=async(std, detConf)=>{
    setLoading(true);setApiError(null);setProgress(0);setProgressMsg("Detecting standard…");
    try {
      const edition = editions[std];
      setProgress(15);
      setProgressMsg(`Validating against ${STD_LABEL[std]} ${edition}…`);

      let msgContent;
      const hasPqrDocAny = !!(pqrDocB64 && pqrDocMime);
      if(docB64&&docMime){
        // Document path — send WPS document + optional PQR document directly to Claude.
        // Extraction result only populates the UI form; validation reads source documents.
        const suppCtx=suppReqs.length?`\nSupplementary requirements: ${JSON.stringify(suppReqs)}`:"";
        const pqrCtx=pqrData&&!hasPqrDocAny?`\nPQR summary (extracted fields only — no PQR document attached): ${JSON.stringify(pqrData)}`:"";
        const combinedNote = hasPqrDocAny && pqrDocB64===docB64
          ? "NOTE: The attached document contains BOTH the WPS and PQR data — read all sections including test result tables."
          : hasPqrDocAny
          ? "NOTE: A separate PQR document is attached alongside the WPS document — read test results from the PQR document."
          : "";
        const valInstruction=
          `Validate this WPS${hasPqrDocAny?" and accompanying PQR":""} against ${STD_LABEL[std]} ${edition}.\n\n`+
          (combinedNote?combinedNote+"\n\n":"")+
          `Read every section of all attached documents — title block, all four corners, headers, qualification ranges table, essential variables table, welding parameters table, ALL test result rows, hardness tables, chemical analysis results, run sequence tables, approval signatures. Extract all parameters directly from what you can see and validate against the code.\n\n`+
          `CRITICAL: Cross-reference PQR actual test results against the WPS qualified ranges. A test is COMPLETE if the PQR document (or the combined document) shows a result for that test — do NOT mark INCOMPLETE merely because the WPS form itself doesn't repeat test result values. If a result is marked PASS or ACCEPTED in the PQR, it satisfies the test requirement.\n\n`+
          `Do NOT mark any field NON_COMPLIANT unless confirmed genuinely absent from ALL attached documents.`+
          suppCtx+pqrCtx;

        // Build content blocks — WPS first, then PQR (if separate), then instruction text
        // If the PQR document is the SAME FILE as the WPS (embedded/combined), send it once only.
        const hasSeparatePqrDoc = pqrDocB64 && pqrDocMime && pqrDocB64 !== docB64;
        const hasCombinedDoc    = pqrDocB64 && pqrDocMime && pqrDocB64 === docB64;
        const blocks=[];
        if(docMime==="text/excel"){
          blocks.push({type:"text",text:`WPS${hasCombinedDoc?" + PQR":""} DOCUMENT (converted from Excel):\n\n${docB64}`});
        } else {
          blocks.push(docMime.startsWith("image/")
            ?{type:"image",source:{type:"base64",media_type:docMime,data:docB64}}
            :{type:"document",source:{type:"base64",media_type:docMime,data:docB64}});
        }
        if(hasSeparatePqrDoc){
          if(pqrDocMime==="text/excel"){
            blocks.push({type:"text",text:`PQR DOCUMENT (converted from Excel):\n\n${pqrDocB64}`});
          } else {
            blocks.push(pqrDocMime.startsWith("image/")
              ?{type:"image",source:{type:"base64",media_type:pqrDocMime,data:pqrDocB64}}
              :{type:"document",source:{type:"base64",media_type:pqrDocMime,data:pqrDocB64}});
          }
        }
        blocks.push({type:"text",text:valInstruction});
        msgContent=blocks;
      } else {
        // Manual input path: validate from the entered params
        const payload={
          standard:STD_LABEL[std], edition,
          wps_parameters:params, process_layers:layers,
          pqr_records:pqrData?[pqrData]:[], supplementary_requirements:suppReqs,
        };
        msgContent=[{type:"text",text:`Validate this WPS against ${STD_LABEL[std]} ${edition}:\n${JSON.stringify(payload)}`}];
      }

      const raw=await callClaude(
        msgContent,
        apiKey,
        buildValidationSystemPrompt(std, edition, params.qualificationStandard||"", !!docB64, hasPqrDocAny),
        6000
      );

      setProgress(90);setProgressMsg("Processing results…");
      const parsed=parseJSON(raw);
      setRawResp(raw);
      setResult({...parsed, _std:std, _detConf:detConf});
      setResTab("recs");

      const {score}=computeScore(parsed);
      const entry={
        id:Date.now().toString(), v:2,
        wpsNumber:params.wpsNumber, process:layers[0]?.process||"—",
        standard:std, standardLabel:STD_LABEL[std], edition,
        score, confidence:parsed.overall_confidence,
        linkedPqr:params.linkedPqr||"",
        dateValidated:new Date().toLocaleDateString(),
        validatedBy:params.validatedBy,
        fullResult:parsed,
        fullParams:{params,layers,editions,suppReqs},
      };
      const nr=[entry,...register];
      setRegister(nr);localStorage.setItem(REG_KEY,JSON.stringify(nr));
      currentRegId.current=entry.id;

      // ── Write/update main WPS register ──────────────────────────────────
      try{
        const wpsMain=JSON.parse(localStorage.getItem(WPS_MAIN_KEY)||"[]");
        const hiStr=(l)=>l&&l.hiMin&&l.hiMax?`${l.hiMin}–${l.hiMax} ${l.hiUnit||"kJ/mm"}`:"—";
        const wpsEntry={
          id:params.wpsNumber||`WPS-VAL-${entry.id}`,
          rev:"A",
          title:params.wpsNumber?`${params.wpsNumber} – ${STD_LABEL[std]}`:`Validated WPS – ${STD_LABEL[std]}`,
          standard:STD_LABEL[std],
          processes:Array.from(new Set(layers.map(l=>l.process).filter(Boolean))),
          materialGroups:params.baseMtlGroup?[params.baseMtlGroup]:params.pNumber?[`P${params.pNumber}`]:["—"],
          pqrRef:params.linkedPqr||"—",
          positions:Array.isArray(params.positions)?params.positions:[],
          thicknessRange:params.thickness||"—",
          heatInput:hiStr(layers[0]),
          preheat:params.preheat||"—",
          interpass:params.interpass||"—",
          consumable:layers[0]?.fillerClass||"—",
          shieldingGas:layers[0]?.shieldGas||"—",
          approvedBy:params.validatedBy||"—",
          approvalDate:new Date().toISOString().split("T")[0],
          status:score>=70?"Active":"Pending Review",
        };
        const wpsIdx=wpsMain.findIndex(w=>w.id===wpsEntry.id);
        if(wpsIdx>=0)wpsMain[wpsIdx]=wpsEntry;else wpsMain.unshift(wpsEntry);
        localStorage.setItem(WPS_MAIN_KEY,JSON.stringify(wpsMain));
      }catch(e){console.error("WPS main register write failed:",e);}

      // ── Write/update main PQR register (if PQR data available) ──────────
      if(pqrData){
        try{
          const pqrMain=JSON.parse(localStorage.getItem(PQR_MAIN_KEY)||"[]");
          const pqrTests=[];
          // pqrData uses short field names (no pqr prefix) except pqrNumber
          if(pqrData.tensileResult==="PASS")pqrTests.push("Tensile");
          if(pqrData.bendResult==="PASS")pqrTests.push("Bend");
          if(pqrData.impactResult==="PASS")pqrTests.push("Impact");
          if(pqrData.hardnessResult==="PASS")pqrTests.push("Hardness");
          if(pqrData.macroResult==="PASS")pqrTests.push("Macro");
          if(pqrData.radiographyResult==="PASS")pqrTests.push("RT");
          const pqrEntry={
            id:pqrData.pqrNumber||`PQR-VAL-${entry.id}`,
            wpsRef:params.wpsNumber||pqrData.linkedWps||"—",
            testDate:pqrData.testDate||new Date().toISOString().split("T")[0],
            testLab:pqrData.witnessedBy||"—",
            standard:STD_LABEL[std],
            result:pqrData.overallResult||"PENDING",
            tests:pqrTests.length?pqrTests:["—"],
          };
          const pqrIdx=pqrMain.findIndex(p=>p.id===pqrEntry.id);
          if(pqrIdx>=0)pqrMain[pqrIdx]=pqrEntry;else pqrMain.unshift(pqrEntry);
          localStorage.setItem(PQR_MAIN_KEY,JSON.stringify(pqrMain));
        }catch(e){console.error("PQR main register write failed:",e);}
      }

    } catch(e){
      const is401=e.status===401;
      setApiError({type:is401?"auth":e.message.toLowerCase().includes("json")||e.message.toLowerCase().includes("token")?"parse":"api",message:is401?"Invalid API key — your key was rejected by Anthropic (401). Please update your API key.":e.message});
      if(is401)setShowKey(true);
    } finally{setProgress(100);setLoading(false);}
  };

  const togglePqrTest=(idx)=>{
    const tests=[...(result.pqr_tests||[])];
    tests[idx]={...tests[idx],status:tests[idx].status==="COMPLETE"?"INCOMPLETE":"COMPLETE"};
    const updated={...result,pqr_tests:tests};
    setResult(updated);
    syncResult(updated);
  };

  const verifyCheck=(idx, newStatus)=>{
    const checks=[...(result.essential_variable_checks||[])];
    const prev=checks[idx];
    checks[idx]={
      ...prev,
      status:newStatus,
      _verified: newStatus!=="REQUIRES_VERIFICATION",
      _prevStatus: newStatus==="REQUIRES_VERIFICATION" ? undefined : (prev._prevStatus||prev.status),
    };
    const updated={...result,essential_variable_checks:checks};
    setResult(updated);
    syncResult(updated);
  };

  const loadRec=rec=>{
    if(rec.fullParams){setParams(rec.fullParams.params);setLayers(rec.fullParams.layers);setEditions(rec.fullParams.editions);setSuppReqs(rec.fullParams.suppReqs||[]);}
    if(rec.fullResult){
      setResult({...rec.fullResult,_std:rec.standard||"ASME_IX",_detConf:rec.confidence});
      setResTab("recs");
    }
    if(rec.standard) setTargetStd(rec.standard);
    currentRegId.current=rec.id;
    setLeftTab("input");
  };
  const delRec=id=>{const nr=register.filter(r=>r.id!==id);setRegister(nr);localStorage.setItem(REG_KEY,JSON.stringify(nr));};

  const {score}=result?computeScore(result):{score:0};
  const oc=result?.overall_confidence;
  const recCount=(()=>{
    const aiHighCount=(result?.recommendations||[]).filter(r=>r.priority==="critical"||r.priority==="high").length;
    const ncCount=(result?.essential_variable_checks||[]).filter(c=>c.status==="NON_COMPLIANT").length;
    return Math.max(aiHighCount,ncCount);
  })();

  if(appMode==="revision") return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:D.bg,fontFamily:"'Inter',sans-serif",color:D.text,overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>
      <RevCompare apiKey={apiKey} onBack={()=>setAppMode("main")}/>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:D.bg,fontFamily:"'Inter',sans-serif",color:D.text,overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <div style={{background:D.surface,borderBottom:`1px solid ${D.border}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:12,flexShrink:0}} className="no-print">
        <span style={{fontFamily:"'DM Mono',monospace",color:D.accent,fontWeight:700,fontSize:14,letterSpacing:".04em"}}>WPS VALIDATION ENGINE</span>
        <span style={{color:D.textSoft,fontSize:11}}>Targeted Single-Standard · Compliance Score · Recommendations</span>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          {oc&&<div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:D.textMid,fontSize:11}}>Confidence:</span><ConfBadge level={oc}/></div>}
          <Btn small outline onClick={()=>setAppMode("revision")} color={D.purple}>Revision Compare</Btn>
          <Btn small outline onClick={()=>setShowKey(v=>!v)} color={D.textMid}>API Key</Btn>
          <Btn small outline onClick={()=>window.print()} color={D.blue}>Export PDF</Btn>
        </div>
      </div>

      {/* Low confidence banner */}
      {oc==="LOW"&&<div style={{background:D.failBg,borderBottom:`1px solid ${D.failBorder}`,padding:"7px 20px",color:D.fail,fontSize:12,fontWeight:600,flexShrink:0}}>⚠ OVERALL CONFIDENCE LOW — independent engineering review is mandatory before use in any controlled document.</div>}

      {/* API key drawer */}
      {showKey&&<div style={{background:D.surfaceAlt,borderBottom:`1px solid ${D.border}`,padding:"10px 20px",display:"flex",gap:10,alignItems:"center",flexShrink:0,flexWrap:"wrap"}} className="no-print">
        <span style={{color:D.textMid,fontSize:12,whiteSpace:"nowrap"}}>Claude API Key:</span>
        <div style={{display:"flex",gap:6,flex:1,maxWidth:420}}>
          <input type={showKeyText?"text":"password"} value={keyDraft} onChange={e=>setKeyDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveKey()} placeholder="sk-ant-…" style={{...INP,flex:1}}/>
          <button onClick={()=>setShowKeyText(v=>!v)} style={{background:D.surfaceHov,border:`1px solid ${D.border}`,color:D.textMid,borderRadius:6,padding:"4px 10px",fontSize:11,fontFamily:"'Inter',sans-serif"}}>{showKeyText?"Hide":"Show"}</button>
        </div>
        <Btn small color={D.accent} onClick={saveKey} disabled={!keyDraft.trim()}>Save</Btn>
        {apiKey&&<><Btn small outline onClick={()=>setShowKey(false)}>Cancel</Btn><span style={{color:D.pass,fontSize:11}}>✓ Key saved: {apiKey.slice(0,12)}…{apiKey.slice(-4)}</span></>}
      </div>}

      {/* Body */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* LEFT — input */}
        <div style={{width:"42%",minWidth:360,borderRight:`1px solid ${D.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}} className="no-print">
          <TabBar tabs={[["input","Input & Configuration"],["register","Register"]]} active={leftTab} setActive={setLeftTab}/>

          {leftTab==="input"&&<>
            <div style={{padding:"10px 16px",borderBottom:`1px solid ${D.border}`,display:"flex",gap:7,flexShrink:0}}>
              {[["manual","Manual Entry"],["upload","Document Upload"]].map(([id,l])=>(
                <button key={id} onClick={()=>setInputMode(id)} style={{background:inputMode===id?D.accentFaint:"transparent",border:`1px solid ${inputMode===id?D.accentBorder:D.border}`,color:inputMode===id?D.accent:D.textMid,borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif"}}>{l}</button>
              ))}
            </div>

            {inputMode==="manual"
              ?<ManualInput params={params} setParams={setParams} layers={layers} setLayers={setLayers} editions={editions} setEditions={setEditions} suppReqs={suppReqs} setSuppReqs={setSuppReqs} errors={errors} targetStd={targetStd} setTargetStd={setTargetStd}/>
              :<DocUpload apiKey={apiKey} onError={msg=>setApiError({type:"api",message:msg})} onExtracted={(ex,b64,mime)=>{
                const wps=ex.wps||ex;
                const pqr=ex.pqr||null;
                const mv=k=>wps[k]?.value||"";
                const proc=mv("process")||"GMAW";
                const noXfer=proc==="SMAW"||proc==="GTAW"||proc==="SAW";
                const xferMode=noXfer?"N/A":(mv("transferMode")&&!mv("transferMode").toLowerCase().startsWith("n/a")?mv("transferMode"):"Spray");
                const newParams={...params,
                  wpsNumber:mv("wpsNumber"),qualificationStandard:mv("qualificationStandard"),
                  linkedPqr:mv("linkedPqr"),validatedBy:mv("validatedBy"),
                  materialSpec:mv("materialSpec"),baseMtlGroup:mv("baseMtlGroup"),
                  pNumber:mv("pNumber"),asmeGroupNumber:mv("asmeGroupNumber"),
                  thickness:mv("thickness"),preheat:mv("preheat"),interpass:mv("interpass"),
                  pwht:wps.pwht?.value===true||wps.pwht?.value==="true",
                  jointType:mv("jointType")||"Butt",positions:parsePositions(wps.positions?.value),
                };
                setParams(newParams);
                setLayers([{...mkLayer(),
                  process:proc,fillerClass:mv("fillerClass"),fillerDia:mv("fillerDia"),
                  shieldGas:mv("shieldGas"),gasFlow:mv("gasFlow"),
                  currentType:mv("currentType")||"DCEP",transferMode:xferMode,
                  ampsMin:mv("ampsMin"),ampsMax:mv("ampsMax"),
                  voltsMin:mv("voltsMin"),voltsMax:mv("voltsMax"),
                  travelSpeedMin:mv("travelSpeedMin"),travelSpeedMax:mv("travelSpeedMax"),
                  travelSpeedUnit:mv("travelSpeedUnit")||"mm/min",
                  wireFeedMin:mv("wireFeedMin"),wireFeedMax:mv("wireFeedMax"),
                  hiMin:mv("heatInputMin"),hiMax:mv("heatInputMax"),hiUnit:mv("heatInputUnit")||"kJ/mm",
                }]);
                // Only populate PQR if extraction returned actual PQR data
                if(pqr){
                  const mpq=k=>pqr[k]?.value||"";
                  setPqrData({pqrNumber:mpq("pqrNumber"),linkedWps:mpq("pqrLinkedWps"),testDate:mpq("pqrTestDate"),witnessedBy:mpq("pqrWitnessedBy"),approvedBy:mpq("pqrApprovedBy"),testPieceThickness:mpq("pqrTestPieceThickness"),testPieceMaterial:mpq("pqrTestPieceMaterial"),actualHeatInputMin:mpq("pqrActualHeatInputMin"),actualHeatInputMax:mpq("pqrActualHeatInputMax"),actualPreheat:mpq("pqrActualPreheat"),actualInterpass:mpq("pqrActualInterpass"),tensileResult:mpq("pqrTensileResult"),tensileValues:mpq("pqrTensileValues"),bendResult:mpq("pqrBendResult"),bendType:mpq("pqrBendType"),impactResult:mpq("pqrImpactResult"),impactValues:mpq("pqrImpactValues"),impactTemp:mpq("pqrImpactTemp"),hardnessResult:mpq("pqrHardnessResult"),hardnessValues:mpq("pqrHardnessValues"),macroResult:mpq("pqrMacroResult"),radiographyResult:mpq("pqrRadiographyResult"),ndtOther:mpq("pqrNDTOther"),overallResult:mpq("pqrOverallResult")||"UNKNOWN"});
                  // This document contains embedded PQR — store it as the PQR document source
                  // so validation reads test results directly from the source file (not just extracted JSON)
                  setPqrDocB64(b64||null);
                  setPqrDocMime(mime||null);
                } else {
                  setPqrData(null);
                  // Only clear pqrDoc if no separate PQR was already uploaded via PQRSection
                  setPqrDocB64(d=>d);
                  setPqrDocMime(d=>d);
                }
                // Store original document for document-aware validation
                setDocB64(b64||null);
                setDocMime(mime||null);
                // Auto-detect standard; qualificationStandard feeds into keyword scoring
                const det=detectStandard(newParams,[],pqr?{pqrNumber:pqr.pqrNumber?.value||""}:null);
                if(det.confidence!=="LOW") setTargetStd(det.standard);
                setInputMode("manual");
              }}/>
            }

            <PQRSection apiKey={apiKey} pqrData={pqrData}
              onPqrExtracted={(data,rawDoc,rawMime)=>{setPqrData(data);setPqrDocB64(rawDoc||null);setPqrDocMime(rawMime||null);}}
              onClear={()=>{setPqrData(null);setPqrDocB64(null);setPqrDocMime(null);}}/>

            {/* Validate footer */}
            <div style={{padding:"12px 16px",borderTop:`1px solid ${D.border}`,background:D.surfaceAlt,flexShrink:0}}>
              {Object.keys(errors).length>0&&<div style={{color:D.fail,fontSize:11,marginBottom:6}}>Required: {Object.keys(errors).map(k=>({wpsNumber:"WPS Number",thickness:"Thickness",validatedBy:"Validated By"}[k]||k)).join(", ")}</div>}
              {loading&&<div style={{marginBottom:8}}>
                <div style={{background:D.border,borderRadius:4,height:3,overflow:"hidden",marginBottom:4}}><div style={{background:D.accent,height:"100%",width:`${progress}%`,transition:"width .4s ease",borderRadius:4}}/></div>
                <span style={{color:D.textMid,fontSize:11}}>{progressMsg} {progress}%</span>
              </div>}
              {detectedConf&&!loading&&!result&&<div style={{marginBottom:8,color:D.textMid,fontSize:11}}>Detected: <span style={{color:STD_LABEL[targetStd]?D.accent:D.warn,fontWeight:600}}>{STD_LABEL[targetStd]}</span> <span style={{color:detectedConf==="HIGH"?D.pass:detectedConf==="MEDIUM"?D.warn:D.fail}}>({detectedConf})</span></div>}
              <Btn color={D.accent} onClick={validate} disabled={loading||!apiKey} style={{width:"100%"}}>
                {loading?"Validating…":"Run Targeted Validation"}
              </Btn>
              {!apiKey&&<div style={{color:D.warn,fontSize:11,marginTop:5}}>API key required — click "API Key" in the header.</div>}
            </div>
          </>}

          {leftTab==="register"&&<Tab6 register={register} onLoad={loadRec} onDelete={delRec}/>}
        </div>

        {/* RIGHT — results */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {!result&&!loading&&!apiError&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10}}>
            <div style={{width:52,height:52,borderRadius:"50%",border:`2px solid ${D.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:D.textSoft}}>⚙</div>
            <div style={{color:D.textMid,fontWeight:600,fontSize:14}}>Configure WPS and run targeted validation</div>
            <div style={{color:D.textSoft,fontSize:12}}>Standard auto-detected · 1 API call · Compliance score + recommendations</div>
          </div>}

          {loading&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner label={progressMsg||"Validating…"}/></div>}

          {apiError&&!loading&&<div style={{padding:20}}>
            <Card style={{borderColor:D.failBorder}}>
              <div style={{color:D.fail,fontWeight:700,marginBottom:8}}>Validation Error</div>
              <div style={{color:D.textMid,fontSize:12,marginBottom:12}}>{apiError.message}</div>
              {apiError.type==="parse"&&rawResp&&<details style={{marginBottom:12}}>
                <summary style={{color:D.textMid,fontSize:11,cursor:"pointer"}}>Show raw response</summary>
                <pre style={{marginTop:8,color:D.textSoft,fontSize:10,background:D.surfaceAlt,padding:10,borderRadius:6,overflowX:"auto",whiteSpace:"pre-wrap",maxHeight:300}}>{rawResp}</pre>
              </details>}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {apiError.type!=="auth"&&<Btn small color={D.accent} onClick={()=>runTargetedVal(targetStd,detectedConf)}>Retry</Btn>}
                {apiError.type==="auth"&&<Btn small color={D.fail} onClick={()=>{localStorage.removeItem("wqms_api_key");window.location.reload();}}>Reset API Key</Btn>}
                <Btn small outline onClick={()=>setShowKey(v=>!v)} color={D.textMid}>Update API Key</Btn>
              </div>
            </Card>
          </div>}

          {result&&!loading&&<>
            <ScoreGauge
              score={score}
              std={result._std||targetStd}
              edition={editions[result._std||targetStd]}
              confidence={result.overall_confidence}
              prequalified={result.prequalified}
            />
            <TabBar tabs={[
              ["recs","Recommendations",recCount>0?String(recCount):null],
              ["checks","Compliance Checks"],
              ["ranges","Qual. Ranges"],
              ["pqr","PQR Tests",(result.pqr_tests||[]).filter(t=>t.status==="INCOMPLETE").length>0?String((result.pqr_tests||[]).filter(t=>t.status==="INCOMPLETE").length):null],
              ["scope","Welder Scope"],
            ]} active={resTab} setActive={setResTab}/>
            <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
              {resTab==="recs"   &&<RecommendationsTab result={result}/>}
              {resTab==="checks" &&<ComplianceChecksTab result={result} onVerify={verifyCheck}/>}
              {resTab==="ranges" &&<QualRangesTab result={result}/>}
              {resTab==="pqr"    &&<PQRTestsTab result={result} onToggle={togglePqrTest}/>}
              {resTab==="scope"  &&<WelderScopeTab result={result}/>}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
