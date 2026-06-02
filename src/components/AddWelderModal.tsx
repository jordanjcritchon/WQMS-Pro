import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import { D, inp } from "../theme";
import type { Welder, WelderQualification } from "../types";

// ── Constants ─────────────────────────────────────────────────────────────────

const PROCESSES = [
  "111 — MMA (SMAW)", "114 — Self-shielded flux-cored", "121 — SAW (single wire)",
  "131 — MIG", "135 — MAG", "136 — Flux-cored MAG", "137 — Flux-cored MIG",
  "141 — TIG (GTAW)", "142 — Autogenous TIG", "143 — TIG (tubular filler)",
  "145 — TIG (reducing gas)", "15 — Plasma arc", "311 — Oxy-acetylene",
];

const MATERIAL_GROUPS = [
  "1.1 — C-Mn steel ≤275 MPa", "1.2 — C-Mn steel 275–360 MPa", "1.3 — C-Mn steel 360–460 MPa",
  "2 — Thermomechanical fine-grained steel", "3 — Heat-treatable steel",
  "4 — Cr-Mo steel (low V)", "5 — Cr-Mo steel (0.75–10% Cr)", "6 — Cr-Mo-V steel (high V)",
  "7 — Ferritic/martensitic stainless", "8.1 — Austenitic 304/316 type",
  "8.2 — Austenitic 309/310 type", "8.3 — Austenitic high-alloy",
  "9.1 — Ni alloy steel 1.5% Ni", "9.2 — Ni alloy steel 3.5% Ni", "9.3 — Ni alloy steel 5–9% Ni",
  "10 — Duplex stainless", "11 — Work-hardening austenitic",
];

const POSITIONS  = ["PA", "PB", "PC", "PD", "PE", "PF", "PG", "H-L045", "J-L045"];
const JOINT_TYPES = ["BW — Butt weld", "FW — Fillet weld", "BW+FW — Both"];
const PASS_FAIL   = ["PASS", "FAIL", "N/A"];
const MONTHS      = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CUR_YEAR    = new Date().getFullYear();
const YEARS       = Array.from({ length: CUR_YEAR + 10 - 1950 + 1 }, (_, i) => String(1950 + i)).reverse();

// ── Module-level styles (avoids recreation on every render) ───────────────────

const S = {
  label:    { display: "block", color: D.textSoft, fontSize: 11, marginBottom: 4, fontWeight: 500 } as React.CSSProperties,
  sel:      { ...inp, cursor: "pointer" } as React.CSSProperties,
  smallBtn: { background: D.surfaceAlt, color: D.textMid, border: `1px solid ${D.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 11 } as React.CSSProperties,
  grid2:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as React.CSSProperties,
  grid3:    { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 } as React.CSSProperties,
  grid5:    { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 } as React.CSSProperties,
};

// ── Sub-components (defined outside — fixes focus-loss on re-render) ──────────

interface LIProps { label: string; value: string; onChange: (v: string) => void; placeholder?: string; }
const LabelInput: React.FC<LIProps> = ({ label, value, onChange, placeholder = "" }) => (
  <div>
    <label style={S.label}>{label}</label>
    <input value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={inp} />
  </div>
);

interface LSProps { label: string; value: string; onChange: (v: string) => void; options: string[]; }
const LabelSelect: React.FC<LSProps> = ({ label, value, onChange, options }) => (
  <div>
    <label style={S.label}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} style={S.sel}>
      <option value="">— select —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

interface DPProps { label: string; value: string; onChange: (v: string) => void; }
const DatePicker: React.FC<DPProps> = ({ label, value, onChange }) => {
  const init = value ? value.split("-") : ["", "", ""];
  const [year,  setYear]  = useState(init[0] || "");
  const [month, setMonth] = useState(init[1] || "");
  const [day,   setDay]   = useState(init[2] || "");

  const daysInMonth = (yr: string, mo: string) =>
    yr && mo ? new Date(Number(yr), Number(mo), 0).getDate() : 31;

  const emit = (nd: string, nm: string, ny: string) => {
    if (nd && nm && ny) {
      const max  = daysInMonth(ny, nm);
      const safe = String(Math.min(Number(nd), max)).padStart(2, "0");
      onChange(`${ny}-${nm}-${safe}`);
    }
  };

  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  return (
    <div>
      <label style={S.label}>{label}</label>
      <div style={{ display: "flex", gap: 6 }}>
        <select value={day} onChange={e => { setDay(e.target.value);   emit(e.target.value, month, year);  }} style={{ ...S.sel, flex: "0 0 64px" }}>
          <option value="">DD</option>
          {days.map(dd => <option key={dd} value={dd}>{dd}</option>)}
        </select>
        <select value={month} onChange={e => { setMonth(e.target.value); emit(day, e.target.value, year);  }} style={{ ...S.sel, flex: "1 1 0" }}>
          <option value="">Month</option>
          {MONTHS.map((mo, i) => {
            const v = String(i + 1).padStart(2, "0");
            return <option key={v} value={v}>{mo}</option>;
          })}
        </select>
        <select value={year} onChange={e => { setYear(e.target.value);  emit(day, month, e.target.value); }} style={{ ...S.sel, flex: "0 0 80px" }}>
          <option value="">Year</option>
          {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
        </select>
      </div>
    </div>
  );
};

// ── Blank qual factory ────────────────────────────────────────────────────────

function blankQual(): Partial<WelderQualification> {
  return {
    id: crypto.randomUUID(), standard: "EN ISO 9606-1:2017", process: "",
    productForm: "plate", materialGroup: "", fillerMaterialType: "",
    fillerMaterialDesignation: "", shieldingGas: "", backingGas: "",
    jointType: "", weldType: "multi", positions: [], thicknessRange: "",
    pipeDiameter: "", preheat: "", pwht: "None", testDate: "", expiryDate: "",
    certNo: "", testLab: "", wpsUsed: "", examinationBody: "", examinerName: "",
    examinerCert: "", manufacturerName: "", manufacturerRef: "",
    visualResult: "PASS", bendResult: "PASS", fractureResult: "N/A",
    radiographicResult: "N/A", hardnessResult: "N/A",
    result: "PASS", continuityOk: true,
    lastActivity: new Date().toISOString().slice(0, 10), testPiece: "",
  };
}

// ── PDF generator ─────────────────────────────────────────────────────────────

export async function generateQualCertPDF(welder: Welder, q: WelderQualification, photoUrl?: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const mg  = 12;
  const cw  = 210 - mg * 2;
  let   y   = mg;

  const box  = (x: number, yy: number, w: number, h: number) => doc.rect(x, yy, w, h);
  const ln   = (x1: number, y1: number, x2: number, y2: number) => doc.line(x1, y1, x2, y2);
  const txt  = (t: string, x: number, yy: number, size = 9, style: "normal"|"bold" = "normal", align: "left"|"center"|"right" = "left") => {
    doc.setFontSize(size); doc.setFont("helvetica", style); doc.text(t, x, yy, { align });
  };
  const field = (label: string, value: string, x: number, yy: number) => {
    txt(label, x, yy, 7); txt(value || "—", x, yy + 4.5, 9, "bold");
  };

  doc.setLineWidth(0.6); box(mg, mg, cw, 297 - mg * 2);
  doc.setFillColor(15, 40, 100); doc.rect(mg, y, cw, 18, "F");
  txt("WELDER QUALIFICATION CERTIFICATE", mg + cw / 2, y + 7, 14, "bold", "center");
  doc.setTextColor(180, 200, 255);
  txt("EN ISO 9606-1:2017  ·  Fusion Welding of Steels", mg + cw / 2, y + 13, 9, "normal", "center");
  doc.setTextColor(0, 0, 0); y += 20; doc.setLineWidth(0.3); ln(mg, y, mg + cw, y);

  y += 5;
  txt("MANUFACTURER / EMPLOYER", mg + 3, y, 7, "bold");
  txt("WELDER IDENTIFICATION",   mg + cw / 2 + 3, y, 7, "bold");
  ln(mg + cw / 2, y - 2, mg + cw / 2, y + 32); y += 5;

  field("Name:", q.manufacturerName || welder.employer, mg + 3, y);
  field("Name:", `${welder.firstName} ${welder.lastName}`, mg + cw / 2 + 3, y); y += 10;
  field("Reference No:", q.manufacturerRef || "—", mg + 3, y);
  field("Date of Birth:", welder.dateOfBirth || "—", mg + cw / 2 + 3, y); y += 10;
  field("Stamp / ID No:", welder.stampNo, mg + 3, y);
  field("Birthplace:", welder.birthplace || "—", mg + cw / 2 + 3, y); y += 10;
  field("Employer:", welder.employer, mg + 3, y);
  field("Trade:", welder.trade || "—", mg + cw / 2 + 3, y); y += 8;

  if (photoUrl) {
    try {
      const img = new Image(); img.crossOrigin = "anonymous"; img.src = photoUrl;
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); });
      const canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      doc.addImage(canvas.toDataURL("image/jpeg"), "JPEG", 210 - mg - 30, mg + 22, 28, 33);
      doc.rect(210 - mg - 30, mg + 22, 28, 33);
    } catch { /**/ }
  } else {
    doc.setFillColor(230, 230, 230); doc.rect(210 - mg - 30, mg + 22, 28, 33, "F");
    doc.setTextColor(150, 150, 150); txt("PHOTO", 210 - mg - 16, mg + 41, 8, "normal", "center"); doc.setTextColor(0, 0, 0);
  }

  ln(mg, y, mg + cw, y);
  const section = (title: string) => {
    y += 5; doc.setFillColor(240, 243, 250); doc.rect(mg, y - 3, cw, 7, "F");
    txt(title, mg + 3, y + 1, 8, "bold"); y += 7;
  };
  const c3 = cw / 3;

  section("WELDING PROCESS AND TEST DETAILS");
  field("Standard:", q.standard, mg + 3, y);
  field("Welding Process:", q.process, mg + c3 + 3, y);
  field("Product Form:", q.productForm === "pipe" ? "Pipe (T)" : "Plate (P)", mg + c3 * 2 + 3, y); y += 11;
  field("Material Group:", q.materialGroup, mg + 3, y);
  field("Joint Type:", q.jointType, mg + c3 + 3, y);
  field("Weld Type:", q.weldType === "single" ? "Single run (ss)" : "Multi run (ms)", mg + c3 * 2 + 3, y); y += 11;
  field("Filler Material Type:", q.fillerMaterialType || "—", mg + 3, y);
  field("Filler Designation:", q.fillerMaterialDesignation || "—", mg + c3 + 3, y);
  field("Positions:", (q.positions || []).join(", ") || "—", mg + c3 * 2 + 3, y); y += 11;
  field("Shielding Gas:", q.shieldingGas || "—", mg + 3, y);
  field("Backing Gas:", q.backingGas || "—", mg + c3 + 3, y);
  field("WPS Used:", q.wpsUsed || "—", mg + c3 * 2 + 3, y); y += 8; ln(mg, y, mg + cw, y);

  section("TEST PIECE DETAILS");
  const c4 = cw / 4;
  field("Test Piece:", q.testPiece || "—", mg + 3, y);
  field("Thickness (t):", q.thicknessRange ? `${q.thicknessRange} mm` : "—", mg + c4 + 3, y);
  field("Pipe Diameter (D):", q.pipeDiameter ? `${q.pipeDiameter} mm` : "N/A", mg + c4 * 2 + 3, y);
  field("Preheat (min):", q.preheat ? `${q.preheat} °C` : "—", mg + c4 * 3 + 3, y); y += 11;
  field("PWHT:", q.pwht || "None", mg + 3, y); ln(mg, y + 7, mg + cw, y + 7); y += 11;

  section("RANGE OF QUALIFICATION (EN ISO 9606-1:2017, Clause 8)");
  field("Thickness Range:", q.thicknessRange || "—", mg + 3, y);
  field("Pipe Diameter Range:", q.pipeDiameter || "All", mg + c3 + 3, y);
  field("Qualified Positions:", (q.positions || []).join(", ") || "—", mg + c3 * 2 + 3, y); y += 11;
  field("Material Groups Covered:", q.materialGroup, mg + 3, y);
  field("Process:", q.process, mg + c3 * 2 + 3, y); y += 8; ln(mg, y, mg + cw, y);

  section("TEST RESULTS");
  const c5  = cw / 5;
  const rc  = (r: string) => r === "PASS" ? [0, 120, 60] as const : r === "FAIL" ? [180, 0, 0] as const : [100, 100, 100] as const;
  const dr  = (lbl: string, val: string, x: number) => {
    txt(lbl, x, y, 7); const [r, g, b] = rc(val || "N/A");
    doc.setTextColor(r, g, b); txt(val || "N/A", x, y + 4.5, 9, "bold"); doc.setTextColor(0, 0, 0);
  };
  dr("Visual (VT):", q.visualResult || "N/A", mg + 3);
  dr("Bend Test:", q.bendResult || "N/A", mg + c5 + 3);
  dr("Fracture Test:", q.fractureResult || "N/A", mg + c5 * 2 + 3);
  dr("RT/UT:", q.radiographicResult || "N/A", mg + c5 * 3 + 3);
  dr("Hardness:", q.hardnessResult || "N/A", mg + c5 * 4 + 3); y += 13;
  if (q.result === "PASS") doc.setFillColor(0, 120, 60); else doc.setFillColor(180, 0, 0);
  doc.rect(mg, y, cw, 10, "F"); doc.setTextColor(255, 255, 255);
  txt(`OVERALL RESULT: ${q.result || "—"}`, mg + cw / 2, y + 6.5, 12, "bold", "center");
  doc.setTextColor(0, 0, 0); y += 13; ln(mg, y, mg + cw, y);

  section("CERTIFICATE DETAILS");
  field("Certificate No:", q.certNo || "—", mg + 3, y);
  field("Test / Examination Date:", q.testDate || "—", mg + c3 + 3, y);
  field("Valid Until:", q.expiryDate || "—", mg + c3 * 2 + 3, y); y += 11;
  field("Testing Laboratory:", q.testLab || "—", mg + 3, y);
  field("Examination Body:", q.examinationBody || "—", mg + c3 + 3, y);
  field("Continuity Maintained:", q.continuityOk ? "Yes" : "No", mg + c3 * 2 + 3, y); y += 11;
  field("Examiner Name:", q.examinerName || "—", mg + 3, y);
  field("Examiner Cert No:", q.examinerCert || "—", mg + c3 + 3, y); y += 13;

  ln(mg, y, mg + cw, y); y += 6;
  const sig = (lbl: string, x: number) => {
    const sw = c3 - 4;
    txt(lbl, x + sw / 2, y, 7, "normal", "center");
    ln(x, y + 12, x + sw, y + 12); txt("Signature / Date", x + sw / 2, y + 16, 7, "normal", "center");
  };
  sig("EXAMINER", mg + 3); sig("MANUFACTURER / EMPLOYER", mg + c3 + 3); sig("WELDER", mg + c3 * 2 + 3);

  doc.setFontSize(7); doc.setTextColor(120, 120, 120);
  doc.text(`Generated by WQMS Pro  ·  ${new Date().toLocaleDateString("en-AU")}`, mg + cw / 2, 297 - mg - 5, { align: "center" });
  doc.save(`WeQ_${welder.stampNo}_${q.certNo || q.process}_${q.testDate || "draft"}.pdf`);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onClose:        () => void;
  onSave:         (welder: Welder, photoFile: File | null, removedQualIds: string[]) => Promise<void>;
  initialWelder?: Welder;
}

export const AddWelderModal: React.FC<Props> = ({ onClose, onSave, initialWelder }) => {
  const editing = !!initialWelder;

  const [firstName,    setFirstName]    = useState(initialWelder?.firstName    ?? "");
  const [lastName,     setLastName]     = useState(initialWelder?.lastName     ?? "");
  const [dateOfBirth,  setDateOfBirth]  = useState(initialWelder?.dateOfBirth  ?? "");
  const [birthplace,   setBirthplace]   = useState(initialWelder?.birthplace   ?? "");
  const [stampNo,      setStampNo]      = useState(initialWelder?.stampNo      ?? "");
  const [employer,     setEmployer]     = useState(initialWelder?.employer     ?? "");
  const [trade,        setTrade]        = useState(initialWelder?.trade        ?? "Welder");
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialWelder?.photoUrl ?? null);
  const [quals,        setQuals]        = useState<Partial<WelderQualification>[]>(
    initialWelder?.qualifications.length ? initialWelder.qualifications : [blankQual()]
  );
  const [removedQualIds, setRemovedQualIds] = useState<string[]>([]);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const updateQual = (i: number, patch: Partial<WelderQualification>) =>
    setQuals(qs => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));

  const togglePos = (i: number, pos: string) =>
    setQuals(qs => qs.map((q, idx) => {
      if (idx !== i) return q;
      const cur = q.positions ?? [];
      return { ...q, positions: cur.includes(pos) ? cur.filter(p => p !== pos) : [...cur, pos] };
    }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setPhotoFile(f);
    const r = new FileReader(); r.onload = ev => setPhotoPreview(ev.target?.result as string); r.readAsDataURL(f);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !stampNo.trim()) {
      setError("First name, last name and stamp number are required."); return;
    }
    const id       = initialWelder?.id ?? crypto.randomUUID();
    const allDates = quals.map(q => q.expiryDate).filter(Boolean) as string[];
    const minDays  = allDates.length ? Math.min(...allDates.map(d => Math.floor((new Date(d).getTime() - Date.now()) / 86400000))) : 365;
    const status: Welder["status"] = minDays < 0 ? "Expired" : minDays < 90 ? "Expiring Soon" : "Current";
    const welder: Welder = {
      id, stampNo: stampNo.trim(), firstName: firstName.trim(), lastName: lastName.trim(),
      dateOfBirth: dateOfBirth || undefined, birthplace: birthplace || undefined,
      employer: employer.trim(), trade: trade.trim(), status,
      photoUrl: initialWelder?.photoUrl,
      qualifications: quals.map(q => ({ ...blankQual(), ...q, id: q.id ?? crypto.randomUUID() }) as WelderQualification),
    };
    setSaving(true); setError(null);
    try { await onSave(welder, photoFile, removedQualIds); onClose(); }
    catch (e: unknown) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  // Panel styles
  const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" };
  const panel:   React.CSSProperties = { width: 800, height: "100vh", background: D.bg, overflowY: "auto", boxShadow: "-4px 0 30px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" };
  const sHead:   React.CSSProperties = { color: D.accent, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${D.border}` };
  const qualCard: React.CSSProperties = { background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: 16, marginBottom: 16 };
  const btn = (col: string): React.CSSProperties => ({ background: col, color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 });

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={panel}>
        {/* Header */}
        <div style={{ background: D.surface, borderBottom: `1px solid ${D.border}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ color: D.text, fontWeight: 700, fontSize: 16 }}>{editing ? "Edit Welder" : "Add Welder"}</div>
            <div style={{ color: D.textSoft, fontSize: 12 }}>ISO 9606-1 Qualification Record</div>
          </div>
          <button onClick={onClose} style={S.smallBtn}>✕ Cancel</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
          {error && <div style={{ background: D.failBg, border: `1px solid ${D.failBorder}`, color: D.fail, borderRadius: 7, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>{error}</div>}

          {/* Welder Details */}
          <div style={{ marginBottom: 24 }}>
            <div style={sHead}>Welder Details</div>
            <div style={{ ...S.grid2, marginBottom: 12 }}>
              <LabelInput label="First Name *" value={firstName} onChange={setFirstName} />
              <LabelInput label="Last Name *"  value={lastName}  onChange={setLastName}  />
            </div>
            <div style={{ ...S.grid3, marginBottom: 12 }}>
              <LabelInput label="Stamp / ID Number *" value={stampNo}   onChange={setStampNo}   placeholder="e.g. W-001" />
              <LabelInput label="Birthplace"           value={birthplace} onChange={setBirthplace} placeholder="City, Country" />
              <DatePicker  label="Date of Birth"        value={dateOfBirth} onChange={setDateOfBirth} />
            </div>
            <div style={{ ...S.grid2, marginBottom: 16 }}>
              <LabelInput label="Employer" value={employer} onChange={setEmployer} placeholder="Company name" />
              <LabelInput label="Trade"    value={trade}    onChange={setTrade}    placeholder="e.g. Welder, Boilermaker" />
            </div>

            {/* Photo upload */}
            <label style={S.label}>Welder Photo</label>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {photoPreview
                ? <img src={photoPreview} alt="preview" style={{ width: 72, height: 88, objectFit: "cover", borderRadius: 6, border: `1px solid ${D.border}` }} />
                : <div style={{ width: 72, height: 88, background: D.surfaceAlt, border: `2px dashed ${D.border}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: D.textSoft, fontSize: 11 }}>Photo</div>
              }
              <div>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
                <button style={S.smallBtn} onClick={() => photoRef.current?.click()}>Upload photo</button>
                {photoFile && <div style={{ color: D.textSoft, fontSize: 11, marginTop: 4 }}>{photoFile.name}</div>}
              </div>
            </div>
          </div>

          {/* Qualifications */}
          <div>
            <div style={{ ...sHead, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Qualifications</span>
              <button style={S.smallBtn} onClick={() => setQuals(qs => [...qs, blankQual()])}>+ Add Qualification</button>
            </div>

            {quals.map((q, i) => (
              <div key={q.id} style={qualCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ color: D.text, fontWeight: 700, fontSize: 13 }}>
                    Qualification {i + 1}{q.process ? ` — ${q.process.split(" ")[0]}` : ""}
                  </div>
                  {quals.length > 1 && (
                    <button style={S.smallBtn} onClick={() => {
                      const removed = quals[i];
                      if (removed?.id) setRemovedQualIds(ids => [...ids, removed.id!]);
                      setQuals(qs => qs.filter((_, idx) => idx !== i));
                    }}>Remove</button>
                  )}
                </div>

                <div style={{ ...S.grid3, marginBottom: 12 }}>
                  <LabelInput   label="Standard"         value={q.standard ?? ""}  onChange={v => updateQual(i, { standard: v })}  placeholder="EN ISO 9606-1:2017" />
                  <LabelSelect  label="Welding Process *" value={q.process ?? ""}   onChange={v => updateQual(i, { process: v })}   options={PROCESSES} />
                  <div>
                    <label style={S.label}>Product Form</label>
                    <select value={q.productForm ?? "plate"} onChange={e => updateQual(i, { productForm: e.target.value as "plate"|"pipe" })} style={S.sel}>
                      <option value="plate">Plate (P)</option>
                      <option value="pipe">Pipe (T)</option>
                    </select>
                  </div>
                </div>

                <div style={{ ...S.grid2, marginBottom: 12 }}>
                  <LabelSelect label="Material Group *" value={q.materialGroup ?? ""} onChange={v => updateQual(i, { materialGroup: v })} options={MATERIAL_GROUPS} />
                  <LabelSelect label="Joint Type *"     value={q.jointType ?? ""}     onChange={v => updateQual(i, { jointType: v })}     options={JOINT_TYPES} />
                </div>

                <div style={{ ...S.grid3, marginBottom: 12 }}>
                  <LabelInput label="Filler Material Type"  value={q.fillerMaterialType ?? ""}        onChange={v => updateQual(i, { fillerMaterialType: v })}        placeholder="e.g. Solid wire" />
                  <LabelInput label="Filler Designation"    value={q.fillerMaterialDesignation ?? ""} onChange={v => updateQual(i, { fillerMaterialDesignation: v })} placeholder="e.g. ER70S-6" />
                  <div>
                    <label style={S.label}>Weld Type</label>
                    <select value={q.weldType ?? "multi"} onChange={e => updateQual(i, { weldType: e.target.value as "single"|"multi" })} style={S.sel}>
                      <option value="single">Single run (ss)</option>
                      <option value="multi">Multi run (ms)</option>
                    </select>
                  </div>
                </div>

                <div style={{ ...S.grid3, marginBottom: 12 }}>
                  <LabelInput label="Shielding Gas"  value={q.shieldingGas ?? ""}  onChange={v => updateQual(i, { shieldingGas: v })}  placeholder="e.g. Ar + 18% CO₂" />
                  <LabelInput label="Backing Gas"    value={q.backingGas ?? ""}    onChange={v => updateQual(i, { backingGas: v })}    placeholder="e.g. Ar or None" />
                  <LabelInput label="WPS Reference"  value={q.wpsUsed ?? ""}       onChange={v => updateQual(i, { wpsUsed: v })}       placeholder="WPS-001" />
                </div>

                {/* Positions */}
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Welding Positions *</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {POSITIONS.map(pos => {
                      const active = (q.positions ?? []).includes(pos);
                      return (
                        <button key={pos} onClick={() => togglePos(i, pos)} style={{ background: active ? D.accent : D.surfaceAlt, color: active ? "#fff" : D.textMid, border: `1px solid ${active ? D.accent : D.border}`, borderRadius: 5, padding: "5px 11px", cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 400, fontFamily: "'DM Mono',monospace" }}>
                          {pos}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ ...S.grid3, marginBottom: 12 }}>
                  <LabelInput label="Test Piece Description" value={q.testPiece ?? ""}       onChange={v => updateQual(i, { testPiece: v })}       placeholder="e.g. 200×150×12 plate" />
                  <LabelInput label="Thickness Range (mm)"   value={q.thicknessRange ?? ""}  onChange={v => updateQual(i, { thicknessRange: v })}  placeholder="e.g. 3–12" />
                  {q.productForm === "pipe"
                    ? <LabelInput label="Pipe OD (mm)" value={q.pipeDiameter ?? ""} onChange={v => updateQual(i, { pipeDiameter: v })} placeholder="e.g. 60.3" />
                    : <div />
                  }
                </div>

                <div style={{ ...S.grid2, marginBottom: 12 }}>
                  <LabelInput label="Preheat Temperature (°C)"      value={q.preheat ?? ""} onChange={v => updateQual(i, { preheat: v })} placeholder="e.g. min 75" />
                  <LabelInput label="Post-Weld Heat Treatment (PWHT)" value={q.pwht ?? ""}   onChange={v => updateQual(i, { pwht: v })}    placeholder="e.g. None" />
                </div>

                <div style={{ ...S.grid3, marginBottom: 12 }}>
                  <LabelInput  label="Certificate Number"  value={q.certNo ?? ""}     onChange={v => updateQual(i, { certNo: v })}     placeholder="e.g. WQ-2024-001" />
                  <DatePicker  label="Test Date *"          value={q.testDate ?? ""}   onChange={v => updateQual(i, { testDate: v })} />
                  <DatePicker  label="Expiry Date *"        value={q.expiryDate ?? ""} onChange={v => updateQual(i, { expiryDate: v })} />
                </div>

                <div style={{ ...S.grid3, marginBottom: 12 }}>
                  <LabelInput label="Testing Laboratory" value={q.testLab ?? ""}        onChange={v => updateQual(i, { testLab: v })}        placeholder="Lab name" />
                  <LabelInput label="Examination Body"   value={q.examinationBody ?? ""} onChange={v => updateQual(i, { examinationBody: v })} placeholder="e.g. IIW, DNV" />
                  <LabelInput label="Examiner Name"      value={q.examinerName ?? ""}    onChange={v => updateQual(i, { examinerName: v })} />
                </div>
                <div style={{ ...S.grid3, marginBottom: 12 }}>
                  <LabelInput label="Examiner Cert No"         value={q.examinerCert ?? ""}      onChange={v => updateQual(i, { examinerCert: v })} />
                  <LabelInput label="Manufacturer / Company"   value={q.manufacturerName ?? ""}  onChange={v => updateQual(i, { manufacturerName: v })} placeholder="Certifying company" />
                  <LabelInput label="Manufacturer Reference"   value={q.manufacturerRef ?? ""}   onChange={v => updateQual(i, { manufacturerRef: v })} />
                </div>

                {/* Test results */}
                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Test Results</label>
                  <div style={S.grid5}>
                    {([
                      ["Visual (VT)",  q.visualResult       ?? "PASS", (v: string) => updateQual(i, { visualResult: v })],
                      ["Bend Test",    q.bendResult         ?? "PASS", (v: string) => updateQual(i, { bendResult: v })],
                      ["Fracture",     q.fractureResult     ?? "N/A",  (v: string) => updateQual(i, { fractureResult: v })],
                      ["RT / UT",      q.radiographicResult ?? "N/A",  (v: string) => updateQual(i, { radiographicResult: v })],
                      ["Hardness",     q.hardnessResult     ?? "N/A",  (v: string) => updateQual(i, { hardnessResult: v })],
                    ] as [string, string, (v: string) => void][]).map(([lbl, val, fn]) => (
                      <div key={lbl}>
                        <label style={S.label}>{lbl}</label>
                        <select value={val} onChange={e => fn(e.target.value)} style={{ ...S.sel, color: val === "PASS" ? "#2ecc71" : val === "FAIL" ? "#e74c3c" : D.textMid, fontWeight: val !== "N/A" ? 700 : 400 }}>
                          {PASS_FAIL.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ ...S.grid2, marginBottom: 8 }}>
                  <div>
                    <label style={S.label}>Overall Result *</label>
                    <select value={q.result ?? "PASS"} onChange={e => updateQual(i, { result: e.target.value })} style={{ ...S.sel, fontWeight: 700, color: q.result === "PASS" ? "#2ecc71" : "#e74c3c" }}>
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 18 }}>
                    <input type="checkbox" id={`cont-${i}`} checked={q.continuityOk ?? true} onChange={e => updateQual(i, { continuityOk: e.target.checked })} />
                    <label htmlFor={`cont-${i}`} style={{ ...S.label, marginBottom: 0, cursor: "pointer" }}>Continuity of welding maintained</label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${D.border}`, padding: "12px 20px", display: "flex", gap: 10, justifyContent: "flex-end", background: D.surface, flexShrink: 0 }}>
          <button style={S.smallBtn} onClick={onClose}>Cancel</button>
          <button style={btn(saving ? D.textSoft : "#2a4a9a")} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save Changes" : "Save Welder"}
          </button>
        </div>
      </div>
    </div>
  );
};
