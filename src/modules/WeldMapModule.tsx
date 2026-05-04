import React, { useState, useRef, useEffect, useCallback } from "react";
import { D, inp } from "../theme";
import { Tag, FieldRow, SectionHeader, TH, TD, Button } from "../components";
import { WELD_MAP_NODES, PROJECTS, WELD_PASSPORTS } from "../data";
import { WELD_STATUS_COLORS } from "../statusMeta";
import type { WeldMapNode } from "../types";

interface WeldMapModuleProps {
  openPassport?: (id: string) => void;
  openNCR?:      (weldId: string, project: string) => void;
  openVT?:       (weldId: string, project: string) => void;
}

interface Transform { scale: number; x: number; y: number; }

export const WeldMapModule: React.FC<WeldMapModuleProps> = ({ openPassport, openNCR, openVT }) => {
  const [selectedNode,    setSelectedNode]    = useState<WeldMapNode | null>(null);
  const [filterStatus,    setFilterStatus]    = useState("All");
  const [filterWelder,    setFilterWelder]    = useState("All");
  const [hoveredNode,     setHoveredNode]     = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState("PRJ-001");
  const [transform,       setTransform]       = useState<Transform>({ scale: 1, x: 0, y: 0 });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isDragging      = useRef(false);
  const hasDragged      = useRef(false);
  const lastPos         = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setTransform(t => {
      const newScale = Math.max(0.4, Math.min(5, t.scale * factor));
      const rect = mapContainerRef.current?.getBoundingClientRect();
      if (!rect) return { ...t, scale: newScale };
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const ratio = newScale / t.scale;
      return { scale: newScale, x: cx - ratio * (cx - t.x), y: cy - ratio * (cy - t.y) };
    });
  }, []);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const zoomIn    = () => setTransform(t => ({ ...t, scale: Math.min(5, t.scale * 1.25) }));
  const zoomOut   = () => setTransform(t => ({ ...t, scale: Math.max(0.4, t.scale / 1.25) }));
  const resetView = () => setTransform({ scale: 1, x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    hasDragged.current = false;
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

  const passport = selectedNode ? WELD_PASSPORTS.find(w => w.id === selectedNode.id) : null;

  const getNodeProject = (node: WeldMapNode) => {
    const p = WELD_PASSPORTS.find(w => w.id === node.id);
    if (p) return PROJECTS.find(pr => pr.id === p.projectId)?.name ?? p.projectId;
    return PROJECTS.find(pr => pr.id === selectedProject)?.name ?? selectedProject;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Filter bar */}
      <div style={{ padding: "10px 16px", background: D.surface, borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} style={{ ...inp, width: 240 }}>
          {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.id} – {p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: 160 }}>
          <option value="All">All Statuses</option>
          {Object.keys(WELD_STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterWelder} onChange={e => setFilterWelder(e.target.value)} style={{ ...inp, width: 150 }}>
          <option value="All">All Welders</option>
          {[...new Set(WELD_MAP_NODES.map(n => n.welder))].filter(w => w !== "—").map(w => <option key={w}>{w}</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {([ ["Accepted", D.pass], ["Pending VT", D.warn], ["NCR Open", D.fail], ["Not Started", D.textSoft] ] as const).map(([label, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: D.textSoft }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Map canvas */}
        <div
          ref={mapContainerRef}
          style={{ flex: 1, position: "relative", overflow: "hidden", background: "#0a0f18", cursor: isDragging.current ? "grabbing" : "grab", userSelect: "none" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* Transformed content */}
          <div style={{
            position:        "absolute",
            width:           "100%",
            height:          "100%",
            transformOrigin: "0 0",
            transform:       `translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`,
          }}>
            {/* Grid */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12 }}>
              <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke={D.border} strokeWidth="0.5" /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            {/* Vessel schematic */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <ellipse cx="15%" cy="50%" rx="6%" ry="20%" fill="none" stroke={D.border} strokeWidth="2" />
              <ellipse cx="85%" cy="50%" rx="6%" ry="20%" fill="none" stroke={D.border} strokeWidth="2" />
              <line x1="15%" y1="30%" x2="85%" y2="30%" stroke={D.border} strokeWidth="2" />
              <line x1="15%" y1="70%" x2="85%" y2="70%" stroke={D.border} strokeWidth="2" />
              <line x1="33%" y1="30%" x2="33%" y2="70%" stroke={D.borderSoft} strokeWidth="1" strokeDasharray="4,4" />
              <line x1="51%" y1="30%" x2="51%" y2="70%" stroke={D.borderSoft} strokeWidth="1" strokeDasharray="4,4" />
              <line x1="69%" y1="30%" x2="69%" y2="70%" stroke={D.borderSoft} strokeWidth="1" strokeDasharray="4,4" />
              <text x="24%" y="20%" fontSize="11" fill={D.textSoft} textAnchor="middle">Shell Course 1</text>
              <text x="42%" y="20%" fontSize="11" fill={D.textSoft} textAnchor="middle">Shell Course 2</text>
              <text x="60%" y="20%" fontSize="11" fill={D.textSoft} textAnchor="middle">Shell Course 3</text>
              <text x="77%" y="20%" fontSize="11" fill={D.textSoft} textAnchor="middle">Shell Course 4</text>
            </svg>
            {/* Weld markers */}
            {filteredNodes.map(node => {
              const sc         = WELD_STATUS_COLORS[node.status] ?? WELD_STATUS_COLORS["Not Started"];
              const isSelected = selectedNode?.id === node.id;
              const isHovered  = hoveredNode === node.id;
              return (
                <div
                  key={node.id}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => { if (!hasDragged.current) setSelectedNode(isSelected ? null : node); }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ position: "absolute", left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%,-50%)", zIndex: isSelected ? 20 : 10, cursor: "pointer" }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: sc.fill, border: `2px solid ${isSelected ? D.accent : sc.stroke}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isSelected ? `0 0 0 4px ${D.accentFaint},0 0 12px ${sc.stroke}40` : isHovered ? `0 0 8px ${sc.stroke}60` : "none", transition: "all 0.15s", fontSize: 9, fontWeight: 700, color: sc.text, fontFamily: "'DM Mono',monospace" }}>
                    {node.id.replace("W-", "")}
                  </div>
                  {isHovered && !isSelected && (
                    <div style={{ position: "absolute", bottom: "120%", left: "50%", transform: "translateX(-50%)", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 6, padding: "6px 10px", whiteSpace: "nowrap", zIndex: 100, boxShadow: D.shadowMd, pointerEvents: "none" }}>
                      <div style={{ color: D.accent, fontWeight: 700, fontSize: 11, fontFamily: "'DM Mono',monospace" }}>{node.id}</div>
                      <div style={{ color: sc.text, fontSize: 11, fontWeight: 600 }}>{node.status}</div>
                      <div style={{ color: D.textSoft, fontSize: 10 }}>{node.weldType} · {node.process}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Zoom controls – outside transform */}
          <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 4, zIndex: 50 }}>
            {([["＋", zoomIn, "Zoom in"], ["－", zoomOut, "Zoom out"], ["⊙", resetView, "Reset view"]] as const).map(([label, fn, title]) => (
              <button key={label} title={title} onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); fn(); }}
                style={{ width: 32, height: 32, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 6, color: D.textMid, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {label}
              </button>
            ))}
            <div style={{ color: D.textSoft, fontSize: 10, textAlign: "center", marginTop: 2 }}>{Math.round(transform.scale * 100)}%</div>
          </div>

          {/* Project overlay – outside transform */}
          <div style={{ position: "absolute", top: 12, left: 12, background: `${D.surface}ee`, border: `1px solid ${D.border}`, borderRadius: 8, padding: "10px 14px", minWidth: 200, zIndex: 50, pointerEvents: "none" }}>
            <div style={{ color: D.text, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{PROJECTS.find(p => p.id === selectedProject)?.name}</div>
            {([ ["Accepted", WELD_MAP_NODES.filter(n => n.status === "Accepted").length], ["Pending VT/NDT", WELD_MAP_NODES.filter(n => n.status.includes("Pending")).length], ["NCR/Repair", WELD_MAP_NODES.filter(n => ["NCR Open","Repair Required"].includes(n.status)).length], ["Not Started", WELD_MAP_NODES.filter(n => n.status === "Not Started").length] ] as const).map(([label, count]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ color: D.textSoft, fontSize: 11 }}>{label}</span>
                <span style={{ color: D.text, fontWeight: 700, fontSize: 11 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <div style={{ width: 320, background: D.surface, borderLeft: `1px solid ${D.border}`, padding: 16, overflowY: "auto", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: D.accent, fontWeight: 800, fontSize: 18, fontFamily: "'DM Mono',monospace" }}>{selectedNode.id}</span>
              <button onClick={() => setSelectedNode(null)} style={{ background: "none", border: `1px solid ${D.border}`, color: D.textMid, borderRadius: 5, padding: "4px 9px", cursor: "pointer", fontSize: 11 }}>✕</button>
            </div>
            <div style={{ padding: "8px 12px", background: WELD_STATUS_COLORS[selectedNode.status]?.fill, border: `1px solid ${WELD_STATUS_COLORS[selectedNode.status]?.stroke}`, borderRadius: 7, marginBottom: 12 }}>
              <div style={{ color: WELD_STATUS_COLORS[selectedNode.status]?.text, fontWeight: 700, fontSize: 13 }}>{selectedNode.status}</div>
            </div>
            <FieldRow label="Weld Type" value={selectedNode.weldType} />
            <FieldRow label="Process"   value={selectedNode.process} />
            <FieldRow label="Welder"    value={selectedNode.welder} />
            {passport && (
              <>
                <SectionHeader mt={16}>Passport Preview</SectionHeader>
                <FieldRow label="VT Result"    value={passport.vtResult}   color={passport.vtResult === "PASS" ? D.pass : D.fail} />
                {passport.ndtResults.map(n => <FieldRow key={n.method} label={`NDT – ${n.method}`} value={n.result} color={n.result === "Pass" ? D.pass : D.fail} />)}
                <FieldRow label="NCRs"         value={passport.ncrRefs.length === 0 ? "None" : passport.ncrRefs.join(", ")} color={passport.ncrRefs.length > 0 ? D.fail : D.pass} />
                <FieldRow label="Final Status" value={passport.finalStatus} color={passport.overallStatus === "Accepted" ? D.pass : D.fail} />
              </>
            )}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <Button color={D.blue} onClick={() => openPassport?.(selectedNode.id)}>Open Full Passport</Button>
              <Button color={D.accent} onClick={() => openVT?.(selectedNode.id, getNodeProject(selectedNode))}>Start Inspection</Button>
              <Button color={D.fail} outline onClick={() => openNCR?.(selectedNode.id, getNodeProject(selectedNode))}>Raise NCR</Button>
            </div>
          </div>
        )}
      </div>

      {/* Weld list */}
      <div style={{ borderTop: `1px solid ${D.border}`, background: D.surface, maxHeight: 160, overflowY: "auto", flexShrink: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr>{["Weld ID","Status","Type","Process","Welder","Action"].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
          <tbody>
            {filteredNodes.map((n, i) => {
              const sc = WELD_STATUS_COLORS[n.status] ?? {};
              return (
                <tr key={n.id} onClick={() => setSelectedNode(n)} style={{ background: selectedNode?.id === n.id ? D.surfaceHov : i % 2 === 0 ? D.surface : "transparent", cursor: "pointer" }}>
                  <TD mono color={D.accent} style={{ fontWeight: 700 }}>{n.id}</TD>
                  <TD><span style={{ color: sc.text, fontWeight: 600, fontSize: 11 }}>{n.status}</span></TD>
                  <TD>{n.weldType}</TD>
                  <TD><Tag label={n.process} kind="blue" /></TD>
                  <TD mono>{n.welder}</TD>
                  <TD><button onClick={e => { e.stopPropagation(); setSelectedNode(n); }} style={{ padding: "3px 8px", background: D.accentFaint, border: `1px solid ${D.accentBorder}`, borderRadius: 4, color: D.accent, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Select</button></TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
