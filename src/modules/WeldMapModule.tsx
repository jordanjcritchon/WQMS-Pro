import React, { useState, useRef, useEffect, useCallback } from "react";
import { D, inp } from "../theme";
import { WELD_MAP_NODES, PROJECTS, WELD_PASSPORTS } from "../data";
import { WELD_STATUS_COLORS } from "../statusMeta";
import type { WeldMapNode } from "../types";

interface WeldMapModuleProps {
  openPassport?: (id: string) => void;
  openNCR?:      (weldId: string, project: string) => void;
  openVT?:       (weldId: string, project: string) => void;
}

interface Transform { scale: number; x: number; y: number; }

const PROCESS_LABEL: Record<string, string> = {
  "111": "SMAW (111)", "135": "GMAW (135)", "141": "GTAW (141)",
  "114": "FCAW (114)", "121": "SAW (121)",  "15":  "PAW (15)",
};

// All recognised statuses in display order
const STATUSES = [
  "Accepted","Pending VT","Pending NDT","Welded","Fit-up Complete",
  "NCR Open","Repair Required","Pending Heat Treatment","Not Started","Released",
];

// Detect schematic type from project name / standard
type SchType = "vessel" | "pipeline" | "structural";
const schType = (name = "", std = ""): SchType => {
  const n = name.toLowerCase(), s = std.toLowerCase();
  if (n.includes("pipeline") || n.includes("pipe") || s.includes("b31.3")) return "pipeline";
  if (n.includes("struct") || n.includes("conveyor") || n.includes("frame") || s.includes("1554")) return "structural";
  return "vessel";
};

// ── SVG weld-map schematics ────────────────────────────────────────────────
// All drawn inside viewBox="0 0 1000 560".
// Node positions map directly: x%→SVG x/10, y25%→140, y50%→280, y75%→420.

// Shared annotation helpers
const SeamLabels = () => (
  <>
    {(["C-01","C-02","C-03","C-04"] as const).map((lbl, i) => {
      const xp = [180,350,520,700][i];
      return <text key={lbl} x={xp} y="126" fontSize="8" fill={D.blue} textAnchor="middle"
        fontFamily="'DM Mono',monospace" fontWeight="700" opacity="0.8">{lbl}</text>;
    })}
    <text x="930" y="143" fontSize="8" fill={D.blue} fontFamily="'DM Mono',monospace" fontWeight="700" opacity="0.8">L-01</text>
    <text x="930" y="423" fontSize="8" fill={D.blue} fontFamily="'DM Mono',monospace" fontWeight="700" opacity="0.8">L-02</text>
  </>
);

// Pressure vessel (horizontal, dished ends, nozzles, saddles)
const VesselSVG: React.FC<{ project?: typeof PROJECTS[0] }> = ({ project }) => (
  <g>
    {/* Interior fill */}
    <rect x="80" y="140" width="840" height="280" fill="#0b1824" />

    {/* Left dished end */}
    <ellipse cx="80" cy="280" rx="76" ry="140" fill="#091420" stroke="#1e4a70" strokeWidth="2" />
    <rect x="79" y="139" width="3" height="283" fill="#0b1824" />
    <line x1="80" y1="140" x2="80" y2="420" stroke="#1e4a70" strokeWidth="2.5" />

    {/* Right dished end */}
    <ellipse cx="920" cy="280" rx="76" ry="140" fill="#091420" stroke="#1e4a70" strokeWidth="2" />
    <rect x="918" y="139" width="3" height="283" fill="#0b1824" />
    <line x1="920" y1="140" x2="920" y2="420" stroke="#1e4a70" strokeWidth="2.5" />

    {/* Shell outline */}
    <line x1="80" y1="140" x2="920" y2="140" stroke="#1e4a70" strokeWidth="2.5" />
    <line x1="80" y1="420" x2="920" y2="420" stroke="#1e4a70" strokeWidth="2.5" />

    {/* ── Weld seams ── */}
    {/* Longitudinal top (L-01 at y=140) */}
    <line x1="80" y1="140" x2="920" y2="140" stroke={D.blue} strokeWidth="1.5" strokeDasharray="10,5" opacity="0.6" />
    {/* Longitudinal bottom (L-02 at y=420) */}
    <line x1="80" y1="420" x2="920" y2="420" stroke={D.blue} strokeWidth="1.5" strokeDasharray="10,5" opacity="0.6" />
    {/* Circumferential girth seams at x=180,350,520,700 */}
    {[180,350,520,700].map((xp,i) => (
      <g key={i}>
        <line x1={xp} y1="140" x2={xp} y2="420" stroke={D.blue} strokeWidth="1.5" strokeDasharray="7,4" opacity="0.6" />
        <line x1={xp-5} y1="137" x2={xp+5} y2="137" stroke={D.blue} strokeWidth="1.5" opacity="0.8" />
        <line x1={xp-5} y1="423" x2={xp+5} y2="423" stroke={D.blue} strokeWidth="1.5" opacity="0.8" />
      </g>
    ))}

    {/* Centre line (phantom) */}
    <line x1="4" y1="280" x2="976" y2="280" stroke="#2a3a5a" strokeWidth="0.6" strokeDasharray="14,4,2,4" />
    <text x="968" y="277" fontSize="7" fill="#2a3a5a" textAnchor="end" fontFamily="'DM Mono',monospace">CL</text>

    {/* Nozzle N-01 (top) */}
    <rect x="330" y="84" width="40" height="58" fill="#091420" stroke="#1e4a70" strokeWidth="1.5" rx="2" />
    <line x1="318" y1="84" x2="382" y2="84" stroke="#1e4a70" strokeWidth="2.5" />
    <text x="350" y="75" fontSize="8" fill={D.textMid} textAnchor="middle" fontFamily="'DM Mono',monospace">N-01</text>

    {/* Nozzle N-02 (bottom) */}
    <rect x="500" y="418" width="40" height="58" fill="#091420" stroke="#1e4a70" strokeWidth="1.5" rx="2" />
    <line x1="488" y1="476" x2="552" y2="476" stroke="#1e4a70" strokeWidth="2.5" />
    <text x="520" y="494" fontSize="8" fill={D.textMid} textAnchor="middle" fontFamily="'DM Mono',monospace">N-02</text>

    {/* Saddles */}
    <rect x="152" y="420" width="60" height="24" fill="#0d1a2e" stroke="#2a3a5a" strokeWidth="1" rx="2" />
    <rect x="162" y="444" width="40" height="7" fill="#0a1520" stroke="#2a3a5a" strokeWidth="1" />
    <rect x="654" y="420" width="60" height="24" fill="#0d1a2e" stroke="#2a3a5a" strokeWidth="1" rx="2" />
    <rect x="664" y="444" width="40" height="7" fill="#0a1520" stroke="#2a3a5a" strokeWidth="1" />

    {/* Course span labels */}
    {(["COURSE 1","COURSE 2","COURSE 3","COURSE 4"] as const).map((lbl,i) => {
      const x1s = [90,191,361,531]; const x2s = [179,349,519,899];
      const xm = (x1s[i]+x2s[i])/2;
      return <text key={lbl} x={xm} y="110" fontSize="7.5" fill={D.textSoft} textAnchor="middle"
        fontFamily="'Inter',sans-serif" letterSpacing="0.06em" opacity="0.8">{lbl}</text>;
    })}

    {/* Dim line left */}
    <line x1="18" y1="140" x2="18" y2="420" stroke="#2a3a5a" strokeWidth="0.7" />
    <line x1="14" y1="140" x2="22" y2="140" stroke="#2a3a5a" strokeWidth="0.7" />
    <line x1="14" y1="420" x2="22" y2="420" stroke="#2a3a5a" strokeWidth="0.7" />
    <text x="12" y="283" fontSize="7" fill={D.textSoft} textAnchor="middle" fontFamily="'DM Mono',monospace"
      transform="rotate(-90,12,283)" opacity="0.6">O/D × 2400L (NTS)</text>

    <SeamLabels />

    {/* Standard badge */}
    <rect x="810" y="460" width="182" height="18" fill="#0d1a2e" rx="3" stroke="#1e3050" strokeWidth="0.8" />
    <text x="901" y="472" fontSize="8" fill={D.textMid} textAnchor="middle" fontFamily="'Inter',sans-serif">
      {project?.standard ?? "AS 4041 / AS 3992"}
    </text>
  </g>
);

// Pipeline / pipe spool (3 parallel pipes + headers + flanges)
const PipelineSVG: React.FC<{ project?: typeof PROJECTS[0] }> = ({ project }) => {
  const pipes = [140, 280, 420]; // y-centres matching node y=25%,50%,75%
  const R = 18; // pipe half-height (visual radius for rect pipe)
  const spoolLabels = ["SPOOL A","SPOOL B","SPOOL C","SPOOL D"];
  const spoolX = [90,181,351,521,701]; // boundaries between spools
  return (
    <g>
      {/* Header pipes (vertical manifolds at each end) */}
      <rect x="54" y={pipes[0]-R} width="16" height={pipes[2]-pipes[0]+2*R} fill="#091e30" stroke="#1e5070" strokeWidth="2" rx="2" />
      <rect x="930" y={pipes[0]-R} width="16" height={pipes[2]-pipes[0]+2*R} fill="#091e30" stroke="#1e5070" strokeWidth="2" rx="2" />

      {/* Each pipe run */}
      {pipes.map((yc, pi) => (
        <g key={pi}>
          {/* Pipe body */}
          <rect x="70" y={yc-R} width="860" height={2*R} fill="#091e30" stroke="#1e5070" strokeWidth="2" rx="3" />
          {/* Pipe highlight (sheen) */}
          <rect x="70" y={yc-R+2} width="860" height={5} fill="#163050" rx="2" opacity="0.6" />

          {/* Flanges at the far ends */}
          <rect x="55" y={yc-R-3} width="15" height={2*R+6} fill="#0d2540" stroke="#2a6090" strokeWidth="1.5" rx="1" />
          <rect x="930" y={yc-R-3} width="15" height={2*R+6} fill="#0d2540" stroke="#2a6090" strokeWidth="1.5" rx="1" />

          {/* Girth welds at x=180,350,520,700 */}
          {[180,350,520,700].map((xp,i) => (
            <g key={i}>
              {/* Weld prep gap (visual) */}
              <rect x={xp-2} y={yc-R} width="4" height={2*R} fill="#0b1a28" />
              {/* Weld cap */}
              <rect x={xp-3} y={yc-R} width="6" height={2*R} fill="none" stroke={D.blue} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
              {/* Flange faces */}
              <line x1={xp} y1={yc-R-4} x2={xp} y2={yc+R+4} stroke="#2a6090" strokeWidth="1.5" />
            </g>
          ))}

          {/* Pipe number labels */}
          <text x="40" y={yc+4} fontSize="8.5" fill={D.textMid} textAnchor="middle"
            fontFamily="'DM Mono',monospace">{`P-0${pi+1}`}</text>
        </g>
      ))}

      {/* Girth seam vertical leaders */}
      {[180,350,520,700].map((xp,i) => (
        <g key={`ldr-${i}`}>
          <line x1={xp} y1={pipes[0]-R-8} x2={xp} y2={pipes[2]+R+12} stroke={D.blue} strokeWidth="1" strokeDasharray="5,3" opacity="0.5" />
          <line x1={xp-5} y1={pipes[0]-R-10} x2={xp+5} y2={pipes[0]-R-10} stroke={D.blue} strokeWidth="1.5" opacity="0.7" />
          <line x1={xp-5} y1={pipes[2]+R+14} x2={xp+5} y2={pipes[2]+R+14} stroke={D.blue} strokeWidth="1.5" opacity="0.7" />
        </g>
      ))}

      {/* Spool span labels */}
      {spoolLabels.map((lbl,i) => {
        const xm = (spoolX[i]+spoolX[i+1])/2;
        return <text key={lbl} x={xm} y="108" fontSize="7.5" fill={D.textSoft} textAnchor="middle"
          fontFamily="'Inter',sans-serif" letterSpacing="0.06em" opacity="0.8">{lbl}</text>;
      })}

      {/* Dimension line */}
      <line x1="18" y1={pipes[0]-R} x2="18" y2={pipes[2]+R} stroke="#2a3a5a" strokeWidth="0.7" />
      <line x1="14" y1={pipes[0]-R} x2="22" y2={pipes[0]-R} stroke="#2a3a5a" strokeWidth="0.7" />
      <line x1="14" y1={pipes[2]+R} x2="22" y2={pipes[2]+R} stroke="#2a3a5a" strokeWidth="0.7" />
      <text x="12" y="283" fontSize="7" fill={D.textSoft} textAnchor="middle" fontFamily="'DM Mono',monospace"
        transform="rotate(-90,12,283)" opacity="0.6">3 × LINES (NTS)</text>

      {/* Seam labels (shared) */}
      <SeamLabels />

      {/* Standard badge */}
      <rect x="796" y="460" width="196" height="18" fill="#0d1824" rx="3" stroke="#1e3050" strokeWidth="0.8" />
      <text x="894" y="472" fontSize="8" fill={D.textMid} textAnchor="middle" fontFamily="'Inter',sans-serif">
        {project?.standard ?? "ASME B31.3"}
      </text>
    </g>
  );
};

// Structural frame (columns + chords + diagonals + base plates)
const StructuralSVG: React.FC<{ project?: typeof PROJECTS[0] }> = ({ project }) => {
  const cols   = [180, 350, 520, 700]; // x matching node x%
  const chords = [140, 280, 420];      // y matching node y%
  const CW = 22; // column half-width
  const BH = 16; // beam half-height
  return (
    <g>
      {/* ── Top chord beam ── */}
      <rect x="80" y={chords[0]-BH} width="840" height={2*BH} fill="#0d1a28" stroke="#1e4060" strokeWidth="2" />
      {/* Beam web highlight */}
      <rect x="80" y={chords[0]-BH+2} width="840" height="4" fill="#142030" opacity="0.7" />
      <rect x="80" y={chords[0]+BH-6} width="840" height="4" fill="#142030" opacity="0.7" />

      {/* ── Bottom chord beam ── */}
      <rect x="80" y={chords[2]-BH} width="840" height={2*BH} fill="#0d1a28" stroke="#1e4060" strokeWidth="2" />
      <rect x="80" y={chords[2]-BH+2} width="840" height="4" fill="#142030" opacity="0.7" />
      <rect x="80" y={chords[2]+BH-6} width="840" height="4" fill="#142030" opacity="0.7" />

      {/* ── Mid stringer ── */}
      <rect x="80" y={chords[1]-8} width="840" height="16" fill="#0a1420" stroke="#1a3050" strokeWidth="1.2" />

      {/* ── Columns ── */}
      {cols.map(xc => (
        <g key={xc}>
          <rect x={xc-CW} y={chords[0]} width={2*CW} height={chords[2]-chords[0]} fill="#0b1928" stroke="#1e4060" strokeWidth="2" />
          {/* Column web highlight */}
          <rect x={xc-CW+2} y={chords[0]} width="4" height={chords[2]-chords[0]} fill="#132030" opacity="0.8" />
          <rect x={xc+CW-6} y={chords[0]} width="4" height={chords[2]-chords[0]} fill="#132030" opacity="0.8" />
          {/* Base plate */}
          <rect x={xc-CW-6} y={chords[2]+BH} width={2*CW+12} height="10" fill="#0d1a28" stroke="#2a4060" strokeWidth="1.5" rx="1" />
          <rect x={xc-CW-12} y={chords[2]+BH+10} width={2*CW+24} height="6" fill="#091420" stroke="#1e3050" strokeWidth="1" rx="1" />
          {/* Cap plate (top) */}
          <rect x={xc-CW-6} y={chords[0]-BH-10} width={2*CW+12} height="10" fill="#0d1a28" stroke="#2a4060" strokeWidth="1.5" rx="1" />
        </g>
      ))}

      {/* ── Cross-bracing in each bay ── */}
      {[[80,180],[180,350],[350,520],[520,700],[700,920]].map(([x1,x2],i) => (
        <g key={i} opacity="0.5">
          <line x1={x1+8} y1={chords[0]+BH} x2={x2-8} y2={chords[2]-BH} stroke="#2a4060" strokeWidth="1.2" strokeDasharray="6,3" />
          <line x1={x2-8} y1={chords[0]+BH} x2={x1+8} y2={chords[2]-BH} stroke="#2a4060" strokeWidth="1.2" strokeDasharray="6,3" />
        </g>
      ))}

      {/* ── Weld seam indicators ── */}
      {/* Top chord welds (L-01) at y=140 */}
      <line x1="80" y1={chords[0]} x2="920" y2={chords[0]} stroke={D.blue} strokeWidth="1.2" strokeDasharray="8,5" opacity="0.5" />
      {/* Bottom chord welds (L-02) at y=420 */}
      <line x1="80" y1={chords[2]} x2="920" y2={chords[2]} stroke={D.blue} strokeWidth="1.2" strokeDasharray="8,5" opacity="0.5" />
      {/* Column face welds (at column x positions) */}
      {cols.map(xc => (
        <g key={`sw-${xc}`}>
          <line x1={xc} y1={chords[0]-BH} x2={xc} y2={chords[2]+BH} stroke={D.blue} strokeWidth="1" strokeDasharray="5,4" opacity="0.45" />
        </g>
      ))}

      {/* Bay labels */}
      {(["BAY 1","BAY 2","BAY 3","BAY 4","BAY 5"] as const).map((lbl,i) => {
        const bx = [80,180,350,520,700,920];
        const xm = (bx[i]+bx[i+1])/2;
        return <text key={lbl} x={xm} y="110" fontSize="7.5" fill={D.textSoft} textAnchor="middle"
          fontFamily="'Inter',sans-serif" letterSpacing="0.06em" opacity="0.8">{lbl}</text>;
      })}

      {/* Column labels */}
      {cols.map((xc,i) => (
        <text key={`cl-${i}`} x={xc} y={chords[2]+48} fontSize="8" fill={D.textMid} textAnchor="middle"
          fontFamily="'DM Mono',monospace">{`COL-${String.fromCharCode(65+i)}`}</text>
      ))}

      {/* Elevation markers */}
      <line x1="18" y1={chords[0]} x2="18" y2={chords[2]} stroke="#2a3a5a" strokeWidth="0.7" />
      <line x1="14" y1={chords[0]} x2="22" y2={chords[0]} stroke="#2a3a5a" strokeWidth="0.7" />
      <line x1="14" y1={chords[2]} x2="22" y2={chords[2]} stroke="#2a3a5a" strokeWidth="0.7" />
      <text x="12" y="283" fontSize="7" fill={D.textSoft} textAnchor="middle" fontFamily="'DM Mono',monospace"
        transform="rotate(-90,12,283)" opacity="0.6">ELEVATION (NTS)</text>

      <SeamLabels />

      {/* Standard badge */}
      <rect x="796" y="460" width="196" height="18" fill="#0d1824" rx="3" stroke="#1e3050" strokeWidth="0.8" />
      <text x="894" y="472" fontSize="8" fill={D.textMid} textAnchor="middle" fontFamily="'Inter',sans-serif">
        {project?.standard ?? "AS 1554.1"}
      </text>
    </g>
  );
};

// ── Main module ──────────────────────────────────────────────────────────────

export const WeldMapModule: React.FC<WeldMapModuleProps> = ({ openPassport, openNCR, openVT }) => {
  const [selectedNode,    setSelectedNode]    = useState<WeldMapNode | null>(null);
  const [filterStatus,    setFilterStatus]    = useState("All");
  const [filterWelder,    setFilterWelder]    = useState("All");
  const [hoveredNode,     setHoveredNode]     = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState("PRJ-001");
  const [transform,       setTransform]       = useState<Transform>({ scale: 1, x: 0, y: 0 });

  const mapRef     = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const lastPos    = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setTransform(t => {
      const ns   = Math.max(0.3, Math.min(6, t.scale * factor));
      const rect = mapRef.current?.getBoundingClientRect();
      if (!rect) return { ...t, scale: ns };
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const r  = ns / t.scale;
      return { scale: ns, x: cx - r * (cx - t.x), y: cy - r * (cy - t.y) };
    });
  }, []);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const zoomIn    = () => setTransform(t => ({ ...t, scale: Math.min(6, t.scale * 1.25) }));
  const zoomOut   = () => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale / 1.25) }));
  const resetView = () => setTransform({ scale: 1, x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true; hasDragged.current = false;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
  };
  const onMouseUp = () => { isDragging.current = false; };

  const filteredNodes = WELD_MAP_NODES.filter(n => {
    if (filterStatus !== "All" && n.status !== filterStatus) return false;
    if (filterWelder !== "All" && n.welder !== filterWelder) return false;
    return true;
  });

  const passport  = selectedNode ? WELD_PASSPORTS.find(w => w.id === selectedNode.id) : null;
  const project   = PROJECTS.find(p => p.id === selectedProject);
  const sType     = schType(project?.name, project?.standard);

  const nodeProject = (node: WeldMapNode) => {
    const p = WELD_PASSPORTS.find(w => w.id === node.id);
    if (p) return PROJECTS.find(pr => pr.id === p.projectId)?.name ?? p.projectId;
    return project?.name ?? selectedProject;
  };

  const today  = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  const counts = STATUSES.reduce((a, s) => ({ ...a, [s]: WELD_MAP_NODES.filter(n => n.status === s).length }), {} as Record<string, number>);
  const active = STATUSES.filter(s => counts[s] > 0);

  const seamPos = (n: WeldMapNode) => n.y <= 30 ? "Top (12H)" : n.y >= 70 ? "Bottom (6H)" : "Equator (3/9H)";

  const typeLabel: Record<SchType, string> = {
    vessel:     "PRESSURE VESSEL — ELEVATION VIEW",
    pipeline:   "PIPE SPOOL — ELEVATION VIEW",
    structural: "STRUCTURAL FRAME — ELEVATION VIEW",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", fontFamily: "'Inter',sans-serif" }}>

      {/* ── Filter bar ── */}
      <div style={{ padding: "8px 14px", background: D.surface, borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
        <select value={selectedProject} onChange={e => { setSelectedProject(e.target.value); setSelectedNode(null); resetView(); }} style={{ ...inp, width: 234 }}>
          {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} – {p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: 160 }}>
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterWelder} onChange={e => setFilterWelder(e.target.value)} style={{ ...inp, width: 148 }}>
          <option value="All">All Welders</option>
          {[...new Set(WELD_MAP_NODES.map(n => n.welder))].filter(w => w !== "—").map(w => <option key={w}>{w}</option>)}
        </select>
        {/* Schematic type chip */}
        <div style={{ background: D.accentFaint, border: `1px solid ${D.accentBorder}`, color: D.accent, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4, letterSpacing: "0.06em" }}>
          {sType === "vessel" ? "⚙ VESSEL" : sType === "pipeline" ? "〰 PIPELINE" : "▦ STRUCTURAL"}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {active.map(s => {
            const c = WELD_STATUS_COLORS[s] ?? { fill: D.surfaceAlt, stroke: D.border, text: D.textSoft };
            return (
              <div key={s} onClick={() => setFilterStatus(filterStatus === s ? "All" : s)}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: filterStatus === s ? D.text : D.textMid, cursor: "pointer", padding: "2px 6px", borderRadius: 4, background: filterStatus === s ? D.surfaceHov : "transparent" }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: c.fill, border: `2px solid ${c.stroke}`, flexShrink: 0 }} />
                <span>{s}</span>
                <span style={{ background: D.surfaceAlt, color: D.textSoft, fontSize: 10, padding: "0 5px", borderRadius: 8, fontWeight: 700 }}>{counts[s]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Drawing canvas ── */}
        <div ref={mapRef}
          style={{ flex: 1, position: "relative", overflow: "hidden", background: D.bg, cursor: isDragging.current ? "grabbing" : "grab", userSelect: "none" }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

          {/* ── Zoomable content ── */}
          <div style={{ position: "absolute", width: "100%", height: "100%", transformOrigin: "0 0", transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.scale})` }}>

            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" overflow="visible">
              <defs>
                {/* Engineering grid */}
                <pattern id="wm-minor" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M20 0L0 0 0 20" fill="none" stroke={D.border} strokeWidth="0.3" />
                </pattern>
                <pattern id="wm-major" width="100" height="100" patternUnits="userSpaceOnUse">
                  <rect width="100" height="100" fill="url(#wm-minor)" />
                  <path d="M100 0L0 0 0 100" fill="none" stroke="#1a1a2e" strokeWidth="0.7" />
                </pattern>
              </defs>

              {/* Grid background */}
              <rect width="1000" height="560" fill="url(#wm-major)" />

              {/* Dynamic schematic */}
              {sType === "vessel"     && <VesselSVG     project={project} />}
              {sType === "pipeline"   && <PipelineSVG   project={project} />}
              {sType === "structural" && <StructuralSVG project={project} />}

              {/* ── Embedded title block ── */}
              <rect x="660" y="470" width="332" height="86" fill={D.surface} rx="3" stroke={D.border} strokeWidth="1" />
              <rect x="660" y="470" width="332" height="3" fill={D.accent} rx="1" />
              <line x1="660" y1="506" x2="992" y2="506" stroke={D.border} strokeWidth="0.8" />
              <line x1="820" y1="506" x2="820" y2="556" stroke={D.border} strokeWidth="0.8" />
              <line x1="900" y1="506" x2="900" y2="556" stroke={D.border} strokeWidth="0.8" />

              <text x="826" y="487" fontSize="8.5" fill={D.textSoft} textAnchor="middle"
                fontFamily="'Inter',sans-serif" fontWeight="700" letterSpacing="0.1em">{typeLabel[sType]}</text>
              <text x="826" y="501" fontSize="11" fill={D.text} textAnchor="middle"
                fontFamily="'Inter',sans-serif" fontWeight="800">{project?.name ?? selectedProject}</text>

              <text x="668" y="518" fontSize="7.5" fill={D.textSoft} fontFamily="'DM Mono',monospace">DWG: WLD-001-RevA</text>
              <text x="668" y="530" fontSize="7.5" fill={D.textSoft} fontFamily="'DM Mono',monospace">CLIENT: {project?.client ?? "—"}</text>
              <text x="668" y="543" fontSize="7.5" fill={D.textSoft} fontFamily="'DM Mono',monospace">DUE: {project?.due ?? "—"}</text>

              <text x="826" y="520" fontSize="7" fill={D.textSoft} fontFamily="'DM Mono',monospace" textAnchor="middle">SCALE</text>
              <text x="826" y="532" fontSize="9" fill={D.accent} fontFamily="'DM Mono',monospace" textAnchor="middle" fontWeight="700">NTS</text>
              <text x="826" y="544" fontSize="7" fill={D.textSoft} fontFamily="'DM Mono',monospace" textAnchor="middle">WQMS Pro</text>

              <text x="908" y="520" fontSize="7" fill={D.textSoft} fontFamily="'DM Mono',monospace" textAnchor="middle">DATE</text>
              <text x="908" y="532" fontSize="8.5" fill={D.text} fontFamily="'DM Mono',monospace" textAnchor="middle" fontWeight="700">{today}</text>
              <text x="908" y="544" fontSize="7" fill={D.textSoft} fontFamily="'DM Mono',monospace" textAnchor="middle">Rev A</text>
            </svg>

            {/* ── Weld node markers ── */}
            {filteredNodes.map(node => {
              const sc         = WELD_STATUS_COLORS[node.status] ?? { fill: D.surfaceAlt, stroke: D.border, text: D.textSoft };
              const isSelected = selectedNode?.id === node.id;
              const isHovered  = hoveredNode === node.id;
              return (
                <div key={node.id}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => { if (!hasDragged.current) setSelectedNode(isSelected ? null : node); }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ position: "absolute", left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%,-50%)", zIndex: isSelected ? 20 : 10, cursor: "pointer" }}>

                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: sc.fill,
                    border: `2.5px solid ${isSelected ? D.accent : sc.stroke}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: isSelected
                      ? `0 0 0 4px ${D.accentFaint}, 0 4px 18px ${sc.stroke}70`
                      : isHovered
                        ? `0 0 0 3px ${sc.stroke}35, 0 2px 10px ${sc.stroke}50`
                        : `0 1px 4px rgba(0,0,0,0.5)`,
                    transition: "all 0.15s",
                    fontSize: 10, fontWeight: 800, color: isSelected ? D.accent : sc.text,
                    fontFamily: "'DM Mono',monospace",
                  }}>
                    {node.id.replace("W-", "")}
                  </div>

                  {/* Hover tooltip */}
                  {isHovered && !isSelected && (
                    <div style={{ position: "absolute", bottom: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 7, padding: "9px 13px", whiteSpace: "nowrap", zIndex: 200, boxShadow: "0 6px 24px rgba(0,0,0,0.6)", pointerEvents: "none" }}>
                      <div style={{ color: D.accent, fontWeight: 800, fontSize: 12, fontFamily: "'DM Mono',monospace", marginBottom: 4 }}>{node.id}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.stroke, flexShrink: 0 }} />
                        <span style={{ color: D.text, fontSize: 11, fontWeight: 600 }}>{node.status}</span>
                      </div>
                      <div style={{ color: D.textMid, fontSize: 10.5 }}>{node.weldType} · {PROCESS_LABEL[node.process] ?? node.process}</div>
                      <div style={{ color: D.textMid, fontSize: 10.5, marginTop: 1 }}>Welder: {node.welder}</div>
                      <div style={{ color: D.textSoft, fontSize: 10, marginTop: 1 }}>{seamPos(node)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Fixed overlays ── */}

          {/* Status summary */}
          <div style={{ position: "absolute", top: 14, left: 14, background: `${D.surface}f0`, border: `1px solid ${D.border}`, borderRadius: 8, padding: "12px 14px", zIndex: 50, pointerEvents: "none", minWidth: 196, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            <div style={{ color: D.textMid, fontWeight: 700, fontSize: 9.5, marginBottom: 9, letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: `1px solid ${D.border}`, paddingBottom: 6, fontFamily: "'DM Mono',monospace" }}>STATUS SUMMARY</div>
            {active.map(s => {
              const c = WELD_STATUS_COLORS[s] ?? { fill: D.surfaceAlt, stroke: D.border, text: D.textSoft };
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.fill, border: `2px solid ${c.stroke}`, flexShrink: 0 }} />
                  <span style={{ color: D.textMid, fontSize: 11, flex: 1 }}>{s}</span>
                  <span style={{ color: D.text, fontWeight: 700, fontSize: 11, fontFamily: "'DM Mono',monospace", minWidth: 16, textAlign: "right" }}>{counts[s]}</span>
                </div>
              );
            })}
            <div style={{ borderTop: `1px solid ${D.border}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: D.textSoft, fontSize: 10 }}>TOTAL WELDS</span>
              <span style={{ color: D.text, fontWeight: 800, fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{WELD_MAP_NODES.length}</span>
            </div>
          </div>

          {/* Zoom controls */}
          <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 4, zIndex: 50 }}>
            {([["＋", zoomIn, "Zoom in"], ["－", zoomOut, "Zoom out"], ["⊙", resetView, "Reset"]] as const).map(([lbl, fn, title]) => (
              <button key={lbl} title={title} onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); fn(); }}
                style={{ width: 32, height: 32, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 6, color: D.textMid, cursor: "pointer", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {lbl}
              </button>
            ))}
            <div style={{ color: D.textSoft, fontSize: 10, textAlign: "center", marginTop: 1, fontFamily: "'DM Mono',monospace" }}>{Math.round(transform.scale * 100)}%</div>
          </div>
        </div>

        {/* ── Detail panel ── */}
        {selectedNode && (() => {
          const sc = WELD_STATUS_COLORS[selectedNode.status] ?? { fill: D.surfaceAlt, stroke: D.border, text: D.textSoft };
          return (
            <div style={{ width: 290, background: D.surface, borderLeft: `1px solid ${D.border}`, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: D.surfaceAlt, borderBottom: `1px solid ${D.border}`, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                  <div style={{ color: D.textSoft, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>Weld Joint</div>
                  <div style={{ color: D.accent, fontWeight: 800, fontSize: 20, fontFamily: "'DM Mono',monospace", lineHeight: 1.1 }}>{selectedNode.id}</div>
                </div>
                <button onClick={() => setSelectedNode(null)} style={{ background: D.surface, border: `1px solid ${D.border}`, color: D.textMid, borderRadius: 5, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>

              {/* Status strip */}
              <div style={{ padding: "8px 16px", background: sc.fill, borderBottom: `1px solid ${sc.stroke}30`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: sc.stroke }} />
                <span style={{ color: sc.text, fontWeight: 700, fontSize: 12 }}>{selectedNode.status}</span>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
                {/* Details */}
                <div style={{ fontSize: 9, fontWeight: 700, color: D.textSoft, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Joint Details</div>
                {([
                  ["Weld ID",   selectedNode.id],
                  ["Joint Type", selectedNode.weldType],
                  ["Process",    PROCESS_LABEL[selectedNode.process] ?? selectedNode.process],
                  ["Welder",    selectedNode.welder],
                  ["Position",  seamPos(selectedNode)],
                ] as [string, string][]).map(([k, v], i) => (
                  <div key={k} style={{ display: "flex", padding: "5px 0", borderBottom: `1px solid ${D.borderSoft}` }}>
                    <span style={{ color: D.textSoft, fontSize: 11, width: 90, flexShrink: 0 }}>{k}</span>
                    <span style={{ color: D.text, fontSize: 11, fontFamily: k === "Weld ID" || k === "Welder" ? "'DM Mono',monospace" : "inherit", fontWeight: k === "Weld ID" ? 700 : 400 }}>{v}</span>
                  </div>
                ))}

                {/* Passport */}
                {passport && (
                  <>
                    <div style={{ fontSize: 9, fontWeight: 700, color: D.textSoft, letterSpacing: "0.12em", textTransform: "uppercase", margin: "14px 0 8px", borderTop: `1px solid ${D.border}`, paddingTop: 12 }}>Inspection Results</div>
                    {([
                      ["VT Result",    passport.vtResult,    passport.vtResult === "PASS"],
                      ...passport.ndtResults.map(n => [`NDT – ${n.method}`, n.result, n.result === "Pass"] as [string, string, boolean]),
                      ["NCRs",         passport.ncrRefs.length === 0 ? "None" : passport.ncrRefs.join(", "), passport.ncrRefs.length === 0],
                      ["Final Status", passport.finalStatus, passport.overallStatus === "Accepted"],
                    ] as [string, string, boolean][]).map(([k, v, ok]) => (
                      <div key={k} style={{ display: "flex", padding: "5px 0", borderBottom: `1px solid ${D.borderSoft}` }}>
                        <span style={{ color: D.textSoft, fontSize: 11, width: 90, flexShrink: 0 }}>{k}</span>
                        <span style={{ color: ok ? D.pass : D.fail, fontSize: 11, fontWeight: 700 }}>{v}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 16 }}>
                  <button onClick={() => openPassport?.(selectedNode.id)}
                    style={{ width: "100%", padding: "9px 14px", background: D.accentFaint, border: `1px solid ${D.accentBorder}`, borderRadius: 6, color: D.accent, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif", textAlign: "left" }}>
                    📋 Open Weld Passport →
                  </button>
                  <button onClick={() => openVT?.(selectedNode.id, nodeProject(selectedNode))}
                    style={{ width: "100%", padding: "9px 14px", background: D.blueFaint, border: `1px solid ${D.blueBorder}`, borderRadius: 6, color: D.blue, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif", textAlign: "left" }}>
                    🔍 Start VT Inspection →
                  </button>
                  <button onClick={() => openNCR?.(selectedNode.id, nodeProject(selectedNode))}
                    style={{ width: "100%", padding: "9px 14px", background: D.failBg, border: `1px solid ${D.failBorder}`, borderRadius: 6, color: D.fail, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif", textAlign: "left" }}>
                    ⚠️ Raise NCR →
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Weld register table ── */}
      <div style={{ borderTop: `1px solid ${D.border}`, background: D.surface, maxHeight: 170, overflowY: "auto", flexShrink: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
            <tr>
              {["Weld ID","Status","Joint Type","Process","Welder","Position"].map(h => (
                <th key={h} style={{ background: D.surfaceAlt, color: D.textMid, padding: "7px 10px", textAlign: "left", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", whiteSpace: "nowrap", borderBottom: `1px solid ${D.border}`, borderRight: `1px solid ${D.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredNodes.map((n, i) => {
              const sc       = WELD_STATUS_COLORS[n.status] ?? { fill: D.surfaceAlt, stroke: D.border, text: D.textSoft };
              const isActive = selectedNode?.id === n.id;
              return (
                <tr key={n.id} onClick={() => setSelectedNode(n)}
                  style={{ background: isActive ? D.surfaceHov : i % 2 === 0 ? D.surface : D.surfaceAlt, cursor: "pointer", borderLeft: isActive ? `2px solid ${D.accent}` : `2px solid transparent`, transition: "background 0.1s" }}>
                  <td style={{ padding: "5px 10px", fontFamily: "'DM Mono',monospace", fontWeight: 700, color: D.accent, fontSize: 11 }}>{n.id}</td>
                  <td style={{ padding: "5px 10px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.stroke, flexShrink: 0 }} />
                      <span style={{ color: sc.text, fontWeight: 600, fontSize: 10.5 }}>{n.status}</span>
                    </span>
                  </td>
                  <td style={{ padding: "5px 10px", color: D.textMid }}>{n.weldType}</td>
                  <td style={{ padding: "5px 10px", color: D.blue, fontFamily: "'DM Mono',monospace", fontSize: 10.5 }}>{PROCESS_LABEL[n.process] ?? n.process}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "'DM Mono',monospace", color: D.textMid }}>{n.welder}</td>
                  <td style={{ padding: "5px 10px", color: D.textSoft, fontSize: 10.5 }}>{seamPos(n)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
