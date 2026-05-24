import React, { useState, useRef, useCallback } from "react";
import { D, inp } from "../theme";
import { Card, TabBar, Button } from "../components";
import { usePersistedState } from "../hooks/usePersistedState";

// ── Types ─────────────────────────────────────────────────────────────────────
type CertType = "material" | "consumable" | "ndt" | "ht" | "other";

interface Cert {
  id:          string;
  type:        CertType;
  filename:    string;
  uploadedAt:  string;
  jobNo:       string;
  // material
  heatNumber?:     string;
  materialGrade?:  string;
  standard?:       string;
  supplier?:       string;
  dateReceived?:   string;
  linkedWeld?:     string;
  // consumable
  productName?:    string;
  batchNumber?:    string;
  // ndt
  weldId?:         string;
  process?:        string;
  wpsRef?:         string;
  result?:         string;
  inspector?:      string;
  reportDate?:     string;
  // ht
  temperature?:    string;
  duration?:       string;
  // note
  notes?:          string;
}

// ── Claude call ───────────────────────────────────────────────────────────────
const ANTHROPIC_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "/api/anthropic/v1/messages"
  : "https://api.anthropic.com/v1/messages";

async function classifyCert(b64: string, mime: string, apiKey: string): Promise<Partial<Cert>> {
  const block = mime.startsWith("image/")
    ? { type: "image",    source: { type: "base64", media_type: mime, data: b64 } }
    : { type: "document", source: { type: "base64", media_type: mime, data: b64 } };

  const r = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: `You are a welding QA document specialist. Classify and extract key fields from certificates and reports. Return ONLY strict JSON — no markdown, no preamble.

Certificate types:
- material: material test certificate / mill cert / material cert
- consumable: welding consumable cert / filler wire cert / electrode cert
- ndt: NDT report / radiography / UT / MT / PT report
- ht: heat treatment record / PWHT report
- other: anything else

Return this JSON:
{"type":"material|consumable|ndt|ht|other","jobNo":"","heatNumber":"","materialGrade":"","standard":"","supplier":"","dateReceived":"","linkedWeld":"","productName":"","batchNumber":"","weldId":"","process":"","wpsRef":"","result":"","inspector":"","reportDate":"","temperature":"","duration":"","notes":""}

Leave unknown fields as empty string. For result on NDT: PASS or FAIL only.`,
      messages: [{ role: "user", content: [block, { type: "text", text: "Classify this document and extract all available fields." }] }],
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    const err = new Error(`API ${r.status}: ${body}`) as Error & { status: number };
    err.status = r.status;
    throw err;
  }
  const text = (await r.json()).content[0].text.trim()
    .replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  return JSON.parse(text);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => `cert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const APIKEY_KEY = "wqms_api_key";

const ResultBadge: React.FC<{ v?: string }> = ({ v }) => {
  if (!v) return <span style={{ color: D.textSoft }}>—</span>;
  const pass = /pass/i.test(v);
  const fail = /fail/i.test(v);
  const c = pass ? D.pass : fail ? D.fail : D.warn;
  const bg = pass ? D.passBg : fail ? D.failBg : D.warnBg;
  const b = pass ? D.passBorder : fail ? D.failBorder : D.warnBorder;
  return <span style={{ background: bg, color: c, border: `1px solid ${b}`, borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{v}</span>;
};

const TypeBadge: React.FC<{ t: CertType }> = ({ t }) => {
  const cfg: Record<CertType, [string, string, string]> = {
    material:   [D.blue,   "rgba(59,130,246,0.1)",  "Material Cert"],
    consumable: [D.accent, D.accentFaint,            "Consumable Cert"],
    ndt:        [D.warn,   D.warnBg,                 "NDT Report"],
    ht:         [D.purple, "rgba(139,92,246,0.1)",   "Heat Treatment"],
    other:      [D.textMid,"rgba(120,120,140,0.1)",  "Other"],
  };
  const [c, bg, label] = cfg[t] ?? cfg.other;
  return <span style={{ background: bg, color: c, borderRadius: 99, padding: "2px 9px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
};

const TH: React.FC<{ c: string }> = ({ c }) => (
  <th style={{ color: D.textSoft, fontWeight: 600, fontSize: 11, textAlign: "left", padding: "9px 12px", borderBottom: `1px solid ${D.border}`, background: D.surfaceAlt, whiteSpace: "nowrap" }}>{c}</th>
);

// ── Upload card ───────────────────────────────────────────────────────────────
interface UploadCardProps {
  apiKey: string;
  onSaved: (cert: Cert) => void;
}

function UploadCard({ apiKey, onSaved }: UploadCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading,   setLoading]   = useState(false);
  const [preview,   setPreview]   = useState<Cert | null>(null);
  const [filename,  setFilename]  = useState("");
  const [err,       setErr]       = useState("");
  const [authErr,   setAuthErr]   = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!apiKey) { setErr("No API key — go back to the main app and enter your API key first."); return; }
    setErr(""); setAuthErr(false); setLoading(true); setPreview(null);
    try {
      const b64: string = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = e => res((e.target!.result as string).split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const extracted = await classifyCert(b64, file.type, apiKey);
      setFilename(file.name);
      setPreview({
        id:         uid(),
        type:       (extracted.type as CertType) ?? "other",
        filename:   file.name,
        uploadedAt: new Date().toISOString(),
        jobNo:      extracted.jobNo      ?? "",
        heatNumber:    extracted.heatNumber    ?? "",
        materialGrade: extracted.materialGrade ?? "",
        standard:      extracted.standard      ?? "",
        supplier:      extracted.supplier      ?? "",
        dateReceived:  extracted.dateReceived  ?? "",
        linkedWeld:    extracted.linkedWeld    ?? "",
        productName:   extracted.productName   ?? "",
        batchNumber:   extracted.batchNumber   ?? "",
        weldId:        extracted.weldId        ?? "",
        process:       extracted.process       ?? "",
        wpsRef:        extracted.wpsRef        ?? "",
        result:        extracted.result        ?? "",
        inspector:     extracted.inspector     ?? "",
        reportDate:    extracted.reportDate    ?? "",
        temperature:   extracted.temperature   ?? "",
        duration:      extracted.duration      ?? "",
        notes:         extracted.notes         ?? "",
      });
    } catch (e: any) {
      if (e.status === 401) {
        setAuthErr(true);
        setErr("Invalid API key — your key was rejected by Anthropic.");
      } else {
        setErr("Extraction failed: " + e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const save = () => {
    if (!preview) return;
    onSaved(preview);
    setPreview(null);
    setFilename("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const field = (label: string, key: keyof Cert) => (
    <div key={key}>
      <div style={{ color: D.textSoft, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{label}</div>
      <input
        value={(preview?.[key] as string) ?? ""}
        onChange={e => setPreview(p => p ? { ...p, [key]: e.target.value } : p)}
        style={{ ...inp, fontSize: 13, padding: "7px 10px" }}
      />
    </div>
  );

  return (
    <Card s={{ padding: 24, marginBottom: 16 }}>
      <div style={{ color: D.text, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Upload Certificate or Report</div>
      <div style={{ color: D.textSoft, fontSize: 12, marginBottom: 16 }}>
        AI reads the document and extracts all key fields automatically. Review and save to the register.
      </div>

      {err && (
        <div style={{ background: D.failBg, border: `1px solid ${D.failBorder}`, borderRadius: 7, padding: "10px 14px", color: D.fail, fontSize: 12, marginBottom: 12 }}>
          {err}
          {authErr && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => { localStorage.removeItem("wqms_api_key"); window.location.reload(); }}
                style={{ background: D.fail, border: "none", color: "#fff", padding: "5px 12px", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
              >
                Reset API Key
              </button>
            </div>
          )}
        </div>
      )}

      {!preview && !loading && (
        <div
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${D.accentBorder}`, borderRadius: 10,
            padding: "36px 24px", textAlign: "center", cursor: "pointer",
            background: D.accentFaint,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <div style={{ color: D.text, fontWeight: 600, marginBottom: 4 }}>Drop cert here or tap to upload</div>
          <div style={{ color: D.textMid, fontSize: 12 }}>PDF, JPG, or PNG — AI auto-classifies and extracts fields</div>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: D.textMid, fontSize: 13 }}>
          <div style={{ width: 24, height: 24, border: `2px solid ${D.border}`, borderTopColor: D.accent, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }}/>
          Extracting fields with AI…
        </div>
      )}

      {preview && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 14 }}>{filename}</div>
              <div style={{ marginTop: 4 }}><TypeBadge t={preview.type} /></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={preview.type}
                onChange={e => setPreview(p => p ? { ...p, type: e.target.value as CertType } : p)}
                style={{ ...inp, width: "auto", fontSize: 12, padding: "6px 28px 6px 10px" }}
              >
                <option value="material">Material Cert</option>
                <option value="consumable">Consumable Cert</option>
                <option value="ndt">NDT Report</option>
                <option value="ht">Heat Treatment</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {field("Job No.",        "jobNo")}
            {field("Date Received",  "dateReceived")}

            {(preview.type === "material") && <>
              {field("Heat Number",   "heatNumber")}
              {field("Material Grade","materialGrade")}
              {field("Standard",      "standard")}
              {field("Supplier",      "supplier")}
              {field("Linked Weld",   "linkedWeld")}
            </>}

            {preview.type === "consumable" && <>
              {field("Product Name",  "productName")}
              {field("Batch Number",  "batchNumber")}
              {field("Standard",      "standard")}
              {field("Supplier",      "supplier")}
            </>}

            {preview.type === "ndt" && <>
              {field("Weld ID",       "weldId")}
              {field("NDT Process",   "process")}
              {field("WPS Ref",       "wpsRef")}
              {field("Result",        "result")}
              {field("Inspector",     "inspector")}
              {field("Report Date",   "reportDate")}
              {field("Standard",      "standard")}
            </>}

            {preview.type === "ht" && <>
              {field("Weld ID",       "weldId")}
              {field("Temperature",   "temperature")}
              {field("Duration",      "duration")}
              {field("Result",        "result")}
              {field("Standard",      "standard")}
              {field("Report Date",   "reportDate")}
            </>}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ color: D.textSoft, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Notes</div>
            <textarea
              value={preview.notes ?? ""}
              onChange={e => setPreview(p => p ? { ...p, notes: e.target.value } : p)}
              rows={2}
              style={{ ...inp, resize: "vertical", lineHeight: 1.5, fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button color={D.pass} onClick={save} style={{ flex: 1 }}>Save to Register</Button>
            <Button outline onClick={() => { setPreview(null); setFilename(""); }}>Discard</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────
export const CertInboxModule: React.FC = () => {
  const apiKey = localStorage.getItem(APIKEY_KEY) ?? "";
  const [certs, setCerts] = usePersistedState<Cert[]>("wqms_certs", []);
  const [tab,    setTab]   = useState("upload");
  const [search, setSearch]= useState("");
  const [detail, setDetail]= useState<Cert | null>(null);

  const add    = (c: Cert) => setCerts(prev => [c, ...prev]);
  const remove = (id: string) => setCerts(prev => prev.filter(c => c.id !== id));

  const byCerts = (type: CertType) => certs.filter(c => c.type === type);
  const filtered = (type: CertType) =>
    byCerts(type).filter(c => !search || JSON.stringify(c).toLowerCase().includes(search.toLowerCase()));

  const tabs: [string, string, number?][] = [
    ["upload",      "Upload"],
    ["material",    "Material Certs",    byCerts("material").length   || undefined],
    ["consumable",  "Consumable Certs",  byCerts("consumable").length || undefined],
    ["ndt",         "NDT Reports",       byCerts("ndt").length        || undefined],
    ["ht",          "Heat Treatment",    byCerts("ht").length         || undefined],
    ["other",       "Other",             byCerts("other").length      || undefined],
  ];

  const rowStyle = (i: number) => ({
    background: i % 2 === 0 ? D.surface : "transparent",
    cursor: "pointer" as const,
  });

  const tdStyle = {
    padding: "9px 12px",
    color: D.textMid,
    fontSize: 12,
    borderBottom: `1px solid ${D.borderSoft}`,
    maxWidth: 160,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
    whiteSpace: "nowrap" as const,
  };

  const thStyle = {
    color: D.textSoft, fontWeight: 600 as const, fontSize: 11,
    textAlign: "left" as const, padding: "9px 12px",
    borderBottom: `1px solid ${D.border}`, background: D.surfaceAlt, whiteSpace: "nowrap" as const,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <TabBar tabs={tabs} active={tab} setActive={t => { setTab(t); setDetail(null); setSearch(""); }} />

      {/* ── Upload tab ── */}
      {tab === "upload" && (
        <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
          <UploadCard apiKey={apiKey} onSaved={add} />

          {certs.length > 0 && (
            <Card s={{ padding: 16 }}>
              <div style={{ color: D.textSoft, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
                Recently Added
              </div>
              {certs.slice(0, 8).map(c => (
                <div key={c.id}
                  onClick={() => { setDetail(c); setTab(c.type === "other" ? "other" : c.type); }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${D.borderSoft}`, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <TypeBadge t={c.type} />
                    <span style={{ color: D.text, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.filename}</span>
                  </div>
                  <span style={{ color: D.textSoft, fontSize: 11, flexShrink: 0, marginLeft: 10 }}>
                    {new Date(c.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ── Register tabs ── */}
      {["material", "consumable", "ndt", "ht", "other"].includes(tab) && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          {/* Detail panel */}
          {detail && detail.type === tab && (
            <Card s={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ color: D.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{detail.filename}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <TypeBadge t={detail.type} />
                    <span style={{ color: D.textSoft, fontSize: 11 }}>Uploaded {new Date(detail.uploadedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button outline color={D.fail} onClick={() => { remove(detail.id); setDetail(null); }}>Delete</Button>
                  <Button outline onClick={() => setDetail(null)}>Close</Button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(Object.entries(detail) as [string, string][])
                  .filter(([k, v]) => !["id","type","filename","uploadedAt"].includes(k) && v)
                  .map(([k, v]) => (
                    <div key={k} style={{ background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 6, padding: "8px 12px" }}>
                      <div style={{ color: D.textSoft, fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>
                        {k.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                      <div style={{ color: D.text, fontSize: 13 }}>
                        {k === "result" ? <ResultBadge v={v} /> : v}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…" style={{ ...inp, maxWidth: 280 }} />
            <span style={{ color: D.textSoft, fontSize: 12 }}>{filtered(tab as CertType).length} records</span>
          </div>

          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10 }}>
            {filtered(tab as CertType).length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: D.textSoft, fontSize: 13 }}>
                No {tab} certificates yet — upload one from the Upload tab.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 600 }}>
                <thead>
                  <tr>
                    {tab === "material"   && ["Filename","Heat No.","Grade","Standard","Supplier","Job No.","Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    {tab === "consumable" && ["Filename","Product","Batch No.","Standard","Supplier","Job No.","Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    {tab === "ndt"        && ["Filename","Weld ID","Process","WPS Ref","Result","Inspector","Date","Job No."].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    {tab === "ht"         && ["Filename","Weld ID","Temp","Duration","Result","Standard","Date","Job No."].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    {tab === "other"      && ["Filename","Job No.","Date","Notes"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered(tab as CertType).map((c, i) => (
                    <tr key={c.id} onClick={() => setDetail(detail?.id === c.id ? null : c)} style={rowStyle(i)}>
                      {tab === "material" && <>
                        <td style={{ ...tdStyle, color: D.accent, fontWeight: 600 }}>{c.filename}</td>
                        <td style={{ ...tdStyle, fontFamily: "'DM Mono',monospace" }}>{c.heatNumber || "—"}</td>
                        <td style={tdStyle}>{c.materialGrade || "—"}</td>
                        <td style={tdStyle}>{c.standard || "—"}</td>
                        <td style={tdStyle}>{c.supplier || "—"}</td>
                        <td style={{ ...tdStyle, fontFamily: "'DM Mono',monospace" }}>{c.jobNo || "—"}</td>
                        <td style={tdStyle}>{c.dateReceived || new Date(c.uploadedAt).toLocaleDateString()}</td>
                      </>}
                      {tab === "consumable" && <>
                        <td style={{ ...tdStyle, color: D.accent, fontWeight: 600 }}>{c.filename}</td>
                        <td style={tdStyle}>{c.productName || "—"}</td>
                        <td style={{ ...tdStyle, fontFamily: "'DM Mono',monospace" }}>{c.batchNumber || "—"}</td>
                        <td style={tdStyle}>{c.standard || "—"}</td>
                        <td style={tdStyle}>{c.supplier || "—"}</td>
                        <td style={{ ...tdStyle, fontFamily: "'DM Mono',monospace" }}>{c.jobNo || "—"}</td>
                        <td style={tdStyle}>{c.dateReceived || new Date(c.uploadedAt).toLocaleDateString()}</td>
                      </>}
                      {tab === "ndt" && <>
                        <td style={{ ...tdStyle, color: D.accent, fontWeight: 600 }}>{c.filename}</td>
                        <td style={{ ...tdStyle, fontFamily: "'DM Mono',monospace" }}>{c.weldId || "—"}</td>
                        <td style={tdStyle}>{c.process || "—"}</td>
                        <td style={{ ...tdStyle, fontFamily: "'DM Mono',monospace" }}>{c.wpsRef || "—"}</td>
                        <td style={tdStyle}><ResultBadge v={c.result} /></td>
                        <td style={tdStyle}>{c.inspector || "—"}</td>
                        <td style={tdStyle}>{c.reportDate || new Date(c.uploadedAt).toLocaleDateString()}</td>
                        <td style={{ ...tdStyle, fontFamily: "'DM Mono',monospace" }}>{c.jobNo || "—"}</td>
                      </>}
                      {tab === "ht" && <>
                        <td style={{ ...tdStyle, color: D.accent, fontWeight: 600 }}>{c.filename}</td>
                        <td style={{ ...tdStyle, fontFamily: "'DM Mono',monospace" }}>{c.weldId || "—"}</td>
                        <td style={tdStyle}>{c.temperature || "—"}</td>
                        <td style={tdStyle}>{c.duration || "—"}</td>
                        <td style={tdStyle}><ResultBadge v={c.result} /></td>
                        <td style={tdStyle}>{c.standard || "—"}</td>
                        <td style={tdStyle}>{c.reportDate || new Date(c.uploadedAt).toLocaleDateString()}</td>
                        <td style={{ ...tdStyle, fontFamily: "'DM Mono',monospace" }}>{c.jobNo || "—"}</td>
                      </>}
                      {tab === "other" && <>
                        <td style={{ ...tdStyle, color: D.accent, fontWeight: 600 }}>{c.filename}</td>
                        <td style={{ ...tdStyle, fontFamily: "'DM Mono',monospace" }}>{c.jobNo || "—"}</td>
                        <td style={tdStyle}>{new Date(c.uploadedAt).toLocaleDateString()}</td>
                        <td style={tdStyle}>{c.notes || "—"}</td>
                      </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
