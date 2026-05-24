import React, { useState, useEffect } from "react";
import { D, inp } from "../theme";
import { Tag, Label, StatusDot, SectionHeader, FieldRow, TabBar, Button } from "../components";
import { WPS_DATA, PQR_DATA } from "../data";
import { WPS_SM } from "../statusMeta";
import type { WPS } from "../types";

const PROCESSES  = ["111 – SMAW","121 – SAW","131 – MIG","135 – MAG","141 – TIG"];
const POSITIONS  = ["PA","PB","PC","PD","PF","PG","H-L045"];
const STANDARDS  = ["ISO 15614-1","ISO 15614-2","ASME IX","AS 3992","AS 4041","AWS D1.1","EN 15614-1"];

const emptyForm = (): Omit<WPS, "id"> => ({
  rev:            "A",
  title:          "",
  standard:       STANDARDS[0],
  processes:      [],
  materialGroups: [],
  pqrRef:         "",
  positions:      [],
  thicknessRange: "",
  heatInput:      "",
  preheat:        "",
  interpass:      "",
  consumable:     "",
  shieldingGas:   "",
  approvedBy:     "",
  approvalDate:   new Date().toISOString().split("T")[0],
  status:         "Active",
});

export const WPSModule: React.FC = () => {
  const [sel,      setSel]     = useState<WPS | null>(null);
  const [tab,      setTab]     = useState("wps");
  const [wpsList,  setWpsList] = useState<WPS[]>(() => {
    try {
      const stored: WPS[] = JSON.parse(localStorage.getItem("wqms_wps_main_register") || "[]");
      const ids = new Set(stored.map(w => w.id));
      return [...stored, ...WPS_DATA.filter(w => !ids.has(w.id))];
    } catch { return WPS_DATA; }
  });
  const [creating, setCreating] = useState(false);
  const [form,     setForm]    = useState(emptyForm());
  const [success,  setSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored: WPS[] = JSON.parse(localStorage.getItem("wqms_wps_main_register") || "[]");
      const ids = new Set(stored.map(w => w.id));
      setWpsList([...stored, ...WPS_DATA.filter(w => !ids.has(w.id))]);
    } catch {}
  }, []);

  const set = (k: keyof Omit<WPS, "id" | "processes" | "materialGroups" | "positions">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleArr = (key: "processes" | "positions", val: string) => {
    setForm(f => {
      const arr = f[key] as string[];
      return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  };

  const handleSubmit = () => {
    if (!form.title || !form.pqrRef || !form.approvedBy) return;
    const newId = `WPS-${String(wpsList.length + 1).padStart(3, "0")}`;
    const newWPS: WPS = {
      id: newId,
      ...form,
      materialGroups: form.materialGroups.length ? form.materialGroups : ["—"],
    };
    setWpsList(prev => {
      const updated = [...prev, newWPS];
      try {
        const stored: WPS[] = JSON.parse(localStorage.getItem("wqms_wps_main_register") || "[]");
        stored.push(newWPS);
        localStorage.setItem("wqms_wps_main_register", JSON.stringify(stored));
      } catch {}
      return updated;
    });
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setCreating(false);
      setForm(emptyForm());
      setSel(newWPS);
    }, 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TabBar tabs={[["wps","WPS Register"],["pqr","PQR Records"]]} active={tab} setActive={id => { setTab(id); setCreating(false); }} />

      {tab === "wps" && !creating && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* List */}
          <div style={{ flex: 1, padding: 18, overflowY: "auto" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <input placeholder="Search WPS…" style={{ ...inp, width: 240 }} />
              <div style={{ marginLeft: "auto" }}>
                <Button onClick={() => { setCreating(true); setSel(null); }}>+ Create WPS</Button>
              </div>
            </div>
            {wpsList.map(w => (
              <div key={w.id} onClick={() => setSel(sel?.id === w.id ? null : w)}
                style={{ background: sel?.id === w.id ? D.surfaceHov : D.surface, border: `1px solid ${sel?.id === w.id ? D.accent : D.border}`, borderLeft: `3px solid ${sel?.id === w.id ? D.accent : "transparent"}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8, cursor: "pointer", boxShadow: D.shadow }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ color: D.accent, fontWeight: 700, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>{w.id}</span>
                      <span style={{ color: D.textSoft, fontSize: 10, background: D.surfaceAlt, borderRadius: 3, padding: "1px 5px", border: `1px solid ${D.border}` }}>Rev {w.rev}</span>
                      <StatusDot status={w.status} meta={WPS_SM} />
                    </div>
                    <div style={{ color: D.text, fontWeight: 600, fontSize: 13, marginBottom: 5 }}>{w.title}</div>
                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                      {w.processes.map(p => <Tag key={p} label={p} kind="blue" />)}
                      {w.materialGroups.slice(0, 3).map(g => <Tag key={g} label={g} kind="green" />)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: D.textSoft, fontSize: 11 }}>{w.standard}</div>
                    <div style={{ color: D.textSoft, fontSize: 11, marginTop: 2 }}>t: {w.thicknessRange}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {sel && (
            <div style={{ width: 340, borderLeft: `1px solid ${D.border}`, background: D.surface, padding: 18, overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ color: D.accent, fontWeight: 800, fontSize: 16, fontFamily: "'DM Mono',monospace" }}>{sel.id}</div>
                  <div style={{ color: D.text, fontWeight: 700, fontSize: 13, marginTop: 2 }}>{sel.title}</div>
                </div>
                <button onClick={() => setSel(null)} style={{ background: "none", border: `1px solid ${D.border}`, color: D.textMid, borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>✕</button>
              </div>
              <SectionHeader mt={0}>Range</SectionHeader>
              <FieldRow label="Thickness"  value={sel.thicknessRange} />
              <FieldRow label="Positions"  value={sel.positions.join(", ")} />
              <SectionHeader>Parameters</SectionHeader>
              <FieldRow label="Heat Input" value={sel.heatInput} />
              <FieldRow label="Preheat"    value={sel.preheat} />
              <FieldRow label="Interpass"  value={sel.interpass} />
              <FieldRow label="Consumable" value={sel.consumable} />
              <SectionHeader>Approval</SectionHeader>
              <FieldRow label="Standard"    value={sel.standard} />
              <FieldRow label="Approved By" value={sel.approvedBy} />
              <FieldRow label="Date"        value={sel.approvalDate} />
            </div>
          )}
        </div>
      )}

      {/* ── Create WPS form ── */}
      {tab === "wps" && creating && (
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 16 }}>Create New WPS</div>
              <div style={{ color: D.textSoft, fontSize: 12, marginTop: 2 }}>New record will be added to the WPS register.</div>
            </div>
            <Button outline onClick={() => setCreating(false)}>← Back to Register</Button>
          </div>

          {success && (
            <div style={{ background: D.passBg, border: `1px solid ${D.passBorder}`, borderRadius: 7, padding: "10px 14px", color: D.pass, fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
              WPS created and added to the register.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ color: D.textMid, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Identity</div>
                <div style={{ marginBottom: 10 }}>
                  <Label c="WPS Title" req />
                  <input value={form.title} onChange={set("title")} placeholder="e.g. Carbon Steel Butt – SMAW" style={inp} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><Label c="Revision" /><input value={form.rev} onChange={set("rev")} placeholder="A" style={inp} /></div>
                  <div>
                    <Label c="Status" />
                    <select value={form.status} onChange={set("status")} style={inp}>
                      <option>Active</option><option>Pending Review</option><option>Superseded</option><option>Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ color: D.textMid, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Scope</div>
                <div style={{ marginBottom: 10 }}>
                  <Label c="Standard" />
                  <select value={form.standard} onChange={set("standard")} style={inp}>
                    {STANDARDS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <Label c="Thickness Range" />
                  <input value={form.thicknessRange} onChange={set("thicknessRange")} placeholder="e.g. 3–40 mm" style={inp} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <Label c="Material Groups" />
                  <input
                    value={form.materialGroups.join(", ")}
                    onChange={e => setForm(f => ({ ...f, materialGroups: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                    placeholder="e.g. 1.1, 1.2 (comma separated)"
                    style={inp}
                  />
                </div>
                <div style={{ marginBottom: 2 }}>
                  <Label c="PQR Reference" req />
                  <input value={form.pqrRef} onChange={set("pqrRef")} placeholder="e.g. PQR-007" style={inp} />
                </div>
              </div>

              <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ color: D.textMid, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Approval</div>
                <div style={{ marginBottom: 10 }}>
                  <Label c="Approved By" req />
                  <input value={form.approvedBy} onChange={set("approvedBy")} placeholder="Name and title" style={inp} />
                </div>
                <div>
                  <Label c="Approval Date" />
                  <input type="date" value={form.approvalDate} onChange={set("approvalDate")} style={{ ...inp, colorScheme: "dark" }} />
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ color: D.textMid, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Welding Processes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {PROCESSES.map(p => {
                    const code = p.split(" – ")[0];
                    const sel = form.processes.includes(code);
                    return (
                      <label key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: sel ? D.accentFaint : D.surfaceAlt, border: `1px solid ${sel ? D.accentBorder : D.border}`, borderRadius: 6, cursor: "pointer" }}>
                        <input type="checkbox" checked={sel} onChange={() => toggleArr("processes", code)} style={{ accentColor: D.accent }} />
                        <span style={{ color: sel ? D.accent : D.textMid, fontSize: 13 }}>{p}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ color: D.textMid, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Positions Qualified</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {POSITIONS.map(p => {
                    const sel = form.positions.includes(p);
                    return (
                      <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: sel ? D.accentFaint : D.surfaceAlt, border: `1px solid ${sel ? D.accentBorder : D.border}`, borderRadius: 6, cursor: "pointer" }}>
                        <input type="checkbox" checked={sel} onChange={() => toggleArr("positions", p)} style={{ accentColor: D.accent }} />
                        <span style={{ color: sel ? D.accent : D.textMid, fontSize: 13 }}>{p}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ color: D.textMid, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Parameters</div>
                {([["heatInput","Heat Input","e.g. 0.8–2.5 kJ/mm"],["preheat","Preheat","e.g. Min 50°C"],["interpass","Interpass Temp","e.g. Max 250°C"],["consumable","Consumable","e.g. E7018"],["shieldingGas","Shielding Gas","e.g. Ar 99.99%"]] as const).map(([k, label, ph]) => (
                  <div key={k} style={{ marginBottom: 10 }}>
                    <Label c={label} />
                    <input value={form[k]} onChange={set(k)} placeholder={ph} style={inp} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
            <Button
              color={D.accent}
              onClick={handleSubmit}
              disabled={!form.title || !form.pqrRef || !form.approvedBy || form.processes.length === 0}
              style={{ minWidth: 160 }}
            >
              Create WPS
            </Button>
            <Button outline onClick={() => { setCreating(false); setForm(emptyForm()); }}>Cancel</Button>
            {(!form.title || !form.pqrRef || !form.approvedBy || form.processes.length === 0) && (
              <span style={{ color: D.textSoft, fontSize: 12, alignSelf: "center" }}>Title, PQR ref, approver, and at least one process are required.</span>
            )}
          </div>
        </div>
      )}

      {tab === "pqr" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, boxShadow: D.shadow }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>{["PQR No.", "WPS", "Test Date", "Lab", "Standard", "Tests", "Result"].map(h => (
                  <th key={h} style={{ color: D.textSoft, fontWeight: 600, fontSize: 11, textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${D.border}`, background: D.surfaceAlt, whiteSpace: "nowrap" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {((): typeof PQR_DATA => {
                  try {
                    const stored = JSON.parse(localStorage.getItem("wqms_pqr_main_register") || "[]");
                    const ids = new Set(stored.map((p: {id:string}) => p.id));
                    return [...stored, ...PQR_DATA.filter(p => !ids.has(p.id))];
                  } catch { return PQR_DATA; }
                })().map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? D.surface : "transparent" }}>
                    <td style={{ padding: "10px 12px", color: D.accent, fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 12, borderBottom: `1px solid ${D.borderSoft}` }}>{p.id}</td>
                    <td style={{ padding: "10px 12px", color: "#6ea4f0", fontSize: 12, borderBottom: `1px solid ${D.borderSoft}` }}>{p.wpsRef}</td>
                    <td style={{ padding: "10px 12px", color: D.textMid, fontSize: 12, borderBottom: `1px solid ${D.borderSoft}` }}>{p.testDate}</td>
                    <td style={{ padding: "10px 12px", color: D.textMid, fontSize: 12, borderBottom: `1px solid ${D.borderSoft}` }}>{p.testLab}</td>
                    <td style={{ padding: "10px 12px", color: D.textMid, fontSize: 12, borderBottom: `1px solid ${D.borderSoft}` }}>{p.standard}</td>
                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${D.borderSoft}` }}><div style={{ display: "flex", flexWrap: "wrap" }}>{p.tests.map(t => <Tag key={t} label={t} kind="green" />)}</div></td>
                    <td style={{ padding: "10px 12px", borderBottom: `1px solid ${D.borderSoft}` }}><Tag label={p.result} kind="green" /></td>
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
