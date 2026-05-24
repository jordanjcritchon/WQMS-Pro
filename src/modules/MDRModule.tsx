import React, { useState, useRef } from "react";
import { D, inp } from "../theme";
import { Card, Label, Tag, StatusDot, Progress, TabBar, Button } from "../components";
import { MDR_PACKAGES, PROJECTS, NCR_DATA, WELD_PASSPORTS, WPS_DATA, WELDER_DATA, MAT_RAW, NDT_DATA, HT_DATA, VT_REPORTS, ITP_DATA } from "../data";
import { MDR_SM } from "../statusMeta";
import type { MDRPackage } from "../types";

const ALL_SECTIONS = [
  { id: "title_page",           label: "Title Page & Cover"          },
  { id: "document_index",       label: "Document Index"              },
  { id: "project_summary",      label: "Project Summary"             },
  { id: "drawings",             label: "Drawing Register"            },
  { id: "material_traceability",label: "Material Traceability"       },
  { id: "wps_pqr",              label: "WPS / PQR Register"          },
  { id: "welder_quals",         label: "Welder Qualifications"       },
  { id: "inspection_records",   label: "Inspection & Test Records"   },
  { id: "ndt_records",          label: "NDT Reports"                 },
  { id: "heat_treatment",       label: "Heat Treatment Records"      },
  { id: "ncr_summary",          label: "NCR / Repair Summary"        },
  { id: "release_cert",         label: "Final Release Certificate"   },
  { id: "client_signoff",       label: "Client Sign-off Sheet"       },
];

interface ValidationRowProps { label: string; ok: boolean; detail: string; }
const ValidationRow: React.FC<ValidationRowProps> = ({ label, ok, detail }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: ok ? D.passBg : D.failBg, border: `1px solid ${ok ? D.passBorder : D.failBorder}`, borderRadius: 5, marginBottom: 5 }}>
    <span style={{ color: ok ? D.pass : D.fail, fontSize: 14 }}>{ok ? "✓" : "✕"}</span>
    <span style={{ color: ok ? D.pass : D.fail, fontSize: 12, fontWeight: 600, flex: 1 }}>{label}</span>
    <span style={{ color: D.textSoft, fontSize: 11 }}>{detail}</span>
  </div>
);

/* ── Compiled MDR document overlay ── */
interface MDRDocumentProps {
  pkg:       MDRPackage;
  projectId: string;
  onClose:   () => void;
}

// Shared print-safe style constants
const C = {
  navy:     "#1a3557",
  navyDk:   "#122440",
  blue:     "#1d4ed8",
  blueLight:"#dbeafe",
  pass:     "#15803d",
  passBg:   "#dcfce7",
  passBd:   "#86efac",
  fail:     "#b91c1c",
  failBg:   "#fee2e2",
  failBd:   "#fca5a5",
  warn:     "#92400e",
  warnBg:   "#fef3c7",
  warnBd:   "#fcd34d",
  rowAlt:   "#f0f5fb",
  border:   "#c8d4e3",
  text:     "#1a1a2e",
  textSoft: "#4b5563",
  mono:     "'Courier New', monospace",
};

const StatusBadge: React.FC<{ v: string; pass?: string[]; fail?: string[]; warn?: string[] }> = ({ v, pass = ["PASS","Pass","Accepted","Current","Uploaded","Active"], fail = ["FAIL","Fail","Expired","Lapsed","Missing"], warn = ["PENDING","Pending","Conditional","Expiring Soon","CONDITIONAL"] }) => {
  const up = String(v).trim();
  const isPass = pass.some(p => up === p);
  const isFail = fail.some(f => up === f);
  const isWarn = warn.some(w => up === w);
  const bg   = isPass ? C.passBg  : isFail ? C.failBg  : isWarn ? C.warnBg  : "#f3f4f6";
  const bd   = isPass ? C.passBd  : isFail ? C.failBd  : isWarn ? C.warnBd  : "#d1d5db";
  const col  = isPass ? C.pass    : isFail ? C.fail     : isWarn ? C.warn    : C.textSoft;
  return (
    <span style={{ display:"inline-block", background:bg, border:`1px solid ${bd}`, color:col, fontWeight:700, fontSize:10, borderRadius:4, padding:"2px 7px", letterSpacing:"0.03em" }}>
      {up}
    </span>
  );
};

const SH: React.FC<{ n: string; label: string }> = ({ n, label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:0, marginTop:28, marginBottom:12, breakBefore:"avoid", pageBreakBefore:"avoid" }}>
    <div style={{ background:C.navy, color:"#fff", fontWeight:700, fontSize:11, padding:"6px 14px", borderRadius:"4px 0 0 4px", letterSpacing:"0.08em", whiteSpace:"nowrap" }}>{n}</div>
    <div style={{ background:C.navyDk, color:"#cbd5e1", fontWeight:600, fontSize:11, padding:"6px 14px", flex:1, borderRadius:"0 4px 4px 0", letterSpacing:"0.03em" }}>{label}</div>
  </div>
);

const TH_S: React.CSSProperties = { background:C.navy, color:"#ffffff", fontWeight:600, fontSize:10, padding:"7px 9px", textAlign:"left", border:`1px solid ${C.navyDk}`, whiteSpace:"nowrap", letterSpacing:"0.03em" };
const TD_S = (alt: boolean): React.CSSProperties => ({ padding:"6px 9px", border:`1px solid ${C.border}`, color:C.text, verticalAlign:"top", fontSize:10.5, background: alt ? C.rowAlt : "#ffffff" });
const TBL: React.CSSProperties = { width:"100%", borderCollapse:"collapse", marginBottom:16, fontSize:10.5, breakInside:"avoid" };

const PRINT_CSS = `
  @media print {
    html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
    .mdr-overlay { position: static !important; background: #ffffff !important; box-shadow: none !important; overflow: visible !important; }
    .mdr-toolbar { display: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    @page { size: A4 portrait; margin: 12mm 15mm; }
    .page-break { page-break-before: always; break-before: page; }
  }
`;

interface SigPadProps { label: string; onDone: (d: string) => void; onCancel: () => void; }
const SigPad: React.FC<SigPadProps> = ({ label, onDone, onCancel }) => {
  const ref  = useRef<HTMLCanvasElement>(null);
  const down = useRef(false);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const t = "touches" in e ? e.touches[0] : e as React.MouseEvent;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const begin = (e: React.MouseEvent | React.TouchEvent) => {
    down.current = true;
    const ctx = ref.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!down.current) return;
    e.preventDefault();
    const ctx = ref.current!.getContext("2d")!;
    ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const { x, y } = pos(e);
    ctx.lineTo(x, y); ctx.stroke();
  };
  const end = () => { down.current = false; };
  const clear = () => { const c = ref.current; if (!c) return; c.width = c.width; };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:20000, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:12, padding:24, width:440, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ color:C.navy, fontWeight:800, fontSize:15, marginBottom:4 }}>Signature — {label}</div>
        <div style={{ color:C.textSoft, fontSize:11, marginBottom:14 }}>Draw your signature below using mouse or touch.</div>
        <canvas ref={ref} width={392} height={160}
          style={{ border:`2px solid ${C.border}`, borderRadius:6, background:"#fafbfd", cursor:"crosshair", display:"block", touchAction:"none", width:"100%" }}
          onMouseDown={begin} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
          onTouchStart={begin} onTouchMove={draw} onTouchEnd={end}
        />
        <div style={{ display:"flex", gap:8, marginTop:14, justifyContent:"flex-end" }}>
          <button onClick={clear} style={{ background:"none", border:`1px solid ${C.border}`, color:C.textSoft, padding:"8px 16px", borderRadius:6, cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>Clear</button>
          <button onClick={onCancel} style={{ background:"none", border:`1px solid ${C.border}`, color:C.textSoft, padding:"8px 16px", borderRadius:6, cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>Cancel</button>
          <button onClick={() => onDone(ref.current!.toDataURL("image/png"))} style={{ background:C.navy, color:"#fff", border:"none", padding:"8px 22px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit" }}>Confirm ✓</button>
        </div>
      </div>
    </div>
  );
};

const MDRDocument: React.FC<MDRDocumentProps> = ({ pkg, projectId, onClose }) => {
  const project   = PROJECTS.find(p => p.id === projectId);
  const passports = WELD_PASSPORTS.filter(w => w.projectId === projectId);
  const ncrs      = NCR_DATA.filter(n => project && n.project.includes(project.name.split("–")[0].trim()));
  const vtReps    = VT_REPORTS.filter(r => project && r.project.includes(project.name.split("–")[0].trim()));
  const htRecs    = HT_DATA.filter(h => h.jobId === projectId);
  const ndtRecs   = NDT_DATA.filter(n => passports.some(p => p.id === n.weldId));
  const itp       = ITP_DATA.filter(i => i.projectId === projectId);
  const today     = new Date().toLocaleDateString("en-AU", { day:"2-digit", month:"long", year:"numeric" });
  const docRef    = `${pkg.id}-Rev${pkg.rev}`;
  const SIG_KEY   = `wqms_mdr_sig_${docRef}`;

  const [sigs, setSigs]         = useState<Record<string,string>>(() => { try { return JSON.parse(localStorage.getItem(SIG_KEY) || "{}"); } catch { return {}; } });
  const [sigModal, setSigModal] = useState<string|null>(null);
  const FIELDS_KEY = `${SIG_KEY}_fields`;
  const [fields, setFields]     = useState<Record<string,string>>(() => { try { return JSON.parse(localStorage.getItem(FIELDS_KEY) || "{}"); } catch { return {}; } });

  const saveSig = (field: string, data: string) => {
    setSigs(prev => {
      const next = { ...prev, [field]: data };
      try { localStorage.setItem(SIG_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setSigModal(null);
  };

  const saveField = (key: string, val: string) => {
    setFields(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem(FIELDS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const editCell = (fieldKey: string, placeholder: string, defaultVal = "") => (
    <input
      value={fields[fieldKey] ?? defaultVal}
      onChange={e => saveField(fieldKey, e.target.value)}
      placeholder={placeholder}
      style={{ border:"none", borderBottom:`1px dashed ${C.border}`, background:"transparent", color:C.text, fontSize:10.5, fontFamily:"inherit", width:"100%", padding:"2px 2px", outline:"none" }}
    />
  );

  const PageFooter = () => (
    <div style={{ borderTop:`1px solid ${C.border}`, marginTop:20, paddingTop:7, display:"flex", justifyContent:"space-between", fontSize:9, color:C.textSoft }}>
      <span style={{ fontWeight:600 }}>WQMS Pro · {docRef}</span>
      <span>{pkg.title}</span>
      <span>CONTROLLED DOCUMENT — {today}</span>
    </div>
  );

  const handlePrint = () => {
    const el = document.getElementById("mdr-print-content");
    if (!el) return;
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("input").forEach(inp => {
      const span = document.createElement("span");
      span.textContent = inp.value || inp.placeholder || "";
      span.style.cssText = inp.style.cssText;
      inp.parentNode?.replaceChild(span, inp);
    });
    clone.querySelectorAll("button").forEach(btn => {
      const span = document.createElement("span");
      span.textContent = btn.textContent?.includes("Sign") ? "[Pending signature]" : btn.textContent || "";
      span.style.color = "#9ca3af"; span.style.fontSize = "9px";
      btn.parentNode?.replaceChild(span, btn);
    });
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${pkg.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
    body{margin:0;padding:0;background:#fff;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:10.5px;line-height:1.55;color:#1a1a2e}
    .page-break{page-break-before:always!important;break-before:page!important}
    @page{size:A4 portrait;margin:12mm 15mm}
  </style>
</head>
<body>${clone.innerHTML}</body>
</html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
  };

  return (
    <div className="mdr-overlay" style={{ position:"fixed", inset:0, zIndex:9999, background:"#12121f", overflowY:"auto" }}>
      <style>{PRINT_CSS}</style>

      {/* Signature pad modal */}
      {sigModal && (
        <SigPad
          label={sigModal === "prep" ? "Prepared By" : sigModal === "review" ? "Reviewed By" : "Client Acceptance"}
          onDone={data => saveSig(sigModal, data)}
          onCancel={() => setSigModal(null)}
        />
      )}

      {/* Toolbar */}
      <div className="mdr-toolbar no-print" style={{ position:"sticky", top:0, background:D.surface, borderBottom:`1px solid ${D.border}`, padding:"10px 20px", display:"flex", gap:10, alignItems:"center", zIndex:10000 }}>
        <span style={{ color:D.text, fontWeight:600, fontSize:14, flex:1 }}>{pkg.title}</span>
        <Button color={D.blue} onClick={handlePrint}>⬇ Export PDF</Button>
        <Button outline onClick={onClose}>✕ Close</Button>
      </div>

      {/* Document centering wrapper */}
      <div style={{ display:"flex", justifyContent:"center", padding:"28px 16px 56px" }}>

      {/* A4 Document */}
      <div id="mdr-print-content" style={{ background:"#ffffff", color:C.text, fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif", width:"210mm", padding:"0", boxShadow:"0 8px 48px rgba(0,0,0,0.6)", fontSize:10.5, lineHeight:1.55 }}>

        {/* ── COVER PAGE ── */}
        <div style={{ background:C.navy, padding:"28px 28px 22px", display:"flex", flexDirection:"column", gap:0 }}>
          {/* Header band */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
            <div>
              <div style={{ color:"#93c5fd", fontSize:9, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:6 }}>Manufacturing Data Record</div>
              <div style={{ color:"#ffffff", fontSize:26, fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.1, maxWidth:380 }}>{pkg.title}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ background:"#ffffff", color:C.navy, fontWeight:800, fontSize:16, padding:"8px 16px", borderRadius:6, letterSpacing:"-0.02em", marginBottom:6 }}>WQMS Pro</div>
              <div style={{ color:"#93c5fd", fontSize:9, fontWeight:700, letterSpacing:"0.12em" }}>WELDING QUALITY MANAGEMENT</div>
            </div>
          </div>

          {/* Cover detail table */}
          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:8, padding:"16px 18px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px 24px" }}>
            {([
              ["Package Reference", docRef],
              ["Project",           project?.name ?? "—"],
              ["Client",            project?.client ?? pkg.client],
              ["Standard",          project?.standard ?? "—"],
              ["Revision",          pkg.rev],
              ["Issue Date",        today],
              ["Prepared By",       pkg.createdBy],
              ["Document Status",   pkg.status],
              ["Completeness",      `${pkg.completeness}%`],
            ] as const).map(([k, v]) => (
              <div key={k}>
                <div style={{ color:"#93c5fd", fontSize:8.5, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:2 }}>{k}</div>
                <div style={{ color:"#ffffff", fontSize:11, fontWeight:600 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Standards strip */}
          <div style={{ display:"flex", gap:8, marginTop:18, flexWrap:"wrap" }}>
            {["ISO 3834","AS 3992","ASME IX","AS 4041","ISO 9606"].map(s => (
              <span key={s} style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", color:"#e0e7ff", fontSize:9.5, fontWeight:600, borderRadius:4, padding:"3px 9px", letterSpacing:"0.06em" }}>{s}</span>
            ))}
            <span style={{ marginLeft:"auto", color:"rgba(255,255,255,0.45)", fontSize:9, alignSelf:"center" }}>CONFIDENTIAL — For authorised recipients only</span>
          </div>
        </div>

        {/* Document body */}
        <div style={{ padding:"22px 28px" }}>

          {/* Revision History */}
          <SH n="REV" label="Document Revision History" />
          <table style={TBL}>
            <thead><tr>{["Rev","Date","Description","Prepared By","Approved By"].map(h => <th key={h} style={TH_S}>{h}</th>)}</tr></thead>
            <tbody>
              <tr>
                <td style={TD_S(false)}>{pkg.rev}</td>
                <td style={TD_S(false)}>{today}</td>
                <td style={TD_S(false)}>Initial issue — compiled from WQMS Pro live data</td>
                <td style={TD_S(false)}>{pkg.createdBy}</td>
                <td style={TD_S(false)}>—</td>
              </tr>
            </tbody>
          </table>

          {/* Table of Contents */}
          <SH n="TOC" label="Table of Contents" />
          <table style={{ ...TBL, marginBottom:0 }}>
            <tbody>
              {ALL_SECTIONS.filter(s => pkg.sections.includes(s.id)).map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? C.rowAlt : "#ffffff" }}>
                  <td style={{ ...TD_S(false), width:36, textAlign:"center", fontWeight:700, color:C.navy, background: i % 2 === 0 ? C.rowAlt : "#ffffff" }}>{i + 1}</td>
                  <td style={{ ...TD_S(false), background: i % 2 === 0 ? C.rowAlt : "#ffffff" }}>{s.label}</td>
                  <td style={{ ...TD_S(false), width:60, textAlign:"right", color:C.textSoft, background: i % 2 === 0 ? C.rowAlt : "#ffffff" }}>p. {i + 3}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <PageFooter />

          {/* ── SECTION 1: Project Summary ── */}
          <div className="page-break" />
          <SH n="01" label="Project Summary" />
          {project && (
            <table style={TBL}>
              <tbody>
                {([
                  ["Project ID", project.id],
                  ["Project Name", project.name],
                  ["Client / End User", project.client],
                  ["Applicable Standard", project.standard],
                  ["Scheduled Completion", project.due],
                  ["Total Welds", String(project.welds.total)],
                  ["Welds Completed", String(project.welds.complete)],
                  ["Welds Pending", String(project.welds.pending)],
                  ["Welds Rejected / Repaired", String(project.welds.rejected)],
                  ["Overall Progress", `${project.progress}%`],
                  ["MDR Package", docRef],
                  ["Issue Date", today],
                ] as const).map(([k, v], i) => (
                  <tr key={k}>
                    <td style={{ ...TD_S(i%2===0), width:200, fontWeight:600, color:C.navy }}>{k}</td>
                    <td style={TD_S(i%2===0)}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <PageFooter />

          {/* ── SECTION 2: Weld Register ── */}
          {passports.length > 0 && (
            <>
              <div className="page-break" />
              <SH n="02" label="Weld Register" />
              <table style={TBL}>
                <thead><tr>{["Weld ID","Joint Type","Process","Welder / Stamp","WPS Ref","VT Result","NDT Summary","Final Status"].map(h => <th key={h} style={TH_S}>{h}</th>)}</tr></thead>
                <tbody>
                  {passports.map((w, i) => (
                    <tr key={w.id}>
                      <td style={{ ...TD_S(i%2===0), fontFamily:C.mono, fontWeight:700, color:C.navy }}>{w.id}</td>
                      <td style={TD_S(i%2===0)}>{w.weldType}</td>
                      <td style={TD_S(i%2===0)}>{w.process}</td>
                      <td style={TD_S(i%2===0)}>{w.welderName} ({w.stampNo})</td>
                      <td style={{ ...TD_S(i%2===0), fontFamily:C.mono }}>{w.wpsId}</td>
                      <td style={TD_S(i%2===0)}><StatusBadge v={w.vtResult} /></td>
                      <td style={{ ...TD_S(i%2===0), fontSize:9.5 }}>{w.ndtResults.map(n => `${n.method}: ${n.result}`).join(" · ") || "—"}</td>
                      <td style={TD_S(i%2===0)}><StatusBadge v={w.finalStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PageFooter />
            </>
          )}

          {/* ── SECTION 3: WPS / PQR Register ── */}
          <div className="page-break" />
          <SH n="03" label="Welding Procedure Specification (WPS) Register" />
          <table style={TBL}>
            <thead><tr>{["WPS No.","Rev","Title","Standard","Process(es)","Thickness Range","Status"].map(h => <th key={h} style={TH_S}>{h}</th>)}</tr></thead>
            <tbody>
              {WPS_DATA.map((w, i) => (
                <tr key={w.id}>
                  <td style={{ ...TD_S(i%2===0), fontFamily:C.mono, fontWeight:700, color:C.navy }}>{w.id}</td>
                  <td style={{ ...TD_S(i%2===0), textAlign:"center" }}>{w.rev}</td>
                  <td style={TD_S(i%2===0)}>{w.title}</td>
                  <td style={TD_S(i%2===0)}>{w.standard}</td>
                  <td style={TD_S(i%2===0)}>{w.processes.join(", ")}</td>
                  <td style={TD_S(i%2===0)}>{w.thicknessRange}</td>
                  <td style={TD_S(i%2===0)}><StatusBadge v={w.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <PageFooter />

          {/* ── SECTION 4: Welder Qualifications ── */}
          <div className="page-break" />
          <SH n="04" label="Welder / Welding Operator Qualifications" />
          <table style={TBL}>
            <thead><tr>{["Name","Stamp No.","Employer","Process","Standard","Expiry Date","Status"].map(h => <th key={h} style={TH_S}>{h}</th>)}</tr></thead>
            <tbody>
              {WELDER_DATA.flatMap(w => w.qualifications.map((q, i) => (
                <tr key={q.id}>
                  <td style={TD_S(i%2===0)}>{w.firstName} {w.lastName}</td>
                  <td style={{ ...TD_S(i%2===0), fontFamily:C.mono }}>{w.stampNo}</td>
                  <td style={TD_S(i%2===0)}>{w.employer}</td>
                  <td style={TD_S(i%2===0)}>{q.process}</td>
                  <td style={TD_S(i%2===0)}>{q.standard}</td>
                  <td style={TD_S(i%2===0)}>{q.expiryDate}</td>
                  <td style={TD_S(i%2===0)}><StatusBadge v={q.continuityOk ? "Current" : "Lapsed"} /></td>
                </tr>
              )))}
            </tbody>
          </table>
          <PageFooter />

          {/* ── SECTION 5: Material Traceability ── */}
          <div className="page-break" />
          <SH n="05" label="Material Traceability Register" />
          <table style={TBL}>
            <thead><tr>{["Mat. ID","Heat No.","Grade / Spec","Standard","Size","Supplier","MTC Status","PMI Result","Location"].map(h => <th key={h} style={TH_S}>{h}</th>)}</tr></thead>
            <tbody>
              {MAT_RAW.map((m, i) => (
                <tr key={m.id}>
                  <td style={{ ...TD_S(i%2===0), fontFamily:C.mono, fontWeight:700, color:C.navy }}>{m.id}</td>
                  <td style={{ ...TD_S(i%2===0), fontFamily:C.mono }}>{m.heatNo}</td>
                  <td style={TD_S(i%2===0)}>{m.grade}</td>
                  <td style={TD_S(i%2===0)}>{m.standard}</td>
                  <td style={TD_S(i%2===0)}>{m.size}</td>
                  <td style={TD_S(i%2===0)}>{m.supplier}</td>
                  <td style={TD_S(i%2===0)}><StatusBadge v={m.mtcStatus} pass={["Uploaded"]} fail={["Missing","Pending"]} /></td>
                  <td style={TD_S(i%2===0)}><StatusBadge v={m.pmiStatus} pass={["Pass"]} fail={["Fail"]} warn={["N/A","Pending"]} /></td>
                  <td style={TD_S(i%2===0)}>{m.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <PageFooter />

          {/* ── SECTION 6: VT Inspection Records ── */}
          {vtReps.length > 0 && (
            <>
              <div className="page-break" />
              <SH n="06" label="Visual Testing (VT) Inspection Records" />
              <table style={TBL}>
                <thead><tr>{["Report ID","Weld ID","Date","Inspector","Standard","Defects Noted","Result"].map(h => <th key={h} style={TH_S}>{h}</th>)}</tr></thead>
                <tbody>
                  {vtReps.map((r, i) => (
                    <tr key={r.id}>
                      <td style={{ ...TD_S(i%2===0), fontFamily:C.mono, fontWeight:700, color:C.navy }}>{r.id}</td>
                      <td style={{ ...TD_S(i%2===0), fontFamily:C.mono }}>{r.weldId}</td>
                      <td style={TD_S(i%2===0)}>{r.date}</td>
                      <td style={TD_S(i%2===0)}>{r.inspector}</td>
                      <td style={TD_S(i%2===0)}>{r.standard}</td>
                      <td style={{ ...TD_S(i%2===0), fontSize:9.5 }}>{r.defects?.join(", ") || "None"}</td>
                      <td style={TD_S(i%2===0)}><StatusBadge v={r.result} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PageFooter />
            </>
          )}

          {/* ── SECTION 7: NDT Records ── */}
          {ndtRecs.length > 0 && (
            <>
              <div className="page-break" />
              <SH n="07" label="Non-Destructive Testing (NDT) Records" />
              <table style={TBL}>
                <thead><tr>{["NDT ID","Weld ID","Method","Technician","Qualification","Accept. Std","Date","Result"].map(h => <th key={h} style={TH_S}>{h}</th>)}</tr></thead>
                <tbody>
                  {ndtRecs.map((n, i) => (
                    <tr key={n.id}>
                      <td style={{ ...TD_S(i%2===0), fontFamily:C.mono, fontWeight:700, color:C.navy }}>{n.id}</td>
                      <td style={{ ...TD_S(i%2===0), fontFamily:C.mono }}>{n.weldId}</td>
                      <td style={TD_S(i%2===0)}>{n.method}</td>
                      <td style={TD_S(i%2===0)}>{n.techName}</td>
                      <td style={TD_S(i%2===0)}>{n.techQual}</td>
                      <td style={TD_S(i%2===0)}>{n.acceptStd}</td>
                      <td style={TD_S(i%2===0)}>{n.date}</td>
                      <td style={TD_S(i%2===0)}><StatusBadge v={n.result} pass={["Pass","PASS"]} fail={["Fail","FAIL"]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PageFooter />
            </>
          )}

          {/* ── SECTION 8: Heat Treatment ── */}
          {htRecs.length > 0 && (
            <>
              <div className="page-break" />
              <SH n="08" label="Heat Treatment Records" />
              <table style={TBL}>
                <thead><tr>{["HT ID","Weld / Component ID","HT Type","Target Temp (°C)","Hold Time (min)","Technician","Date","Status"].map(h => <th key={h} style={TH_S}>{h}</th>)}</tr></thead>
                <tbody>
                  {htRecs.map((h, i) => (
                    <tr key={h.id}>
                      <td style={{ ...TD_S(i%2===0), fontFamily:C.mono, fontWeight:700, color:C.navy }}>{h.id}</td>
                      <td style={{ ...TD_S(i%2===0), fontFamily:C.mono }}>{h.weldId}</td>
                      <td style={TD_S(i%2===0)}>{h.type}</td>
                      <td style={{ ...TD_S(i%2===0), textAlign:"center" }}>{h.targetTemp}</td>
                      <td style={{ ...TD_S(i%2===0), textAlign:"center" }}>{h.soakTime}</td>
                      <td style={TD_S(i%2===0)}>{h.technician}</td>
                      <td style={TD_S(i%2===0)}>{h.date}</td>
                      <td style={TD_S(i%2===0)}><StatusBadge v={h.actualStatus} pass={["Pass","Complete"]} fail={["Fail"]} warn={["Pending"]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PageFooter />
            </>
          )}

          {/* ── SECTION 9: NCR Summary ── */}
          {ncrs.length > 0 && (
            <>
              <div className="page-break" />
              <SH n="09" label="Non-Conformance Report (NCR) Summary" />
              <table style={TBL}>
                <thead><tr>{["NCR No.","Weld ID","Defect Description","Priority","Status","Assigned To","Date Raised","CAPA Summary"].map(h => <th key={h} style={TH_S}>{h}</th>)}</tr></thead>
                <tbody>
                  {ncrs.map((n, i) => (
                    <tr key={n.id}>
                      <td style={{ ...TD_S(i%2===0), fontFamily:C.mono, fontWeight:700, color:C.fail }}>{n.id}</td>
                      <td style={{ ...TD_S(i%2===0), fontFamily:C.mono }}>{n.weldId}</td>
                      <td style={TD_S(i%2===0)}>{n.defect}</td>
                      <td style={TD_S(i%2===0)}><StatusBadge v={n.priority} pass={["Low"]} warn={["Medium","High"]} fail={["Critical"]} /></td>
                      <td style={TD_S(i%2===0)}><StatusBadge v={n.status} pass={["Closed"]} warn={["In Progress"]} fail={["Open"]} /></td>
                      <td style={TD_S(i%2===0)}>{n.assignee}</td>
                      <td style={TD_S(i%2===0)}>{n.raised}</td>
                      <td style={{ ...TD_S(i%2===0), fontSize:9.5 }}>{n.capa ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PageFooter />
            </>
          )}

          {/* ── SECTION 10: ITP ── */}
          {itp.length > 0 && (
            <>
              <div className="page-break" />
              <SH n="10" label="Inspection & Test Plan (ITP) Sign-off" />
              {itp.map(plan => (
                <div key={plan.id} style={{ marginBottom:20 }}>
                  <div style={{ background:C.blueLight, border:`1px solid #93c5fd`, borderRadius:5, padding:"6px 12px", marginBottom:8, fontSize:11, fontWeight:600, color:C.navy }}>
                    {plan.itpNo} — {plan.component} &nbsp;
                    <span style={{ fontSize:9.5, fontWeight:500, color:C.textSoft }}>Rev {plan.rev} · {plan.status}</span>
                  </div>
                  <table style={TBL}>
                    <thead><tr>{["#","Activity / Description","Inspection Method","Hold","Status","Inspector Sign","Client Sign","Date"].map(h => <th key={h} style={TH_S}>{h}</th>)}</tr></thead>
                    <tbody>
                      {plan.steps.map((s, i) => (
                        <tr key={s.seq}>
                          <td style={{ ...TD_S(i%2===0), textAlign:"center", fontWeight:700 }}>{s.seq}</td>
                          <td style={TD_S(i%2===0)}>{s.activity}</td>
                          <td style={TD_S(i%2===0)}>{s.method}</td>
                          <td style={{ ...TD_S(i%2===0), textAlign:"center" }}>
                            <span style={{ fontWeight:700, fontSize:11, color: s.holdType==="H" ? C.fail : s.holdType==="W" ? C.warn : C.pass }}>{s.holdType}</span>
                          </td>
                          <td style={TD_S(i%2===0)}><StatusBadge v={s.status} pass={["Completed"]} warn={["In Progress"]} fail={["Pending"]} /></td>
                          <td style={{ ...TD_S(i%2===0), color:C.textSoft }}>{s.signedInspector || "—"}</td>
                          <td style={{ ...TD_S(i%2===0), color:C.textSoft }}>{s.signedClient || "—"}</td>
                          <td style={{ ...TD_S(i%2===0), color:C.textSoft }}>{s.date || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <PageFooter />
            </>
          )}

          {/* ── SECTION 11: Release Certificate ── */}
          <div className="page-break" />
          <SH n="11" label="Final Release Certificate &amp; Document Declaration" />

          <div style={{ border:`2px solid ${C.navy}`, borderRadius:6, overflow:"hidden", marginBottom:20 }}>
            {/* Certificate header */}
            <div style={{ background:C.navy, color:"#ffffff", padding:"12px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:800, fontSize:14, letterSpacing:"-0.01em" }}>MANUFACTURING DATA RECORD</div>
                <div style={{ fontSize:10, color:"#93c5fd", marginTop:2 }}>Final Release Certificate</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:700, fontSize:12 }}>{docRef}</div>
                <div style={{ fontSize:10, color:"#93c5fd" }}>Issue Date: {today}</div>
              </div>
            </div>

            <div style={{ padding:"16px 18px" }}>
              <p style={{ fontSize:11, lineHeight:1.7, marginBottom:16, color:C.text }}>
                This Manufacturing Data Record has been compiled in accordance with <strong>{project?.standard}</strong> and all applicable
                client specifications, codes, and standards. All documentation referenced herein has been reviewed and
                verified as current, complete, and accurate at the time of issue. This package is released for client
                review and acceptance.
              </p>

              {/* Summary statistics */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                {([
                  ["Total Welds",    String(project?.welds.total ?? "—"),   C.navy],
                  ["Accepted",       String(project?.welds.complete ?? "—"), C.pass],
                  ["Open NCRs",      String(ncrs.filter(n => n.status !== "Closed").length), ncrs.filter(n => n.status !== "Closed").length > 0 ? C.fail : C.pass],
                  ["Completeness",   `${pkg.completeness}%`,                 pkg.completeness === 100 ? C.pass : C.warn],
                ] as const).map(([label, val, col]) => (
                  <div key={label} style={{ background:C.rowAlt, border:`1px solid ${C.border}`, borderRadius:5, padding:"10px 12px", textAlign:"center" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:col }}>{val}</div>
                    <div style={{ fontSize:9.5, color:C.textSoft, fontWeight:600, marginTop:2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Signature table */}
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    {["","Prepared By","Reviewed By","Client Acceptance"].map(h => (
                      <th key={h} style={{ ...TH_S, textAlign:"center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(["Name","Title / Role","Signature","Date"] as const).map((row, i) => (
                    <tr key={row}>
                      <td style={{ ...TD_S(i%2===0), fontWeight:600, color:C.navy, width:110 }}>{row}</td>
                      {(["Prepared By","Reviewed By","Client Acceptance"] as [string,string,string]).map(col => {
                        const field = col === "Prepared By" ? "prep" : col === "Reviewed By" ? "review" : "client";
                        if (row === "Signature") {
                          const sig = sigs[field];
                          return (
                            <td key={col} style={{ ...TD_S(i%2===0), height:68, textAlign:"center", verticalAlign:"middle" }}>
                              {sig ? (
                                <div>
                                  <img src={sig} alt="signature" style={{ maxHeight:50, maxWidth:160, display:"block", margin:"0 auto" }} />
                                  <span style={{ fontSize:9, color:C.blue, cursor:"pointer", marginTop:3, display:"block" }} onClick={() => setSigModal(field)}>✎ Re-sign</span>
                                </div>
                              ) : (
                                <button onClick={() => setSigModal(field)} style={{ background:C.blueLight, border:`1px solid #93c5fd`, color:C.blue, borderRadius:6, padding:"9px 16px", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit", letterSpacing:"0.01em" }}>
                                  ✍ Tap to Sign
                                </button>
                              )}
                            </td>
                          );
                        }
                        if (row === "Name") return (
                          <td key={col} style={{ ...TD_S(i%2===0), height:30 }}>
                            {editCell(`${field}_name`, "Enter name…", col === "Prepared By" ? pkg.createdBy : "")}
                          </td>
                        );
                        if (row === "Title / Role") return (
                          <td key={col} style={{ ...TD_S(i%2===0), height:30 }}>
                            {editCell(`${field}_title`, "Enter title / role…")}
                          </td>
                        );
                        if (row === "Date") return (
                          <td key={col} style={{ ...TD_S(i%2===0), height:30 }}>
                            {editCell(`${field}_date`, "DD / MM / YYYY", col === "Prepared By" ? today : "")}
                          </td>
                        );
                        return <td key={col} style={{ ...TD_S(i%2===0), height:30 }} />;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document control footer */}
          <div style={{ background:C.rowAlt, border:`1px solid ${C.border}`, borderRadius:5, padding:"10px 14px", fontSize:9.5, color:C.textSoft, lineHeight:1.6 }}>
            <strong style={{ color:C.navy }}>Document Control Notice:</strong> This document is controlled. Printed copies are uncontrolled unless
            stamped "CONTROLLED". The current revision is maintained in WQMS Pro. Any reproduction or distribution
            requires written authorisation from the issuing authority. Reference: {docRef}.
          </div>

          <PageFooter />
        </div>
      </div>

      </div>
    </div>
  );
};

/* ── Main MDR Module ── */
export const MDRModule: React.FC = () => {
  const [tab,          setTab]          = useState("packages");
  const [selectedPkg,  setSelectedPkg]  = useState<MDRPackage>(MDR_PACKAGES[0]);
  const [wizStep,      setWizStep]      = useState(0);
  const [wizProjectId, setWizProjectId] = useState(PROJECTS[0].id);
  const [showDocument, setShowDocument] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {showDocument && (
        <MDRDocument
          pkg={selectedPkg}
          projectId={wizProjectId}
          onClose={() => setShowDocument(false)}
        />
      )}

      <TabBar tabs={[["packages","MDR Packages"],["builder","New Package Wizard"]]} active={tab} setActive={setTab} />

      {/* ── Package list + detail ── */}
      {tab === "packages" && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ width: 300, background: D.surface, borderRight: `1px solid ${D.border}`, padding: 14, overflowY: "auto", flexShrink: 0 }}>
            <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>MDR PACKAGES</div>
            <Button style={{ width: "100%", marginBottom: 12 }} onClick={() => setTab("builder")}>+ New Package</Button>
            {MDR_PACKAGES.map(pkg => (
              <div key={pkg.id} onClick={() => setSelectedPkg(pkg)} style={{ background: selectedPkg?.id === pkg.id ? D.surfaceHov : D.surfaceAlt, border: `1px solid ${selectedPkg?.id === pkg.id ? D.accent : D.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: D.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{pkg.id}</span>
                  <StatusDot status={pkg.status} meta={MDR_SM} />
                </div>
                <div style={{ color: D.text, fontWeight: 600, fontSize: 12, marginBottom: 3 }}>{pkg.title}</div>
                <div style={{ color: D.textSoft, fontSize: 11, marginBottom: 6 }}>{pkg.client} · Rev {pkg.rev}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1 }}><Progress value={pkg.completeness} color={pkg.completeness === 100 ? D.pass : pkg.completeness > 70 ? D.warn : D.fail} h={4} /></div>
                  <span style={{ color: pkg.completeness === 100 ? D.pass : D.textMid, fontWeight: 700, fontSize: 11, minWidth: 34 }}>{pkg.completeness}%</span>
                </div>
                {pkg.missing.length > 0 && <div style={{ color: D.fail, fontSize: 10, marginTop: 5 }}>⚠ {pkg.missing.length} items missing</div>}
              </div>
            ))}
          </div>

          {selectedPkg && (
            <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ color: D.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace", fontSize: 16 }}>{selectedPkg.id}</span>
                    <Tag label={`Rev ${selectedPkg.rev}`} kind="neutral" />
                    <StatusDot status={selectedPkg.status} meta={MDR_SM} />
                  </div>
                  <div style={{ color: D.text, fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{selectedPkg.title}</div>
                  <div style={{ color: D.textSoft, fontSize: 12 }}>Client: {selectedPkg.client} · Created by: {selectedPkg.createdBy}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button color={D.blue} outline>Regenerate</Button>
                  <Button color={D.pass} onClick={() => { setWizProjectId(selectedPkg.projectId); setShowDocument(true); }}>View Document</Button>
                </div>
              </div>

              <Card s={{ padding: 16, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ color: D.text, fontWeight: 700, fontSize: 14 }}>Package Completeness</div>
                  <div style={{ color: selectedPkg.completeness === 100 ? D.pass : D.warn, fontSize: 22, fontWeight: 700 }}>{selectedPkg.completeness}%</div>
                </div>
                <Progress value={selectedPkg.completeness} color={selectedPkg.completeness === 100 ? D.pass : selectedPkg.completeness > 70 ? D.warn : D.fail} h={10} />
                {selectedPkg.missing.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ color: D.fail, fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Missing items blocking completion:</div>
                    {selectedPkg.missing.map((m, i) => <div key={i} style={{ color: D.fail, fontSize: 12, marginBottom: 3 }}>✕ {m}</div>)}
                  </div>
                )}
              </Card>

              <Card s={{ padding: 16, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: D.accent, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, paddingBottom: 7, borderBottom: `1px solid ${D.border}` }}>
                  Pre-Build Validation
                </div>
                <ValidationRow label="All weld records complete"       ok={true}  detail="103/103 welds – PRJ-001" />
                <ValidationRow label="Open NCRs"                       ok={NCR_DATA.filter(n => n.status !== "Closed").length === 0} detail={`${NCR_DATA.filter(n => n.status !== "Closed").length} open`} />
                <ValidationRow label="All ITP hold points signed"      ok={false} detail="2 unsigned holds remaining" />
                <ValidationRow label="Heat treatment records complete" ok={true}  detail="HT-001 – PASS" />
                <ValidationRow label="NDT coverage 100%"               ok={true}  detail="All required NDT complete" />
                <ValidationRow label="Material certs on file"          ok={false} detail="1 MTC missing" />
                <ValidationRow label="Welder qualifications current"   ok={true}  detail="All current at issue date" />
              </Card>

              <Card s={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: D.accent, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, paddingBottom: 7, borderBottom: `1px solid ${D.border}` }}>
                  Package Sections
                </div>
                {ALL_SECTIONS.map(sec => {
                  const included = selectedPkg.sections.includes(sec.id);
                  return (
                    <div key={sec.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 5, background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 6, opacity: included ? 1 : 0.4 }}>
                      <span style={{ color: included ? D.pass : D.textSoft, fontSize: 14 }}>{included ? "☑" : "☐"}</span>
                      <span style={{ color: D.text, fontSize: 12, flex: 1 }}>{sec.label}</span>
                      {included && <span style={{ color: D.pass, fontSize: 11 }}>Included</span>}
                    </div>
                  );
                })}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── Wizard ── */}
      {tab === "builder" && (
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div style={{ display: "flex", marginBottom: 20, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, overflow: "hidden" }}>
            {["Choose Project","Select Sections","Validate","Build Package"].map((s, i) => (
              <button key={i} onClick={() => setWizStep(i)} style={{ flex: 1, padding: "11px 4px", border: "none", borderRight: i < 3 ? `1px solid ${D.border}` : "none", background: wizStep === i ? D.accent : wizStep > i ? D.passBg : D.surfaceAlt, color: wizStep === i ? "#fff" : wizStep > i ? D.pass : D.textSoft, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                {wizStep > i ? "✓ " : ""}{s}
              </button>
            ))}
          </div>

          {wizStep === 0 && (
            <Card s={{ padding: 20 }}>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Select Project & Package</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <Label c="Project" />
                  <select value={wizProjectId} onChange={e => setWizProjectId(e.target.value)} style={inp}>
                    {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} – {p.name}</option>)}
                  </select>
                </div>
                <div><Label c="Client" /><input style={inp} defaultValue={PROJECTS.find(p => p.id === wizProjectId)?.client ?? ""} /></div>
                <div><Label c="Package Title" /><input style={inp} placeholder="e.g. Full MDR – Spool Package A" /></div>
                <div>
                  <Label c="Client Template" />
                  <select style={inp}><option>Standard MDR</option><option>Pressure Equipment (AS 4041)</option><option>Structural (AS 1554)</option><option>Pipeline (ASME B31.3)</option><option>Mining (Custom)</option></select>
                </div>
              </div>
            </Card>
          )}

          {wizStep === 1 && (
            <Card s={{ padding: 20 }}>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Select MDR Sections</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ALL_SECTIONS.map(sec => (
                  <div key={sec.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 7, cursor: "pointer" }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: D.accent }} />
                    <span style={{ color: D.text, fontSize: 13 }}>{sec.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {wizStep === 2 && (
            <Card s={{ padding: 20 }}>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Pre-Build Validation</div>
              <ValidationRow label="All weld records complete"  ok={true}  detail="" />
              <ValidationRow label="No open NCRs"              ok={false} detail="NCR-001 and NCR-004 open" />
              <ValidationRow label="All ITP hold points signed" ok={false} detail="2 holds pending" />
              <ValidationRow label="Material certs complete"   ok={false} detail="MAT-004 MTC missing" />
              <ValidationRow label="NDT coverage 100%"         ok={true}  detail="" />
              <ValidationRow label="HT records complete"       ok={true}  detail="" />
              <ValidationRow label="Welder quals current"      ok={true}  detail="" />
              <div style={{ marginTop: 14, padding: "10px 14px", background: D.warnBg, border: `1px solid ${D.warnBorder}`, borderRadius: 7, color: D.warn, fontSize: 12, fontWeight: 600 }}>
                Package has outstanding items. You may build a draft but cannot issue until all items are resolved.
              </div>
            </Card>
          )}

          {wizStep === 3 && (
            <Card s={{ padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16, color: D.accent }}>■</div>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Ready to Build</div>
              <div style={{ color: D.textSoft, fontSize: 13, marginBottom: 20, maxWidth: 480, margin: "0 auto 20px" }}>
                The MDR engine will compile all records for <strong style={{ color: D.text }}>{PROJECTS.find(p => p.id === wizProjectId)?.name}</strong>, generate the document index, and produce a client-ready document.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <Button color={D.blue} outline>Save as Draft</Button>
                <Button color={D.pass} onClick={() => setShowDocument(true)}>Build Package</Button>
              </div>
            </Card>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <button onClick={() => setWizStep(s => Math.max(0, s - 1))} disabled={wizStep === 0} style={{ background: "none", border: `1px solid ${D.border}`, color: wizStep === 0 ? D.textSoft : D.textMid, padding: "9px 20px", borderRadius: 7, cursor: wizStep === 0 ? "default" : "pointer", fontSize: 13, fontFamily: "'Inter',sans-serif" }}>← Back</button>
            {wizStep < 3 && <Button onClick={() => setWizStep(s => Math.min(3, s + 1))}>Next →</Button>}
          </div>
        </div>
      )}
    </div>
  );
};
