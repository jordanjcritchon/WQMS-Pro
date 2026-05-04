import React, { useState, useEffect, useRef, useCallback } from "react";
import { D, inp } from "../theme";
import { Card, Label, TabBar, Button } from "../components";
import { PROJECTS, WELD_PASSPORTS } from "../data";
import { useStore } from "../store";
import type { VTReport, VTPhoto } from "../types";

interface VTModuleProps {
  preselect?:  { weldId: string; project: string } | null;
  onOpenNCR?:  (weldId: string, project: string) => void;
}

const emptyForm = () => ({
  weldId:    "",
  jobNo:     "",
  project:   "",
  standard:  "ISO 5817 – Level B",
  date:      new Date().toISOString().split("T")[0],
  inspector: "",
  result:    "PASS" as "PASS" | "FAIL" | "CONDITIONAL",
  defects:   "",
  notes:     "",
});

// ── Camera Modal ──────────────────────────────────────────────────────────────
interface CameraModalProps {
  onCapture: (dataUrl: string) => void;
  onClose:   () => void;
}

function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready,   setReady]   = useState(false);
  const [err,     setErr]     = useState<string | null>(null);
  const [facing,  setFacing]  = useState<"environment" | "user">("environment");

  const startCamera = useCallback(async (facingMode: "environment" | "user") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch {
      setErr("Camera access denied. Use the Upload button instead.");
    }
  }, []);

  useEffect(() => {
    startCamera(facing);
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [startCamera, facing]);

  const capture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCapture(dataUrl);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, overflow: "hidden", width: "min(92vw, 640px)", boxShadow: "0 24px 64px rgba(0,0,0,0.8)" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${D.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: D.text, fontWeight: 700, fontSize: 14 }}>Live Camera</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setFacing(f => f === "environment" ? "user" : "environment")}
              style={{ background: D.surfaceAlt, border: `1px solid ${D.border}`, color: D.textMid, borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
            >
              Flip
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", color: D.textSoft, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>
          </div>
        </div>

        <div style={{ position: "relative", background: "#000", minHeight: 280 }}>
          {err ? (
            <div style={{ color: D.fail, padding: 32, textAlign: "center", fontSize: 13 }}>{err}</div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", display: "block", maxHeight: "60vh", objectFit: "contain" }}
            />
          )}
          {!ready && !err && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: D.textMid, fontSize: 13 }}>
              Starting camera…
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div style={{ padding: 16, display: "flex", gap: 10 }}>
          <button
            onClick={capture}
            disabled={!ready || !!err}
            style={{ flex: 1, background: ready && !err ? D.accent : D.surfaceAlt, border: "none", color: "#fff", borderRadius: 8, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: ready && !err ? "pointer" : "not-allowed", fontFamily: "'Inter',sans-serif", opacity: ready && !err ? 1 : 0.5 }}
          >
            Capture Photo
          </button>
          <button
            onClick={onClose}
            style={{ background: "none", border: `1px solid ${D.border}`, color: D.textMid, borderRadius: 8, padding: "12px 20px", fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Photo Strip ───────────────────────────────────────────────────────────────
interface PhotoStripProps {
  photos:   VTPhoto[];
  onChange: (photos: VTPhoto[]) => void;
  onCamera: () => void;
}

function PhotoStrip({ photos, onChange, onCamera }: PhotoStripProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const url = e.target?.result as string;
        onChange([...photos, { url, description: "" }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const updateDesc = (idx: number, description: string) =>
    onChange(photos.map((p, i) => i === idx ? { ...p, description } : p));

  const remove = (idx: number) =>
    onChange(photos.filter((_, i) => i !== idx));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: photos.length ? 12 : 0 }}>
        <button
          type="button"
          onClick={onCamera}
          style={{ display: "flex", alignItems: "center", gap: 6, background: D.accentFaint, border: `1px solid ${D.accentBorder}`, color: D.accent, borderRadius: 7, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
        >
          <span style={{ fontSize: 16 }}>📷</span> Live Camera
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{ display: "flex", alignItems: "center", gap: 6, background: D.surfaceAlt, border: `1px solid ${D.border}`, color: D.textMid, borderRadius: 7, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
        >
          <span style={{ fontSize: 16 }}>🖼</span> Upload / Gallery
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {photos.map((p, i) => (
            <div key={i} style={{ background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ position: "relative" }}>
                <img
                  src={p.url}
                  alt={`Photo ${i + 1}`}
                  style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 12, lineHeight: "22px", textAlign: "center" }}
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: "6px 8px" }}>
                <input
                  value={p.description}
                  onChange={e => updateDesc(i, e.target.value)}
                  placeholder="Add description…"
                  style={{ ...inp, fontSize: 11, padding: "4px 7px" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export const VTModule: React.FC<VTModuleProps> = ({ preselect, onOpenNCR }) => {
  const { vtReports: reports, setVtReports: setReports } = useStore();
  const [tab,        setTab]       = useState("history");
  const [form,       setForm]      = useState(emptyForm());
  const [photos,     setPhotos]    = useState<VTPhoto[]>([]);
  const [cameraOpen, setCameraOpen]= useState(false);
  const [success,    setSuccess]   = useState(false);
  const [selected,   setSelected]  = useState<VTReport | null>(null);

  const failCount = reports.filter(r => r.result === "FAIL").length;

  useEffect(() => {
    if (preselect) {
      setTab("new");
      const passport = WELD_PASSPORTS.find(w => w.id === preselect.weldId);
      const projectName = passport
        ? PROJECTS.find(p => p.id === passport.projectId)?.name ?? preselect.project
        : preselect.project;
      setForm(f => ({
        ...f,
        weldId:  preselect.weldId,
        project: projectName,
        jobNo:   passport?.projectId ?? "",
      }));
    }
  }, [preselect]);

  const set = (k: keyof ReturnType<typeof emptyForm>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.weldId || !form.inspector) return;
    const newId = `VTR-${String(reports.length + 1).padStart(3, "0")}`;
    const newReport: VTReport = {
      id:        newId,
      jobNo:     form.jobNo,
      weldId:    form.weldId,
      project:   form.project,
      result:    form.result,
      date:      form.date,
      inspector: form.inspector,
      defects:   form.defects ? form.defects.split("\n").filter(Boolean) : [],
      standard:  form.standard,
      notes:     form.notes || undefined,
      photos:    photos.length ? photos : undefined,
    };
    setReports(prev => [newReport, ...prev]);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setForm(emptyForm());
      setPhotos([]);
      setTab("history");
    }, 2000);
  };

  const resultStyle = (result: string) => {
    if (result === "PASS")        return { c: D.pass, bg: D.passBg, b: D.passBorder };
    if (result === "FAIL")        return { c: D.fail, bg: D.failBg, b: D.failBorder };
    return { c: D.warn, bg: D.warnBg, b: D.warnBorder };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {cameraOpen && (
        <CameraModal
          onCapture={url => { setPhotos(p => [...p, { url, description: "" }]); setCameraOpen(false); }}
          onClose={() => setCameraOpen(false)}
        />
      )}

      <TabBar
        tabs={[["new","New Report"],["history","History"],["dashboard","Dashboard"],["ncr","NCR Log",failCount]]}
        active={tab}
        setActive={id => { setTab(id); setSelected(null); }}
      />

      {/* ── New Report ── */}
      {tab === "new" && (
        <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
          <Card s={{ padding: 24, maxWidth: 740 }}>
            <div style={{ color: D.text, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>New VT Inspection Report</div>
            {preselect && (
              <div style={{ color: D.textSoft, fontSize: 12, marginBottom: 16 }}>Pre-filled from Weld Map · {preselect.weldId}</div>
            )}

            {success && (
              <div style={{ background: D.passBg, border: `1px solid ${D.passBorder}`, borderRadius: 7, padding: "10px 14px", color: D.pass, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                Report {form.result === "FAIL" ? "recorded. Consider raising an NCR." : "submitted successfully."}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <Label c="Weld ID" req />
                <input value={form.weldId} onChange={set("weldId")} placeholder="e.g. W-012" style={inp} />
              </div>
              <div>
                <Label c="Job No." />
                <input value={form.jobNo} onChange={set("jobNo")} placeholder="e.g. JOB-2024-004" style={inp} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Label c="Project" />
                <input value={form.project} onChange={set("project")} placeholder="Project name" style={inp} />
              </div>
              <div>
                <Label c="Standard" />
                <select value={form.standard} onChange={set("standard")} style={inp}>
                  <option>ISO 5817 – Level B</option>
                  <option>ISO 5817 – Level C</option>
                  <option>AS 1554.1 SP</option>
                  <option>AS 1554.1 GP</option>
                  <option>ASME B31.3</option>
                  <option>ASME VIII Div.1</option>
                  <option>AWS D1.1</option>
                </select>
              </div>
              <div>
                <Label c="Date" />
                <input type="date" value={form.date} onChange={set("date")} style={{ ...inp, colorScheme: "dark" }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Label c="Inspector" req />
                <input value={form.inspector} onChange={set("inspector")} placeholder="Inspector name" style={inp} />
              </div>
            </div>

            {/* Result selector */}
            <div style={{ marginBottom: 14 }}>
              <Label c="Result" />
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {(["PASS","FAIL","CONDITIONAL"] as const).map(r => {
                  const rc = resultStyle(r);
                  const sel = form.result === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setForm(f => ({ ...f, result: r }))}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 7, border: `2px solid ${sel ? rc.c : D.border}`, background: sel ? rc.bg : D.surfaceAlt, color: sel ? rc.c : D.textMid, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "all 0.1s" }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {(form.result === "FAIL" || form.result === "CONDITIONAL") && (
              <div style={{ marginBottom: 14 }}>
                <Label c="Defects Found" />
                <textarea
                  value={form.defects}
                  onChange={e => setForm(f => ({ ...f, defects: e.target.value }))}
                  placeholder="One defect per line&#10;e.g. Undercut 0.8mm at weld toe&#10;Porosity cluster 3mm dia"
                  rows={4}
                  style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
                />
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <Label c="Notes" />
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Additional observations…"
                rows={3}
                style={{ ...inp, resize: "vertical", lineHeight: 1.5 }}
              />
            </div>

            {/* Photos section */}
            <div style={{ marginBottom: 20, paddingTop: 16, borderTop: `1px solid ${D.border}` }}>
              <Label c={`Site Photos${photos.length ? ` (${photos.length})` : ""}`} />
              <div style={{ marginTop: 8 }}>
                <PhotoStrip
                  photos={photos}
                  onChange={setPhotos}
                  onCamera={() => setCameraOpen(true)}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Button
                color={form.result === "FAIL" ? D.fail : D.pass}
                onClick={handleSubmit}
                disabled={!form.weldId || !form.inspector}
                style={{ flex: 1 }}
              >
                Submit Report
              </Button>
              {form.result === "FAIL" && onOpenNCR && form.weldId && (
                <Button color={D.fail} outline onClick={() => onOpenNCR(form.weldId, form.project)}>
                  Raise NCR
                </Button>
              )}
              <Button outline onClick={() => { setForm(emptyForm()); setPhotos([]); }}>Reset</Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── History ── */}
      {tab === "history" && !selected && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Report ID","Job No.","Weld ID","Project","Standard","Date","Inspector","Photos","Result"].map(h => (
                    <th key={h} style={{ color: D.textSoft, fontWeight: 600, fontSize: 11, textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${D.border}`, background: D.surfaceAlt, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => {
                  const rc = resultStyle(r.result);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r)}
                      style={{ borderBottom: `1px solid ${D.borderSoft}`, background: i % 2 === 0 ? D.surface : "transparent", cursor: "pointer" }}
                    >
                      <td style={{ padding: "10px 12px", color: "#6ea4f0", fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 12, borderBottom: `1px solid ${D.borderSoft}` }}>{r.id}</td>
                      <td style={{ padding: "10px 12px", color: D.textMid, fontSize: 12, borderBottom: `1px solid ${D.borderSoft}` }}>{r.jobNo}</td>
                      <td style={{ padding: "10px 12px", color: D.textMid, fontFamily: "'DM Mono',monospace", fontSize: 12, borderBottom: `1px solid ${D.borderSoft}` }}>{r.weldId}</td>
                      <td style={{ padding: "10px 12px", color: D.textMid, fontSize: 12, borderBottom: `1px solid ${D.borderSoft}`, maxWidth: 180 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.project}</div></td>
                      <td style={{ padding: "10px 12px", color: D.textMid, fontSize: 12, borderBottom: `1px solid ${D.borderSoft}` }}>{r.standard.split("–")[0].trim()}</td>
                      <td style={{ padding: "10px 12px", color: D.textMid, fontSize: 12, borderBottom: `1px solid ${D.borderSoft}` }}>{r.date}</td>
                      <td style={{ padding: "10px 12px", color: D.textMid, fontSize: 12, borderBottom: `1px solid ${D.borderSoft}` }}>{r.inspector}</td>
                      <td style={{ padding: "10px 12px", borderBottom: `1px solid ${D.borderSoft}` }}>
                        {r.photos?.length
                          ? <span style={{ color: D.accent, fontSize: 11, fontWeight: 600 }}>📷 {r.photos.length}</span>
                          : <span style={{ color: D.textSoft, fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: `1px solid ${D.borderSoft}` }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: rc.bg, color: rc.c, border: `1px solid ${rc.b}`, borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                          {r.result === "PASS" ? "✓" : r.result === "FAIL" ? "✕" : "△"} {r.result}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Report Detail ── */}
      {tab === "history" && selected && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <div style={{ marginBottom: 14 }}>
            <button
              onClick={() => setSelected(null)}
              style={{ background: "none", border: "none", color: D.accent, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif", padding: 0 }}
            >
              ← Back to History
            </button>
          </div>
          <Card s={{ padding: 24, maxWidth: 740 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ color: "#6ea4f0", fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{selected.id}</div>
                <div style={{ color: D.text, fontWeight: 700, fontSize: 16 }}>{selected.project}</div>
                <div style={{ color: D.textMid, fontSize: 12, marginTop: 2 }}>Weld: {selected.weldId} · {selected.date} · {selected.inspector}</div>
              </div>
              {(() => { const rc = resultStyle(selected.result); return (
                <span style={{ background: rc.bg, color: rc.c, border: `1px solid ${rc.b}`, borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>
                  {selected.result === "PASS" ? "✓" : selected.result === "FAIL" ? "✕" : "△"} {selected.result}
                </span>
              ); })()}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[["Standard", selected.standard], ["Job No.", selected.jobNo || "—"]].map(([l, v]) => (
                <div key={l} style={{ background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 7, padding: "8px 12px" }}>
                  <div style={{ color: D.textSoft, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{l}</div>
                  <div style={{ color: D.text, fontSize: 13 }}>{v}</div>
                </div>
              ))}
            </div>

            {selected.defects.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: D.textSoft, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Defects Found</div>
                {selected.defects.map((d, i) => (
                  <div key={i} style={{ background: D.failBg, border: `1px solid ${D.failBorder}`, borderRadius: 5, padding: "5px 10px", color: D.fail, fontSize: 12, marginBottom: 4 }}>• {d}</div>
                ))}
              </div>
            )}

            {selected.notes && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: D.textSoft, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Notes</div>
                <div style={{ color: D.textMid, fontSize: 13, lineHeight: 1.6, background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 7, padding: "10px 12px" }}>{selected.notes}</div>
              </div>
            )}

            {selected.photos && selected.photos.length > 0 && (
              <div>
                <div style={{ color: D.textSoft, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                  Site Photos ({selected.photos.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {selected.photos.map((p, i) => (
                    <div key={i} style={{ background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 8, overflow: "hidden" }}>
                      <img
                        src={p.url}
                        alt={p.description || `Photo ${i + 1}`}
                        style={{ width: "100%", height: 140, objectFit: "cover", display: "block", cursor: "pointer" }}
                        onClick={() => window.open(p.url, "_blank")}
                      />
                      {p.description && (
                        <div style={{ padding: "6px 10px", color: D.textMid, fontSize: 12 }}>{p.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.result === "FAIL" && onOpenNCR && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${D.border}` }}>
                <Button color={D.fail} outline onClick={() => onOpenNCR(selected.weldId, selected.project)}>
                  Raise NCR for this Report
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Dashboard ── */}
      {tab === "dashboard" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
            {([
              ["Total",     reports.length,                                                                                D.textMid],
              ["Passed",    reports.filter(r => r.result === "PASS").length,                                              D.pass],
              ["Failed",    failCount,                                                                                     D.fail],
              ["Pass Rate", `${Math.round((reports.filter(r => r.result === "PASS").length / (reports.length || 1)) * 100)}%`, D.pass],
            ] as const).map(([l, v, c]) => (
              <Card key={l} s={{ padding: 16 }}>
                <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 6 }}>{l.toUpperCase()}</div>
                <div style={{ color: c, fontSize: 26, fontWeight: 700 }}>{v}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── NCR Log ── */}
      {tab === "ncr" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          {reports.filter(r => r.result === "FAIL").map((r, i) => (
            <div key={r.id} style={{ background: D.surface, border: `1px solid ${D.failBorder}`, borderLeft: `4px solid ${D.fail}`, borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <span style={{ color: D.fail, fontWeight: 700, fontFamily: "'DM Mono',monospace", fontSize: 12 }}>NCR-{String(i + 1).padStart(3, "0")}</span>
                    <span style={{ display: "inline-block", background: D.failBg, color: D.fail, border: `1px solid ${D.failBorder}`, borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>OPEN</span>
                  </div>
                  <div style={{ color: D.text, fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{r.project}</div>
                  <div style={{ color: D.textMid, fontSize: 12 }}>Weld: <strong>{r.weldId}</strong> · {r.date}</div>
                  {r.defects.map((d, j) => <div key={j} style={{ color: D.fail, fontSize: 12 }}>• {d}</div>)}
                </div>
                {onOpenNCR && (
                  <Button style={{ alignSelf: "flex-start" }} color={D.fail} outline onClick={() => onOpenNCR(r.weldId, r.project)}>
                    Assign CAPA
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
