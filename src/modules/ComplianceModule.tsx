import React, { useState, useMemo } from "react";
import { D } from "../theme";
import { Card, Progress } from "../components";
import {
  WPS_DATA, WELDER_DATA, NCR_DATA, MAT_RAW, MAT_CONS,
  NDT_EQUIP, HT_DATA, ITP_DATA, PROJECTS,
} from "../data";
import { useStore } from "../store";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Category {
  id:      string;
  name:    string;
  weight:  number;
  score:   number;
  issues:  string[];
  navTarget?: string;
}

interface Recommendation {
  priority: "critical" | "high" | "medium";
  category: string;
  action:   string;
  impact:   number;
}

interface ComplianceResult {
  score:           number;
  status:          "compliant" | "at-risk" | "non-compliant";
  categories:      Category[];
  recommendations: Recommendation[];
}

// ── Scoring engine ────────────────────────────────────────────────────────────
function calcCompliance(vtReports: ReturnType<typeof useStore>["vtReports"], projectId?: string): ComplianceResult {

  // ── 1. Welder Qualifications (20%) ──────────────────────────────────────────
  const welderIssues: string[] = [];
  let welderScore = 100;
  WELDER_DATA.forEach(w => {
    if (w.status === "Expired") {
      welderScore -= 30;
      welderIssues.push(`${w.firstName} ${w.lastName} (${w.stampNo}): Qualification EXPIRED — must not weld`);
    } else if (w.status === "Expiring Soon") {
      welderScore -= 10;
      welderIssues.push(`${w.firstName} ${w.lastName} (${w.stampNo}): Qualification expiring soon — schedule renewal`);
    }
    w.qualifications.forEach(q => {
      if (!q.continuityOk) {
        welderScore -= 6;
        welderIssues.push(`${w.firstName} ${w.lastName}: Continuity lapsed for ${q.process} (${q.standard})`);
      }
    });
  });
  welderScore = Math.max(0, welderScore);

  // ── 2. Material Traceability (15%) ──────────────────────────────────────────
  const matIssues: string[] = [];
  let matScore = 100;
  MAT_RAW.forEach(m => {
    if (m.mtcStatus === "Missing") {
      matScore -= 40;
      matIssues.push(`${m.id} (${m.grade}): No Material Test Certificate — material must not be used`);
    }
    if (m.traceability === "Missing") {
      matScore -= 20;
      matIssues.push(`${m.id}: Traceability chain broken — heat number unknown`);
    }
    if (m.pmiStatus === "Fail") {
      matScore -= 15;
      matIssues.push(`${m.id}: PMI verification failed — material identity unconfirmed`);
    }
  });
  matScore = Math.max(0, matScore);

  // ── 3. NCR & Defect Management (15%) ────────────────────────────────────────
  const ncrIssues: string[] = [];
  let ncrScore = 100;
  const openNCRs = NCR_DATA.filter(n => n.status !== "Closed" && (!projectId || n.project === PROJECTS.find(p => p.id === projectId)?.name));
  openNCRs.forEach(n => {
    if      (n.priority === "Critical") { ncrScore -= 25; ncrIssues.push(`${n.id}: CRITICAL NCR open — "${n.defect}"`); }
    else if (n.priority === "High")     { ncrScore -= 12; ncrIssues.push(`${n.id}: High-priority NCR — "${n.defect}"`); }
    else if (n.priority === "Medium")   { ncrScore -= 6;  ncrIssues.push(`${n.id}: Medium NCR open — "${n.defect}"`); }
    else                                { ncrScore -= 2; }
  });
  // Repeat defect penalty
  const defectMap: Record<string, number> = {};
  NCR_DATA.forEach(n => {
    const key = `${n.project}::${n.defect.split(/\s+/)[0].toLowerCase()}`;
    defectMap[key] = (defectMap[key] || 0) + 1;
  });
  let repeatPenalty = 0;
  Object.entries(defectMap).forEach(([, count]) => {
    if (count > 1) repeatPenalty += 10;
  });
  if (repeatPenalty > 0) {
    ncrScore -= repeatPenalty;
    ncrIssues.push(`Repeat defect pattern detected — root cause analysis required`);
  }
  ncrScore = Math.max(0, ncrScore);

  // ── 4. WPS Validity (12%) ────────────────────────────────────────────────────
  const wpsIssues: string[] = [];
  let wpsScore = 100;
  WPS_DATA.forEach(w => {
    if      (w.status === "Expired")        { wpsScore -= 30; wpsIssues.push(`${w.id}: WPS EXPIRED — "${w.title}" — must not be applied`); }
    else if (w.status === "Pending Review") { wpsScore -= 10; wpsIssues.push(`${w.id}: WPS pending review — "${w.title}" — obtain sign-off`); }
  });
  wpsScore = Math.max(0, wpsScore);

  // ── 5. Consumable Certification (12%) ────────────────────────────────────────
  const consIssues: string[] = [];
  let consScore = 100;
  MAT_CONS.forEach(c => {
    if (c.issueStatus === "Expired") {
      consScore -= 35;
      consIssues.push(`${c.id} (${c.classification}): Expired consumable — return to store and replace`);
    }
  });
  consScore = Math.max(0, consScore);

  // ── 6. NDT Equipment Calibration (8%) ────────────────────────────────────────
  const ndtEqIssues: string[] = [];
  let ndtEqScore = 100;
  NDT_EQUIP.forEach(e => {
    if (e.calibStatus === "Expired") {
      ndtEqScore -= 35;
      ndtEqIssues.push(`${e.id} (${e.type} – ${e.model}): Calibration EXPIRED — remove from service until recalibrated`);
    }
  });
  ndtEqScore = Math.max(0, ndtEqScore);

  // ── 7. VT Pass Rate (8%) ─────────────────────────────────────────────────────
  const vtIssues: string[] = [];
  const filteredVT = projectId
    ? vtReports.filter(r => r.project === PROJECTS.find(p => p.id === projectId)?.name)
    : vtReports;
  const vtTotal = filteredVT.length;
  const vtPass  = filteredVT.filter(r => r.result === "PASS").length;
  const vtScore = vtTotal > 0 ? Math.round((vtPass / vtTotal) * 100) : 100;
  if (vtTotal > 0 && vtScore < 90) vtIssues.push(`VT pass rate is ${vtScore}% — ${vtTotal - vtPass} fail(s) require repair and re-inspection`);

  // ── 8. ITP Hold Points (5%) ──────────────────────────────────────────────────
  const itpIssues: string[] = [];
  let itpScore = 100;
  ITP_DATA.forEach(itp => {
    const total     = itp.steps.length;
    const completed = itp.steps.filter(s => s.status === "Completed").length;
    const pct       = Math.round((completed / total) * 100);
    if (pct < 100) {
      const pending = itp.steps.filter(s => s.status !== "Completed");
      const holdCount = pending.filter(s => s.holdType === "H").length;
      if (holdCount > 0) {
        itpScore -= 15;
        itpIssues.push(`${itp.itpNo}: ${holdCount} uncleaned Hold Point(s) blocking progression`);
      } else {
        itpScore -= 5;
        itpIssues.push(`${itp.itpNo}: ${total - completed} step(s) pending sign-off`);
      }
    }
  });
  itpScore = Math.max(0, itpScore);

  // ── 9. Heat Treatment (5%) ───────────────────────────────────────────────────
  const htIssues: string[] = [];
  let htScore = 100;
  HT_DATA.forEach(h => {
    if (h.compliant === false) {
      htScore -= 35;
      htIssues.push(`${h.id}: ${h.type} NON-COMPLIANT on ${h.componentId} — repeat treatment required`);
    } else if (h.compliant === null) {
      htScore -= 10;
      htIssues.push(`${h.id}: ${h.type} pending verification for ${h.componentId}`);
    }
  });
  htScore = Math.max(0, htScore);

  // ── Weighted total ────────────────────────────────────────────────────────────
  const categories: Category[] = [
    { id:"welders",     name:"Welder Qualifications",      weight:20, score:welderScore,  issues:welderIssues,  navTarget:"welders"    },
    { id:"materials",   name:"Material Traceability",      weight:15, score:matScore,     issues:matIssues,     navTarget:"materials"  },
    { id:"ncr",         name:"NCR & Defect Management",    weight:15, score:ncrScore,     issues:ncrIssues,     navTarget:"ncr"        },
    { id:"wps",         name:"WPS / PQR Validity",         weight:12, score:wpsScore,     issues:wpsIssues,     navTarget:"wps"        },
    { id:"consumables", name:"Consumable Certification",   weight:12, score:consScore,    issues:consIssues,    navTarget:"materials"  },
    { id:"ndteq",       name:"NDT Equipment Calibration",  weight: 8, score:ndtEqScore,   issues:ndtEqIssues,   navTarget:"inspection" },
    { id:"vt",          name:"VT Pass Rate",               weight: 8, score:vtScore,      issues:vtIssues,      navTarget:"inspection" },
    { id:"itp",         name:"ITP / Hold Points",          weight: 5, score:itpScore,     issues:itpIssues,     navTarget:"inspection" },
    { id:"ht",          name:"Heat Treatment",             weight: 5, score:htScore,      issues:htIssues,      navTarget:"materials"  },
  ];

  const score = Math.round(categories.reduce((s, c) => s + (c.score * c.weight) / 100, 0));
  const status: ComplianceResult["status"] = score >= 90 ? "compliant" : score >= 70 ? "at-risk" : "non-compliant";

  // ── Recommendations ────────────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  categories.forEach(cat => {
    cat.issues.forEach(issue => {
      const p =
        cat.id === "welders"    && issue.includes("EXPIRED")   ? "critical" :
        cat.id === "materials"  && issue.includes("No Material") ? "critical" :
        cat.id === "ncr"        && issue.includes("CRITICAL")  ? "critical" :
        cat.id === "wps"        && issue.includes("EXPIRED")   ? "critical" :
        cat.id === "consumables"                               ? "high"     :
        cat.id === "ndteq"                                     ? "high"     :
        cat.weight >= 12                                       ? "high"     : "medium";
      recommendations.push({
        priority: p as Recommendation["priority"],
        category: cat.name,
        action:   issue,
        impact:   Math.round(cat.weight * (1 - cat.score / 100)),
      });
    });
  });

  recommendations.sort((a, b) => {
    const po = { critical: 0, high: 1, medium: 2 };
    return po[a.priority] - po[b.priority] || b.impact - a.impact;
  });

  return { score, status, categories, recommendations };
}

// ── Score ring ────────────────────────────────────────────────────────────────
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 140 }) => {
  const r   = (size - 18) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const clr  = score >= 90 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={D.border}    strokeWidth={10} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={clr}         strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ color: clr, fontSize: size * 0.22, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>
          {score}%
        </div>
      </div>
    </div>
  );
};

// ── Status pill ───────────────────────────────────────────────────────────────
const StatusPill: React.FC<{ status: ComplianceResult["status"] }> = ({ status }) => {
  const cfg = {
    compliant:      [D.pass,  D.passBg,  D.passBorder,  "COMPLIANT"],
    "at-risk":      [D.warn,  D.warnBg,  D.warnBorder,  "AT RISK"],
    "non-compliant":[D.fail,  D.failBg,  D.failBorder,  "NON-COMPLIANT"],
  }[status];
  return (
    <span style={{
      background: cfg[1], border: `1px solid ${cfg[2]}`,
      color: cfg[0], borderRadius: 8, padding: "4px 14px",
      fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
    }}>
      {cfg[3]}
    </span>
  );
};

// ── Priority badge ────────────────────────────────────────────────────────────
const PriBadge: React.FC<{ p: Recommendation["priority"] }> = ({ p }) => {
  const [bg, color, label] = p === "critical"
    ? [D.failBg, D.fail, "CRITICAL"]
    : p === "high"
    ? [D.warnBg, D.warn, "HIGH"]
    : ["rgba(99,102,241,0.08)", "#818cf8", "MEDIUM"];
  return (
    <span style={{ background: bg, color, border: `1px solid ${color}33`, borderRadius: 4, padding: "2px 7px", fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", flexShrink: 0 }}>
      {label}
    </span>
  );
};

// ── Main module ───────────────────────────────────────────────────────────────
export const ComplianceModule: React.FC<{ setActive?: (id: string) => void }> = ({ setActive }) => {
  const { vtReports } = useStore();
  const [projectId, setProjectId] = useState<string>("all");
  const [openCat,   setOpenCat]   = useState<string | null>(null);

  const result = useMemo(
    () => calcCompliance(vtReports, projectId === "all" ? undefined : projectId),
    [vtReports, projectId],
  );

  const clr = result.score >= 90 ? D.pass : result.score >= 70 ? D.warn : D.fail;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: D.text, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Compliance Score</div>
          <div style={{ color: D.textMid, fontSize: 13, marginTop: 3 }}>ISO 3834 · AS 3992 · ASME IX</div>
        </div>
        {/* Project selector */}
        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          style={{
            background: D.surfaceAlt, border: `1px solid ${D.border}`,
            color: D.text, padding: "8px 28px 8px 12px", borderRadius: 8,
            fontSize: 13, fontFamily: "'Inter',sans-serif", outline: "none", cursor: "pointer",
          }}
        >
          <option value="all">All Projects</option>
          {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Hero score card */}
      <Card s={{ padding: 28, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <ScoreRing score={result.score} size={150} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ marginBottom: 10 }}><StatusPill status={result.status} /></div>
            <div style={{ color: D.text, fontSize: 16, fontWeight: 700, lineHeight: 1.5, marginBottom: 6 }}>
              {result.status === "compliant"
                ? "All critical processes operating within accepted limits."
                : result.status === "at-risk"
                ? "Action required — several compliance gaps detected."
                : "Immediate action required — critical non-conformances present."}
            </div>
            <div style={{ color: D.textMid, fontSize: 13 }}>
              {result.recommendations.filter(r => r.priority === "critical").length} critical · {result.recommendations.filter(r => r.priority === "high").length} high · {result.recommendations.filter(r => r.priority === "medium").length} medium items
            </div>
          </div>
          {/* Threshold legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, borderLeft: `1px solid ${D.border}`, paddingLeft: 24 }}>
            {([["≥ 90%", "COMPLIANT", D.pass, D.passBg], ["70–89%", "AT RISK", D.warn, D.warnBg], ["< 70%", "NON-COMPLIANT", D.fail, D.failBg]] as const).map(([range, label, c, bg]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                <span style={{ color: D.textSoft, fontSize: 11 }}>{range}</span>
                <span style={{ color: c, fontSize: 10, fontWeight: 700, background: bg, padding: "1px 6px", borderRadius: 4 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Category breakdown */}
        <Card s={{ padding: 20 }}>
          <div style={{ color: D.text, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Score Breakdown</div>
          {result.categories.map(cat => {
            const catClr = cat.score >= 90 ? D.pass : cat.score >= 70 ? D.warn : D.fail;
            const isOpen = openCat === cat.id;
            return (
              <div key={cat.id} style={{ marginBottom: 12 }}>
                <button
                  onClick={() => setOpenCat(isOpen ? null : cat.id)}
                  style={{
                    width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10, marginBottom: 5,
                  }}
                >
                  <span style={{ color: D.textMid, fontSize: 12, flex: 1, textAlign: "left", fontFamily: "'Inter',sans-serif" }}>{cat.name}</span>
                  <span style={{ color: D.textSoft, fontSize: 10 }}>×{cat.weight}%</span>
                  <span style={{ color: catClr, fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: "right" }}>{cat.score}</span>
                  <span style={{ color: D.textSoft, fontSize: 11 }}>{isOpen ? "▲" : "▼"}</span>
                </button>
                <Progress value={cat.score} color={catClr} h={5} />
                {isOpen && cat.issues.length > 0 && (
                  <div style={{ marginTop: 8, paddingLeft: 8, borderLeft: `2px solid ${catClr}` }}>
                    {cat.issues.map((issue, i) => (
                      <div key={i} style={{ color: D.textMid, fontSize: 11, lineHeight: 1.6, marginBottom: 3 }}>· {issue}</div>
                    ))}
                    {cat.navTarget && setActive && (
                      <button
                        onClick={() => setActive(cat.navTarget!)}
                        style={{ marginTop: 6, background: D.accentFaint, border: `1px solid ${D.accentBorder}`, color: D.accent, padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}
                      >
                        Go to {cat.name} →
                      </button>
                    )}
                  </div>
                )}
                {isOpen && cat.issues.length === 0 && (
                  <div style={{ marginTop: 6, color: D.pass, fontSize: 11, paddingLeft: 8 }}>✓ No issues found</div>
                )}
              </div>
            );
          })}
        </Card>

        {/* Recommendations */}
        <Card s={{ padding: 20 }}>
          <div style={{ color: D.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Recommendations</div>
          <div style={{ color: D.textSoft, fontSize: 11, marginBottom: 14 }}>Sorted by priority and score impact</div>
          {result.recommendations.length === 0 ? (
            <div style={{ color: D.pass, fontSize: 13, textAlign: "center", padding: "24px 0" }}>✓ No recommendations — fully compliant</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 480, overflowY: "auto" }}>
              {result.recommendations.map((rec, i) => (
                <div key={i} style={{
                  background: D.surfaceAlt, border: `1px solid ${D.border}`,
                  borderRadius: 8, padding: "10px 12px",
                  borderLeft: `3px solid ${rec.priority === "critical" ? D.fail : rec.priority === "high" ? D.warn : "#818cf8"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                    <PriBadge p={rec.priority} />
                    <span style={{ color: D.textSoft, fontSize: 10, marginLeft: "auto", flexShrink: 0 }}>
                      +{rec.impact}pt if fixed
                    </span>
                  </div>
                  <div style={{ color: D.textMid, fontSize: 12, lineHeight: 1.55, marginTop: 4 }}>{rec.action}</div>
                  <div style={{ color: D.textSoft, fontSize: 10, marginTop: 4 }}>{rec.category}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Weights explanation */}
      <Card s={{ padding: 18 }}>
        <div style={{ color: D.text, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>How the Score is Calculated</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {result.categories.map(cat => (
            <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: D.surfaceAlt, borderRadius: 6 }}>
              <span style={{ color: D.textMid, fontSize: 11 }}>{cat.name}</span>
              <span style={{ color: D.accent, fontSize: 11, fontWeight: 700 }}>{cat.weight}%</span>
            </div>
          ))}
        </div>
        <div style={{ color: D.textSoft, fontSize: 11, marginTop: 12, lineHeight: 1.7 }}>
          Weights reflect ISO 3834 risk priorities. Personnel qualifications and material traceability carry the highest weight as failures in these areas directly compromise weld integrity and regulatory compliance. Scores below 70% in any category trigger an automatic risk assessment flag.
        </div>
      </Card>
    </div>
  );
};

// ── Dashboard widget (exported separately) ────────────────────────────────────
export const ComplianceDashboardWidget: React.FC<{ setActive: (id: string) => void }> = ({ setActive }) => {
  const { vtReports } = useStore();
  const result = useMemo(() => calcCompliance(vtReports), [vtReports]);
  const clr = result.score >= 90 ? D.pass : result.score >= 70 ? D.warn : D.fail;

  const topRecs = result.recommendations.slice(0, 4);

  return (
    <Card onClick={() => setActive("compliance")} s={{ padding: 18, cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: D.text, fontWeight: 700, fontSize: 14 }}>Compliance Score</div>
        <button onClick={() => setActive("compliance")} style={{ background: "none", border: `1px solid ${D.border}`, color: D.textMid, padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11 }}>Full report →</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 14 }}>
        <ScoreRing score={result.score} size={90} />
        <div>
          <StatusPill status={result.status} />
          <div style={{ color: D.textMid, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
            {result.recommendations.filter(r => r.priority === "critical").length > 0
              ? `${result.recommendations.filter(r => r.priority === "critical").length} critical item(s) require immediate action`
              : result.recommendations.filter(r => r.priority === "high").length > 0
              ? `${result.recommendations.filter(r => r.priority === "high").length} high-priority item(s) need attention`
              : "All critical processes compliant"}
          </div>
        </div>
      </div>

      {/* Mini category bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {result.categories.slice(0, 5).map(cat => {
          const catClr = cat.score >= 90 ? D.pass : cat.score >= 70 ? D.warn : D.fail;
          return (
            <div key={cat.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: D.textSoft, fontSize: 10 }}>{cat.name}</span>
                <span style={{ color: catClr, fontSize: 10, fontWeight: 700 }}>{cat.score}</span>
              </div>
              <Progress value={cat.score} color={catClr} h={4} />
            </div>
          );
        })}
      </div>

      {/* Top recs */}
      {topRecs.length > 0 && (
        <div>
          <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>TOP ACTIONS</div>
          {topRecs.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                background: r.priority === "critical" ? D.fail : r.priority === "high" ? D.warn : "#818cf8" }} />
              <div style={{ color: D.textMid, fontSize: 11, lineHeight: 1.5 }}>{r.action}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
