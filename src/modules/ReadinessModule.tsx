import React, { useState } from "react";
import { D, inp } from "../theme";
import { Card, Button } from "../components";
import { PROJECTS, READINESS_CHECKS } from "../data";
import type { ReadinessCheck } from "../types";

interface CheckCategoryProps {
  title: string;
  icon:  string;
  items: ReadinessCheck[];
}

const CheckCategory: React.FC<CheckCategoryProps> = ({ title, icon, items }) => (
  <Card s={{ padding: 16, marginBottom: 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ color: D.text, fontWeight: 700, fontSize: 14, fontFamily: "'Inter',sans-serif" }}>{title}</span>
      <span style={{ marginLeft: "auto", color: items.some(i => i.status === "fail") ? D.fail : items.some(i => i.status === "warn") ? D.warn : D.pass, fontSize: 12, fontWeight: 700 }}>
        {items.filter(i => i.status === "pass").length}/{items.length} OK
      </span>
    </div>
    {items.map((item, i) => (
      <div
        key={i}
        style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", marginBottom: 5, background: item.status === "fail" ? D.failBg : item.status === "warn" ? D.warnBg : D.surfaceAlt, border: `1px solid ${item.status === "fail" ? D.failBorder : item.status === "warn" ? D.warnBorder : D.border}`, borderRadius: 6 }}
      >
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
          {item.status === "pass" ? "✅" : item.status === "fail" ? "🚫" : "⚠️"}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ color: item.status === "fail" ? D.fail : item.status === "warn" ? D.warn : D.text, fontWeight: 600, fontSize: 12 }}>{item.item}</div>
          <div style={{ color: D.textSoft, fontSize: 11, marginTop: 1 }}>{item.note}</div>
        </div>
        {item.status !== "pass" && (
          <button style={{ padding: "3px 10px", borderRadius: 5, border: `1px solid ${D.border}`, background: D.surface, color: D.textMid, fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>Resolve →</button>
        )}
      </div>
    ))}
  </Card>
);

export const ReadinessModule: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState("PRJ-001");
  const checks    = READINESS_CHECKS[selectedProject] ?? READINESS_CHECKS["PRJ-001"];
  const allChecks = Object.values(checks).flat();
  const passCount = allChecks.filter(c => c.status === "pass").length;
  const failCount = allChecks.filter(c => c.status === "fail").length;
  const warnCount = allChecks.filter(c => c.status === "warn").length;
  const total     = allChecks.length;
  const score     = Math.round((passCount / total) * 100);
  const readiness = failCount > 0 ? "NOT READY" : warnCount > 0 ? "READY WITH CONDITIONS" : "READY TO WELD";
  const readColor = failCount > 0 ? D.fail : warnCount > 0 ? D.warn : D.pass;
  const readBg    = failCount > 0 ? D.failBg : warnCount > 0 ? D.warnBg : D.passBg;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Controls */}
      <div style={{ padding: "14px 20px", background: D.surface, borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <div style={{ color: D.textSoft, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}>ASSESS PROJECT:</div>
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} style={{ ...inp, width: 280 }}>
          {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} – {p.name}</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <Button outline color={D.border}>📥 Download Report</Button>
          <Button color={D.blue}>🔄 Re-run Checks</Button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {/* Overall result */}
        <div style={{ background: readBg, border: `2px solid ${readColor}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ fontSize: 40 }}>{failCount > 0 ? "🚫" : warnCount > 0 ? "⚠️" : "✅"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: readColor, fontWeight: 800, fontSize: 22, fontFamily: "'Inter',sans-serif" }}>{readiness}</div>
            <div style={{ color: D.textMid, fontSize: 13, marginTop: 3 }}>{PROJECTS.find(p => p.id === selectedProject)?.name}</div>
          </div>
          <div style={{ display: "flex", gap: 20, textAlign: "center" }}>
            {([["PASS", passCount, D.pass], ["WARN", warnCount, D.warn], ["BLOCK", failCount, D.fail], ["SCORE", `${score}%`, readColor]] as const).map(([l, v, c]) => (
              <div key={l}>
                <div style={{ color: c, fontSize: 28, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>{v}</div>
                <div style={{ color: D.textSoft, fontSize: 11 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Blockers */}
        {failCount > 0 && (
          <div style={{ padding: "12px 16px", background: D.failBg, border: `1px solid ${D.failBorder}`, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ color: D.fail, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>🚨 Critical Blockers – Must resolve before welding can commence</div>
            {allChecks.filter(c => c.status === "fail").map((c, i) => (
              <div key={i} style={{ color: D.fail, fontSize: 12, marginBottom: 3 }}>• {c.item}: {c.note}</div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <CheckCategory title="Document Readiness"  icon="📋" items={checks.documents}   />
          <CheckCategory title="Personnel Readiness" icon="👷" items={checks.personnel}   />
          <CheckCategory title="Material Readiness"  icon="🧱" items={checks.materials}   />
          <CheckCategory title="Consumable Readiness"icon="🔩" items={checks.consumables} />
          <CheckCategory title="Equipment Readiness" icon="🔧" items={checks.equipment}   />
          <CheckCategory title="Process & Compliance"icon="⚙️" items={checks.process}    />
        </div>
      </div>
    </div>
  );
};
