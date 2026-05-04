import React from "react";
import { D } from "../theme";

interface FieldRowProps {
  label:   string;
  value?:  string | number | null;
  mono?:   boolean;
  accent?: boolean;
  color?:  string;
}

export const FieldRow: React.FC<FieldRowProps> = ({ label, value, mono, accent, color }) => (
  <div style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "baseline" }}>
    <span style={{ color: D.textSoft, fontSize: 12, minWidth: 148, flexShrink: 0 }}>{label}</span>
    <span
      style={{
        color:      color || (accent ? D.accent : D.text),
        fontSize:   13,
        fontWeight: mono ? 400 : 500,
        fontFamily: mono ? "'DM Mono',monospace" : "'Inter',sans-serif",
        letterSpacing: mono ? "0.02em" : "-0.01em",
      }}
    >
      {value ?? "—"}
    </span>
  </div>
);
