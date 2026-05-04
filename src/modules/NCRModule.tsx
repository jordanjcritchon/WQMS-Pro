import React, { useState, useEffect } from "react";
import { D, inp } from "../theme";
import { Card, Label, StatusDot, SimpleTable, Button } from "../components";
import { NCR_DATA } from "../data";
import { NCR_SM } from "../statusMeta";
import type { NCR } from "../types";

interface NCRModuleProps {
  preselect?: { weldId: string; project: string } | null;
}

const PRIORITY_COLOR: Record<string, string> = {
  Critical: D.fail,
  High:     "#f07030",
  Medium:   D.warn,
  Low:      D.textMid,
};

const emptyForm = () => ({
  weldId:      "",
  project:     "",
  defect:      "",
  priority:    "Medium",
  raisedBy:    "",
  date:        new Date().toISOString().split("T")[0],
  capa:        "",
  description: "",
});

export const NCRModule: React.FC<NCRModuleProps> = ({ preselect }) => {
  const [view,     setView]     = useState<"kanban" | "list">("kanban");
  const [ncrs,     setNcrs]     = useState<NCR[]>(NCR_DATA);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(emptyForm());
  const [success,  setSuccess]  = useState(false);

  useEffect(() => {
    if (preselect) {
      setShowForm(true);
      setForm(f => ({ ...f, weldId: preselect.weldId, project: preselect.project }));
    }
  }, [preselect]);

  const handleSubmit = () => {
    if (!form.weldId || !form.defect || !form.raisedBy) return;
    const newId = `NCR-${String(ncrs.length + 1).padStart(3, "0")}`;
    const newNCR: NCR = {
      id:       newId,
      weldId:   form.weldId,
      project:  form.project,
      defect:   form.defect,
      status:   "Open",
      priority: form.priority as NCR["priority"],
      raised:   form.date,
      assignee: form.raisedBy,
      capa:     form.capa,
    };
    setNcrs(prev => [newNCR, ...prev]);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setShowForm(false);
      setForm(emptyForm());
    }, 2000);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Main content */}
      <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {(["kanban", "list"] as const).map(id => (
              <button key={id} onClick={() => setView(id)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${view === id ? D.accent : D.border}`, background: view === id ? D.accentFaint : D.surfaceAlt, color: view === id ? D.accent : D.textMid, fontSize: 12, cursor: "pointer" }}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
            <Button color={D.fail} onClick={() => { setForm(emptyForm()); setShowForm(true); }}>+ Raise NCR</Button>
          </div>
        </div>

        {view === "kanban" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {(["Open", "In Progress", "Closed"] as const).map(col => (
              <div key={col}>
                <div style={{ color: col === "Open" ? D.fail : col === "In Progress" ? D.warn : D.pass, fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", marginBottom: 10, textTransform: "uppercase" }}>
                  {col} ({ncrs.filter(n => n.status === col).length})
                </div>
                {ncrs.filter(n => n.status === col).map(n => (
                  <Card key={n.id} s={{ padding: "12px 14px", marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ color: D.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{n.id}</span>
                      <span style={{ color: PRIORITY_COLOR[n.priority], fontWeight: 700, fontSize: 11 }}>{n.priority}</span>
                    </div>
                    <div style={{ color: D.text, fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{n.defect}</div>
                    <div style={{ color: D.textSoft, fontSize: 11 }}>Weld: {n.weldId} · {n.raised}</div>
                    {n.capa && (
                      <div style={{ marginTop: 7, padding: "6px 9px", background: D.surfaceAlt, borderRadius: 5, color: D.textMid, fontSize: 11, lineHeight: 1.5 }}>{n.capa}</div>
                    )}
                  </Card>
                ))}
              </div>
            ))}
          </div>
        )}

        {view === "list" && (
          <SimpleTable
            data={ncrs}
            keyField="id"
            columns={[
              { key: "id",       label: "ID",       mono: true, color: () => D.accent },
              { key: "weldId",   label: "Weld",     mono: true, color: () => "#6ea4f0" },
              { key: "project",  label: "Project",  render: r => String(r.project).split("–")[0].trim() },
              { key: "defect",   label: "Defect",   color: () => D.text },
              { key: "priority", label: "Priority", color: r => PRIORITY_COLOR[String(r.priority)] },
              { key: "status",   label: "Status",   render: r => <StatusDot status={String(r.status)} meta={NCR_SM} /> },
              { key: "assignee", label: "Assignee" },
              { key: "raised",   label: "Raised" },
            ]}
          />
        )}
      </div>

      {/* Form panel */}
      {showForm && (
        <div style={{ width: 380, background: D.surface, borderLeft: `1px solid ${D.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Panel header */}
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${D.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 14 }}>Raise NCR</div>
              {preselect && (
                <div style={{ color: D.textSoft, fontSize: 11, marginTop: 2 }}>Pre-filled from Weld Map · {preselect.weldId}</div>
              )}
            </div>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: `1px solid ${D.border}`, color: D.textMid, borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
            {success && (
              <div style={{ background: D.passBg, border: `1px solid ${D.passBorder}`, borderRadius: 7, padding: "10px 14px", color: D.pass, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                NCR raised successfully and added to the register.
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <Label c="Weld ID" req />
              <input value={form.weldId} onChange={set("weldId")} placeholder="e.g. W-012" style={inp} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Label c="Project" />
              <input value={form.project} onChange={set("project")} placeholder="e.g. Pressure Vessel – Tank Farm B" style={inp} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Label c="Defect Description" req />
              <input value={form.defect} onChange={set("defect")} placeholder="e.g. Undercut 0.8mm at toe" style={inp} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Label c="Priority" />
              <select value={form.priority} onChange={set("priority")} style={inp}>
                {["Critical","High","Medium","Low"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Label c="Raised By" req />
              <input value={form.raisedBy} onChange={set("raisedBy")} placeholder="Inspector name" style={inp} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Label c="Date Raised" />
              <input type="date" value={form.date} onChange={set("date")} style={{ ...inp, colorScheme: "dark" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Label c="Additional Detail" />
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the non-conformance in detail…"
                rows={3}
                style={{ ...inp, resize: "vertical", lineHeight: 1.5 }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <Label c="Proposed CAPA" />
              <textarea
                value={form.capa}
                onChange={e => setForm(f => ({ ...f, capa: e.target.value }))}
                placeholder="Corrective and preventive action…"
                rows={3}
                style={{ ...inp, resize: "vertical", lineHeight: 1.5 }}
              />
            </div>

            {/* Required field warning */}
            {(!form.weldId || !form.defect || !form.raisedBy) && (
              <div style={{ color: D.textSoft, fontSize: 11, marginBottom: 12 }}>* Weld ID, Defect Description, and Raised By are required.</div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <Button
                color={D.fail}
                onClick={handleSubmit}
                disabled={!form.weldId || !form.defect || !form.raisedBy}
                style={{ flex: 1 }}
              >
                Submit NCR
              </Button>
              <Button outline onClick={() => { setShowForm(false); setForm(emptyForm()); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
