import React from "react";
import { D } from "../theme";
import { Card, Tag, StatusDot, StatCard, Progress } from "../components";
import { PROJECTS, ALERTS, VT_REPORTS, NCR_DATA, WELDER_DATA, READINESS_CHECKS, MDR_PACKAGES } from "../data";
import { PROJ_SM, MDR_SM } from "../statusMeta";
import { ComplianceDashboardWidget } from "./ComplianceModule";

interface DashboardModuleProps {
  setActive: (id: string) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({ setActive }) => {
  const totalW    = PROJECTS.reduce((s, p) => s + p.welds.total, 0);
  const complW    = PROJECTS.reduce((s, p) => s + p.welds.complete, 0);
  const rejW      = PROJECTS.reduce((s, p) => s + p.welds.rejected, 0);
  const repairRate = ((rejW / complW) * 100).toFixed(1);
  const vtPass    = VT_REPORTS.filter(r => r.result === "PASS").length;
  const vtTotal   = VT_REPORTS.length;
  const openNcr   = NCR_DATA.filter(n => n.status !== "Closed").length;
  const critNcr   = NCR_DATA.filter(n => n.priority === "Critical" && n.status !== "Closed").length;
  const expW      = WELDER_DATA.filter(w => w.status === "Expiring Soon" || w.status === "Expired").length;

  return (
    <div style={{ padding: 20, overflowY: "auto" }}>
      {/* ISO banner */}
      <div style={{ background: "linear-gradient(135deg,#1a2440,#1a2830)", border: "1px solid #2a4060", borderRadius: 10, padding: "14px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, background: D.accent, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🔥</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: D.text, fontWeight: 700, fontSize: 15, fontFamily: "'Inter',sans-serif" }}>WQMS Pro — ISO 3834 Welding Quality Management System</div>
          <div style={{ color: D.textSoft, fontSize: 12, marginTop: 2 }}>Fabrication · Pressure Equipment · Structural · Mining · Defence · Pipeline</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["ISO 3834", "AS 3992", "ASME IX", "AS 4041", "ISO 9606"].map(s => <Tag key={s} label={s} kind="blue" />)}
        </div>
      </div>

      {/* Critical alerts */}
      {ALERTS.filter(a => a.type === "critical").map(a => (
        <div key={a.id} style={{ background: D.failBg, border: `1px solid ${D.failBorder}`, borderLeft: `4px solid ${D.fail}`, borderRadius: 8, padding: "10px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 17 }}>🚨</span>
          <div style={{ flex: 1, color: D.fail, fontSize: 12, fontWeight: 600 }}>{a.msg}</div>
          <button onClick={() => setActive("ncr")} style={{ background: D.failBg, border: `1px solid ${D.failBorder}`, color: D.fail, padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>View NCR →</button>
        </div>
      ))}

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Welds"    value={totalW}                sub={`${complW} complete`}                         color={D.blue} icon="⚡" onClick={() => setActive("weldregister")} />
        <StatCard label="Repair Rate"    value={`${repairRate}%`}       sub={`${rejW} rejected`}                          color={parseFloat(repairRate) > 5 ? D.fail : D.pass} icon="🔄" onClick={() => setActive("ncr")} />
        <StatCard label="VT Pass Rate"   value={`${Math.round((vtPass / vtTotal) * 100)}%`} sub={`${vtPass}/${vtTotal}`} color={D.pass} icon="🔍" onClick={() => setActive("inspection")} />
        <StatCard label="Open NCRs"      value={openNcr}               sub={critNcr > 0 ? `${critNcr} critical` : "None critical"} color={openNcr > 2 ? D.fail : D.warn} icon="⚠️" onClick={() => setActive("ncr")} />
        <StatCard label="Quals Expiring" value={expW}                  sub="Need action"                                 color={expW > 0 ? D.warn : D.pass} icon="👷" onClick={() => setActive("welders")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Project status */}
        <Card s={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ color: D.text, fontWeight: 700, fontSize: 14, fontFamily: "'Inter',sans-serif" }}>Live Project Status</div>
            <button onClick={() => setActive("projects")} style={{ background: "none", border: `1px solid ${D.border}`, color: D.textMid, padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11 }}>All →</button>
          </div>
          {PROJECTS.map(p => (
            <div key={p.id} onClick={() => setActive("projects")} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${D.borderSoft}`, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <div style={{ color: D.text, fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div style={{ color: D.textSoft, fontSize: 11, marginTop: 1 }}>{p.client} · Due {p.due}</div>
                </div>
                <StatusDot status={p.status} meta={PROJ_SM} />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1 }}><Progress value={p.progress} color={p.status === "On Track" ? D.pass : p.status === "At Risk" ? D.warn : D.fail} /></div>
                <span style={{ color: D.textMid, fontSize: 11, fontWeight: 700, minWidth: 30 }}>{p.progress}%</span>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                {([["✓", p.welds.complete, D.pass], ["⏳", p.welds.pending, D.textMid], ["✕", p.welds.rejected, D.fail]] as const).map(([ic, v, c]) => (
                  <span key={String(ic)} style={{ color: c, fontSize: 11 }}>{ic} {v}</span>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Alerts */}
          <Card s={{ padding: 18 }}>
            <div style={{ color: D.text, fontWeight: 700, fontSize: 14, fontFamily: "'Inter',sans-serif", marginBottom: 12 }}>Alerts & Compliance</div>
            {ALERTS.map(a => (
              <div key={a.id} style={{ display: "flex", gap: 10, padding: "7px 10px", marginBottom: 5, background: a.type === "critical" ? D.failBg : a.type === "warn" ? D.warnBg : D.blueFaint, border: `1px solid ${a.type === "critical" ? D.failBorder : a.type === "warn" ? D.warnBorder : D.blueBorder}`, borderRadius: 6 }}>
                <span style={{ fontSize: 12, flexShrink: 0 }}>{a.type === "critical" ? "🚨" : a.type === "warn" ? "⚠️" : "ℹ️"}</span>
                <div style={{ color: a.type === "critical" ? D.fail : a.type === "warn" ? D.warn : D.textMid, fontSize: 11.5, lineHeight: 1.5 }}>{a.msg}</div>
              </div>
            ))}
          </Card>

          {/* Quick actions */}
          <Card s={{ padding: 18, flex: 1 }}>
            <div style={{ color: D.text, fontWeight: 700, fontSize: 14, fontFamily: "'Inter',sans-serif", marginBottom: 12 }}>Quick Actions</div>
            {([ ["📘","Weld Passport","weldregister"], ["🗺️","Weld Maps","weldregister"], ["🔍","VT Inspection","inspection"], ["⚠️","Raise NCR","ncr"], ["📊","Compliance","compliance"], ["📦","MDR Builder","reports"] ] as const).map(([ic, label, target]) => (
              <button key={label} onClick={() => setActive(target)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", marginBottom: 5, background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 7, cursor: "pointer", color: D.textMid, fontFamily: "'Inter',sans-serif", fontSize: 12, textAlign: "left" }}>
                <span style={{ fontSize: 15 }}>{ic}</span>
                <span style={{ fontWeight: 600, color: D.text, flex: 1 }}>{label}</span>
                <span style={{ color: D.accent }}>→</span>
              </button>
            ))}
          </Card>
        </div>
      </div>

      {/* Compliance widget + NDT + Readiness */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <ComplianceDashboardWidget setActive={setActive} />

        {/* NDT summary */}
        <Card onClick={() => setActive("inspection")} s={{ padding: 18, cursor: "pointer" }}>
          <div style={{ color: D.text, fontWeight: 700, fontSize: 14, fontFamily: "'Inter',sans-serif", marginBottom: 12 }}>NDT Summary</div>
          {([["VT", vtPass, vtTotal, D.pass], ["MT", 18, 20, D.blue], ["UT", 12, 14, D.blue], ["RT", 8, 10, D.warn], ["PT", 6, 6, D.pass]] as const).map(([m, p, t, c]) => (
            <div key={m} style={{ marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: D.textMid, fontSize: 12 }}>{m}</span>
                <span style={{ color: c, fontSize: 12, fontWeight: 700 }}>{p}/{t}</span>
              </div>
              <Progress value={(p / t) * 100} color={c} h={5} />
            </div>
          ))}
        </Card>

        {/* Readiness summary */}
        <Card s={{ padding: 18 }}>
          <div style={{ color: D.text, fontWeight: 700, fontSize: 14, fontFamily: "'Inter',sans-serif", marginBottom: 12 }}>Readiness Summary</div>
          {PROJECTS.map(p => {
            const checks = READINESS_CHECKS[p.id];
            const all    = checks ? Object.values(checks).flat() : [];
            const fails  = all.filter(c => c.status === "fail").length;
            const warns  = all.filter(c => c.status === "warn").length;
            const ready  = fails === 0 && warns === 0;
            const cond   = fails === 0 && warns > 0;
            return (
              <div key={p.id} onClick={() => setActive("readiness")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${D.borderSoft}`, cursor: "pointer" }}>
                <span style={{ color: D.textMid, fontSize: 11 }}>{p.name.split("–")[0].trim()}</span>
                <span style={{ color: ready ? D.pass : cond ? D.warn : D.fail, fontWeight: 700, fontSize: 11 }}>
                  {ready ? "✅ READY" : cond ? "⚠️ CONDITIONS" : `🚫 ${fails} BLOCKER${fails !== 1 ? "S" : ""}`}
                </span>
              </div>
            );
          })}
        </Card>

        {/* MDR status */}
        <Card onClick={() => setActive("reports")} s={{ padding: 18, cursor: "pointer" }}>
          <div style={{ color: D.text, fontWeight: 700, fontSize: 14, fontFamily: "'Inter',sans-serif", marginBottom: 12 }}>MDR Status</div>
          {MDR_PACKAGES.map(pkg => (
            <div key={pkg.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${D.borderSoft}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: D.text, fontSize: 12, fontWeight: 600 }}>{pkg.id}</span>
                <StatusDot status={pkg.status} meta={MDR_SM} />
              </div>
              <div style={{ color: D.textSoft, fontSize: 11, marginBottom: 5 }}>{pkg.client}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1 }}><Progress value={pkg.completeness} color={pkg.completeness === 100 ? D.pass : pkg.completeness > 70 ? D.warn : D.fail} h={4} /></div>
                <span style={{ color: D.textMid, fontWeight: 700, fontSize: 11 }}>{pkg.completeness}%</span>
              </div>
              {pkg.missing.length > 0 && <div style={{ color: D.fail, fontSize: 10, marginTop: 3 }}>⚠ {pkg.missing.length} missing</div>}
            </div>
          ))}
          <button onClick={() => setActive("reports")} style={{ width: "100%", padding: "8px", background: D.accentFaint, border: `1px solid ${D.accentBorder}`, borderRadius: 6, cursor: "pointer", color: D.accent, fontWeight: 600, fontSize: 12, fontFamily: "'Inter',sans-serif" }}>Open MDR Builder →</button>
        </Card>
      </div>
    </div>
  );
};
