import React, { useState } from "react";
import { D, inp } from "../theme";
import { Tag, StatusDot, SectionHeader, TabBar, Button } from "../components";
import { AddWelderModal, generateQualCertPDF } from "../components/AddWelderModal";
import { useStore } from "../store";
import * as db from "../lib/db";
import { WELDER_SM } from "../statusMeta";
import { daysUntil } from "../utils";
import type { Welder } from "../types";

export const WeldersModule: React.FC = () => {
  const { welderData, setWelderData, refresh } = useStore();
  const [sel,        setSel]        = useState<Welder | null>(null);
  const [tab,        setTab]        = useState("register");
  const [search,     setSearch]     = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [editWelder, setEditWelder] = useState<Welder | null>(null);
  const [exporting,  setExporting]  = useState<string | null>(null);

  const alerts = welderData.flatMap(w =>
    w.qualifications
      .filter(q => { const d = daysUntil(q.expiryDate); return d !== null && d < 90; })
      .map(q => ({ welder: w, qual: q, days: daysUntil(q.expiryDate) as number }))
  ).sort((a, b) => a.days - b.days);

  const PROCESSES = ["111", "121", "131", "135", "141"];

  const filtered = welderData.filter(w => {
    const s = search.toLowerCase();
    return !s || `${w.firstName} ${w.lastName} ${w.stampNo} ${w.employer}`.toLowerCase().includes(s);
  });

  const uploadPendingDocs = async (welder: Welder, pendingDocs: Record<string, File[]>): Promise<Welder> => {
    const updated: Welder = { ...welder };
    updated.qualifications = await Promise.all(welder.qualifications.map(async q => {
      const files = pendingDocs[q.id] ?? [];
      if (!files.length) return q;
      const newDocs = await Promise.all(files.map(f => db.uploadQualDocument(welder.id, q.id, f)));
      return { ...q, documents: [...(q.documents ?? []), ...newDocs] };
    }));
    return updated;
  };

  const handleSaveWelder = async (welder: Welder, photoFile: File | null, removedQualIds: string[], pendingDocs: Record<string, File[]>) => {
    let photoUrl = welder.photoUrl;
    if (photoFile) photoUrl = await db.uploadWelderPhoto(welder.id, photoFile);
    let final: Welder = { ...welder, photoUrl };
    final = await uploadPendingDocs(final, pendingDocs);
    if (removedQualIds.length) await db.deleteQualifications(removedQualIds);
    await db.upsertWelder(final);
    setWelderData(prev => [...prev, final]);
    await refresh();
  };

  const handleEditWelder = async (welder: Welder, photoFile: File | null, removedQualIds: string[], pendingDocs: Record<string, File[]>) => {
    let photoUrl = welder.photoUrl;
    if (photoFile) photoUrl = await db.uploadWelderPhoto(welder.id, photoFile);
    let final: Welder = { ...welder, photoUrl };
    final = await uploadPendingDocs(final, pendingDocs);
    if (removedQualIds.length) await db.deleteQualifications(removedQualIds);
    await db.upsertWelder(final);
    setWelderData(prev => prev.map(w => w.id === final.id ? final : w));
    setSel(final);
    await refresh();
  };

  const handleExportPDF = async (w: Welder, qIdx: number) => {
    const key = `${w.id}-${qIdx}`;
    setExporting(key);
    try {
      await generateQualCertPDF(w, w.qualifications[qIdx], w.photoUrl);
    } finally {
      setExporting(null);
    }
  };

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
              <input
                placeholder="Search welders…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inp, width: 240 }}
              />
              <div style={{ marginLeft: "auto" }}>
                <Button color="#2a4a9a" onClick={() => setShowAdd(true)}>+ Add Welder</Button>
              </div>
            </div>

            {filtered.length === 0 && (
              <div style={{ color: D.textSoft, textAlign: "center", padding: 40, fontSize: 13 }}>
                {search ? "No welders match your search." : "No welders yet — click + Add Welder to get started."}
              </div>
            )}

            {filtered.map(w => (
              <div
                key={w.id}
                onClick={() => setSel(sel?.id === w.id ? null : w)}
                style={{ background: sel?.id === w.id ? D.surfaceHov : D.surface, border: `1px solid ${sel?.id === w.id ? D.accent : D.border}`, borderLeft: `3px solid ${sel?.id === w.id ? D.accent : "transparent"}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8, cursor: "pointer", boxShadow: D.shadow, display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                {/* Photo thumbnail */}
                {w.photoUrl
                  ? <img src={w.photoUrl} alt="" style={{ width: 44, height: 54, objectFit: "cover", borderRadius: 5, border: `1px solid ${D.border}`, flexShrink: 0 }} />
                  : <div style={{ width: 44, height: 54, background: D.surfaceAlt, borderRadius: 5, border: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: D.textSoft, fontSize: 18, flexShrink: 0 }}>👷</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ color: D.accent, fontWeight: 700, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>{w.stampNo}</span>
                        <StatusDot status={w.status} meta={WELDER_SM} />
                      </div>
                      <div style={{ color: D.text, fontWeight: 700, fontSize: 14, fontFamily: "'Inter',sans-serif", marginBottom: 2 }}>{w.firstName} {w.lastName}</div>
                      <div style={{ color: D.textSoft, fontSize: 12 }}>{w.trade} · {w.employer}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", marginTop: 4 }}>
                        {[...new Set(w.qualifications.map(q => q.process.split(" ")[0]))].map(p => <Tag key={p} label={p} kind="blue" />)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", color: D.textSoft, fontSize: 11 }}>
                      {w.qualifications.length} cert{w.qualifications.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {sel && (
            <div style={{ width: 400, borderLeft: `1px solid ${D.border}`, background: D.surface, padding: 18, overflowY: "auto" }}>
              {/* Welder header */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {sel.photoUrl
                    ? <img src={sel.photoUrl} alt="" style={{ width: 56, height: 68, objectFit: "cover", borderRadius: 6, border: `1px solid ${D.border}` }} />
                    : <div style={{ width: 56, height: 68, background: D.surfaceAlt, borderRadius: 6, border: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: D.textSoft, fontSize: 24 }}>👷</div>
                  }
                  <div>
                    <div style={{ color: "#6ea4f0", fontWeight: 800, fontSize: 16, fontFamily: "'DM Mono',monospace" }}>{sel.stampNo}</div>
                    <div style={{ color: D.text, fontWeight: 700, fontSize: 15 }}>{sel.firstName} {sel.lastName}</div>
                    <div style={{ color: D.textSoft, fontSize: 12 }}>{sel.trade} · {sel.employer}</div>
                    {sel.dateOfBirth && <div style={{ color: D.textSoft, fontSize: 11, marginTop: 2 }}>DOB: {sel.dateOfBirth}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setSel(null)} style={{ background: "none", border: `1px solid ${D.border}`, color: D.textMid, borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>✕</button>
                  <button onClick={() => setEditWelder(sel)} style={{ background: "#2a4a9a", border: "none", color: "#fff", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>✏ Edit</button>
                </div>
              </div>

              <SectionHeader icon="🏅">Qualifications</SectionHeader>
              {sel.qualifications.map((q, qi) => {
                const days = daysUntil(q.expiryDate);
                const key  = `${sel.id}-${qi}`;
                return (
                  <div key={q.id} style={{ background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 7, padding: "10px 12px", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                      <Tag label={q.process.split(" ")[0]} kind="blue" />
                      <Tag label={q.materialGroup.split(" ")[0]} kind="green" />
                      {days !== null && days < 0   && <Tag label="EXPIRED"           kind="red"   />}
                      {days !== null && days >= 0 && days < 90 && <Tag label={`${days}d left`} kind="amber" />}
                    </div>
                    <div style={{ color: D.textMid, fontSize: 12, marginBottom: 2 }}>
                      {q.jointType} · {(q.positions || []).join(", ")}
                    </div>
                    {q.shieldingGas && <div style={{ color: D.textSoft, fontSize: 11 }}>Gas: {q.shieldingGas}</div>}
                    <div style={{ color: D.textSoft, fontSize: 11 }}>t: {q.thicknessRange} mm · Tested: {q.testDate}</div>
                    {q.certNo && <div style={{ color: D.textSoft, fontSize: 11 }}>Cert: {q.certNo}</div>}
                    {!q.continuityOk && <div style={{ marginTop: 4 }}><Tag label="⚠ Continuity check required" kind="amber" /></div>}

                    {/* Attached documents */}
                    {(q.documents ?? []).length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ color: D.textSoft, fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Documents</div>
                        {(q.documents ?? []).map((doc, di) => (
                          <a key={di} href={doc.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: D.accent, fontSize: 12, textDecoration: "none", marginBottom: 3 }}>
                            <span>📄</span>
                            <span style={{ textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Export PDF button */}
                    <button
                      onClick={() => handleExportPDF(sel, qi)}
                      disabled={exporting === key}
                      style={{ marginTop: 8, background: exporting === key ? D.surfaceAlt : "#1a3a7a", color: exporting === key ? D.textSoft : "#fff", border: "none", borderRadius: 5, padding: "5px 12px", cursor: exporting === key ? "default" : "pointer", fontSize: 11, fontWeight: 600 }}
                    >
                      {exporting === key ? "Generating PDF…" : "⬇ Export Certificate PDF"}
                    </button>
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
                  <div style={{ color: D.text, fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
                    {w.firstName} {w.lastName} <span style={{ color: D.textSoft, fontWeight: 400, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{w.stampNo}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Tag label={q.process.split(" ")[0]} kind="blue" />
                    <Tag label={q.materialGroup.split(" ")[0]} kind="green" />
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
                {welderData.map((w, i) => (
                  <tr key={w.id} style={{ background: i % 2 === 0 ? D.surface : "transparent", borderBottom: `1px solid ${D.borderSoft}` }}>
                    <td style={{ padding: "9px 14px", borderRight: `1px solid ${D.border}`, whiteSpace: "nowrap" }}>
                      <div style={{ color: D.text, fontWeight: 600 }}>{w.firstName} {w.lastName}</div>
                    </td>
                    <td style={{ padding: "9px 12px", color: D.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace", fontSize: 12, borderRight: `1px solid ${D.border}` }}>{w.stampNo}</td>
                    {PROCESSES.map(p => {
                      const quals    = w.qualifications.filter(q => q.process.startsWith(p));
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

      {showAdd && (
        <AddWelderModal onClose={() => setShowAdd(false)} onSave={handleSaveWelder} />
      )}
      {editWelder && (
        <AddWelderModal
          onClose={() => setEditWelder(null)}
          onSave={handleEditWelder}
          initialWelder={editWelder}
        />
      )}
    </div>
  );
};
