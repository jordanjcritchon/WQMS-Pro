import React, { useState } from "react";
import { D, inp } from "../theme";
import type { Project } from "../types";

// ── Reuse the DatePicker pattern from AddWelderModal ──────────────────────────
const MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CUR_YEAR = new Date().getFullYear();
const YEARS    = Array.from({ length: 10 }, (_, i) => String(CUR_YEAR + i));

const S = {
  label: { display: "block", color: D.textSoft, fontSize: 11, marginBottom: 4, fontWeight: 500 } as React.CSSProperties,
  sel:   { ...inp, cursor: "pointer" } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as React.CSSProperties,
  smallBtn: { background: D.surfaceAlt, color: D.textMid, border: `1px solid ${D.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 11 } as React.CSSProperties,
};

interface DPProps { label: string; value: string; onChange: (v: string) => void; }
const DatePicker: React.FC<DPProps> = ({ label, value, onChange }) => {
  const init  = value ? value.split("-") : ["", "", ""];
  const [year,  setYear]  = useState(init[0] || "");
  const [month, setMonth] = useState(init[1] || "");
  const [day,   setDay]   = useState(init[2] || "");

  const emit = (nd: string, nm: string, ny: string) => {
    if (nd && nm && ny) {
      const max  = new Date(Number(ny), Number(nm), 0).getDate();
      const safe = String(Math.min(Number(nd), max)).padStart(2, "0");
      onChange(`${ny}-${nm}-${safe}`);
    }
  };
  const days = Array.from({ length: new Date(Number(year || CUR_YEAR), Number(month || 1), 0).getDate() }, (_, i) => String(i + 1).padStart(2, "0"));

  return (
    <div>
      <label style={S.label}>{label}</label>
      <div style={{ display: "flex", gap: 6 }}>
        <select value={day}   onChange={e => { setDay(e.target.value);   emit(e.target.value, month, year); }} style={{ ...S.sel, flex: "0 0 60px" }}>
          <option value="">DD</option>{days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={month} onChange={e => { setMonth(e.target.value); emit(day, e.target.value, year); }} style={{ ...S.sel, flex: "1 1 0" }}>
          <option value="">Month</option>
          {MONTHS.map((mo, i) => { const v = String(i+1).padStart(2,"0"); return <option key={v} value={v}>{mo}</option>; })}
        </select>
        <select value={year}  onChange={e => { setYear(e.target.value);  emit(day, month, e.target.value); }} style={{ ...S.sel, flex: "0 0 76px" }}>
          <option value="">Year</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
};

const STANDARDS: Record<string, string[]> = {
  "Australian Standards — Structural": [
    "AS/NZS 1554.1 — Cat GP (General Purpose)",
    "AS/NZS 1554.1 — Cat SP (Structural Purpose)",
    "AS/NZS 1554.2",
    "AS/NZS 1554.3",
    "AS/NZS 1554.4",
    "AS/NZS 1554.5 — Stainless Steel",
    "AS/NZS 1554.6 — Aluminium",
    "AS/NZS 1554.7",
    "BS EN 1090-2 — Structural Steel",
  ],
  "Australian Standards — Pressure Equipment": [
    "AS 4041 — Cat 1 (Highest risk)",
    "AS 4041 — Cat 2",
    "AS 4041 — Cat 3",
    "AS/NZS 3992 — Pressure Equipment Welding",
    "AS 1210 — Pressure Vessels",
    "AS 4037 — Pressure Equipment Examination",
    "AS 2885.2 — Pipelines (Welding)",
  ],
  "ASME — Boiler & Pressure Vessel": [
    "ASME BPVC Sec I — Power Boilers",
    "ASME BPVC Sec VIII Div 1 — Pressure Vessels",
    "ASME BPVC Sec VIII Div 2 — Pressure Vessels (Alt Rules)",
    "ASME BPVC Sec IX — Welding Qualifications",
  ],
  "ASME — B31 Piping Codes": [
    "ASME B31.1 — Power Piping",
    "ASME B31.3 — Process Piping",
    "ASME B31.4 — Liquid Pipelines",
    "ASME B31.8 — Gas Transmission",
    "ASME B31.9 — Building Services Piping",
    "ASME B31.12 — Hydrogen Piping",
  ],
  "AWS Standards": [
    "AWS D1.1 — Structural Steel",
    "AWS D1.2 — Structural Aluminium",
    "AWS D1.5 — Bridge Welding",
    "AWS D1.6 — Structural Stainless Steel",
    "AWS D9.1 — Sheet Metal",
  ],
  "European / ISO Standards": [
    "EN ISO 3834-2 — Comprehensive Quality",
    "EN ISO 3834-3 — Standard Quality",
    "EN ISO 3834-4 — Elementary Quality",
    "EN 13480 — Metallic Industrial Piping",
    "EN 13445 — Unfired Pressure Vessels",
    "EN 15614-1 — WPQR Steel",
    "ISO 9001:2015 — Quality Management",
  ],
  "API Standards": [
    "API 650 — Storage Tanks",
    "API 620 — Large Welded Tanks",
    "API 1104 — Pipeline Welding",
    "API 582 — Welding Guidelines",
  ],
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onSave:  (project: Project) => Promise<void>;
}

export const AddProjectModal: React.FC<Props> = ({ onClose, onSave }) => {
  const [name,     setName]     = useState("");
  const [client,   setClient]   = useState("");
  const [standard, setStandard] = useState("");
  const [status,   setStatus]   = useState<Project["status"]>("On Track");
  const [due,      setDue]      = useState("");
  const [progress, setProgress] = useState(0);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || !client.trim()) {
      setError("Project name and client are required."); return;
    }
    const project: Project = {
      id:       `P-${Date.now()}`,
      name:     name.trim(),
      client:   client.trim(),
      standard: standard || "—",
      status,
      due:      due || "—",
      progress,
      welds:    { total: 0, complete: 0, pending: 0, rejected: 0 },
      drawings: [],
    };
    setSaving(true); setError(null);
    try { await onSave(project); onClose(); }
    catch (e: unknown) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" };
  const modal:   React.CSSProperties = { background: D.bg, borderRadius: 12, width: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", overflow: "hidden" };
  const btn = (col: string): React.CSSProperties => ({ background: col, color: "#fff", border: "none", borderRadius: 6, padding: "9px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 });

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={{ background: D.surface, borderBottom: `1px solid ${D.border}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: D.text, fontWeight: 700, fontSize: 16 }}>New Project</div>
          <button onClick={onClose} style={S.smallBtn}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {error && <div style={{ background: D.failBg, border: `1px solid ${D.failBorder}`, color: D.fail, borderRadius: 7, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>{error}</div>}

          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Project Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pipe Spool Fabrication — Block 4" style={inp} />
          </div>

          <div style={{ ...S.grid2, marginBottom: 12 }}>
            <div>
              <label style={S.label}>Client *</label>
              <input value={client} onChange={e => setClient(e.target.value)} placeholder="Client name" style={inp} />
            </div>
            <div>
              <label style={S.label}>Welding Standard</label>
              <select value={standard} onChange={e => setStandard(e.target.value)} style={S.sel}>
                <option value="">— select —</option>
                {Object.entries(STANDARDS).map(([group, items]) => (
                  <optgroup key={group} label={group}>
                    {items.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div style={{ ...S.grid2, marginBottom: 12 }}>
            <div>
              <label style={S.label}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Project["status"])} style={S.sel}>
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>
            <DatePicker label="Due Date" value={due} onChange={setDue} />
          </div>

          <div style={{ marginBottom: 4 }}>
            <label style={S.label}>Initial Progress: <strong style={{ color: D.text }}>{progress}%</strong></label>
            <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))} style={{ width: "100%", accentColor: D.accent }} />
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${D.border}`, padding: "12px 20px", display: "flex", gap: 10, justifyContent: "flex-end", background: D.surface }}>
          <button style={S.smallBtn} onClick={onClose}>Cancel</button>
          <button style={btn(saving ? D.textSoft : "#2a4a9a")} onClick={handleSave} disabled={saving}>
            {saving ? "Creating…" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
};
