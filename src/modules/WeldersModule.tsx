import React, { useState } from "react";
import { D, inp } from "../theme";
import { Tag, StatusDot, SectionHeader, TabBar, Button } from "../components";
import { WELDER_DATA } from "../data";
import { WELDER_SM } from "../statusMeta";
import { daysUntil } from "../utils";
import type { Welder } from "../types";

export const WeldersModule: React.FC = () => {
  const [sel, setSel]   = useState<Welder | null>(null);
  const [tab, setTab]   = useState("register");

  const alerts = WELDER_DATA.flatMap(w =>
    w.qualifications
      .filter(q => { const d = daysUntil(q.expiryDate); return d !== null && d < 90; })
      .map(q => ({ welder: w, qual: q, days: daysUntil(q.expiryDate) as number }))
  ).sort((a, b) => a.days - b.days);

  const PROCESSES = ["111", "121", "131", "135", "141"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TabBar
        tabs={[["register", "Register"], ["alerts", "Expiry Alerts", alerts.length], ["matrix", "Matrix"]]}
        active={tab}
        setActive={setTab}
      />

      {/* ── Register ── */}
      {tab === "register" && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ flex: 1, padding: 18, overflowY: "auto" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <input placeholder="Search…" style={{ ...inp, width: 240 }} />
              <div style={{ marginLeft: "auto" }}><Button color="#2a4a9a">+ Add Welder</Button></div>
            </div>
            {WELDER_DATA.map(w => (
              <div
                key={w.id}
                onClick={() => setSel(sel?.id === w.id ? null : w)}
                style={{ background: sel?.id === w.id ? D.surfaceHov : D.surface, border: `1px solid ${sel?.id === w.id ? D.accent : D.border}`, borderLeft: `3px solid ${sel?.id === w.id ? D.accent : "transparent"}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8, cursor: "pointer", boxShadow: D.shadow }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ color: D.accent, fontWeight: 700, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>{w.stampNo}</span>
                      <StatusDot status={w.status} meta={WELDER_SM} />
                    </div>
                    <div style={{ color: D.text, fontWeight: 700, fontSize: 14, fontFamily: "'Inter',sans-serif", marginBottom: 2 }}>{w.firstName} {w.lastName}</div>
                    <div style={{ color: D.textSoft, fontSize: 12 }}>{w.trade} · {w.employer}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", marginTop: 4 }}>
                      {[...new Set(w.qualifications.map(q => q.process))].map(p => <Tag key={p} label={p} kind="blue" />)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: D.textSoft, fontSize: 11 }}>{w.qualifications.length} cert{w.qualifications.length !== 1 ? "s" : ""}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sel && (
            <div style={{ width: 380, borderLeft: `1px solid ${D.border}`, background: D.surface, padding: 18, overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ color: "#6ea4f0", fontWeight: 800, fontSize: 17, fontFamily: "'DM Mono',monospace" }}>{sel.stampNo}</div>
                  <div style={{ color: D.text, fontWeight: 700, fontSize: 15, fontFamily: "'Inter',sans-serif" }}>{sel.firstName} {sel.lastName}</div>
                </div>
                <button onClick={() => setSel(null)} style={{ background: "none", border: `1px solid ${D.border}`, color: D.textMid, borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>✕</button>
              </div>
              <SectionHeader icon="🏅">Qualifications</SectionHeader>
              {sel.qualifications.map(q => {
                const days = daysUntil(q.expiryDate);
                return (
                  <div key={q.id} style={{ background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 7, padding: "10px 12px", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
                      <Tag label={q.process} kind="blue" />
                      <Tag label={q.materialGroup} kind="green" />
                      {days !== null && days < 0   && <Tag label="EXPIRED"           kind="red"   />}
                      {days !== null && days >= 0 && days < 90 && <Tag label={`${days}d left`} kind="amber" />}
                    </div>
                    <div style={{ color: D.textMid, fontSize: 12 }}>{q.jointType} · {q.positions.join(", ")}</div>
                    <div style={{ color: D.textSoft, fontSize: 11 }}>t: {q.thicknessRange} · Tested: {q.testDate}</div>
                    {!q.continuityOk && <div style={{ marginTop: 4 }}><Tag label="⚠ Continuity check required" kind="amber" /></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Expiry Alerts ── */}
      {tab === "alerts" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          {alerts.length === 0 ? (
            <div style={{ color: D.pass, padding: 16, background: D.passBg, borderRadius: 8, border: `1px solid ${D.passBorder}` }}>✓ All qualifications current.</div>
          ) : alerts.map(({ welder: w, qual: q, days }, i) => (
            <div key={i} style={{ background: D.surface, border: `1px solid ${days < 0 ? D.failBorder : D.warnBorder}`, borderLeft: `4px solid ${days < 0 ? D.fail : D.warn}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: D.text, fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif", marginBottom: 3 }}>
                    {w.firstName} {w.lastName} <span style={{ color: D.textSoft, fontWeight: 400, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{w.stampNo}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Tag label={q.process} kind="blue" />
                    <Tag label={q.materialGroup} kind="green" />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {days < 0
                    ? <Tag label={`Expired ${Math.abs(days)}d ago`} kind="red" />
                    : <Tag label={`Expires in ${days}d`}            kind="amber" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Matrix ── */}
      {tab === "matrix" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, boxShadow: D.shadow }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: D.surfaceAlt, borderBottom: `1px solid ${D.border}` }}>
                  <th style={{ color: D.textSoft, fontWeight: 600, fontSize: 11, textAlign: "left", padding: "9px 14px", borderRight: `1px solid ${D.border}` }}>Welder</th>
                  <th style={{ color: D.textSoft, fontWeight: 600, fontSize: 11, textAlign: "left", padding: "9px 12px", borderRight: `1px solid ${D.border}` }}>Stamp</th>
                  {PROCESSES.map(p => (
                    <th key={p} style={{ color: D.textSoft, fontWeight: 600, fontSize: 11, textAlign: "center", padding: "9px 10px", borderRight: `1px solid ${D.borderSoft}` }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WELDER_DATA.map((w, i) => (
                  <tr key={w.id} style={{ background: i % 2 === 0 ? D.surface : "transparent", borderBottom: `1px solid ${D.borderSoft}` }}>
                    <td style={{ padding: "9px 14px", borderRight: `1px solid ${D.border}`, whiteSpace: "nowrap" }}>
                      <div style={{ color: D.text, fontWeight: 600 }}>{w.firstName} {w.lastName}</div>
                    </td>
                    <td style={{ padding: "9px 12px", color: D.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace", fontSize: 12, borderRight: `1px solid ${D.border}` }}>{w.stampNo}</td>
                    {PROCESSES.map(p => {
                      const quals    = w.qualifications.filter(q => q.process === p);
                      const expired  = quals.length > 0 && quals.every(q => (daysUntil(q.expiryDate) ?? 0) < 0);
                      const expiring = quals.some(q => { const d = daysUntil(q.expiryDate); return d !== null && d >= 0 && d < 90; });
                      return (
                        <td key={p} style={{ padding: "9px 10px", textAlign: "center", borderRight: `1px solid ${D.borderSoft}` }}>
                          {quals.length === 0 ? <span style={{ color: D.borderSoft }}>–</span> : expired ? "🔴" : expiring ? "🟡" : "🟢"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
