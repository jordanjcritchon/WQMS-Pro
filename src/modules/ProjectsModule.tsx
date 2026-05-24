import React, { useState } from "react";
import { D } from "../theme";
import { Card, StatusDot, Progress, Tag } from "../components";
import {
  PROJECTS, NCR_DATA, VT_REPORTS, WELD_PASSPORTS,
  ITP_DATA, READINESS_CHECKS, HT_DATA, MDR_PACKAGES, MAT_RAW,
} from "../data";
import { PROJ_SM } from "../statusMeta";
import type { Project } from "../types";

const TABS = ["Overview", "Welds", "Quality", "ITP", "Materials"] as const;
type Tab = typeof TABS[number];

// ── helpers ──────────────────────────────────────────────────────────────────

const statusColor = (s: string) =>
  s === "On Track" ? D.pass : s === "At Risk" ? D.warn : D.fail;

const ResultBadge: React.FC<{ v: string }> = ({ v }) => {
  const c = v === "PASS" || v === "Pass" || v === "pass"
    ? D.pass : v === "FAIL" || v === "Fail" || v === "fail"
    ? D.fail : v === "Pending" || v === "pending"
    ? D.textMid : D.warn;
  const bg = v === "PASS" || v === "Pass" || v === "pass"
    ? D.passBg ?? "#052e16" : v === "FAIL" || v === "Fail" || v === "fail"
    ? D.failBg : D.warnBg;
  return (
    <span style={{ background: bg, border: `1px solid ${c}`, color: c, borderRadius: 4, padding: "2px 7px", fontSize: 10.5, fontWeight: 700 }}>
      {v.toUpperCase()}
    </span>
  );
};

// ── sub-panels ────────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{ p: Project }> = ({ p }) => {
  const readiness = READINESS_CHECKS[p.id];
  const htRecords = HT_DATA.filter(h => h.jobId === p.id);
  const mdr       = MDR_PACKAGES.find(m => m.projectId === p.id);
  const ncrs      = NCR_DATA.filter(n => n.project === p.name);
  const openNcrs  = ncrs.filter(n => n.status !== "Closed");

  const allChecks = readiness ? Object.values(readiness).flat() : [];
  const fails     = allChecks.filter(c => c.status === "fail").length;
  const warns     = allChecks.filter(c => c.status === "warn").length;
  const ready     = fails === 0 && warns === 0;

  const sc = statusColor(p.status);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {/* Project info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card s={{ padding: 18 }}>
          <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>PROJECT SUMMARY</div>
          {([
            ["Client",    p.client],
            ["Standard",  p.standard],
            ["Due Date",  p.due],
            ["Progress",  `${p.progress}%`],
            ["Status",    p.status],
          ] as const).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${D.borderSoft}` }}>
              <span style={{ color: D.textSoft, fontSize: 12 }}>{k}</span>
              <span style={{ color: k === "Status" ? sc : D.text, fontWeight: k === "Status" ? 700 : 500, fontSize: 12 }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <Progress value={p.progress} color={sc} h={8} />
          </div>
        </Card>

        {/* Weld stats */}
        <Card s={{ padding: 18 }}>
          <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>WELD PROGRESS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {([
              ["Total",     p.welds.total,    D.blue],
              ["Complete",  p.welds.complete,  D.pass],
              ["Pending",   p.welds.pending,   D.warn],
              ["Rejected",  p.welds.rejected,  D.fail],
            ] as const).map(([l, v, c]) => (
              <div key={l} style={{ background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: D.textSoft, fontSize: 10, letterSpacing: "0.05em", marginBottom: 4 }}>{l.toUpperCase()}</div>
                <div style={{ color: c, fontWeight: 700, fontSize: 22 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 11, color: D.textMid }}>
            <span>Repair rate: <span style={{ color: p.welds.rejected > 0 ? D.warn : D.pass, fontWeight: 700 }}>
              {p.welds.complete > 0 ? ((p.welds.rejected / p.welds.complete) * 100).toFixed(1) : "0.0"}%
            </span></span>
            <span>Completion: <span style={{ color: sc, fontWeight: 700 }}>{p.progress}%</span></span>
          </div>
        </Card>

        {/* NCR snapshot */}
        <Card s={{ padding: 18 }}>
          <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>NCR SNAPSHOT</div>
          {ncrs.length === 0
            ? <div style={{ color: D.textSoft, fontSize: 12 }}>No NCRs for this project.</div>
            : ncrs.map(n => (
              <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "7px 0", borderBottom: `1px solid ${D.borderSoft}`, gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                    <span style={{ color: D.accent, fontWeight: 700, fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{n.id}</span>
                    <span style={{ color: D.textSoft, fontSize: 10 }}>{n.weldId}</span>
                  </div>
                  <div style={{ color: D.text, fontSize: 11 }}>{n.defect}</div>
                </div>
                <span style={{
                  color: n.priority === "Critical" ? D.fail : n.priority === "High" ? D.warn : D.textMid,
                  fontSize: 10, fontWeight: 700, background: n.priority === "Critical" ? D.failBg : D.warnBg,
                  border: `1px solid ${n.priority === "Critical" ? D.failBorder : D.warnBorder}`,
                  borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap",
                }}>
                  {n.status}
                </span>
              </div>
            ))
          }
          {openNcrs.length > 0 && (
            <div style={{ marginTop: 10, color: D.fail, fontSize: 11, fontWeight: 700 }}>
              ⚠ {openNcrs.length} open NCR{openNcrs.length !== 1 ? "s" : ""} — action required
            </div>
          )}
        </Card>
      </div>

      {/* Right column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Readiness */}
        <Card s={{ padding: 18 }}>
          <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>PRE-PRODUCTION READINESS</div>
          {!readiness
            ? <div style={{ color: D.textSoft, fontSize: 12 }}>No readiness data.</div>
            : Object.entries(readiness).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ color: D.textMid, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>{cat}</div>
                {(items as { item: string; status: string; note?: string }[]).map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "4px 0", borderBottom: `1px solid ${D.borderSoft}` }}>
                    <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>
                      {c.status === "pass" ? "✅" : c.status === "warn" ? "⚠️" : "🚫"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: D.text, fontSize: 11 }}>{c.item}</div>
                      {c.note && <div style={{ color: D.textSoft, fontSize: 10, marginTop: 1 }}>{c.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ))
          }
          <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6, background: ready ? "#052e16" : fails > 0 ? D.failBg : D.warnBg, border: `1px solid ${ready ? D.pass : fails > 0 ? D.failBorder : D.warnBorder}` }}>
            <span style={{ color: ready ? D.pass : fails > 0 ? D.fail : D.warn, fontWeight: 700, fontSize: 12 }}>
              {ready ? "✅ ALL CLEAR — READY TO WELD" : fails > 0 ? `🚫 ${fails} BLOCKER${fails !== 1 ? "S" : ""} — STOP WORK` : `⚠️ ${warns} CONDITION${warns !== 1 ? "S" : ""} — PROCEED WITH CAUTION`}
            </span>
          </div>
        </Card>

        {/* Heat treatment */}
        {htRecords.length > 0 && (
          <Card s={{ padding: 18 }}>
            <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>HEAT TREATMENT</div>
            {htRecords.map(h => (
              <div key={h.id} style={{ padding: "8px 0", borderBottom: `1px solid ${D.borderSoft}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div>
                    <span style={{ color: D.accent, fontWeight: 700, fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{h.id}</span>
                    <span style={{ color: D.textMid, fontSize: 11, marginLeft: 8 }}>{h.weldId} · {h.type}</span>
                  </div>
                  <ResultBadge v={h.actualStatus} />
                </div>
                <div style={{ color: D.textSoft, fontSize: 11 }}>
                  {h.material} · {h.thickness}mm · {h.targetTemp}°C / {h.soakTime} min
                </div>
                <div style={{ color: D.textMid, fontSize: 10, marginTop: 2 }}>{h.date} · {h.technician}</div>
              </div>
            ))}
          </Card>
        )}

        {/* MDR */}
        {mdr && (
          <Card s={{ padding: 18 }}>
            <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>MDR PACKAGE</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: D.text, fontWeight: 600, fontSize: 12 }}>{mdr.id}</span>
              <span style={{ color: D.textMid, fontSize: 11 }}>Rev {mdr.rev}</span>
            </div>
            <div style={{ color: D.textSoft, fontSize: 11, marginBottom: 10 }}>{mdr.title}</div>
            <Progress value={mdr.completeness} color={mdr.completeness === 100 ? D.pass : mdr.completeness > 70 ? D.warn : D.fail} h={6} />
            <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: D.textMid }}>Completeness</span>
              <span style={{ color: D.text, fontWeight: 700 }}>{mdr.completeness}%</span>
            </div>
            {mdr.missing.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ color: D.fail, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>MISSING ITEMS</div>
                {mdr.missing.map((m, i) => (
                  <div key={i} style={{ color: D.warn, fontSize: 11, padding: "2px 0" }}>• {m}</div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

const WeldsTab: React.FC<{ p: Project }> = ({ p }) => {
  const passports = WELD_PASSPORTS.filter(w => w.projectId === p.id);

  if (passports.length === 0) {
    return <div style={{ color: D.textSoft, fontSize: 13, padding: 20 }}>No weld passports recorded for this project.</div>;
  }

  return (
    <Card s={{ overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: D.surfaceAlt }}>
              {["Weld ID", "Component", "Joint", "Process", "Welder", "WPS", "VT", "NDT", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: D.textSoft, fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", borderBottom: `1px solid ${D.border}`, whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {passports.map((w, i) => (
              <tr key={w.id} style={{ background: i % 2 === 0 ? D.surface : D.surfaceAlt }}>
                <td style={{ padding: "9px 12px", color: D.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace", borderBottom: `1px solid ${D.borderSoft}` }}>{w.id}</td>
                <td style={{ padding: "9px 12px", color: D.textMid, borderBottom: `1px solid ${D.borderSoft}` }}>{w.componentId}</td>
                <td style={{ padding: "9px 12px", color: D.text, borderBottom: `1px solid ${D.borderSoft}` }}>{w.weldType}</td>
                <td style={{ padding: "9px 12px", color: D.textMid, fontFamily: "'DM Mono',monospace", fontSize: 11, borderBottom: `1px solid ${D.borderSoft}` }}>{w.process}</td>
                <td style={{ padding: "9px 12px", color: D.text, borderBottom: `1px solid ${D.borderSoft}` }}>{w.welderName}</td>
                <td style={{ padding: "9px 12px", color: D.textMid, fontFamily: "'DM Mono',monospace", fontSize: 11, borderBottom: `1px solid ${D.borderSoft}` }}>{w.wpsId}</td>
                <td style={{ padding: "9px 12px", borderBottom: `1px solid ${D.borderSoft}` }}><ResultBadge v={w.vtResult || "Pending"} /></td>
                <td style={{ padding: "9px 12px", borderBottom: `1px solid ${D.borderSoft}` }}>
                  {w.ndtResults.length > 0
                    ? w.ndtResults.map((r, ri) => <ResultBadge key={ri} v={`${r.method}: ${r.result}`} />)
                    : <span style={{ color: D.textSoft, fontSize: 11 }}>—</span>}
                </td>
                <td style={{ padding: "9px 12px", borderBottom: `1px solid ${D.borderSoft}` }}>
                  <span style={{
                    color: w.overallStatus === "Accepted" ? D.pass : w.overallStatus === "Rejected" ? D.fail : D.warn,
                    fontWeight: 700, fontSize: 11,
                  }}>
                    {w.overallStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const QualityTab: React.FC<{ p: Project }> = ({ p }) => {
  const ncrs = NCR_DATA.filter(n => n.project === p.name);
  const vts  = VT_REPORTS.filter(r => r.project === p.name);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* NCRs */}
      <Card s={{ padding: 18 }}>
        <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14 }}>NON-CONFORMANCE REPORTS</div>
        {ncrs.length === 0
          ? <div style={{ color: D.textSoft, fontSize: 12 }}>No NCRs for this project.</div>
          : ncrs.map(n => (
            <div key={n.id} style={{ padding: "12px 0", borderBottom: `1px solid ${D.borderSoft}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: D.accent, fontWeight: 700, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>{n.id}</span>
                  <span style={{ color: D.textMid, fontSize: 11 }}>Weld {n.weldId}</span>
                  <span style={{ color: D.textSoft, fontSize: 10 }}>{n.raised}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{
                    color: n.priority === "Critical" ? D.fail : n.priority === "High" ? D.warn : D.textMid,
                    background: n.priority === "Critical" ? D.failBg : D.warnBg,
                    border: `1px solid ${n.priority === "Critical" ? D.failBorder : D.warnBorder}`,
                    borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700,
                  }}>{n.priority}</span>
                  <span style={{
                    color: n.status === "Closed" ? D.pass : n.status === "Open" ? D.fail : D.warn,
                    background: n.status === "Closed" ? "#052e16" : n.status === "Open" ? D.failBg : D.warnBg,
                    border: `1px solid ${n.status === "Closed" ? D.pass : n.status === "Open" ? D.failBorder : D.warnBorder}`,
                    borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700,
                  }}>{n.status}</span>
                </div>
              </div>
              <div style={{ color: D.text, fontSize: 12, marginBottom: 4 }}>{n.defect}</div>
              <div style={{ color: D.textSoft, fontSize: 11 }}>CAPA: {n.capa}</div>
              <div style={{ color: D.textMid, fontSize: 10, marginTop: 4 }}>Assignee: {n.assignee}</div>
            </div>
          ))
        }
      </Card>

      {/* VT Reports */}
      <Card s={{ padding: 18 }}>
        <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14 }}>VISUAL INSPECTION REPORTS</div>
        {vts.length === 0
          ? <div style={{ color: D.textSoft, fontSize: 12 }}>No VT reports for this project.</div>
          : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: D.surfaceAlt }}>
                    {["Report ID", "Weld ID", "Date", "Inspector", "Standard", "Result", "Defects"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: D.textSoft, fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", borderBottom: `1px solid ${D.border}`, whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vts.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? D.surface : D.surfaceAlt }}>
                      <td style={{ padding: "8px 12px", color: D.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace", fontSize: 11, borderBottom: `1px solid ${D.borderSoft}` }}>{r.id}</td>
                      <td style={{ padding: "8px 12px", color: D.textMid, fontFamily: "'DM Mono',monospace", fontSize: 11, borderBottom: `1px solid ${D.borderSoft}` }}>{r.weldId}</td>
                      <td style={{ padding: "8px 12px", color: D.textMid, fontSize: 11, borderBottom: `1px solid ${D.borderSoft}` }}>{r.date}</td>
                      <td style={{ padding: "8px 12px", color: D.text, fontSize: 11, borderBottom: `1px solid ${D.borderSoft}` }}>{r.inspector}</td>
                      <td style={{ padding: "8px 12px", color: D.textSoft, fontSize: 10, borderBottom: `1px solid ${D.borderSoft}` }}>{r.standard}</td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${D.borderSoft}` }}><ResultBadge v={r.result} /></td>
                      <td style={{ padding: "8px 12px", color: r.defects.length > 0 ? D.fail : D.textSoft, fontSize: 11, borderBottom: `1px solid ${D.borderSoft}` }}>
                        {r.defects.length > 0 ? r.defects.join(", ") : "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>
    </div>
  );
};

const ITPTab: React.FC<{ p: Project }> = ({ p }) => {
  const itps = ITP_DATA.filter(i => i.projectId === p.id);

  if (itps.length === 0) {
    return <div style={{ color: D.textSoft, fontSize: 13, padding: 20 }}>No ITP data for this project.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {itps.map(itp => (
        <Card key={itp.id} s={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: D.accent, fontWeight: 700, fontSize: 13, fontFamily: "'DM Mono',monospace" }}>{itp.itpNo}</span>
                <span style={{ color: D.textMid, fontSize: 11 }}>Rev {itp.rev}</span>
              </div>
              <div style={{ color: D.text, fontWeight: 600, fontSize: 14 }}>{itp.component}</div>
              <div style={{ color: D.textSoft, fontSize: 11, marginTop: 2 }}>{itp.standard}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span style={{
                color: itp.status === "Active" ? D.pass : D.warn,
                background: itp.status === "Active" ? "#052e16" : D.warnBg,
                border: `1px solid ${itp.status === "Active" ? D.pass : D.warn}`,
                borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700,
              }}>{itp.status}</span>
              <span style={{ color: D.textSoft, fontSize: 10 }}>Client: {itp.clientApproval}</span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: D.surfaceAlt }}>
                  {["#", "Activity", "Criteria", "Method", "Hold", "Status", "Inspector", "Client", "Date"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: D.textSoft, fontWeight: 700, fontSize: 10, letterSpacing: "0.07em", borderBottom: `1px solid ${D.border}`, whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itp.steps.map((step, i) => (
                  <tr key={step.seq} style={{ background: i % 2 === 0 ? D.surface : D.surfaceAlt }}>
                    <td style={{ padding: "7px 10px", color: D.textMid, fontWeight: 700, borderBottom: `1px solid ${D.borderSoft}` }}>{step.seq}</td>
                    <td style={{ padding: "7px 10px", color: D.text, borderBottom: `1px solid ${D.borderSoft}`, maxWidth: 180 }}>{step.activity}</td>
                    <td style={{ padding: "7px 10px", color: D.textSoft, fontSize: 10, borderBottom: `1px solid ${D.borderSoft}`, maxWidth: 140 }}>{step.criteria}</td>
                    <td style={{ padding: "7px 10px", color: D.textMid, borderBottom: `1px solid ${D.borderSoft}`, whiteSpace: "nowrap" }}>{step.method}</td>
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${D.borderSoft}`, textAlign: "center" }}>
                      <span style={{ color: step.holdType === "H" ? D.fail : D.warn, fontWeight: 700, fontSize: 12 }}>{step.holdType}</span>
                    </td>
                    <td style={{ padding: "7px 10px", borderBottom: `1px solid ${D.borderSoft}`, whiteSpace: "nowrap" }}>
                      <span style={{
                        color: step.status === "Completed" ? D.pass : step.status === "In Progress" ? D.warn : D.textSoft,
                        fontWeight: step.status === "Completed" ? 700 : 500, fontSize: 11,
                      }}>
                        {step.status === "Completed" ? "✓ Done" : step.status === "In Progress" ? "⏳ In Progress" : "— Pending"}
                      </span>
                    </td>
                    <td style={{ padding: "7px 10px", color: step.signedInspector ? D.pass : D.textSoft, borderBottom: `1px solid ${D.borderSoft}`, whiteSpace: "nowrap" }}>{step.signedInspector || "—"}</td>
                    <td style={{ padding: "7px 10px", color: step.signedClient ? D.pass : D.textSoft, borderBottom: `1px solid ${D.borderSoft}`, whiteSpace: "nowrap" }}>{step.signedClient || "—"}</td>
                    <td style={{ padding: "7px 10px", color: D.textSoft, fontSize: 10, borderBottom: `1px solid ${D.borderSoft}`, whiteSpace: "nowrap" }}>{step.date || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
};

const MaterialsTab: React.FC<{ p: Project }> = ({ p }) => {
  const passports  = WELD_PASSPORTS.filter(w => w.projectId === p.id);
  const matIds     = [...new Set(passports.map(w => w.matId).filter(Boolean))];
  const materials  = MAT_RAW.filter(m => matIds.includes(m.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card s={{ padding: 18 }}>
        <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14 }}>RAW MATERIALS — LINKED TO PROJECT WELDS</div>
        {materials.length === 0
          ? <div style={{ color: D.textSoft, fontSize: 12 }}>No materials linked to this project's weld passports.</div>
          : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: D.surfaceAlt }}>
                    {["Mat ID", "Heat No.", "Grade", "Standard", "Size", "Supplier", "MTC", "PMI", "Location", "Traceability"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: D.textSoft, fontWeight: 700, fontSize: 10, letterSpacing: "0.07em", borderBottom: `1px solid ${D.border}`, whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m, i) => (
                    <tr key={m.id} style={{ background: i % 2 === 0 ? D.surface : D.surfaceAlt }}>
                      <td style={{ padding: "8px 10px", color: D.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace", fontSize: 11, borderBottom: `1px solid ${D.borderSoft}` }}>{m.id}</td>
                      <td style={{ padding: "8px 10px", color: D.textMid, fontFamily: "'DM Mono',monospace", fontSize: 11, borderBottom: `1px solid ${D.borderSoft}` }}>{m.heatNo}</td>
                      <td style={{ padding: "8px 10px", color: D.text, borderBottom: `1px solid ${D.borderSoft}` }}>{m.grade}</td>
                      <td style={{ padding: "8px 10px", color: D.textSoft, fontSize: 10, borderBottom: `1px solid ${D.borderSoft}` }}>{m.standard}</td>
                      <td style={{ padding: "8px 10px", color: D.textMid, borderBottom: `1px solid ${D.borderSoft}` }}>{m.size}</td>
                      <td style={{ padding: "8px 10px", color: D.text, borderBottom: `1px solid ${D.borderSoft}` }}>{m.supplier}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${D.borderSoft}` }}><ResultBadge v={m.mtcStatus} /></td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${D.borderSoft}` }}><ResultBadge v={m.pmiStatus} /></td>
                      <td style={{ padding: "8px 10px", color: D.textSoft, fontSize: 11, borderBottom: `1px solid ${D.borderSoft}` }}>{m.location}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${D.borderSoft}` }}>
                        <span style={{ color: m.traceability === "Linked" ? D.pass : D.fail, fontWeight: 700, fontSize: 11 }}>
                          {m.traceability === "Linked" ? "✓ Linked" : "✗ Missing"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>
    </div>
  );
};

// ── main component ────────────────────────────────────────────────────────────

export const ProjectsModule: React.FC = () => {
  const [selected, setSelected] = useState<Project>(PROJECTS[0]);
  const [tab,      setTab]      = useState<Tab>("Overview");

  const sc = statusColor(selected.status);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ── Left panel: project list ─────────────────────────────────────── */}
      <div style={{ width: 260, flexShrink: 0, background: D.surface, borderRight: `1px solid ${D.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 14px 10px", borderBottom: `1px solid ${D.border}` }}>
          <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>ACTIVE PROJECTS</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {PROJECTS.map(p => {
            const pc  = statusColor(p.status);
            const sel = p.id === selected.id;
            return (
              <div
                key={p.id}
                onClick={() => { setSelected(p); setTab("Overview"); }}
                style={{
                  padding: "14px 14px", cursor: "pointer",
                  borderLeft: `3px solid ${sel ? D.accent : "transparent"}`,
                  background: sel ? D.surfaceAlt : "transparent",
                  borderBottom: `1px solid ${D.borderSoft}`,
                  transition: "background 0.1s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: D.accent, fontWeight: 700, fontSize: 10, fontFamily: "'DM Mono',monospace" }}>{p.id}</span>
                  <StatusDot status={p.status} meta={PROJ_SM} />
                </div>
                <div style={{ color: sel ? D.text : D.textMid, fontWeight: sel ? 700 : 500, fontSize: 12, lineHeight: 1.4, marginBottom: 6 }}>{p.name}</div>
                <div style={{ color: D.textSoft, fontSize: 10, marginBottom: 6 }}>{p.client}</div>
                <Progress value={p.progress} color={pc} h={4} />
                <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: D.textSoft, fontSize: 10 }}>Due {p.due}</span>
                  <span style={{ color: pc, fontWeight: 700, fontSize: 10 }}>{p.progress}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right panel: detail ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 0", borderBottom: `1px solid ${D.border}`, background: D.surface, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: D.accent, fontWeight: 700, fontSize: 13, fontFamily: "'DM Mono',monospace" }}>{selected.id}</span>
                <span style={{ color: sc, fontWeight: 700, fontSize: 12, background: selected.status === "On Track" ? "#052e16" : selected.status === "At Risk" ? D.warnBg : D.failBg, border: `1px solid ${sc}`, borderRadius: 4, padding: "2px 8px" }}>{selected.status}</span>
              </div>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 17, fontFamily: "'Inter',sans-serif" }}>{selected.name}</div>
              <div style={{ color: D.textSoft, fontSize: 12, marginTop: 2 }}>{selected.client} · {selected.standard}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: sc, fontWeight: 700, fontSize: 28 }}>{selected.progress}%</div>
              <div style={{ color: D.textSoft, fontSize: 10 }}>complete</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0 }}>
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "8px 16px", background: "none", border: "none", cursor: "pointer",
                  color: tab === t ? D.accent : D.textMid,
                  fontWeight: tab === t ? 700 : 500,
                  fontSize: 12, fontFamily: "'Inter',sans-serif",
                  borderBottom: `2px solid ${tab === t ? D.accent : "transparent"}`,
                  marginBottom: -1, transition: "color 0.12s",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {tab === "Overview"   && <OverviewTab   p={selected} />}
          {tab === "Welds"      && <WeldsTab      p={selected} />}
          {tab === "Quality"    && <QualityTab    p={selected} />}
          {tab === "ITP"        && <ITPTab        p={selected} />}
          {tab === "Materials"  && <MaterialsTab  p={selected} />}
        </div>
      </div>
    </div>
  );
};
