import React from "react";
import { D } from "../theme";
import { Card } from "./Card";

interface StatCardProps {
  label:    string;
  value:    string | number;
  sub?:     string;
  color?:   string;
  icon?:    string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color, icon, onClick }) => (
  <Card onClick={onClick} s={{ padding: "16px 18px", cursor: onClick ? "pointer" : undefined }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <div
          style={{
            color:         D.textSoft,
            fontSize:      11,
            fontWeight:    500,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom:  10,
          }}
        >
          {label}
        </div>
        <div
          style={{
            color:      color || D.text,
            fontSize:   26,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ color: D.textMid, fontSize: 12, marginTop: 6 }}>{sub}</div>
        )}
      </div>
      {icon && (
        <div style={{
          width:          34,
          height:         34,
          background:     D.surfaceAlt,
          borderRadius:   8,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       11,
          fontWeight:     700,
          color:          D.textSoft,
          fontFamily:     "'DM Mono',monospace",
          border:         `1px solid ${D.border}`,
          letterSpacing:  "0.04em",
          flexShrink:     0,
        }}>
          {icon}
        </div>
      )}
    </div>
    {color && (
      <div style={{
        height:       2,
        background:   color,
        borderRadius: 1,
        marginTop:    14,
        opacity:      0.4,
      }} />
    )}
  </Card>
);
