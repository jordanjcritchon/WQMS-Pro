import React, { useState, useRef } from "react";

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
// Map ISO/EN position codes and bare ASME codes to the combined form used in POSITIONS
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
const JOINT_TYPES= ["Butt","Fillet","T-joint","Corner","Lap"];
const STANDARDS  = ["ASME_IX","ISO_15614_1","AS_1554_1","AS_3992","AWS_D1_1","AWS_B2_1"];
const STD_LABEL  = {ASME_IX:"ASME IX",ISO_15614_1:"ISO 15614-1",AS_1554_1:"AS 1554.1",AS_3992:"AS 3992",AWS_D1_1:"AWS D1.1",AWS_B2_1:"AWS B2.1"};
const EDITIONS   = {
  ASME_IX:       ["2019","2021","2023"],
  ISO_15614_1:   ["2004","2017","2017+AMD1:2019"],
  AS_1554_1:     ["2014","2014+AMD1"],
  AS_3992:       ["1998"],
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
const mkLayer  = () => ({process:"GMAW",fillerClass:"",fillerDia:"",shieldGas:"",gasFlow:"",currentType:"DCEP",transferMode:"Spray",hiMin:"",hiMax:"",hiUnit:"kJ/mm"});
const mkParams = () => ({wpsNumber:"",materialSpec:"",baseMtlGroup:"",pNumber:"",asmeGroupNumber:"",thickness:"",preheat:"",interpass:"",pwht:false,pwhtTempMin:"",pwhtTempMax:"",pwhtHold:"",jointType:"Butt",positions:[],multiPass:true,multiWire:false,backing:false,backingMtl:"",validatedBy:"",linkedPqr:""});

// ── System Prompts (split into 2 calls to stay within token limits) ────────
const EXPERT_PREAMBLE = `You are a senior welding engineer and codes specialist with deep expertise in ASME Section IX, ISO 15614-1, AS 1554.1, AS 3992, AWS D1.1, and AWS B2.1. Return strict JSON only — no preamble, no markdown fences.

BREVITY RULES (critical — output must fit within token limit):
- All string values: max 12 words. No clause numbers inside value strings unless the field IS a clause field.
- qualification_range strings: max 8 words (e.g. "0.5t to 2t per QW-451").
- gaps arrays: max 4 items per standard, each item max 10 words.
- resolution strings: max 12 words.
- confidence_note strings: max 10 words.
- Omit any field whose value would be empty or "N/A".

Confidence: HIGH=certain of clause; MEDIUM=confident; LOW=uncertain, human review mandatory.

Key assessment rules:
- PREHEAT: WPS preheat is a MINIMUM. PQR preheat ≥ WPS min → COMPLIANT.
- POSITIONS: If wps_parameters.positions contains ANY position codes, the WPS is NOT missing positions — mark positions as COMPLIANT. 2F = PB (horizontal fillet). Accept all ASME and ISO/EN equivalents.
- TRANSFER MODE: Only assess transfer mode for GMAW and FCAW. For SMAW, GTAW, SAW, or any non-GMAW/FCAW process the transfer mode is NOT_APPLICABLE — do NOT flag it as a gap or non-compliance regardless of what value appears in the data.
- AS 1554 MATERIAL GROUPS: AS 1554.1 uses weldability categories (Cat 1–4) per Table 2.2.`;

// Call 1 — material classification + qualification ranges (combined)
const SYSTEM_PROMPT_P1 = `${EXPERT_PREAMBLE}

Classify base metals and assess qualification ranges. For material_classification: identify ASME IX P-Number/Group (QW-422), ISO group, AS weldability category, AWS D1.1 category for each base metal. Rules: if P-Number explicit → basis="direct"; if AS 1554/AS 3992 only → find nearest equivalent, basis="equivalent", add brief note; if unknown → basis="unknown", p_number="—". Multiple materials: one entry each.

Return ONLY this JSON:
{"process":"string","edition_years":{"ASME_IX":"string","ISO_15614_1":"string","AS_1554_1":"string","AS_3992":"string","AWS_D1_1":"string","AWS_B2_1":"string"},"material_classification":[{"specification":"string","asme_p_number":"string","asme_p_number_basis":"direct|equivalent|unknown","asme_p_number_note":"string","asme_group_number":"string","iso_material_group":"string","as_material_group":"string","aws_d1_category":"string","stated_p_number":"string","mismatch":false,"mismatch_note":"string","confidence":"HIGH|MEDIUM|LOW"}],"qualification_ranges":{"ASME_IX":{"thickness":"string","heat_input":"string","positions":"string","pwht":"string","filler_diameter":"string"},"ISO_15614_1":{},"AS_1554_1":{},"AS_3992":{},"AWS_D1_1":{},"AWS_B2_1":{}}}`;

// Call 2 — essential variables: ASME IX, ISO 15614-1, AS 1554.1
const SYSTEM_PROMPT_P2 = `${EXPERT_PREAMBLE}

CRITICAL TOKEN RULE: Include ONLY items with status NON_COMPLIANT or REQUIRES_VERIFICATION. Omit all COMPLIANT items — they waste tokens. If all items pass for a standard, return [].

Return ONLY this JSON (ASME_IX, ISO_15614_1, AS_1554_1 only):
{"essential_variables":{"ASME_IX":[{"variable":"string","clause":"string","recorded_value":"string","qualification_range":"string","status":"NON_COMPLIANT|REQUIRES_VERIFICATION","confidence":"HIGH|MEDIUM|LOW","confidence_note":"string"}],"ISO_15614_1":[],"AS_1554_1":[]}}`;

// Call 3 — essential variables: AS 3992, AWS D1.1, AWS B2.1
const SYSTEM_PROMPT_P3 = `${EXPERT_PREAMBLE}

CRITICAL TOKEN RULE: Include ONLY items with status NON_COMPLIANT or REQUIRES_VERIFICATION. Omit all COMPLIANT items — they waste tokens. If all items pass for a standard, return [].

Return ONLY this JSON (AS_3992, AWS_D1_1, AWS_B2_1 only):
{"essential_variables":{"AS_3992":[{"variable":"string","clause":"string","recorded_value":"string","qualification_range":"string","status":"NON_COMPLIANT|REQUIRES_VERIFICATION","confidence":"HIGH|MEDIUM|LOW","confidence_note":"string"}],"AWS_D1_1":[],"AWS_B2_1":[]}}`;

// Call 4 — PQR test requirements (all 6 standards)
const SYSTEM_PROMPT_P4 = `${EXPERT_PREAMBLE}

Cross-reference pqr_records against each standard's test requirements. PASS/ACCEPTED → COMPLETE. Required but missing/FAIL/PENDING → INCOMPLETE. Not applicable → NOT_APPLICABLE.
CRITICAL TOKEN RULE: Include ONLY INCOMPLETE items. Omit all COMPLETE and NOT_APPLICABLE items to save space.

Return ONLY this JSON:
{"pqr_test_requirements":{"ASME_IX":[{"test":"string","clause":"string","requirement":"string","status":"INCOMPLETE","pqr_actual_result":"string","confidence":"HIGH|MEDIUM|LOW","confidence_note":"string"}],"ISO_15614_1":[],"AS_1554_1":[],"AS_3992":[],"AWS_D1_1":[],"AWS_B2_1":[]}}`;

// Call 5 — gap analysis + welder scope + summary (all 6 standards)
const SYSTEM_PROMPT_P5 = `${EXPERT_PREAMBLE}

For AS_1554_1: first check if PREQUALIFIED per Clause 4.5 — applies when: (a) process is MMAW, SAW, GTAW, or GMAW Spray/Pulse; (b) base metal Category 1, 2, or 3 per Table 2.2; (c) heat input within Table 4.5.1; (d) preheat meets Table 4.7.1. If prequalified: qualifies=true, note "Prequalified WPS — no PQR required". Otherwise full qualification per Clause 4.4.
CRITICAL TOKEN RULE: unified_test_matrix maximum 4 tests. wpq_scope fields max 8 words each.

Return ONLY this JSON:
{"gap_analysis":{"ASME_IX":{"qualifies":true,"gaps":["string"],"resolution":"string","clause_basis":"string"},"ISO_15614_1":{},"AS_1554_1":{},"AS_3992":{},"AWS_D1_1":{},"AWS_B2_1":{}},"minimum_common_pathway":{"achievable":true,"conflicts":["string"],"test_piece":{"dimensions":"string","material":"string","rationale":"string"},"unified_test_matrix":[{"test":"string","specimen_count":"string","acceptance_criteria":{"ASME_IX":"string","ISO_15614_1":"string","AS_1554_1":"string","AS_3992":"string","AWS_D1_1":"string","AWS_B2_1":"string"},"clauses":{"ASME_IX":"string","ISO_15614_1":"string","AS_1554_1":"string","AS_3992":"string","AWS_D1_1":"string","AWS_B2_1":"string"},"confidence":"HIGH|MEDIUM|LOW"}]},"wpq_scope":{"ASME_IX":{"positions":"string","thickness_range":"string","process":"string","material_group":"string","clause":"string","confidence":"HIGH|MEDIUM|LOW"},"ISO_15614_1":{},"AS_1554_1":{},"AS_3992":{},"AWS_D1_1":{},"AWS_B2_1":{}},"overall_confidence":"HIGH|MEDIUM|LOW","overall_summary":"string"}`;

// ── API Helpers ───────────────────────────────────────────────────────────
function repairTruncatedJSON(s) {
  let result = s.trimEnd();
  // Remove incomplete key with no value: ,"key":
  result = result.replace(/,?\s*"[^"\\]*(?:\\.[^"\\]*)?"?\s*:\s*$/, '');
  // Remove incomplete string value that was cut mid-way: ,"key": "partial...
  result = result.replace(/,?\s*"[^"\\]*$/, '');
  // Remove trailing comma
  result = result.replace(/,\s*$/, '');
  // Count unclosed brackets and braces (skipping string contents)
  let braces = 0, brackets = 0, inStr = false, escaped = false;
  for (const c of result) {
    if (escaped)       { escaped = false; continue; }
    if (c === '\\' && inStr) { escaped = true; continue; }
    if (c === '"')     { inStr = !inStr; continue; }
    if (inStr)         continue;
    if (c === '{')     braces++;
    else if (c === '}') braces--;
    else if (c === '[') brackets++;
    else if (c === ']') brackets--;
  }
  for (let i = 0; i < brackets; i++) result += ']';
  for (let i = 0; i < braces;   i++) result += '}';
  return result;
}

function parseJSON(raw) {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try { return JSON.parse(stripped); } catch(_) {}
  try { return JSON.parse(repairTruncatedJSON(stripped)); } catch(e) {
    throw new Error("JSON parse failed after repair attempt: " + e.message);
  }
}

// Use proxy in dev (Vite rewrites /api/anthropic → api.anthropic.com);
// call Anthropic directly in production (the dangerous-direct-browser-access header enables CORS).
const ANTHROPIC_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "/api/anthropic/v1/messages"
  : "https://api.anthropic.com/v1/messages";

async function callClaude(userContent, apiKey, systemOverride, maxTokens=1500, model="claude-sonnet-4-6") {
  const r = await fetch(ANTHROPIC_URL, {
    method:"POST",
    headers:{
      "x-api-key":apiKey,
      "anthropic-version":"2023-06-01",
      "content-type":"application/json",
      "anthropic-dangerous-direct-browser-access":"true",
    },
    body:JSON.stringify({
      model,
      max_tokens:maxTokens,
      system:systemOverride||SYSTEM_PROMPT,
      messages:[{role:"user",content:userContent}],
    }),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`API ${r.status}: ${t}`); }
  return (await r.json()).content[0].text;
}

const HAIKU = "claude-haiku-4-5-20251001";

async function extractFromDoc(b64, mimeType, apiKey) {
  const block = mimeType.startsWith("image/")
    ? {type:"image",source:{type:"base64",media_type:mimeType,data:b64}}
    : {type:"document",source:{type:"base64",media_type:mimeType,data:b64}};
  return callClaude(
    [block,{type:"text",text:`Extract all WPS and PQR parameters from this document. The document may contain a WPS only, a PQR only, or both combined.

Return strict JSON with this structure:
{
  "wps": { each field as {value, confidence:'HIGH'|'MEDIUM'|'LOW'} },
  "pqr": { each field as {value, confidence} } or null if no PQR found
}

WPS fields: wpsNumber, validatedBy, process, materialSpec, baseMtlGroup, pNumber, asmeGroupNumber, thickness, fillerClass, fillerDia, shieldGas, gasFlow, preheat, interpass, pwht, pwhtTempMin, pwhtTempMax, pwhtHold, heatInputMin, heatInputMax, heatInputUnit, currentType, transferMode, jointType, positions, multiPass, multiWire, backing, backingMtl.

Field notes:
- positions: extract ALL welding position codes found. Accept ASME codes (1G,2G,3G,4G,5G,6G,1F,2F,3F,4F) and ISO/EN codes (PA,PB,PC,PD,PE,PF,PG). If both forms appear for the same position (e.g. "2F (PB)") include both. Return as array or comma-separated string.
- transferMode: for MMAW/SMAW/process 111 set value to "N/A - Not applicable to MMAW". For GMAW look for Spray, Short Circuit/Dip, Pulse/Pulsed, Globular.
- baseMtlGroup: for AS 1554 WPS extract the weldability category number (Category 1, 2, 3, or 4) per AS 1554.1 Table 2.2. Note if the document uses "weldability group" terminology instead of ISO material group numbers.

PQR fields: pqrNumber, pqrLinkedWps, pqrTestDate, pqrWitnessedBy, pqrTestPieceThickness, pqrTestPieceMaterial, pqrActualHeatInputMin, pqrActualHeatInputMax, pqrActualPreheat, pqrActualInterpass, pqrTensileResult (PASS/FAIL/PENDING), pqrTensileValues, pqrBendResult (PASS/FAIL/PENDING), pqrBendType, pqrImpactResult (PASS/FAIL/PENDING/NOT_REQUIRED), pqrImpactValues, pqrImpactTemp, pqrHardnessResult (PASS/FAIL/PENDING/NOT_REQUIRED), pqrHardnessValues, pqrMacroResult (PASS/FAIL/PENDING/NOT_REQUIRED), pqrRadiographyResult (PASS/FAIL/PENDING/NOT_REQUIRED), pqrNDTOther, pqrOverallResult (ACCEPTED/REJECTED/UNKNOWN), pqrApprovedBy.

Notes: validatedBy/pqrApprovedBy = person who signed/approved. materialSpec = full spec as written. Missing fields: value empty string, confidence LOW.`}],
    apiKey,
    "You are a welding document specialist. Extract WPS parameters from the document and return strict JSON only.",
    3000,
    HAIKU
  );
}

// ── Primitive Components ──────────────────────────────────────────────────
function ConfBadge({level,small}) {
  const sz = small ? {fontSize:9,padding:"1px 5px"} : {fontSize:10,padding:"2px 7px"};
  const s = {
    HIGH:{background:D.pass,color:"#fff",border:"none"},
    MEDIUM:{background:"transparent",color:D.warn,border:`1px solid ${D.warn}`},
    LOW:{background:"transparent",color:D.fail,border:`1px solid ${D.fail}`,animation:"pulse 1.5s infinite"},
  };
  return <span style={{...sz,borderRadius:4,fontWeight:700,letterSpacing:"0.04em",fontFamily:"'DM Mono',monospace",...(s[level]||s.LOW)}}>{level||"?"}</span>;
}

function StatusBadge({status}) {
  const cfg = {
    COMPLIANT:            {bg:D.passBg,border:D.passBorder,color:D.pass,   label:"COMPLIANT"},
    NON_COMPLIANT:        {bg:D.failBg,border:D.failBorder,color:D.fail,   label:"NON-COMPLIANT"},
    REQUIRES_VERIFICATION:{bg:D.warnBg,border:D.warnBorder,color:D.warn,   label:"VERIFY"},
    COMPLETE:             {bg:D.passBg,border:D.passBorder,color:D.pass,   label:"COMPLETE"},
    INCOMPLETE:           {bg:D.failBg,border:D.failBorder,color:D.fail,   label:"INCOMPLETE"},
    NOT_APPLICABLE:       {bg:"rgba(100,100,120,.1)",border:"rgba(100,100,120,.2)",color:D.textSoft,label:"N/A"},
  };
  const c = cfg[status]||cfg.NOT_APPLICABLE;
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
function Spinner({label="Running validation engine…"}) {
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
  const key = `lcv_${id}`;
  const [name,setName]=useState(()=>localStorage.getItem(key)||"");
  const [done,setDone]=useState(()=>!!localStorage.getItem(key));
  const confirm = () => {
    if (!name.trim()) return;
    const ts = new Date().toLocaleString();
    localStorage.setItem(key, `${name} — ${ts}`);
    setDone(true);
  };
  if (done) return <div style={{marginTop:4,color:D.pass,fontSize:9}}>✓ Verified: {localStorage.getItem(key)}</div>;
  return (
    <div style={{marginTop:6,background:"rgba(239,68,68,.06)",border:`1px solid ${D.failBorder}`,borderRadius:5,padding:"5px 7px"}}>
      <div style={{color:D.fail,fontSize:9,fontWeight:600,marginBottom:3}}>⚠ LOW confidence — reviewer sign-off required before COMPLIANT</div>
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
function ManualInput({params,setParams,layers,setLayers,editions,setEditions,suppReqs,setSuppReqs,errors}) {
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
            <div><Lbl c="Group No. (ASME IX)"/><input value={params.asmeGroupNumber} onChange={set("asmeGroupNumber")} placeholder="e.g. 1 or 2" style={INP}/></div>
            <div><Lbl c="AS / ISO Group"/><input value={params.baseMtlGroup} onChange={set("baseMtlGroup")} placeholder="e.g. 1.1" style={INP}/></div>
          </div>
          <Lbl c="Base Metal Thickness (mm)" req/><input value={params.thickness} onChange={set("thickness")} placeholder="20" style={{...INP,borderColor:errors.thickness?D.fail:undefined}}/>
        </Card>
      </div>

      {/* Process layers */}
      <div style={{marginBottom:16}}>
        <div style={{color:D.textMid,fontSize:11,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${D.border}`}}>Process Layers (Multi-Process Configuration)</div>
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

      {/* Editions */}
      <Card style={{marginBottom:16}}>
        <SH mt={0}>Standards Edition Selection</SH>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
          {STANDARDS.map(std=>(
            <div key={std}><Lbl c={STD_LABEL[std]}/><select value={editions[std]} onChange={e=>setEditions(ed=>({...ed,[std]:e.target.value}))} style={INP}>{EDITIONS[std].map(y=><option key={y}>{y}</option>)}</select></div>
          ))}
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
  const [file,setFile]=useState(null);
  const [loading,setLoading]=useState(false);
  const [extracted,setExtracted]=useState(null);
  const [confirmed,setConfirmed]=useState(false);
  const [localErr,setLocalErr]=useState(null);
  const ref=useRef();

  const handle=async f=>{
    setLocalErr(null);
    if(!apiKey){setLocalErr("API key required — click 'API Key' in the header first.");return;}
    setFile(f);setLoading(true);
    try {
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(f);});
      const raw=await extractFromDoc(b64,f.type,apiKey);
      setExtracted(parseJSON(raw));
    } catch(e){
      const msg="Extraction failed: "+e.message;
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
          <div style={{color:D.textMid,fontSize:12}}>PDF, JPG, or PNG — AI auto-extracts all fields</div>
          <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>e.target.files[0]&&handle(e.target.files[0])}/>
        </div>
      )}
      {loading&&<Spinner label="Extracting WPS parameters…"/>}
      {extracted&&!confirmed&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{color:D.text,fontWeight:700}}>Extracted Fields — Review Required</div>
            <Btn small outline onClick={()=>{setExtracted(null);setFile(null);}}>Re-upload</Btn>
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
          <Btn color={D.pass} onClick={()=>{onExtracted(extracted);setConfirmed(true);}}>Confirm All Fields & Proceed to Validation</Btn>
        </div>
      )}
      {confirmed&&<div style={{background:D.passBg,border:`1px solid ${D.passBorder}`,borderRadius:7,padding:"10px 14px",color:D.pass,fontSize:13}}>Fields confirmed. Use the Validate button to run cross-standard analysis.</div>}
    </div>
  );
}

// ── Tab 1: Essential Variables ────────────────────────────────────────────
function MatClassCard({classifications}) {
  if(!classifications||!classifications.length) return null;
  const basisCfg={
    direct:   {label:"DIRECT MATCH",  bg:D.passBg,  border:D.passBorder,  color:D.pass},
    equivalent:{label:"EQUIVALENT",   bg:D.warnBg,  border:D.warnBorder,  color:D.warn},
    unknown:  {label:"UNKNOWN",       bg:"rgba(100,100,120,.1)",border:"rgba(100,100,120,.2)",color:D.textSoft},
  };
  return (
    <div style={{marginBottom:16}}>
      <div style={{color:D.textMid,fontSize:11,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${D.border}`}}>Material Classification</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {classifications.map((m,i)=>{
          const hasMismatch=m.mismatch&&m.mismatch!=="false"&&m.mismatch!==false;
          const basis=basisCfg[m.asme_p_number_basis]||basisCfg.unknown;
          const isEquiv=m.asme_p_number_basis==="equivalent";
          return (
            <div key={i} style={{background:hasMismatch?D.failBg:D.surfaceAlt,border:`1px solid ${hasMismatch?D.failBorder:D.border}`,borderRadius:8,padding:"10px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
                <span style={{color:D.text,fontWeight:700,fontSize:13,fontFamily:"'DM Mono',monospace"}}>{m.specification||"—"}</span>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  {hasMismatch&&<span style={{background:D.failBg,border:`1px solid ${D.failBorder}`,color:D.fail,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4}}>P-NUMBER MISMATCH</span>}
                  <ConfBadge level={m.confidence} small/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:isEquiv||m.asme_p_number_note?8:0}}>
                <div style={{background:D.surface,border:`1px solid ${isEquiv?D.warnBorder:D.border}`,borderRadius:6,padding:"7px 10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <span style={{color:D.textSoft,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em"}}>ASME IX P-Number</span>
                    <span style={{background:basis.bg,border:`1px solid ${basis.border}`,color:basis.color,fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:3}}>{basis.label}</span>
                  </div>
                  <div style={{color:m.asme_p_number?D.blue:D.textSoft,fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{m.asme_p_number||"—"}</div>
                </div>
                {[
                  ["ASME IX Group No.",m.asme_group_number,D.blue],
                  ["ISO 15614-1 Group",m.iso_material_group,D.purple],
                  ["AS 1554 Weldability Cat.",m.as_material_group,D.pass],
                  ["AWS D1.1 Category",m.aws_d1_category,D.warn],
                ].map(([label,val,col])=>(
                  <div key={label} style={{background:D.surface,border:`1px solid ${D.border}`,borderRadius:6,padding:"7px 10px"}}>
                    <div style={{color:D.textSoft,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>{label}</div>
                    <div style={{color:val?col:D.textSoft,fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{val||"—"}</div>
                  </div>
                ))}
              </div>
              {isEquiv&&m.asme_p_number_note&&(
                <div style={{background:D.warnBg,border:`1px solid ${D.warnBorder}`,borderRadius:5,padding:"6px 10px",color:D.warn,fontSize:11}}>
                  <span style={{fontWeight:700}}>⚠ Equivalence basis: </span>{m.asme_p_number_note}. This is an indicative cross-reference only — not a formal ASME qualification.
                </div>
              )}
              {m.stated_p_number&&!isEquiv&&<div style={{marginTop:6,color:D.textMid,fontSize:11}}>Stated on document: P-{m.stated_p_number}</div>}
              {hasMismatch&&m.mismatch_note&&<div style={{marginTop:4,color:D.fail,fontSize:11}}>⚠ {m.mismatch_note}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tab1({data}) {
  const ev=data.essential_variables||{};
  const allVars=[...new Set(STANDARDS.flatMap(s=>(ev[s]||[]).map(v=>v.variable)))];
  const lowCount=STANDARDS.flatMap(s=>ev[s]||[]).filter(v=>v.confidence==="LOW").length;
  return (
    <div style={{overflow:"auto",flex:1,padding:16}}>
      <MatClassCard classifications={data.material_classification}/>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
        <span style={{color:D.text,fontWeight:700,fontSize:14}}>Essential Variables Matrix</span>
        <ConfBadge level={data.overall_confidence}/>
        {lowCount>0&&<span style={{background:D.failBg,border:`1px solid ${D.failBorder}`,color:D.fail,fontSize:11,padding:"2px 8px",borderRadius:5}}>{lowCount} LOW confidence — sign-off required</span>}
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>
            <th style={{...TH,width:180,position:"sticky",top:0,zIndex:2}}>Variable</th>
            {STANDARDS.map(s=><th key={s} style={{...TH,color:D.blue,position:"sticky",top:0,zIndex:2}}>{STD_LABEL[s]}</th>)}
          </tr></thead>
          <tbody>
            {allVars.map((varName,ri)=>(
              <tr key={varName} style={{background:ri%2===0?D.surface:"transparent"}}>
                <td style={{...TD,color:D.textMid,fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600}}>{varName}</td>
                {STANDARDS.map(std=>{
                  const e=(ev[std]||[]).find(v=>v.variable===varName);
                  if(!e) return <td key={std} style={{...TD,color:D.textSoft,textAlign:"center",fontSize:11}}>N/A</td>;
                  const rowBg=e.status==="COMPLIANT"?D.passBg:e.status==="NON_COMPLIANT"?D.failBg:D.warnBg;
                  return (
                    <td key={std} style={{...TD,background:rowBg}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                        <div style={{flex:1}}>
                          <div style={{color:D.text,fontSize:11,marginBottom:2}}>{e.recorded_value}</div>
                          <div style={{color:D.textMid,fontSize:10,marginBottom:3}}>→ {e.qualification_range}</div>
                          <Tip text={e.confidence_note?`${e.clause} — ${e.confidence_note}`:e.clause}>
                            <span style={{color:D.textSoft,fontSize:10,fontFamily:"'DM Mono',monospace",borderBottom:`1px dashed ${D.border}`,cursor:"help"}}>{e.clause}</span>
                          </Tip>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end",flexShrink:0}}>
                          <StatusBadge status={e.status}/>
                          <ConfBadge level={e.confidence} small/>
                        </div>
                      </div>
                      {e.confidence==="LOW"&&<LowConfVerify id={`${std}_${varName}`}/>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
}

// ── Tab 2: PQR Tests ──────────────────────────────────────────────────────
function Tab2({data,onToggle}) {
  const [open,setOpen]=useState(STANDARDS.reduce((a,s)=>({...a,[s]:true}),{}));
  const tests=data.pqr_test_requirements||{};
  return (
    <div style={{overflowY:"auto",flex:1,padding:16}}>
      <div style={{color:D.text,fontWeight:700,fontSize:14,marginBottom:14}}>PQR Test Requirements</div>
      {STANDARDS.map(std=>{
        const items=tests[std]||[];
        const inc=items.filter(t=>t.status==="INCOMPLETE").length;
        return (
          <Card key={std} style={{marginBottom:10}}>
            <button onClick={()=>setOpen(o=>({...o,[std]:!o[std]}))} style={{background:"none",border:"none",width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",padding:0,color:D.text}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{color:D.blue,fontWeight:700,fontSize:13}}>{STD_LABEL[std]}</span>
                <span style={{color:D.textSoft,fontSize:11}}>{items.length} tests</span>
                {inc>0&&<span style={{background:D.failBg,border:`1px solid ${D.failBorder}`,color:D.fail,fontSize:10,padding:"1px 6px",borderRadius:10}}>{inc} incomplete</span>}
              </div>
              <span style={{color:D.textSoft,fontSize:12}}>{open[std]?"▲":"▼"}</span>
            </button>
            {open[std]&&items.length>0&&<div style={{marginTop:10,display:"flex",flexDirection:"column",gap:5}}>
              {items.map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 10px",background:D.surfaceAlt,borderRadius:6,border:`1px solid ${D.border}`}}>
                  <input type="checkbox" checked={t.status==="COMPLETE"} onChange={()=>onToggle(std,i)} style={{accentColor:D.pass,marginTop:2,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:2}}>
                      <span style={{color:D.text,fontWeight:600,fontSize:12}}>{t.test}</span>
                      <StatusBadge status={t.status}/><ConfBadge level={t.confidence} small/>
                    </div>
                    <div style={{color:D.textMid,fontSize:11,marginBottom:2}}>{t.requirement}</div>
                    {t.pqr_actual_result&&<div style={{background:t.status==="COMPLETE"?D.passBg:D.warnBg,border:`1px solid ${t.status==="COMPLETE"?D.passBorder:D.warnBorder}`,borderRadius:4,padding:"3px 8px",fontSize:11,color:t.status==="COMPLETE"?D.pass:D.warn,marginBottom:4,display:"inline-block"}}>PQR result: {t.pqr_actual_result}</div>}
                    <Tip text={t.confidence_note||t.clause}><span style={{color:D.textSoft,fontSize:10,fontFamily:"'DM Mono',monospace",borderBottom:`1px dashed ${D.border}`,cursor:"help"}}>{t.clause}</span></Tip>
                  </div>
                </div>
              ))}
            </div>}
          </Card>
        );
      })}
    </div>
  );
}

// ── Tab 3: Qualification Ranges ───────────────────────────────────────────
function Tab3({data}) {
  const ranges=data.qualification_ranges||{};
  const fields=[["thickness","Base Metal Thickness"],["heat_input","Heat Input"],["positions","Positions Covered"],["pwht","PWHT Applicability"],["filler_diameter","Filler Diameter"]];
  return (
    <div style={{overflowY:"auto",flex:1,padding:16}}>
      <div style={{color:D.text,fontWeight:700,fontSize:14,marginBottom:14}}>Qualification Ranges Comparison</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>
            <th style={{...TH,width:200}}>Parameter</th>
            {STANDARDS.map(s=><th key={s} style={{...TH,color:D.blue}}>{STD_LABEL[s]}</th>)}
          </tr></thead>
          <tbody>
            {fields.map(([key,label],ri)=>{
              const vals=STANDARDS.map(s=>ranges[s]?.[key]||"—");
              const lens=vals.filter(v=>v!=="—").map(v=>v.length);
              const minLen=lens.length?Math.min(...lens):0;
              return (
                <tr key={key} style={{background:ri%2===0?D.surface:"transparent"}}>
                  <td style={{...TD,color:D.textMid,fontWeight:600,fontFamily:"'DM Mono',monospace",fontSize:11}}>{label}</td>
                  {STANDARDS.map((s,si)=>{
                    const v=vals[si];
                    const most=v!=="—"&&v.length===minLen&&lens.filter(l=>l===minLen).length<STANDARDS.length;
                    return <td key={s} style={{...TD,background:most?D.warnBg:"transparent"}}>
                      <span style={{color:most?D.warn:D.text,fontFamily:"'DM Mono',monospace",fontSize:11}}>{v}</span>
                      {most&&<div style={{color:D.warn,fontSize:9,marginTop:1}}>▲ most restrictive</div>}
                    </td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 4: Gap Analysis ───────────────────────────────────────────────────
function Tab4({data}) {
  const gap=data.gap_analysis||{};
  const pw=data.minimum_common_pathway||{};
  const tl=g=>{
    if(g.qualifies&&(!g.gaps||!g.gaps.length)) return {color:D.pass,bg:D.passBg,border:D.passBorder,label:"FULLY QUALIFIED"};
    if(!g.qualifies) return {color:D.fail,bg:D.failBg,border:D.failBorder,label:"NOT QUALIFIED"};
    return {color:D.warn,bg:D.warnBg,border:D.warnBorder,label:"PARTIALLY QUALIFIED"};
  };
  return (
    <div style={{overflowY:"auto",flex:1,padding:16}}>
      <div style={{color:D.text,fontWeight:700,fontSize:14,marginBottom:12}}>Gap Analysis</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {STANDARDS.map(std=>{const g=gap[std]||{};const t=tl(g);return(
          <Card key={std}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{color:D.blue,fontWeight:700,fontSize:13}}>{STD_LABEL[std]}</span>
              <span style={{background:t.bg,border:`1px solid ${t.border}`,color:t.color,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4}}>{t.label}</span>
            </div>
            {g.gaps&&g.gaps.length>0&&<ul style={{paddingLeft:16,marginBottom:8}}>{g.gaps.map((gi,i)=><li key={i} style={{color:D.textMid,fontSize:11,marginBottom:2}}>{gi}</li>)}</ul>}
            {g.resolution&&<div style={{color:D.text,fontSize:11,marginBottom:4}}><b>Resolution:</b> {g.resolution}</div>}
            {g.clause_basis&&<div style={{color:D.textSoft,fontSize:10,fontFamily:"'DM Mono',monospace"}}>{g.clause_basis}</div>}
          </Card>
        );})}
      </div>

      <div style={{color:D.text,fontWeight:700,fontSize:14,marginBottom:12}}>Minimum Common Qualification Pathway</div>
      {pw&&<>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
          <span style={{background:pw.achievable?D.passBg:D.failBg,border:`1px solid ${pw.achievable?D.passBorder:D.failBorder}`,color:pw.achievable?D.pass:D.fail,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:5}}>{pw.achievable?"ACHIEVABLE":"CONFLICTS PRESENT"}</span>
        </div>
        {pw.conflicts&&pw.conflicts.length>0&&<div style={{background:D.failBg,border:`1px solid ${D.failBorder}`,borderRadius:7,padding:"10px 14px",marginBottom:12}}>
          <div style={{color:D.fail,fontWeight:700,fontSize:12,marginBottom:6}}>Irreconcilable Conflicts</div>
          {pw.conflicts.map((c,i)=><div key={i} style={{color:D.textMid,fontSize:12,marginBottom:2}}>• {c}</div>)}
        </div>}
        {pw.test_piece&&<Card style={{marginBottom:14}}>
          <SH mt={0}>Optimal Test Piece</SH>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {[["dimensions","Dimensions"],["material","Material"],["rationale","Rationale"]].map(([k,l])=>(
              <div key={k}><div style={{color:D.textMid,fontSize:10,textTransform:"uppercase",marginBottom:2}}>{l}</div><div style={{color:D.text,fontSize:12,fontFamily:k==="dimensions"?"'DM Mono',monospace":"inherit"}}>{pw.test_piece[k]||"—"}</div></div>
            ))}
          </div>
        </Card>}
        {pw.unified_test_matrix&&pw.unified_test_matrix.length>0&&<>
          <div style={{color:D.textMid,fontSize:11,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>Unified Test Matrix</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead><tr>
                {["Test","Specimens","Conf",...STANDARDS.map(s=>`${STD_LABEL[s]} Criteria`),...STANDARDS.map(s=>`${STD_LABEL[s]} Clause`)].map((h,i)=><th key={i} style={{...TH,fontSize:10}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {pw.unified_test_matrix.map((row,i)=>(
                  <tr key={i} style={{background:i%2===0?D.surface:"transparent"}}>
                    <td style={{...TD,fontWeight:600,color:D.text}}>{row.test}</td>
                    <td style={{...TD,color:D.textMid,fontFamily:"'DM Mono',monospace"}}>{row.specimen_count}</td>
                    <td style={TD}><ConfBadge level={row.confidence} small/></td>
                    {STANDARDS.map(s=><td key={s} style={{...TD,color:D.textMid,fontSize:11}}>{row.acceptance_criteria?.[s]||"—"}</td>)}
                    {STANDARDS.map(s=><td key={s} style={{...TD,color:D.textSoft,fontFamily:"'DM Mono',monospace",fontSize:10}}>{row.clauses?.[s]||"—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}
      </>}
    </div>
  );
}

// ── Tab 5: Welder Scope ───────────────────────────────────────────────────
function Tab5({data}) {
  const wpq=data.wpq_scope||{};
  const fields=[["positions","Positions"],["thickness_range","Thickness Range"],["process","Process"],["material_group","Material Group"],["clause","Clause Ref"]];
  return (
    <div style={{overflowY:"auto",flex:1,padding:16}}>
      <div style={{color:D.text,fontWeight:700,fontSize:14,marginBottom:14}}>Derived Welder Qualification Scope (WPQ)</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {STANDARDS.map(std=>{const s=wpq[std]||{};return(
          <Card key={std}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{color:D.blue,fontWeight:700,fontSize:13}}>{STD_LABEL[std]}</span>
              <ConfBadge level={s.confidence} small/>
            </div>
            {fields.map(([k,l])=>(
              <div key={k} style={{marginBottom:8}}>
                <div style={{color:D.textMid,fontSize:10,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2}}>{l}</div>
                <div style={{color:D.text,fontSize:12,fontFamily:k==="clause"?"'DM Mono',monospace":"inherit"}}>{s[k]||"—"}</div>
              </div>
            ))}
          </Card>
        );})}
      </div>
    </div>
  );
}

// ── Tab 6: Register ───────────────────────────────────────────────────────
// ── PQR Upload Section ────────────────────────────────────────────────────
function PQRSection({apiKey,pqrData,onPqrExtracted,onClear}) {
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState(null);
  const ref=useRef();

  const handle=async f=>{
    setErr(null);
    if(!apiKey){setErr("API key required — click 'API Key' in the header.");return;}
    setLoading(true);
    try {
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(f);});
      const raw=await callClaude(
        [{type:f.type.startsWith("image/")?"image":"document",source:{type:"base64",media_type:f.type,data:b64}},{type:"text",text:`Extract PQR (Procedure Qualification Record) data from this document. Return strict JSON where each field is {value,confidence:'HIGH'|'MEDIUM'|'LOW'}. Fields: pqrNumber, pqrLinkedWps, pqrTestDate, pqrWitnessedBy, pqrApprovedBy, pqrTestPieceThickness, pqrTestPieceMaterial, pqrActualHeatInputMin, pqrActualHeatInputMax, pqrActualPreheat, pqrActualInterpass, pqrTensileResult, pqrTensileValues, pqrBendResult, pqrBendType, pqrImpactResult, pqrImpactValues, pqrImpactTemp, pqrHardnessResult, pqrHardnessValues, pqrMacroResult, pqrRadiographyResult, pqrNDTOther, pqrOverallResult. For result fields use PASS/FAIL/PENDING/NOT_REQUIRED. Missing fields: value empty string, confidence LOW.`}],
        apiKey,
        "You are a welding engineer. Extract PQR test data from the document. Return strict JSON only — no markdown, no preamble.",
        2000,
        HAIKU
      );
      const ex=parseJSON(raw);
      const mpq=k=>ex[k]?.value||"";
      onPqrExtracted({pqrNumber:mpq("pqrNumber"),linkedWps:mpq("pqrLinkedWps"),testDate:mpq("pqrTestDate"),witnessedBy:mpq("pqrWitnessedBy"),approvedBy:mpq("pqrApprovedBy"),testPieceThickness:mpq("pqrTestPieceThickness"),testPieceMaterial:mpq("pqrTestPieceMaterial"),actualHeatInputMin:mpq("pqrActualHeatInputMin"),actualHeatInputMax:mpq("pqrActualHeatInputMax"),actualPreheat:mpq("pqrActualPreheat"),actualInterpass:mpq("pqrActualInterpass"),tensileResult:mpq("pqrTensileResult"),tensileValues:mpq("pqrTensileValues"),bendResult:mpq("pqrBendResult"),bendType:mpq("pqrBendType"),impactResult:mpq("pqrImpactResult"),impactValues:mpq("pqrImpactValues"),impactTemp:mpq("pqrImpactTemp"),hardnessResult:mpq("pqrHardnessResult"),hardnessValues:mpq("pqrHardnessValues"),macroResult:mpq("pqrMacroResult"),radiographyResult:mpq("pqrRadiographyResult"),ndtOther:mpq("pqrNDTOther"),overallResult:mpq("pqrOverallResult")||"UNKNOWN"});
    } catch(e){setErr("PQR extraction failed: "+e.message);}
    finally{setLoading(false);}
  };

  const resultColor=pqrData?.overallResult==="ACCEPTED"?D.pass:pqrData?.overallResult==="REJECTED"?D.fail:D.warn;
  const resultBg=pqrData?.overallResult==="ACCEPTED"?D.passBg:pqrData?.overallResult==="REJECTED"?D.failBg:D.warnBg;
  const resultBorder=pqrData?.overallResult==="ACCEPTED"?D.passBorder:pqrData?.overallResult==="REJECTED"?D.failBorder:D.warnBorder;

  return (
    <div style={{padding:"10px 16px",borderTop:`1px solid ${D.border}`,background:D.surfaceAlt,flexShrink:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{color:D.textMid,fontSize:11,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>PQR Document</span>
        {pqrData&&<button onClick={onClear} style={{background:"none",border:"none",color:D.textSoft,fontSize:11,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>✕ Remove</button>}
      </div>
      {pqrData?(
        <div style={{background:resultBg,border:`1px solid ${resultBorder}`,borderRadius:6,padding:"7px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:resultColor,fontWeight:700,fontSize:12,fontFamily:"'DM Mono',monospace"}}>{pqrData.pqrNumber||"PQR"}</div>
            <div style={{color:D.textMid,fontSize:11}}>{pqrData.testDate||"No date"}{pqrData.witnessedBy?" · "+pqrData.witnessedBy:""}</div>
          </div>
          <span style={{background:resultBg,border:`1px solid ${resultBorder}`,color:resultColor,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4}}>{pqrData.overallResult}</span>
        </div>
      ):(
        <>
          {err&&<div style={{color:D.fail,fontSize:11,marginBottom:6}}>⚠ {err}</div>}
          {loading?<div style={{color:D.textMid,fontSize:12,padding:"8px 0"}}>Extracting PQR…</div>:(
            <div onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handle(f);}} onDragOver={e=>e.preventDefault()} onClick={()=>ref.current.click()}
              style={{border:`2px dashed ${D.border}`,borderRadius:6,padding:"10px 12px",textAlign:"center",cursor:"pointer",color:D.textMid,fontSize:12}}>
              Drop PQR document here or <span style={{color:D.accent}}>click to upload</span>
              <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>e.target.files[0]&&handle(e.target.files[0])}/>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Tab6({register,onLoad,onDelete}) {
  const [search,setSearch]=useState("");
  const [filt,setFilt]=useState("all");
  const filtered=register.filter(r=>{
    const q=search.toLowerCase();
    return(!q||r.wpsNumber?.toLowerCase().includes(q)||r.process?.toLowerCase().includes(q))
      &&(filt==="all"||r.overallStatus===filt);
  });
  const exportCSV=()=>{
    const hdr=["WPS No.","Process","Standards","Edition Years","Status","Confidence","Linked PQR","Date Validated","Validated By"];
    const rows=register.map(r=>[r.wpsNumber,r.process,r.standards,r.editionYears,r.overallStatus,r.confidence,r.linkedPqr||"",r.dateValidated,r.validatedBy]);
    const csv=[hdr,...rows].map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="wps_register.csv";a.click();
  };
  return (
    <div style={{overflowY:"auto",flex:1,padding:16}}>
      <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{color:D.text,fontWeight:700,fontSize:14}}>WPS Qualification Register</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{...INP,width:180}}/>
        <select value={filt} onChange={e=>setFilt(e.target.value)} style={{...INP,width:160}}><option value="all">All Statuses</option><option value="QUALIFIED">Qualified</option><option value="PARTIAL">Partial</option><option value="NOT_QUALIFIED">Not Qualified</option></select>
        <div style={{marginLeft:"auto"}}><Btn small outline onClick={exportCSV} color={D.blue}>Export CSV</Btn></div>
      </div>
      {filtered.length===0
        ?<div style={{textAlign:"center",padding:48,color:D.textSoft,fontSize:13}}>No records yet. Complete a validation to populate the register.</div>
        :<div style={{overflowX:"auto",background:D.surface,border:`1px solid ${D.border}`,borderRadius:10}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>{["WPS No.","Process","Standards","Status","Conf","PQR","Date","Validated By",""].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((r,i)=>(
                <tr key={r.id} style={{background:i%2===0?D.surface:"transparent"}}>
                  <td style={{...TD,color:D.accent,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{r.wpsNumber}</td>
                  <td style={{...TD,color:D.textMid}}>{r.process}</td>
                  <td style={{...TD,color:D.textMid,fontSize:10}}>{r.standards}</td>
                  <td style={TD}><StatusBadge status={r.overallStatus}/></td>
                  <td style={TD}><ConfBadge level={r.confidence} small/></td>
                  <td style={{...TD,color:D.textMid,fontFamily:"'DM Mono',monospace"}}>{r.linkedPqr||"—"}</td>
                  <td style={{...TD,color:D.textMid}}>{r.dateValidated}</td>
                  <td style={{...TD,color:D.textMid}}>{r.validatedBy}</td>
                  <td style={TD}><div style={{display:"flex",gap:5}}><Btn small outline onClick={()=>onLoad(r)} color={D.accent}>Load</Btn><Btn small outline onClick={()=>onDelete(r.id)} color={D.fail}>Del</Btn></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
    </div>
  );
}

// ── Revision Comparison ───────────────────────────────────────────────────
function RevCompare({apiKey,onBack}) {
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
      <Btn color={D.accent} onClick={run} disabled={loading}>{loading?"Analysing…":"Run Requalification Assessment"}</Btn>
      {err&&<div style={{marginTop:10,color:D.fail,fontSize:12}}>{err}</div>}
      {result&&<div style={{marginTop:20}}>
        <div style={{color:D.text,fontWeight:700,fontSize:14,marginBottom:10}}>Requalification Assessment</div>
        {result.summary&&<div style={{background:D.surfaceAlt,border:`1px solid ${D.border}`,borderRadius:7,padding:"10px 14px",color:D.text,fontSize:12,marginBottom:14}}>{result.summary}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {STANDARDS.map(std=>{const r=result[std]||{};const nr=r.requalification_required;const isNew=r.type==="new_pqr";return(
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
const REG_KEY="wps_val_register";
const APIKEY_KEY="wqms_api_key"; // shared with global store — setup screen handles first entry

export default function WPSValidationEngine() {
  const [appMode,setAppMode]=useState("main");
  const [inputMode,setInputMode]=useState("manual");
  const [leftTab,setLeftTab]=useState("input");
  const [resTab,setResTab]=useState("ev");

  const [apiKey,setApiKey]=useState(()=>localStorage.getItem(APIKEY_KEY)||"");
  const [showKey,setShowKey]=useState(!localStorage.getItem(APIKEY_KEY));
  const [keyDraft,setKeyDraft]=useState("");
  const [showKeyText,setShowKeyText]=useState(false);

  const [params,setParams]=useState(mkParams());
  const [layers,setLayers]=useState([mkLayer()]);
  const [editions,setEditions]=useState({ASME_IX:"2023",ISO_15614_1:"2017+AMD1:2019",AS_1554_1:"2014+AMD1",AS_3992:"1998",AWS_D1_1:"2022",AWS_B2_1:"2021"});
  const [suppReqs,setSuppReqs]=useState([]);
  const [pqrData,setPqrData]=useState(null);
  const [errors,setErrors]=useState({});

  const [loading,setLoading]=useState(false);
  const [progress,setProgress]=useState(0);
  const [result,setResult]=useState(null);
  const [rawResp,setRawResp]=useState(null);
  const [apiError,setApiError]=useState(null);

  const [register,setRegister]=useState(()=>{try{return JSON.parse(localStorage.getItem(REG_KEY)||"[]");}catch{return [];}});

  const saveKey=()=>{
    const k=keyDraft.trim();
    if(!k)return;
    setApiKey(k);localStorage.setItem(APIKEY_KEY,k);setShowKey(false);setKeyDraft("");
  };

  const validate=()=>{
    const e={};
    if(!params.wpsNumber)e.wpsNumber=true;
    if(!params.thickness)e.thickness=true;
    if(!params.validatedBy)e.validatedBy=true;
    if(Object.keys(e).length){setErrors(e);return;}
    setErrors({});
    runVal();
  };

  const runVal=async()=>{
    setLoading(true);setApiError(null);setProgress(0);
    try {
      // Trimmed payloads — each call only receives the fields it needs
      const mtlPayload={process:layers[0]?.process||"",materialSpec:params.materialSpec,baseMtlGroup:params.baseMtlGroup,pNumber:params.pNumber,asmeGroupNumber:params.asmeGroupNumber,thickness:params.thickness,preheat:params.preheat,interpass:params.interpass,positions:params.positions,pwht:params.pwht,edition_years:editions,process_layers:layers.map(l=>({process:l.process,hiMin:l.hiMin,hiMax:l.hiMax,hiUnit:l.hiUnit}))};
      const essPayload={wps_parameters:params,process_layers:layers,edition_years:editions,supplementary_requirements:suppReqs};
      const pqrPayload={wps_basics:{process:layers[0]?.process||"",materialSpec:params.materialSpec,pNumber:params.pNumber,thickness:params.thickness,positions:params.positions,pwht:params.pwht},pqr_records:pqrData?[pqrData]:[],edition_years:editions};
      const gapPayload={wps_parameters:params,process_layers:layers,edition_years:editions,supplementary_requirements:suppReqs,pqr_records:pqrData?[pqrData]:[]};
      const mk=t=>[{type:"text",text:t}];
      setProgress(5);  const raw1=await callClaude(mk(`Classify material and qualification ranges:\n${JSON.stringify(mtlPayload)}`),apiKey,SYSTEM_PROMPT_P1,2200);
      setProgress(25); const raw2=await callClaude(mk(`Assess essential variables:\n${JSON.stringify(essPayload)}`),apiKey,SYSTEM_PROMPT_P2,2500);
      setProgress(45); const raw3=await callClaude(mk(`Assess essential variables:\n${JSON.stringify(essPayload)}`),apiKey,SYSTEM_PROMPT_P3,2500);
      setProgress(62); const raw4=await callClaude(mk(`Assess PQR test requirements:\n${JSON.stringify(pqrPayload)}`),apiKey,SYSTEM_PROMPT_P4,2500);
      setProgress(78); const raw5=await callClaude(mk(`Perform gap analysis and summary:\n${JSON.stringify(gapPayload)}`),apiKey,SYSTEM_PROMPT_P5,3000);
      setProgress(95);
      const combined=[raw1,raw2,raw3,raw4,raw5].join("\n---\n");
      setRawResp(combined);
      const p1=parseJSON(raw1),p2=parseJSON(raw2),p3=parseJSON(raw3),p4=parseJSON(raw4),p5=parseJSON(raw5);
      const parsed={...p1,essential_variables:{...(p2.essential_variables||{}),...(p3.essential_variables||{})},...p4,...p5};
      setResult(parsed);
      setResTab("ev");
      // Determine overall status
      const g=parsed.gap_analysis||{};
      const allQ=STANDARDS.every(s=>g[s]?.qualifies);
      const anyQ=STANDARDS.some(s=>g[s]?.qualifies);
      const overallStatus=allQ?"QUALIFIED":anyQ?"PARTIAL":"NOT_QUALIFIED";
      const entry={id:Date.now().toString(),wpsNumber:params.wpsNumber,process:layers[0]?.process||"—",standards:STANDARDS.map(s=>STD_LABEL[s]).join(", "),editionYears:Object.values(editions).join(" / "),overallStatus,confidence:parsed.overall_confidence,linkedPqr:params.linkedPqr||"",dateValidated:new Date().toLocaleDateString(),validatedBy:params.validatedBy,fullResult:parsed,fullParams:{params,layers,editions,suppReqs}};
      const nr=[entry,...register];
      setRegister(nr);localStorage.setItem(REG_KEY,JSON.stringify(nr));
    } catch(e){
      setApiError({type:e.message.toLowerCase().includes("json")||e.message.toLowerCase().includes("token")?"parse":"api",message:e.message});
    } finally{setProgress(100);setLoading(false);}
  };

  const toggleTest=(std,idx)=>{
    setResult(r=>{
      const t=[...(r.pqr_test_requirements?.[std]||[])];
      t[idx]={...t[idx],status:t[idx].status==="COMPLETE"?"INCOMPLETE":"COMPLETE"};
      return{...r,pqr_test_requirements:{...r.pqr_test_requirements,[std]:t}};
    });
  };

  const loadRec=rec=>{
    if(rec.fullParams){setParams(rec.fullParams.params);setLayers(rec.fullParams.layers);setEditions(rec.fullParams.editions);setSuppReqs(rec.fullParams.suppReqs||[]);}
    if(rec.fullResult){setResult(rec.fullResult);setResTab("ev");}
    setLeftTab("input");
  };
  const delRec=id=>{const nr=register.filter(r=>r.id!==id);setRegister(nr);localStorage.setItem(REG_KEY,JSON.stringify(nr));};

  const lowCount=result?STANDARDS.flatMap(s=>result.essential_variables?.[s]||[]).filter(v=>v.confidence==="LOW").length:0;
  const oc=result?.overall_confidence;

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
        <span style={{color:D.textSoft,fontSize:11}}>ASME IX · ISO 15614-1 · AS 1554.1 · AS 3992</span>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          {oc&&<div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:D.textMid,fontSize:11}}>Session Confidence:</span><ConfBadge level={oc}/></div>}
          <Btn small outline onClick={()=>setAppMode("revision")} color={D.purple}>Revision Compare</Btn>
          <Btn small outline onClick={()=>setShowKey(v=>!v)} color={D.textMid}>API Key</Btn>
          <Btn small outline onClick={()=>window.print()} color={D.blue}>Export PDF</Btn>
        </div>
      </div>

      {/* Low confidence banner */}
      {oc==="LOW"&&<div style={{background:D.failBg,borderBottom:`1px solid ${D.failBorder}`,padding:"7px 20px",color:D.fail,fontSize:12,fontWeight:600,flexShrink:0}}>⚠ OVERALL CONFIDENCE LOW — Independent engineering review is mandatory before use in any controlled document.</div>}

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
            {/* Mode toggle */}
            <div style={{padding:"10px 16px",borderBottom:`1px solid ${D.border}`,display:"flex",gap:7,flexShrink:0}}>
              {[["manual","Manual Entry"],["upload","Document Upload"]].map(([id,l])=>(
                <button key={id} onClick={()=>setInputMode(id)} style={{background:inputMode===id?D.accentFaint:"transparent",border:`1px solid ${inputMode===id?D.accentBorder:D.border}`,color:inputMode===id?D.accent:D.textMid,borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,fontFamily:"'Inter',sans-serif"}}>{l}</button>
              ))}
            </div>

            {inputMode==="manual"
              ?<ManualInput params={params} setParams={setParams} layers={layers} setLayers={setLayers} editions={editions} setEditions={setEditions} suppReqs={suppReqs} setSuppReqs={setSuppReqs} errors={errors}/>
              :<DocUpload apiKey={apiKey} onError={msg=>setApiError({type:"api",message:msg})} onExtracted={ex=>{
                const wps=ex.wps||ex;
                const pqr=ex.pqr||null;
                const mv=k=>wps[k]?.value||"";
                const proc=mv("process")||"GMAW";
                const rawXfer=mv("transferMode");
                const noXfer=proc==="SMAW"||proc==="GTAW"||proc==="SAW";
                const xferMode=noXfer?"N/A":(rawXfer&&!rawXfer.toLowerCase().startsWith("n/a")?rawXfer:"Spray");
                setParams(p=>({...p,wpsNumber:mv("wpsNumber"),validatedBy:mv("validatedBy"),materialSpec:mv("materialSpec"),baseMtlGroup:mv("baseMtlGroup"),pNumber:mv("pNumber"),asmeGroupNumber:mv("asmeGroupNumber"),thickness:mv("thickness"),preheat:mv("preheat"),interpass:mv("interpass"),pwht:wps.pwht?.value===true||wps.pwht?.value==="true",jointType:mv("jointType")||"Butt",positions:parsePositions(wps.positions?.value)}));
                setLayers([{...mkLayer(),process:proc,fillerClass:mv("fillerClass"),fillerDia:mv("fillerDia"),shieldGas:mv("shieldGas"),gasFlow:mv("gasFlow"),currentType:mv("currentType")||"DCEP",transferMode:xferMode,hiMin:mv("heatInputMin"),hiMax:mv("heatInputMax"),hiUnit:mv("heatInputUnit")||"kJ/mm"}]);
                if(pqr){
                  const mpq=k=>pqr[k]?.value||"";
                  setPqrData({pqrNumber:mpq("pqrNumber"),linkedWps:mpq("pqrLinkedWps"),testDate:mpq("pqrTestDate"),witnessedBy:mpq("pqrWitnessedBy"),approvedBy:mpq("pqrApprovedBy"),testPieceThickness:mpq("pqrTestPieceThickness"),testPieceMaterial:mpq("pqrTestPieceMaterial"),actualHeatInputMin:mpq("pqrActualHeatInputMin"),actualHeatInputMax:mpq("pqrActualHeatInputMax"),actualPreheat:mpq("pqrActualPreheat"),actualInterpass:mpq("pqrActualInterpass"),tensileResult:mpq("pqrTensileResult"),tensileValues:mpq("pqrTensileValues"),bendResult:mpq("pqrBendResult"),bendType:mpq("pqrBendType"),impactResult:mpq("pqrImpactResult"),impactValues:mpq("pqrImpactValues"),impactTemp:mpq("pqrImpactTemp"),hardnessResult:mpq("pqrHardnessResult"),hardnessValues:mpq("pqrHardnessValues"),macroResult:mpq("pqrMacroResult"),radiographyResult:mpq("pqrRadiographyResult"),ndtOther:mpq("pqrNDTOther"),overallResult:mpq("pqrOverallResult")||"UNKNOWN"});
                }
                setInputMode("manual");
              }}/>
            }

            {/* PQR section */}
            <PQRSection apiKey={apiKey} pqrData={pqrData} onPqrExtracted={setPqrData} onClear={()=>setPqrData(null)}/>

            {/* Validate footer */}
            <div style={{padding:"12px 16px",borderTop:`1px solid ${D.border}`,background:D.surfaceAlt,flexShrink:0}}>
              {Object.keys(errors).length>0&&<div style={{color:D.fail,fontSize:11,marginBottom:6}}>Required: {Object.keys(errors).map(k=>({wpsNumber:"WPS Number",thickness:"Thickness",validatedBy:"Validated By"}[k]||k)).join(", ")}</div>}
              {loading&&<div style={{marginBottom:8}}>
                <div style={{background:D.border,borderRadius:4,height:3,overflow:"hidden",marginBottom:4}}><div style={{background:D.accent,height:"100%",width:`${progress}%`,transition:"width .4s ease",borderRadius:4}}/></div>
                <span style={{color:D.textMid,fontSize:11}}>Validating against 4 standards… {progress}%</span>
              </div>}
              <Btn color={D.accent} onClick={validate} disabled={loading||!apiKey} style={{width:"100%"}}>
                {loading?"Validating…":"Run Cross-Standard Validation"}
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
            <div style={{color:D.textMid,fontWeight:600,fontSize:14}}>Configure WPS parameters and run validation</div>
            <div style={{color:D.textSoft,fontSize:12}}>Results across ASME IX · ISO 15614-1 · AS 1554.1 · AS 3992 appear here</div>
          </div>}

          {loading&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner/></div>}

          {apiError&&!loading&&<div style={{padding:20}}>
            <Card style={{borderColor:D.failBorder}}>
              <div style={{color:D.fail,fontWeight:700,marginBottom:8}}>Validation Error</div>
              <div style={{color:D.textMid,fontSize:12,marginBottom:12}}>{apiError.message}</div>
              {apiError.type==="parse"&&rawResp&&<details style={{marginBottom:12}}>
                <summary style={{color:D.textMid,fontSize:11,cursor:"pointer"}}>Show raw response</summary>
                <pre style={{marginTop:8,color:D.textSoft,fontSize:10,background:D.surfaceAlt,padding:10,borderRadius:6,overflowX:"auto",whiteSpace:"pre-wrap",maxHeight:300}}>{rawResp}</pre>
              </details>}
              <Btn small color={D.accent} onClick={runVal}>Retry</Btn>
            </Card>
          </div>}

          {result&&!loading&&<>
            <TabBar tabs={[["ev","Essential Variables",lowCount>0?String(lowCount):null],["pqr","PQR Tests"],["ranges","Qual. Ranges"],["gap","Gap Analysis"],["wpq","Welder Scope"]]} active={resTab} setActive={setResTab}/>
            <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
              {resTab==="ev"    &&<Tab1 data={result}/>}
              {resTab==="pqr"   &&<Tab2 data={result} onToggle={toggleTest}/>}
              {resTab==="ranges"&&<Tab3 data={result}/>}
              {resTab==="gap"   &&<Tab4 data={result}/>}
              {resTab==="wpq"   &&<Tab5 data={result}/>}
            </div>
            {result.overall_summary&&<div style={{borderTop:`1px solid ${D.border}`,padding:"8px 16px",background:D.surfaceAlt,flexShrink:0}}>
              <span style={{color:D.textMid,fontSize:11,fontWeight:600}}>SUMMARY: </span>
              <span style={{color:D.text,fontSize:11}}>{result.overall_summary}</span>
            </div>}
          </>}
        </div>
      </div>
    </div>
  );
}
