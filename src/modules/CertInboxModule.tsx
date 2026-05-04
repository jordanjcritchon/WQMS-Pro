import React, { useState, useEffect, useCallback } from "react";
import { D, inp } from "../theme";
import { Card, TabBar, Button } from "../components";

const API = `http://${window.location.hostname}:3001/api`;

interface ScannerStatus {
  connected:      boolean;
  lastChecked:    string | null;
  processedCount: number;
  lastError:      string | null;
  apiKeyPresent:  boolean;
}

interface MaterialCert {
  id: number; filename: string; filepath: string;
  heat_number: string; material_grade: string; standard: string;
  supplier: string; date_received: string; job_no: string;
  linked_weld: string; email_subject: string; email_from: string;
  created_at: string;
}

interface ConsumableCert {
  id: number; filename: string; filepath: string;
  product_name: string; batch_number: string; standard: string;
  supplier: string; date_received: string; job_no: string;
  email_subject: string; email_from: string; created_at: string;
}

interface NDTReport {
  id: number; filename: string; filepath: string;
  weld_id: string; process: string; wps_ref: string; result: string;
  standard: string; inspector: string; report_date: string; job_no: string;
  email_subject: string; email_from: string; created_at: string;
}

interface HTReport {
  id: number; filename: string; filepath: string;
  job_no: string; weld_id: string; temperature: string;
  duration: string; result: string; standard: string;
  report_date: string; email_subject: string; email_from: string;
  created_at: string;
}

const openFile = async (filepath: string) => {
  await fetch(`${API}/file/open`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filepath }),
  });
};

const ResultBadge: React.FC<{ v: string }> = ({ v }) => {
  const pass = v.toUpperCase() === "PASS" || v.toUpperCase() === "PASSED";
  const fail = v.toUpperCase() === "FAIL" || v.toUpperCase() === "FAILED";
  const c = pass ? D.pass : fail ? D.fail : D.warn;
  const bg = pass ? D.passBg : fail ? D.failBg : D.warnBg;
  const b = pass ? D.passBorder : fail ? D.failBorder : D.warnBorder;
  if (!v) return <span style={{ color: D.textSoft }}>—</span>;
  return (
    <span style={{ background: bg, color: c, border: `1px solid ${b}`, borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
      {v}
    </span>
  );
};

const TH: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th style={{ color: D.textSoft, fontWeight: 600, fontSize: 11, textAlign: "left", padding: "9px 12px", borderBottom: `1px solid ${D.border}`, background: D.surfaceAlt, whiteSpace: "nowrap" }}>
    {children}
  </th>
);

const TD: React.FC<{ children: React.ReactNode; mono?: boolean; accent?: boolean }> = ({ children, mono, accent }) => (
  <td style={{ padding: "9px 12px", color: accent ? D.accent : D.textMid, fontSize: 12, borderBottom: `1px solid ${D.borderSoft}`, fontFamily: mono ? "'DM Mono',monospace" : undefined, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
    {children || <span style={{ color: D.textSoft }}>—</span>}
  </td>
);

export const CertInboxModule: React.FC = () => {
  const [tab,         setTab]         = useState("status");
  const [scanStatus,  setScanStatus]  = useState<ScannerStatus | null>(null);
  const [materials,   setMaterials]   = useState<MaterialCert[]>([]);
  const [consumables, setConsumables] = useState<ConsumableCert[]>([]);
  const [ndt,         setNdt]         = useState<NDTReport[]>([]);
  const [ht,          setHt]          = useState<HTReport[]>([]);
  const [serverDown,  setServerDown]  = useState(false);
  const [search,      setSearch]      = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [s, m, c, n, h] = await Promise.all([
        fetch(`${API}/status`).then(r => r.json()),
        fetch(`${API}/registers/materials`).then(r => r.json()),
        fetch(`${API}/registers/consumables`).then(r => r.json()),
        fetch(`${API}/registers/ndt`).then(r => r.json()),
        fetch(`${API}/registers/heat-treatment`).then(r => r.json()),
      ]);
      setScanStatus(s);
      setMaterials(m);
      setConsumables(c);
      setNdt(n);
      setHt(h);
      setServerDown(false);
    } catch {
      setServerDown(true);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 8_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const totalDocs = materials.length + consumables.length + ndt.length + ht.length;

  const tabs: [string, string, number?][] = [
    ["status",      "Scanner"],
    ["materials",   "Material Certs",     materials.length],
    ["consumables", "Consumable Certs",   consumables.length],
    ["ndt",         "NDT Reports",        ndt.length],
    ["ht",          "Heat Treatment",     ht.length],
  ];

  if (serverDown) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <TabBar tabs={tabs} active={tab} setActive={setTab} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: D.failBg, border: `2px solid ${D.failBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: D.fail, fontSize: 22 }}>!</span>
          </div>
          <div style={{ color: D.text, fontWeight: 700, fontSize: 16 }}>Backend server not running</div>
          <div style={{ color: D.textSoft, fontSize: 13, textAlign: "center", maxWidth: 420, lineHeight: 1.6 }}>
            Open a terminal, navigate to <span style={{ color: D.accent, fontFamily: "'DM Mono',monospace" }}>wqms-refactored/server</span>, run <span style={{ color: D.accent, fontFamily: "'DM Mono',monospace" }}>npm install</span> then <span style={{ color: D.accent, fontFamily: "'DM Mono',monospace" }}>npm run dev</span>
          </div>
          <Button color={D.accent} onClick={fetchAll}>Retry Connection</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <TabBar tabs={tabs} active={tab} setActive={setTab} />

      {/* ── Scanner Status ── */}
      {tab === "status" && (
        <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              ["Connection",  scanStatus?.connected ? "Online" : "Offline",           scanStatus?.connected ? D.pass : D.fail],
              ["Processed",   String(scanStatus?.processedCount ?? 0),                D.accent],
              ["Total Saved", String(totalDocs),                                       D.textMid],
              ["AI Engine",   scanStatus?.apiKeyPresent ? "Active" : "No API Key",    scanStatus?.apiKeyPresent ? D.pass : D.warn],
            ].map(([l, v, c]) => (
              <Card key={l} s={{ padding: 16 }}>
                <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 6 }}>{l.toUpperCase()}</div>
                <div style={{ color: c as string, fontSize: 22, fontWeight: 700 }}>{v}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Card s={{ padding: 18 }}>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Connection Details</div>
              {[
                ["Email Account",  "Certificates12@outlook.com"],
                ["IMAP Server",    "outlook.office365.com:993"],
                ["Scan Interval",  "Every 30 seconds"],
                ["Last Checked",   scanStatus?.lastChecked ? new Date(scanStatus.lastChecked).toLocaleString() : "—"],
                ["Last Error",     scanStatus?.lastError ?? "None"],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${D.borderSoft}` }}>
                  <span style={{ color: D.textSoft, fontSize: 12 }}>{l}</span>
                  <span style={{ color: l === "Last Error" && scanStatus?.lastError ? D.fail : D.textMid, fontSize: 12, fontFamily: l === "Email Account" || l === "IMAP Server" ? "'DM Mono',monospace" : undefined }}>{v}</span>
                </div>
              ))}
            </Card>

            <Card s={{ padding: 18 }}>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Storage Location</div>
              <div style={{ color: D.textSoft, fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>
                Documents are automatically saved to your Mac under:
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: D.accent, background: D.surfaceAlt, padding: "10px 12px", borderRadius: 6, marginBottom: 14, lineHeight: 1.8 }}>
                ~/Documents/WQMS Documents/<br />
                ├── Material Certificates/<br />
                ├── Welding Consumable Certificates/<br />
                ├── NDT Reports/<br />
                ├── Heat Treatment Reports/<br />
                └── Unclassified/
              </div>
              {!scanStatus?.apiKeyPresent && (
                <div style={{ background: D.warnBg, border: `1px solid ${D.warnBorder}`, borderRadius: 7, padding: "10px 14px", color: D.warn, fontSize: 12, lineHeight: 1.6 }}>
                  <strong>AI classification disabled.</strong> Files are being saved to Unclassified/. Add your ANTHROPIC_API_KEY to <span style={{ fontFamily: "'DM Mono',monospace" }}>server/.env</span> and restart the server to enable automatic sorting and field extraction.
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── Material Certificates ── */}
      {tab === "materials" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials..." style={{ ...inp, maxWidth: 320, marginBottom: 14 }} />
          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {["#","Filename","Heat No.","Grade","Standard","Supplier","Date","Job No.","Weld Ref","From",""].map(h => <TH key={h}>{h}</TH>)}
              </tr></thead>
              <tbody>
                {materials.filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase())).map(r => (
                  <tr key={r.id}>
                    <TD mono accent>{String(r.id).padStart(3,"0")}</TD>
                    <TD>{r.filename}</TD>
                    <TD mono>{r.heat_number}</TD>
                    <TD>{r.material_grade}</TD>
                    <TD>{r.standard}</TD>
                    <TD>{r.supplier}</TD>
                    <TD>{r.date_received}</TD>
                    <TD mono>{r.job_no}</TD>
                    <TD mono>{r.linked_weld}</TD>
                    <TD>{r.email_from}</TD>
                    <td style={{ padding: "9px 12px", borderBottom: `1px solid ${D.borderSoft}` }}>
                      <button onClick={() => openFile(r.filepath)} style={{ background: D.accentFaint, border: `1px solid ${D.accentBorder}`, color: D.accent, borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Open</button>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr><td colSpan={11} style={{ padding: 24, textAlign: "center", color: D.textSoft, fontSize: 13 }}>No material certificates received yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Consumable Certificates ── */}
      {tab === "consumables" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search consumables..." style={{ ...inp, maxWidth: 320, marginBottom: 14 }} />
          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {["#","Filename","Product","Batch No.","Standard","Supplier","Date","Job No.","From",""].map(h => <TH key={h}>{h}</TH>)}
              </tr></thead>
              <tbody>
                {consumables.filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase())).map(r => (
                  <tr key={r.id}>
                    <TD mono accent>{String(r.id).padStart(3,"0")}</TD>
                    <TD>{r.filename}</TD>
                    <TD>{r.product_name}</TD>
                    <TD mono>{r.batch_number}</TD>
                    <TD>{r.standard}</TD>
                    <TD>{r.supplier}</TD>
                    <TD>{r.date_received}</TD>
                    <TD mono>{r.job_no}</TD>
                    <TD>{r.email_from}</TD>
                    <td style={{ padding: "9px 12px", borderBottom: `1px solid ${D.borderSoft}` }}>
                      <button onClick={() => openFile(r.filepath)} style={{ background: D.accentFaint, border: `1px solid ${D.accentBorder}`, color: D.accent, borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Open</button>
                    </td>
                  </tr>
                ))}
                {consumables.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: 24, textAlign: "center", color: D.textSoft, fontSize: 13 }}>No consumable certificates received yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── NDT Reports ── */}
      {tab === "ndt" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search NDT reports..." style={{ ...inp, maxWidth: 320, marginBottom: 14 }} />
          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {["#","Filename","Weld ID","Process","WPS Ref","Result","Standard","Inspector","Date","Job No.",""].map(h => <TH key={h}>{h}</TH>)}
              </tr></thead>
              <tbody>
                {ndt.filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase())).map(r => (
                  <tr key={r.id}>
                    <TD mono accent>{String(r.id).padStart(3,"0")}</TD>
                    <TD>{r.filename}</TD>
                    <TD mono>{r.weld_id}</TD>
                    <TD>{r.process}</TD>
                    <TD mono>{r.wps_ref}</TD>
                    <td style={{ padding: "9px 12px", borderBottom: `1px solid ${D.borderSoft}` }}><ResultBadge v={r.result} /></td>
                    <TD>{r.standard}</TD>
                    <TD>{r.inspector}</TD>
                    <TD>{r.report_date}</TD>
                    <TD mono>{r.job_no}</TD>
                    <td style={{ padding: "9px 12px", borderBottom: `1px solid ${D.borderSoft}` }}>
                      <button onClick={() => openFile(r.filepath)} style={{ background: D.accentFaint, border: `1px solid ${D.accentBorder}`, color: D.accent, borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Open</button>
                    </td>
                  </tr>
                ))}
                {ndt.length === 0 && (
                  <tr><td colSpan={11} style={{ padding: 24, textAlign: "center", color: D.textSoft, fontSize: 13 }}>No NDT reports received yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Heat Treatment ── */}
      {tab === "ht" && (
        <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search HT reports..." style={{ ...inp, maxWidth: 320, marginBottom: 14 }} />
          <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {["#","Filename","Job No.","Weld ID","Temp.","Duration","Result","Standard","Date","From",""].map(h => <TH key={h}>{h}</TH>)}
              </tr></thead>
              <tbody>
                {ht.filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase())).map(r => (
                  <tr key={r.id}>
                    <TD mono accent>{String(r.id).padStart(3,"0")}</TD>
                    <TD>{r.filename}</TD>
                    <TD mono>{r.job_no}</TD>
                    <TD mono>{r.weld_id}</TD>
                    <TD>{r.temperature}</TD>
                    <TD>{r.duration}</TD>
                    <td style={{ padding: "9px 12px", borderBottom: `1px solid ${D.borderSoft}` }}><ResultBadge v={r.result} /></td>
                    <TD>{r.standard}</TD>
                    <TD>{r.report_date}</TD>
                    <TD>{r.email_from}</TD>
                    <td style={{ padding: "9px 12px", borderBottom: `1px solid ${D.borderSoft}` }}>
                      <button onClick={() => openFile(r.filepath)} style={{ background: D.accentFaint, border: `1px solid ${D.accentBorder}`, color: D.accent, borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Open</button>
                    </td>
                  </tr>
                ))}
                {ht.length === 0 && (
                  <tr><td colSpan={11} style={{ padding: 24, textAlign: "center", color: D.textSoft, fontSize: 13 }}>No heat treatment reports received yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
