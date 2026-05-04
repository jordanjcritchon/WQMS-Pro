import React from "react";
import { D } from "../theme";
import type { StatusMetaMap } from "../types";

interface StatusDotProps {
  status: string;
  meta:   StatusMetaMap;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, meta }) => {
  const m = meta[status] ?? { dot: D.textSoft, bg: D.surfaceAlt, text: D.textMid };
  return (
    <span
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          5,
        background:   m.bg,
        color:        m.text,
        borderRadius: 99,
        padding:      "3px 9px",
        fontSize:     11,
        fontWeight:   500,
        whiteSpace:   "nowrap",
        letterSpacing: "0.01em",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};
