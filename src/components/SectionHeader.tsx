import React from "react";
import { D } from "../theme";

interface SectionHeaderProps {
  icon?:    string;
  children: React.ReactNode;
  mt?:      number;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon: _icon, children, mt }) => (
  <div
    style={{
      display:       "flex",
      alignItems:    "center",
      gap:           8,
      color:         D.textMid,
      fontSize:      11,
      fontWeight:    600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      marginBottom:  12,
      marginTop:     mt ?? 18,
      paddingBottom: 8,
      borderBottom:  `1px solid ${D.border}`,
    }}
  >
    <div style={{ width: 3, height: 12, background: D.accent, borderRadius: 2, flexShrink: 0 }} />
    {children}
  </div>
);
