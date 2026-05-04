import React from "react";
import { D } from "../theme";
import { Card, StatusDot, Progress, Button } from "../components";
import { PROJECTS } from "../data";
import { PROJ_SM } from "../statusMeta";

export const ProjectsModule: React.FC = () => (
  <div style={{ padding: 20, overflowY: "auto" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>ACTIVE PROJECTS</div>
      <Button>+ New Project</Button>
    </div>
    {PROJECTS.map(p => {
      const statusColor = p.status === "On Track" ? D.pass : p.status === "At Risk" ? D.warn : D.fail;
      return (
        <Card key={p.id} s={{ padding: 20, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: D.accent, fontWeight: 700, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>{p.id}</span>
                <StatusDot status={p.status} meta={PROJ_SM} />
              </div>
              <div style={{ color: D.text, fontWeight: 700, fontSize: 16, fontFamily: "'Inter',sans-serif" }}>{p.name}</div>
              <div style={{ color: D.textSoft, fontSize: 12, marginTop: 2 }}>{p.client} · {p.standard} · Due {p.due}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: statusColor, fontSize: 26, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>{p.progress}%</div>
            </div>
          </div>

          <Progress value={p.progress} color={statusColor} h={8} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 12 }}>
            {([["Total", p.welds.total, D.textMid], ["Complete", p.welds.complete, D.pass], ["Pending", p.welds.pending, D.warn], ["Rejected", p.welds.rejected, D.fail]] as const).map(([l, v, c]) => (
              <div key={l} style={{ background: D.surfaceAlt, borderRadius: 7, padding: "10px 12px", border: `1px solid ${D.border}` }}>
                <div style={{ color: D.textSoft, fontSize: 10, letterSpacing: "0.05em", marginBottom: 3 }}>{l.toUpperCase()}</div>
                <div style={{ color: c, fontWeight: 700, fontSize: 20, fontFamily: "'Inter',sans-serif" }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      );
    })}
  </div>
);
