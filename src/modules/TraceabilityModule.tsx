import React from "react";
import { D } from "../theme";
import { Tag, StatusDot, TH, TD, Button } from "../components";

interface WeldRow {
  id:         string;
  project:    string;
  wpsId:      string;
  welderName: string;
  position:   string;
  material:   string;
  thickness:  number;
  vtResult:   string;
  ndtResult:  string;
  status:     string;
  date:       string;
}

const WELDS: WeldRow[] = [
  { id:"W-001",project:"PRJ-001",wpsId:"WPS-001",welderName:"J. Kowalski",position:"PC",  material:"AS/NZS 3678-350",thickness:12,vtResult:"PASS", ndtResult:"PASS – MT",     status:"Complete",date:"2025-11-15" },
  { id:"W-002",project:"PRJ-001",wpsId:"WPS-001",welderName:"J. Kowalski",position:"PF",  material:"AS/NZS 3678-350",thickness:12,vtResult:"FAIL", ndtResult:"Pending",       status:"Rejected",date:"2025-11-16" },
  { id:"W-022",project:"PRJ-003",wpsId:"WPS-002",welderName:"M. Santos",  position:"PF",  material:"316/316L SS",    thickness:6, vtResult:"PASS", ndtResult:"PASS – RT",     status:"Complete",date:"2026-01-10" },
  { id:"W-025",project:"PRJ-003",wpsId:"WPS-002",welderName:"M. Santos",  position:"H-L045",material:"316/316L SS", thickness:8, vtResult:"FAIL", ndtResult:"FAIL – crack",  status:"Rejected",date:"2026-01-12" },
  { id:"W-047",project:"PRJ-004",wpsId:"WPS-006",welderName:"D. Nguyen",  position:"PA",  material:"AS/NZS 3678-350",thickness:16,vtResult:"Pending",ndtResult:"Not Started",status:"NCR Open",date:"2026-02-01" },
];

const STATUS_META: Record<string, { dot: string; bg: string; text: string }> = {
  Complete:  { dot: "#22c97a", bg: "rgba(34,201,122,0.10)", text: "#22c97a" },
  Rejected:  { dot: "#e04848", bg: "rgba(224,72,72,0.10)",  text: "#e04848" },
  "NCR Open":{ dot: "#e04848", bg: "rgba(224,72,72,0.10)",  text: "#e04848" },
};

export const TraceabilityModule: React.FC = () => (
  <div style={{ padding: 18, overflowY: "auto" }}>
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
      <Button color={D.pass}>+ Log Weld</Button>
    </div>
    <div style={{ overflowX: "auto", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, boxShadow: D.shadow }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {["Weld ID","Project","WPS","Welder","Position","Material","t(mm)","VT","NDT","Status","Date"].map(h => (
              <TH key={h}>{h}</TH>
            ))}
          </tr>
        </thead>
        <tbody>
          {WELDS.map((w, i) => (
            <tr key={w.id} style={{ borderBottom: `1px solid ${D.borderSoft}`, background: i % 2 === 0 ? D.surface : "transparent" }}>
              <TD mono color={D.accent} style={{ fontWeight: 700 }}>{w.id}</TD>
              <TD>{w.project}</TD>
              <TD mono color="#6ea4f0">{w.wpsId}</TD>
              <TD>{w.welderName}</TD>
              <TD>{w.position}</TD>
              <TD>{w.material}</TD>
              <TD center>{w.thickness}</TD>
              <TD color={w.vtResult === "PASS" ? D.pass : w.vtResult === "FAIL" ? D.fail : D.textMid} style={{ fontWeight: 700 }}>{w.vtResult}</TD>
              <TD>{w.ndtResult}</TD>
              <TD><StatusDot status={w.status} meta={STATUS_META} /></TD>
              <TD>{w.date}</TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
