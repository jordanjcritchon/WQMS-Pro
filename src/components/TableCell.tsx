import React from "react";
import { D } from "../theme";

interface THProps {
  children:  React.ReactNode;
  center?:   boolean;
}

export const TH: React.FC<THProps> = ({ children, center }) => (
  <th
    style={{
      color:         D.textSoft,
      fontWeight:    600,
      fontSize:      11,
      letterSpacing: "0.05em",
      textAlign:     center ? "center" : "left",
      padding:       "10px 12px",
      whiteSpace:    "nowrap",
      borderBottom:  `1px solid ${D.border}`,
      background:    D.surfaceAlt,
    }}
  >
    {children}
  </th>
);

interface TDProps {
  children:  React.ReactNode;
  mono?:     boolean;
  center?:   boolean;
  color?:    string;
  style?:    React.CSSProperties;
}

export const TD: React.FC<TDProps> = ({ children, mono, center, color, style: st }) => (
  <td
    style={{
      padding:      "10px 12px",
      color:        color || D.textMid,
      fontSize:     12,
      fontFamily:   mono ? "'DM Mono',monospace" : undefined,
      textAlign:    center ? "center" : undefined,
      borderBottom: `1px solid ${D.borderSoft}`,
      ...st,
    }}
  >
    {children}
  </td>
);
