import React, { useState, useEffect, useCallback } from "react";
import { D, inp } from "../theme";
import { Card, TabBar } from "../components";
import { supabase } from "../lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface InboxEmail {
  id: string;
  gmail_message_id: string;
  from_email: string;
  from_name: string;
  subject: string;
  received_at: string;
  attachment_count: number;
  extracted: boolean;
  cert_type: string | null;
  processing_error: string | null;
}

interface MaterialCert {
  id: string; inbox_id: string; cert_ref: string; heat_no: string;
  grade: string; standard: string; supplier: string; test_date: string;
  item_size: string; cev: number | null; document_url: string;
}

interface ConsumableCert {
  id: string; inbox_id: string; cert_ref: string; classification: string;
  manufacturer: string; batch_no: string; standard: string; test_date: string;
  document_url: string;
}

interface NDTReport {
  id: string; inbox_id: string; report_no: string; method: string;
  weld_id: string; technician: string; cert_level: string; standard: string;
  result: string; test_date: string; document_url: string;
}

interface HTReport {
  id: string; inbox_id: string; report_no: string; ht_type: string;
  component_id: string; weld_id: string; material: string;
  target_temp: number | null; soak_time: number | null; actual_temp: number | null;
  result: string; test_date: string; document_url: string;
}

interface WelderCert {
  id: string; inbox_id: string; cert_no: string; welder_name: string;
  stamp_no: string; standard: string; process: string; material_group: string;
  positions: string[]; test_date: string; expiry_date: string; test_lab: string;
  document_url: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB") : "—";
const ago = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const ResultBadge: React.FC<{ v?: string }> = ({ v }) => {
  if (!v) return <span style={{ color: D.textSoft }}>—</span>;
  const pass = /pass/i.test(v), fail = /fail/i.test(v);
  const c = pass ? D.pass : fail ? D.fail : D.warn;
  const bg = pass ? D.passBg : fail ? D.failBg : D.warnBg;
  return <span style={{ background: bg, color: c, borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{v}</span>;
};

const TypeBadge: React.FC<{ t: string | null }> = ({ t }) => {
  const map: Record<string, [string, string, string]> = {
    material:       [D.blue,   "rgba(59,130,246,0.12)",  "Material Cert"],
    consumable:     [D.accent, D.accentFaint,             "Consumable Cert"],
    ndt:            [D.warn,   D.warnBg,                  "NDT Report"],
    heat_treatment: [D.purple, "rgba(139,92,246,0.12)",   "Heat Treatment"],
    welder_qual:    [D.pass,   D.passBg,                  "Welder Cert"],
    wps:            [D.textMid,"rgba(120,120,140,0.12)",  "WPS"],
    other:          [D.textMid,"rgba(120,120,140,0.12)",  "Other"],
  };
  const [c, bg, label] = map[t ?? "other"] ?? map.other;
  return <span style={{ background: bg, color: c, borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
};

const DeleteBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={e => { e.stopPropagation(); onClick(); }} style={{
    background: D.failBg, border: `1px solid ${D.failBorder}`, color: D.fail,
    borderRadius: 5, padding: "3px 8px", fontSize: 11, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
  }}>Delete</button>
);

const th: React.CSSProperties = {
  color: D.textSoft, fontWeight: 600, fontSize: 11, textAlign: "left",
  padding: "9px 12px", borderBottom: `1px solid ${D.border}`,
  background: D.surfaceAlt, whiteSpace: "nowrap",
};
const td = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: "9px 12px", color: D.textMid, fontSize: 12,
  borderBottom: `1px solid ${D.borderSoft}`, maxWidth: 180,
  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  ...extra,
});

const EmptyRow: React.FC<{ cols: number; msg: string }> = ({ cols, msg }) => (
  <tr><td colSpan={cols} style={{ padding: 40, textAlign: "center", color: D.textSoft, fontSize: 13 }}>{msg}</td></tr>
);

// ── Monitor tab ───────────────────────────────────────────────────────────────

const MonitorTab: React.FC<{ emails: InboxEmail[]; loading: boolean; lastPoll: Date | null; onRefresh: () => void }> = ({ emails, loading, lastPoll, onRefresh }) => (
  <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
    {/* Status bar */}
    <Card s={{ padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative", width: 12, height: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: D.pass, position: "absolute" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: D.pass, position: "absolute", opacity: 0.4, animation: "pulse 2s ease-in-out infinite" }} />
        </div>
        <div>
          <div style={{ color: D.text, fontWeight: 700, fontSize: 13 }}>Live Monitoring</div>
          <div style={{ color: D.textSoft, fontSize: 11 }}>wqmscerts@gmail.com · polling every 30 seconds</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {lastPoll && <span style={{ color: D.textSoft, fontSize: 11 }}>Last checked {ago(lastPoll.toISOString())}</span>}
        <button onClick={onRefresh} disabled={loading} style={{
          background: D.accentFaint, border: `1px solid ${D.accentBorder}`, color: D.accent,
          borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
        }}>{loading ? "Refreshing…" : "Refresh"}</button>
      </div>
    </Card>

    {/* Stats row */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
      {[
        ["Total Received", emails.length],
        ["Processed", emails.filter(e => e.extracted).length],
        ["With Attachments", emails.filter(e => e.attachment_count > 0).length],
        ["Errors", emails.filter(e => e.processing_error).length],
      ].map(([label, val]) => (
        <Card key={String(label)} s={{ padding: "12px 16px", textAlign: "center" }}>
          <div style={{ color: D.text, fontWeight: 700, fontSize: 22 }}>{val}</div>
          <div style={{ color: D.textSoft, fontSize: 11, marginTop: 2 }}>{label}</div>
        </Card>
      ))}
    </div>

    {/* Email feed */}
    <Card s={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${D.border}`, color: D.textSoft, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em" }}>
        Email Feed
      </div>
      {emails.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: D.textSoft, fontSize: 13 }}>
          No emails received yet — send a cert PDF to wqmscerts@gmail.com
        </div>
      ) : (
        emails.map(e => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: `1px solid ${D.borderSoft}` }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: e.processing_error ? D.fail : e.extracted ? D.pass : e.attachment_count > 0 ? D.warn : D.border }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: D.text, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.subject || "(no subject)"}</div>
              <div style={{ color: D.textSoft, fontSize: 11, marginTop: 2 }}>
                From: {e.from_name || e.from_email} · {e.attachment_count} attachment{e.attachment_count !== 1 ? "s" : ""}
              </div>
              {e.processing_error && <div style={{ color: D.fail, fontSize: 11, marginTop: 2 }}>Error: {e.processing_error}</div>}
            </div>
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              {e.cert_type && <TypeBadge t={e.cert_type} />}
              <span style={{ color: D.textSoft, fontSize: 11 }}>{ago(e.received_at)}</span>
            </div>
          </div>
        ))
      )}
    </Card>
  </div>
);

// ── Main module ───────────────────────────────────────────────────────────────

export const CertInboxModule: React.FC = () => {
  const [tab, setTab] = useState("monitor");
  const [loading, setLoading] = useState(false);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);

  const [emails, setEmails]       = useState<InboxEmail[]>([]);
  const [material, setMaterial]   = useState<MaterialCert[]>([]);
  const [consumable, setConsumable] = useState<ConsumableCert[]>([]);
  const [ndt, setNdt]             = useState<NDTReport[]>([]);
  const [ht, setHt]               = useState<HTReport[]>([]);
  const [welder, setWelder]       = useState<WelderCert[]>([]);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [inboxRes, matRes, conRes, ndtRes, htRes, welRes] = await Promise.all([
        supabase.from("cert_inbox").select("*").order("received_at", { ascending: false }).limit(50),
        supabase.from("material_cert_register").select("*").order("created_at", { ascending: false }),
        supabase.from("consumable_cert_register").select("*").order("created_at", { ascending: false }),
        supabase.from("ndt_report_register").select("*").order("created_at", { ascending: false }),
        supabase.from("ht_report_register").select("*").order("created_at", { ascending: false }),
        supabase.from("welder_cert_register").select("*").order("created_at", { ascending: false }),
      ]);
      if (inboxRes.data) setEmails(inboxRes.data);
      if (matRes.data)   setMaterial(matRes.data);
      if (conRes.data)   setConsumable(conRes.data);
      if (ndtRes.data)   setNdt(ndtRes.data);
      if (htRes.data)    setHt(htRes.data);
      if (welRes.data)   setWelder(welRes.data);
      setLastPoll(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCert = useCallback(async (table: string, id: string) => {
    if (!supabase) return;
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    await supabase.from(table).delete().eq("id", id);
    load();
  }, [load]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const tabs: [string, string, number?][] = [
    ["monitor",    "Monitor"],
    ["material",   "Material Certs",   material.length   || undefined],
    ["consumable", "Consumable Certs", consumable.length || undefined],
    ["ndt",        "NDT Reports",      ndt.length        || undefined],
    ["ht",         "Heat Treatment",   ht.length         || undefined],
    ["welder",     "Welder Certs",     welder.length     || undefined],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(2.2);opacity:0} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>

      <TabBar tabs={tabs} active={tab} setActive={t => setTab(t)} />

      {/* Monitor */}
      {tab === "monitor" && (
        <MonitorTab emails={emails} loading={loading} lastPoll={lastPoll} onRefresh={load} />
      )}

      {/* Material Certs */}
      {tab === "material" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
              <thead><tr>{["Cert Ref","Heat No","Grade","Standard","Supplier","Test Date","Document",""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {material.length === 0 ? <EmptyRow cols={8} msg="No material certs yet — send a mill cert to wqmscerts@gmail.com" /> :
                  material.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? D.surface : "transparent" }}>
                      <td style={td({ color: D.accent, fontWeight: 600 })}>{r.cert_ref || "—"}</td>
                      <td style={td({ fontFamily: "'DM Mono',monospace" })}>{r.heat_no || "—"}</td>
                      <td style={td()}>{r.grade || "—"}</td>
                      <td style={td()}>{r.standard || "—"}</td>
                      <td style={td()}>{r.supplier || "—"}</td>
                      <td style={td()}>{fmt(r.test_date)}</td>
                      <td style={td()}>{r.document_url ? <a href={r.document_url} target="_blank" rel="noreferrer" style={{ color: D.accent }}>View PDF</a> : "—"}</td>
                      <td style={td()}><DeleteBtn onClick={() => deleteCert("material_cert_register", r.id)} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consumable Certs */}
      {tab === "consumable" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
              <thead><tr>{["Cert Ref","Classification","Manufacturer","Batch No","Standard","Test Date","Document",""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {consumable.length === 0 ? <EmptyRow cols={8} msg="No consumable certs yet — send an electrode/filler cert to wqmscerts@gmail.com" /> :
                  consumable.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? D.surface : "transparent" }}>
                      <td style={td({ color: D.accent, fontWeight: 600 })}>{r.cert_ref || "—"}</td>
                      <td style={td()}>{r.classification || "—"}</td>
                      <td style={td()}>{r.manufacturer || "—"}</td>
                      <td style={td({ fontFamily: "'DM Mono',monospace" })}>{r.batch_no || "—"}</td>
                      <td style={td()}>{r.standard || "—"}</td>
                      <td style={td()}>{fmt(r.test_date)}</td>
                      <td style={td()}>{r.document_url ? <a href={r.document_url} target="_blank" rel="noreferrer" style={{ color: D.accent }}>View PDF</a> : "—"}</td>
                      <td style={td()}><DeleteBtn onClick={() => deleteCert("consumable_cert_register", r.id)} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NDT Reports */}
      {tab === "ndt" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
              <thead><tr>{["Report No","Method","Weld ID","Technician","Standard","Result","Test Date","Document",""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {ndt.length === 0 ? <EmptyRow cols={9} msg="No NDT reports yet — send an RT/UT/MT/PT report to wqmscerts@gmail.com" /> :
                  ndt.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? D.surface : "transparent" }}>
                      <td style={td({ color: D.accent, fontWeight: 600 })}>{r.report_no || "—"}</td>
                      <td style={td()}>{r.method || "—"}</td>
                      <td style={td({ fontFamily: "'DM Mono',monospace" })}>{r.weld_id || "—"}</td>
                      <td style={td()}>{r.technician || "—"}</td>
                      <td style={td()}>{r.standard || "—"}</td>
                      <td style={td()}><ResultBadge v={r.result} /></td>
                      <td style={td()}>{fmt(r.test_date)}</td>
                      <td style={td()}>{r.document_url ? <a href={r.document_url} target="_blank" rel="noreferrer" style={{ color: D.accent }}>View PDF</a> : "—"}</td>
                      <td style={td()}><DeleteBtn onClick={() => deleteCert("ndt_report_register", r.id)} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Heat Treatment */}
      {tab === "ht" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
              <thead><tr>{["Report No","HT Type","Component","Weld ID","Target Temp","Soak Time","Result","Test Date","Document",""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {ht.length === 0 ? <EmptyRow cols={10} msg="No heat treatment reports yet — send a PWHT record to wqmscerts@gmail.com" /> :
                  ht.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? D.surface : "transparent" }}>
                      <td style={td({ color: D.accent, fontWeight: 600 })}>{r.report_no || "—"}</td>
                      <td style={td()}>{r.ht_type || "—"}</td>
                      <td style={td()}>{r.component_id || "—"}</td>
                      <td style={td({ fontFamily: "'DM Mono',monospace" })}>{r.weld_id || "—"}</td>
                      <td style={td()}>{r.target_temp != null ? `${r.target_temp}°C` : "—"}</td>
                      <td style={td()}>{r.soak_time != null ? `${r.soak_time} min` : "—"}</td>
                      <td style={td()}><ResultBadge v={r.result} /></td>
                      <td style={td()}>{fmt(r.test_date)}</td>
                      <td style={td()}>{r.document_url ? <a href={r.document_url} target="_blank" rel="noreferrer" style={{ color: D.accent }}>View PDF</a> : "—"}</td>
                      <td style={td()}><DeleteBtn onClick={() => deleteCert("ht_report_register", r.id)} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Welder Certs */}
      {tab === "welder" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
              <thead><tr>{["Cert No","Welder","Stamp No","Standard","Process","Test Date","Expiry","Document",""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {welder.length === 0 ? <EmptyRow cols={9} msg="No welder certs yet — send a welder qualification cert to wqmscerts@gmail.com" /> :
                  welder.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? D.surface : "transparent" }}>
                      <td style={td({ color: D.accent, fontWeight: 600 })}>{r.cert_no || "—"}</td>
                      <td style={td()}>{r.welder_name || "—"}</td>
                      <td style={td({ fontFamily: "'DM Mono',monospace" })}>{r.stamp_no || "—"}</td>
                      <td style={td()}>{r.standard || "—"}</td>
                      <td style={td()}>{r.process || "—"}</td>
                      <td style={td()}>{fmt(r.test_date)}</td>
                      <td style={td()}>{fmt(r.expiry_date)}</td>
                      <td style={td()}>{r.document_url ? <a href={r.document_url} target="_blank" rel="noreferrer" style={{ color: D.accent }}>View PDF</a> : "—"}</td>
                      <td style={td()}><DeleteBtn onClick={() => deleteCert("welder_cert_register", r.id)} /></td>
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
