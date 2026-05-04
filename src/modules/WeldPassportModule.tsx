import React, { useState } from "react";
import { D, inp } from "../theme";
import { Card, Tag, StatusDot, SectionHeader, FieldRow, Button } from "../components";
import { WELD_PASSPORTS, WPS_DATA } from "../data";
import { OVERALL_SM } from "../statusMeta";
import type { WeldPassport } from "../types";

interface WeldPassportModuleProps {
  preselect?: string | null;
}

interface StatusBannerProps { w: WeldPassport; }

const StatusBanner: React.FC<StatusBannerProps> = ({ w }) => {
  const m = OVERALL_SM[w.overallStatus] ?? { bg: D.surfaceAlt, text: D.textMid };
  const checks = [
    { label: "Personnel",    ok: w.qualValid },
    { label: "WPS Valid",    ok: WPS_DATA.find(s => s.id === w.wpsId)?.status === "Active" },
    { label: "Material Cert",ok: !!w.matCertRef },
    { label: "VT",           ok: w.vtResult === "PASS" },
    { label: "NDT",          ok: w.ndtResults.every(n => n.result === "Pass") },
    { label: "HT",           ok: !w.htRef || w.htResult === "Pass" },
    { label: "No Open NCRs", ok: w.ncrRefs.length === 0 },
  ];
  return (
    <div style={{ background: m.bg, border: `1px solid ${m.text}33`, borderRadius: 8, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <div style={{ color: m.text, fontWeight: 800, fontSize: 16, fontFamily: "'Inter',sans-serif" }}>{w.overallStatus}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: c.ok ? D.passBg : D.failBg, border: `1px solid ${c.ok ? D.passBorder : D.failBorder}`, borderRadius: 5, fontSize: 11, fontWeight: 600, color: c.ok ? D.pass : D.fail }}>
            <span>{c.ok ? "✓" : "✕"}</span>{c.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export const WeldPassportModule: React.FC<WeldPassportModuleProps> = ({ preselect }) => {
  const [selectedId, setSelectedId] = useState(preselect ?? WELD_PASSPORTS[0].id);
  const [copied, setCopied] = useState(false);
  const wp = WELD_PASSPORTS.find(w => w.id === selectedId);

  const handleExportPDF = () => window.print();

  const handleShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?weld=${selectedId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Sidebar — hidden during print */}
      <div className="no-print" style={{ width: 280, background: D.surface, borderRight: `1px solid ${D.border}`, padding: 14, overflowY: "auto", flexShrink: 0 }}>
        <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>WELD PASSPORTS</div>
        <input placeholder="Search weld ID…" style={{ ...inp, marginBottom: 12 }} />
        {WELD_PASSPORTS.map(w => {
          const sel = selectedId === w.id;
          const m   = OVERALL_SM[w.overallStatus] ?? {};
          return (
            <div
              key={w.id}
              onClick={() => setSelectedId(w.id)}
              style={{ background: sel ? D.surfaceHov : D.surfaceAlt, border: `1px solid ${sel ? D.accent : D.border}`, borderLeft: `3px solid ${sel ? D.accent : m.dot ?? D.border}`, borderRadius: 7, padding: "10px 12px", marginBottom: 7, cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: D.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{w.id}</span>
                <StatusDot status={w.overallStatus} meta={OVERALL_SM} />
              </div>
              <div style={{ color: D.text, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{w.weldType}</div>
              <div style={{ color: D.textSoft, fontSize: 11 }}>{w.projectId} · {w.spoolNo}</div>
              {w.repairCount > 0 && <Tag label={`${w.repairCount} repair(s)`} kind="amber" />}
              {w.ncrRefs.length > 0 && <Tag label="NCR Open" kind="red" />}
            </div>
          );
        })}
        <div style={{ marginTop: 12, padding: "10px 12px", background: D.accentFaint, border: `1px solid ${D.accentBorder}`, borderRadius: 7 }}>
          <div style={{ color: D.accent, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>QUICK ACCESS</div>
          <div style={{ color: D.textSoft, fontSize: 11, lineHeight: 1.6 }}>Open from any module:<br />Click weld ID → "Open Passport"</div>
        </div>
      </div>

      {/* Detail */}
      {wp && (
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
                <span style={{ color: D.accent, fontWeight: 800, fontSize: 20, fontFamily: "'DM Mono',monospace" }}>{wp.id}</span>
                <Tag label={wp.projectId} kind="blue" />
                <Tag label={wp.weldType}  kind="neutral" />
                <StatusDot status={wp.overallStatus} meta={OVERALL_SM} />
              </div>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 16, fontFamily: "'Inter',sans-serif", marginBottom: 2 }}>{wp.weldType} – {wp.componentId}</div>
              <div style={{ color: D.textSoft, fontSize: 12 }}>Drawing: {wp.drawingNo} · Joint: {wp.jointNo} · Spool: {wp.spoolNo}</div>
            </div>
            <div className="no-print" style={{ display: "flex", gap: 8 }}>
              <Button color={D.blue} outline onClick={handleExportPDF}>Export PDF</Button>
              <Button color={copied ? D.pass : D.accent} onClick={handleShareLink}>
                {copied ? "Copied!" : "Share Link"}
              </Button>
            </div>
          </div>

          <StatusBanner w={wp} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Core */}
            <Card s={{ padding: 16 }}>
              <SectionHeader icon="⚡" mt={0}>Core Weld Information</SectionHeader>
              <FieldRow label="Weld Type"      value={wp.weldType} />
              <FieldRow label="Joint Design"   value={wp.jointDesign} />
              <FieldRow label="Size / Thickness" value={wp.size} />
              <FieldRow label="Position"       value={wp.position} />
              <FieldRow label="Process"        value={wp.process} />
              <FieldRow label="Date Welded"    value={wp.dateWelded} />
              <FieldRow label="Standard"       value={wp.standard} />
            </Card>

            {/* Personnel */}
            <Card s={{ padding: 16 }}>
              <SectionHeader icon="👷" mt={0}>Personnel & Qualification</SectionHeader>
              <FieldRow label="Welder"          value={`${wp.welderName} (${wp.stampNo})`} accent />
              <FieldRow label="Qualification Ref" value={wp.qualRef} mono />
              <FieldRow label="Qual Valid?"     value={wp.qualValid ? "✓ Valid" : "✕ EXPIRED"} color={wp.qualValid ? D.pass : D.fail} />
              <FieldRow label="Coordinator"     value={wp.coordinator} />
              <FieldRow label="Inspector"       value={wp.inspector} />
            </Card>

            {/* WPS */}
            <Card s={{ padding: 16 }}>
              <SectionHeader icon="📋" mt={0}>Procedure & Technical Controls</SectionHeader>
              <FieldRow label="WPS Used"        value={wp.wpsId}  accent mono />
              <FieldRow label="WPS Revision"    value={wp.wpsRev} />
              <FieldRow label="PQR Reference"   value={wp.pqrRef} mono />
              <FieldRow label="Material Group"  value={wp.matGroup} />
              <FieldRow label="Thickness OK?"   value={wp.thicknessOk ? "✓ Within range" : "✕ Out of range"} color={wp.thicknessOk ? D.pass : D.fail} />
              <FieldRow label="Process OK?"     value={wp.processOk  ? "✓ Validated"   : "✕ Mismatch"}      color={wp.processOk  ? D.pass : D.fail} />
              <FieldRow label="Consumable OK?"  value={wp.consumableOk ? "✓ Compatible" : "✕ Mismatch"}      color={wp.consumableOk ? D.pass : D.fail} />
            </Card>

            {/* Material */}
            <Card s={{ padding: 16 }}>
              <SectionHeader icon="🧱" mt={0}>Material Traceability</SectionHeader>
              <FieldRow label="Material ID"     value={wp.matId}          accent mono />
              <FieldRow label="Heat Number"     value={wp.heatNo}         mono />
              <FieldRow label="MTC Reference"   value={wp.matCertRef} />
              <FieldRow label="PMI Status"      value={wp.pmiStatus}      color={wp.pmiStatus === "Pass" ? D.pass : D.warn} />
              <FieldRow label="Consumable ID"   value={wp.consumableId}   mono />
              <FieldRow label="Batch / Lot"     value={wp.consumableBatch} mono />
              <FieldRow label="Shielding Gas"   value={wp.weldingGas} />
            </Card>

            {/* Inspection */}
            <Card s={{ padding: 16 }}>
              <SectionHeader icon="🔍" mt={0}>Inspection & Testing</SectionHeader>
              <FieldRow label="Fit-up"          value={wp.fitupStatus}      color={wp.fitupStatus     === "Pass" ? D.pass : D.fail} />
              <FieldRow label="In-process"      value={wp.inprocessStatus}  color={wp.inprocessStatus === "Pass" ? D.pass : D.fail} />
              <FieldRow label="VT Result"       value={wp.vtResult}         color={wp.vtResult        === "PASS" ? D.pass : D.fail} />
              <FieldRow label="VT Date"         value={wp.vtDate} />
              <FieldRow label="VT Inspector"    value={wp.vtInspector} />
              {wp.ndtResults.map(n => <FieldRow key={n.method} label={`NDT – ${n.method}`} value={n.result} color={n.result === "Pass" ? D.pass : D.fail} />)}
              {wp.htRef && <FieldRow label={`HT (${wp.htType})`} value={wp.htResult ?? ""} color={wp.htResult === "Pass" ? D.pass : wp.htResult === "Pending" ? D.warn : D.fail} />}
              <FieldRow label="Dimensional"     value={wp.dimensionalResult}    color={wp.dimensionalResult   === "Pass" ? D.pass : D.textMid} />
              <FieldRow label="Pressure Test"   value={wp.pressureTestResult}   color={wp.pressureTestResult  === "Pass" ? D.pass : D.textMid} />
            </Card>

            {/* Defects */}
            <Card s={{ padding: 16 }}>
              <SectionHeader icon="⚠️" mt={0}>Defects / Repairs / NCR</SectionHeader>
              <FieldRow label="Repair Count"    value={wp.repairCount.toString()} color={wp.repairCount > 0 ? D.warn : D.pass} />
              <FieldRow label="Open NCRs"       value={wp.ncrRefs.length === 0 ? "None" : wp.ncrRefs.join(", ")} color={wp.ncrRefs.length > 0 ? D.fail : D.pass} />
              <FieldRow label="Final Status"    value={wp.finalStatus}  color={wp.finalStatus === "Accepted" ? D.pass : D.fail} />
              {wp.repairs.length > 0 && (
                <>
                  <div style={{ color: D.textSoft, fontSize: 11, marginTop: 8, marginBottom: 5 }}>Repair History</div>
                  {wp.repairs.map(r => (
                    <div key={r.repairNo} style={{ padding: "7px 10px", background: D.warnBg, border: `1px solid ${D.warnBorder}`, borderRadius: 5, marginBottom: 5 }}>
                      <div style={{ color: D.warn, fontSize: 11, fontWeight: 700 }}>Repair #{r.repairNo} – {r.date}</div>
                      <div style={{ color: D.textMid, fontSize: 11 }}>{r.desc}</div>
                    </div>
                  ))}
                </>
              )}
            </Card>
          </div>

          {/* Timeline */}
          <Card s={{ padding: 16, marginTop: 14 }}>
            <SectionHeader icon="⏱️" mt={0}>Weld Event Timeline</SectionHeader>
            <div style={{ position: "relative", paddingLeft: 20 }}>
              <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 2, background: D.border, borderRadius: 2 }} />
              {wp.timeline.map((t, i) => (
                <div key={i} style={{ position: "relative", marginBottom: 12, paddingLeft: 16 }}>
                  <div style={{ position: "absolute", left: -5, top: 4, width: 10, height: 10, borderRadius: "50%", background: t.event.includes("FAIL") || t.event.includes("NCR") ? D.fail : t.event === "Accepted" ? D.pass : D.blue, border: `2px solid ${D.bg}` }} />
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: t.event.includes("FAIL") || t.event.includes("NCR") ? D.fail : D.text, fontWeight: 600, fontSize: 12 }}>{t.event}</div>
                      <div style={{ color: D.textSoft, fontSize: 11 }}>{t.note}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ color: D.textSoft, fontSize: 11 }}>{t.date}</div>
                      <div style={{ color: D.textSoft, fontSize: 10 }}>{t.by}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Attachments */}
          <Card s={{ padding: 16, marginTop: 14 }}>
            <SectionHeader icon="📎" mt={0}>Attachments & Evidence</SectionHeader>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {wp.attachments.map(a => (
                <div key={a} style={{ padding: "6px 12px", background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 6, color: D.blue, fontSize: 12, cursor: "pointer" }}>📎 {a}</div>
              ))}
              <div style={{ padding: "6px 12px", background: D.accentFaint, border: `1px solid ${D.accentBorder}`, borderRadius: 6, color: D.accent, fontSize: 12, cursor: "pointer" }}>+ Upload</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
