import React, { useState } from "react";
import { D } from "../theme";
import { StatusDot, Progress, Tag, Button } from "../components";
import { ITP_DATA } from "../data";
import { ITP_STEP_SM } from "../statusMeta";
import type { ITP } from "../types";

const HOLD_META: Record<string, { bg: string; c: string; b: string; label: string }> = {
  H: { bg: D.failBg,   c: D.fail,        b: D.failBorder,  label: "Hold"        },
  W: { bg: D.warnBg,   c: D.warn,        b: D.warnBorder,  label: "Witness"     },
  S: { bg: D.blueFaint, c: "#6ea4f0",    b: D.blueBorder,  label: "Surveillance"},
};

export const ITPModule: React.FC = () => {
  const [selectedITP, setSelectedITP] = useState<ITP>(ITP_DATA[0]);
  const done  = selectedITP?.steps.filter(s => s.status === "Completed").length ?? 0;
  const total = selectedITP?.steps.length ?? 0;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Sidebar list */}
      <div style={{ width: 280, background: D.surface, borderRight: `1px solid ${D.border}`, padding: 14, overflowY: "auto", flexShrink: 0 }}>
        <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>ITP REGISTER</div>
        <Button style={{ width: "100%", marginBottom: 12 }}>+ New ITP</Button>
        {ITP_DATA.map(itp => {
          const d   = itp.steps.filter(s => s.status === "Completed").length;
          const t   = itp.steps.length;
          const sel = selectedITP?.id === itp.id;
          return (
            <div
              key={itp.id}
              onClick={() => setSelectedITP(itp)}
              style={{ background: sel ? D.surfaceHov : D.surfaceAlt, border: `1px solid ${sel ? D.accent : D.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: D.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{itp.itpNo}</span>
                <span style={{ color: D.textSoft, fontSize: 10 }}>Rev {itp.rev}</span>
              </div>
              <div style={{ color: D.text, fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{itp.component}</div>
              <Progress value={(d / t) * 100} color={d === t ? D.pass : D.blue} h={4} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ color: D.textSoft, fontSize: 10 }}>{d}/{t} steps</span>
                <span style={{ color: d === t ? D.pass : D.textMid, fontWeight: 700, fontSize: 10 }}>{Math.round((d / t) * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail */}
      {selectedITP && (
        <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: D.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace", fontSize: 16 }}>{selectedITP.itpNo}</span>
                <Tag label={`Rev ${selectedITP.rev}`} kind="neutral" />
                <Tag label={`Client: ${selectedITP.clientApproval}`} kind="green" />
              </div>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 16, fontFamily: "'Inter',sans-serif" }}>{selectedITP.component}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: done === total ? D.pass : D.textMid, fontWeight: 700, fontSize: 22, fontFamily: "'Inter',sans-serif" }}>{done}/{total}</div>
              <div style={{ color: D.textSoft, fontSize: 11 }}>steps complete</div>
            </div>
          </div>

          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, boxShadow: D.shadow }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["#","Activity","Criteria","Method","H/W/S","Status","Inspector","Client","Date"].map(h => (
                    <th key={h} style={{ color: D.textSoft, fontWeight: 600, fontSize: 11, textAlign: h === "#" ? "center" : "left", padding: "10px 12px", borderBottom: `1px solid ${D.border}`, background: D.surfaceAlt, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedITP.steps.map(step => {
                  const hc = HOLD_META[step.holdType];
                  return (
                    <tr key={step.seq} style={{ background: step.status === "Completed" ? D.passBg : step.status === "In Progress" ? D.warnBg : "transparent" }}>
                      <td style={{ padding: "10px 12px", color: D.textSoft, fontWeight: 700, textAlign: "center", borderBottom: `1px solid ${D.borderSoft}` }}>{step.seq}</td>
                      <td style={{ padding: "10px 12px", color: D.text, fontWeight: 600, minWidth: 160, borderBottom: `1px solid ${D.borderSoft}` }}>{step.activity}</td>
                      <td style={{ padding: "10px 12px", color: D.textMid, fontSize: 11, maxWidth: 160, borderBottom: `1px solid ${D.borderSoft}` }}>{step.criteria}</td>
                      <td style={{ padding: "10px 12px", color: D.textSoft, borderBottom: `1px solid ${D.borderSoft}` }}>{step.method}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: `1px solid ${D.borderSoft}` }}>
                        <span style={{ background: hc?.bg, color: hc?.c, border: `1px solid ${hc?.b}`, borderRadius: 4, padding: "2px 7px", fontWeight: 700, fontSize: 11 }}>
                          {step.holdType} – {hc?.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: `1px solid ${D.borderSoft}` }}>
                        <StatusDot status={step.status} meta={ITP_STEP_SM} />
                      </td>
                      <td style={{ padding: "10px 12px", color: step.signedInspector ? D.pass : D.textSoft, fontSize: 11, borderBottom: `1px solid ${D.borderSoft}` }}>{step.signedInspector || "—"}</td>
                      <td style={{ padding: "10px 12px", color: step.signedClient ? D.pass : D.textSoft, fontSize: 11, borderBottom: `1px solid ${D.borderSoft}` }}>{step.signedClient || "—"}</td>
                      <td style={{ padding: "10px 12px", color: D.textSoft, borderBottom: `1px solid ${D.borderSoft}` }}>{step.date || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
