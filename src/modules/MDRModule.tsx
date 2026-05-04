import React, { useState } from "react";
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

const MDRDocument: React.FC<MDRDocumentProps> = ({ pkg, projectId, onClose }) => {
  const project  = PROJECTS.find(p => p.id === projectId);
  const passports = WELD_PASSPORTS.filter(w => w.projectId === projectId);
  const ncrs     = NCR_DATA.filter(n => project && n.project.includes(project.name.split("–")[0].trim()));
  const vtReps   = VT_REPORTS.filter(r => project && r.project.includes(project.name.split("–")[0].trim()));
  const htRecs   = HT_DATA.filter(h => h.jobId === projectId);
  const ndtRecs  = NDT_DATA.filter(n => passports.some(p => p.id === n.weldId));
  const welder   = WELDER_DATA;
  const itp      = ITP_DATA.filter(i => i.projectId === projectId);
  const today    = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" });

  const doc: React.CSSProperties = {
    background:  "#ffffff",
    color:       "#111111",
    fontFamily:  "'Inter', sans-serif",
    width:       "210mm",
    minHeight:   "297mm",
    margin:      "20px auto",
    padding:     "18mm 20mm",
    boxShadow:   "0 20px 60px rgba(0,0,0,0.6)",
    fontSize:    11,
    lineHeight:  1.5,
  };

  const h1: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 4, letterSpacing: "-0.02em" };
  const h2: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "#111", marginTop: 24, marginBottom: 8, paddingBottom: 5, borderBottom: "2px solid #6366f1" };
  const h3: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#333", marginTop: 14, marginBottom: 6 };
  const tbl: React.CSSProperties = { width: "100%", borderCollapse: "collapse", marginBottom: 14, fontSize: 11 };
  const th: React.CSSProperties  = { background: "#f4f4f8", color: "#444", fontWeight: 600, padding: "6px 8px", textAlign: "left", border: "1px solid #ddd" };
  const td: React.CSSProperties  = { padding: "5px 8px", border: "1px solid #e0e0e8", color: "#222", verticalAlign: "top" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div className="no-print" style={{ position: "sticky", top: 0, background: D.surface, borderBottom: `1px solid ${D.border}`, padding: "10px 20px", display: "flex", gap: 10, alignItems: "center", zIndex: 10000, flexShrink: 0 }}>
        <span style={{ color: D.text, fontWeight: 600, fontSize: 14, flex: 1 }}>{pkg.title} – Compiled MDR Document</span>
        <Button color={D.pass} onClick={() => window.print()}>Export PDF</Button>
        <Button outline onClick={onClose}>Close</Button>
      </div>

      {/* Document */}
      <div style={doc}>
        {/* Cover */}
        <div style={{ textAlign: "center", paddingBottom: 24, marginBottom: 24, borderBottom: "3px solid #6366f1" }}>
          <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Manufacturing Data Record</div>
          <div style={h1}>{pkg.title}</div>
          <div style={{ fontSize: 14, color: "#444", marginTop: 6 }}>{project?.name}</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Client: {project?.client ?? pkg.client}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 16, fontSize: 11, color: "#555" }}>
            <div><strong>Package Ref:</strong> {pkg.id}</div>
            <div><strong>Revision:</strong> {pkg.rev}</div>
            <div><strong>Issue Date:</strong> {today}</div>
            <div><strong>Standard:</strong> {project?.standard}</div>
          </div>
        </div>

        {/* Table of Contents */}
        <div style={h2}>Table of Contents</div>
        {ALL_SECTIONS.filter(s => pkg.sections.includes(s.id)).map((s, i) => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px dotted #ccc", fontSize: 11 }}>
            <span>{i + 1}. {s.label}</span>
            <span style={{ color: "#888" }}>{i + 2}</span>
          </div>
        ))}

        {/* Project Summary */}
        <div style={h2}>1. Project Summary</div>
        {project && (
          <table style={tbl}>
            <tbody>
              {[["Project ID", project.id],["Project Name", project.name],["Client", project.client],["Standard", project.standard],["Due Date", project.due],["Total Welds", project.welds.total],["Completed", project.welds.complete],["Pending", project.welds.pending],["Rejected", project.welds.rejected],["Progress", `${project.progress}%`]].map(([k, v]) => (
                <tr key={k as string}><td style={{ ...td, width: 180, fontWeight: 600, background: "#f9f9fc" }}>{k}</td><td style={td}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Weld Register */}
        {passports.length > 0 && (
          <>
            <div style={h2}>2. Weld Register</div>
            <table style={tbl}>
              <thead><tr>
                {["Weld ID","Type","Process","Welder","WPS","VT","NDT","Final Status"].map(h => <th key={h} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {passports.map(w => (
                  <tr key={w.id}>
                    <td style={{ ...td, fontFamily: "monospace", fontWeight: 700, color: "#6366f1" }}>{w.id}</td>
                    <td style={td}>{w.weldType.split("–")[0].trim()}</td>
                    <td style={td}>{w.process.split("–")[0].trim()}</td>
                    <td style={td}>{w.welderName} ({w.stampNo})</td>
                    <td style={{ ...td, fontFamily: "monospace" }}>{w.wpsId}</td>
                    <td style={{ ...td, color: w.vtResult === "PASS" ? "#059669" : "#dc2626", fontWeight: 600 }}>{w.vtResult}</td>
                    <td style={td}>{w.ndtResults.map(n => `${n.method}: ${n.result}`).join(", ") || "—"}</td>
                    <td style={{ ...td, color: w.finalStatus === "Accepted" ? "#059669" : "#dc2626", fontWeight: 600 }}>{w.finalStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* WPS Register */}
        <div style={h2}>3. WPS Register</div>
        <table style={tbl}>
          <thead><tr>{["WPS No.","Rev","Title","Standard","Processes","Thickness","Status"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {WPS_DATA.map(w => (
              <tr key={w.id}>
                <td style={{ ...td, fontFamily: "monospace", fontWeight: 700, color: "#6366f1" }}>{w.id}</td>
                <td style={td}>{w.rev}</td>
                <td style={td}>{w.title}</td>
                <td style={td}>{w.standard}</td>
                <td style={td}>{w.processes.join(", ")}</td>
                <td style={td}>{w.thicknessRange}</td>
                <td style={{ ...td, color: w.status === "Active" ? "#059669" : w.status === "Expired" ? "#dc2626" : "#d97706", fontWeight: 600 }}>{w.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Welder Qualifications */}
        <div style={h2}>4. Welder Qualifications</div>
        <table style={tbl}>
          <thead><tr>{["Welder","Stamp","Employer","Process","Standard","Expiry","Status"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {welder.flatMap(w => w.qualifications.map(q => (
              <tr key={q.id}>
                <td style={td}>{w.firstName} {w.lastName}</td>
                <td style={{ ...td, fontFamily: "monospace" }}>{w.stampNo}</td>
                <td style={td}>{w.employer}</td>
                <td style={td}>{q.process}</td>
                <td style={td}>{q.standard}</td>
                <td style={td}>{q.expiryDate}</td>
                <td style={{ ...td, color: q.continuityOk ? "#059669" : "#dc2626", fontWeight: 600 }}>{q.continuityOk ? "Current" : "Lapsed"}</td>
              </tr>
            )))}
          </tbody>
        </table>

        {/* Material Traceability */}
        <div style={h2}>5. Material Traceability</div>
        <table style={tbl}>
          <thead><tr>{["Mat ID","Heat No.","Grade","Standard","MTC Status","PMI","Location"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {MAT_RAW.map(m => (
              <tr key={m.id}>
                <td style={{ ...td, fontFamily: "monospace", fontWeight: 700, color: "#6366f1" }}>{m.id}</td>
                <td style={{ ...td, fontFamily: "monospace" }}>{m.heatNo}</td>
                <td style={td}>{m.grade}</td>
                <td style={td}>{m.standard}</td>
                <td style={{ ...td, color: m.mtcStatus === "Uploaded" ? "#059669" : "#dc2626", fontWeight: 600 }}>{m.mtcStatus}</td>
                <td style={{ ...td, color: m.pmiStatus === "Pass" ? "#059669" : "#d97706", fontWeight: 600 }}>{m.pmiStatus}</td>
                <td style={td}>{m.location}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* VT Reports */}
        {vtReps.length > 0 && (
          <>
            <div style={h2}>6. Visual Testing Records</div>
            <table style={tbl}>
              <thead><tr>{["Report ID","Weld ID","Date","Inspector","Standard","Result"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {vtReps.map(r => (
                  <tr key={r.id}>
                    <td style={{ ...td, fontFamily: "monospace", fontWeight: 700, color: "#6366f1" }}>{r.id}</td>
                    <td style={{ ...td, fontFamily: "monospace" }}>{r.weldId}</td>
                    <td style={td}>{r.date}</td>
                    <td style={td}>{r.inspector}</td>
                    <td style={td}>{r.standard}</td>
                    <td style={{ ...td, color: r.result === "PASS" ? "#059669" : r.result === "FAIL" ? "#dc2626" : "#d97706", fontWeight: 700 }}>{r.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* NDT Records */}
        {ndtRecs.length > 0 && (
          <>
            <div style={h2}>7. NDT Records</div>
            <table style={tbl}>
              <thead><tr>{["NDT ID","Weld ID","Method","Technician","Qualification","Date","Result"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {ndtRecs.map(n => (
                  <tr key={n.id}>
                    <td style={{ ...td, fontFamily: "monospace", fontWeight: 700, color: "#6366f1" }}>{n.id}</td>
                    <td style={{ ...td, fontFamily: "monospace" }}>{n.weldId}</td>
                    <td style={td}>{n.method}</td>
                    <td style={td}>{n.techName}</td>
                    <td style={td}>{n.techQual}</td>
                    <td style={td}>{n.date}</td>
                    <td style={{ ...td, color: n.result === "Pass" ? "#059669" : "#dc2626", fontWeight: 700 }}>{n.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Heat Treatment */}
        {htRecs.length > 0 && (
          <>
            <div style={h2}>8. Heat Treatment Records</div>
            <table style={tbl}>
              <thead><tr>{["HT ID","Weld ID","Type","Target Temp","Soak Time","Technician","Date","Result"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {htRecs.map(h => (
                  <tr key={h.id}>
                    <td style={{ ...td, fontFamily: "monospace", fontWeight: 700, color: "#6366f1" }}>{h.id}</td>
                    <td style={{ ...td, fontFamily: "monospace" }}>{h.weldId}</td>
                    <td style={td}>{h.type}</td>
                    <td style={td}>{h.targetTemp}°C</td>
                    <td style={td}>{h.soakTime} min</td>
                    <td style={td}>{h.technician}</td>
                    <td style={td}>{h.date}</td>
                    <td style={{ ...td, color: h.actualStatus === "Pass" ? "#059669" : h.actualStatus === "Pending" ? "#d97706" : "#dc2626", fontWeight: 700 }}>{h.actualStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* NCR Summary */}
        {ncrs.length > 0 && (
          <>
            <div style={h2}>9. NCR / Non-Conformance Summary</div>
            <table style={tbl}>
              <thead><tr>{["NCR ID","Weld ID","Defect","Priority","Status","Assignee","Raised","CAPA"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {ncrs.map(n => (
                  <tr key={n.id}>
                    <td style={{ ...td, fontFamily: "monospace", fontWeight: 700, color: "#dc2626" }}>{n.id}</td>
                    <td style={{ ...td, fontFamily: "monospace" }}>{n.weldId}</td>
                    <td style={td}>{n.defect}</td>
                    <td style={{ ...td, color: n.priority === "Critical" ? "#dc2626" : n.priority === "High" ? "#ea580c" : "#d97706", fontWeight: 600 }}>{n.priority}</td>
                    <td style={{ ...td, color: n.status === "Closed" ? "#059669" : n.status === "Open" ? "#dc2626" : "#d97706", fontWeight: 600 }}>{n.status}</td>
                    <td style={td}>{n.assignee}</td>
                    <td style={td}>{n.raised}</td>
                    <td style={td}>{n.capa ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* ITP */}
        {itp.length > 0 && (
          <>
            <div style={h2}>10. Inspection & Test Plan Sign-off</div>
            {itp.map(plan => (
              <div key={plan.id}>
                <div style={h3}>{plan.itpNo} – {plan.component}</div>
                <table style={tbl}>
                  <thead><tr>{["Step","Activity","Method","Hold","Status","Inspector","Client","Date"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {plan.steps.map(s => (
                      <tr key={s.seq}>
                        <td style={{ ...td, textAlign: "center" }}>{s.seq}</td>
                        <td style={td}>{s.activity}</td>
                        <td style={td}>{s.method}</td>
                        <td style={{ ...td, textAlign: "center", fontWeight: 700, color: s.holdType === "H" ? "#dc2626" : s.holdType === "W" ? "#d97706" : "#059669" }}>{s.holdType}</td>
                        <td style={{ ...td, color: s.status === "Completed" ? "#059669" : s.status === "In Progress" ? "#d97706" : "#999", fontWeight: 600 }}>{s.status}</td>
                        <td style={td}>{s.signedInspector || "—"}</td>
                        <td style={td}>{s.signedClient || "—"}</td>
                        <td style={td}>{s.date || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}

        {/* Release certificate */}
        <div style={h2}>11. Release Declaration</div>
        <div style={{ border: "2px solid #6366f1", borderRadius: 8, padding: 16, marginTop: 8 }}>
          <div style={{ fontSize: 12, marginBottom: 8 }}>
            This Manufacturing Data Record has been compiled in accordance with <strong>{project?.standard}</strong> and all applicable client specifications. All documentation referenced herein has been verified as current and complete at the time of issue.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
            {["Prepared By","Reviewed By","Client Acceptance"].map(role => (
              <div key={role} style={{ borderTop: "1px solid #999", paddingTop: 8 }}>
                <div style={{ fontSize: 10, color: "#666", marginBottom: 20 }}>{role}</div>
                <div style={{ fontSize: 10, color: "#888" }}>Name: _______________</div>
                <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>Date: _______________</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, paddingTop: 10, borderTop: "1px solid #ddd", fontSize: 9, color: "#999", display: "flex", justifyContent: "space-between" }}>
          <span>WQMS Pro · {pkg.id} Rev {pkg.rev}</span>
          <span>Generated {today}</span>
          <span>CONFIDENTIAL – For authorised personnel only</span>
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
