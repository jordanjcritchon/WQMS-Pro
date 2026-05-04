import React from "react";
import { D } from "../theme";
import { NAV } from "../nav";

interface PlaceholderModuleProps {
  id: string;
}

export const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({ id }) => (
  <div style={{ padding: 60, textAlign: "center" }}>
    <div style={{ fontSize: 44, marginBottom: 18 }}>🚧</div>
    <div style={{ color: D.text, fontWeight: 700, fontSize: 18, fontFamily: "'Inter',sans-serif", marginBottom: 10 }}>
      {NAV.find(n => n.id === id)?.label}
    </div>
    <div style={{ color: D.textSoft, fontSize: 13, maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
      This module is part of the full WQMS Pro suite.
    </div>
    <div style={{ color: D.textSoft, fontSize: 12, marginTop: 16 }}>Scheduled for next release.</div>
  </div>
);
