import React, { useState } from "react";
import { D } from "../theme";
import { WPSModule }           from "./WPSModule";
import WPSValidationEngine     from "../WPSValidationEngine";

const TABS = ["WPS & PQR Register", "AI Validation Engine"] as const;

export const WPSHubModule: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Tab bar */}
      <div style={{ background: D.surface, borderBottom: `1px solid ${D.border}`, display: "flex", paddingLeft: 16, flexShrink: 0, gap: 2 }}>
        {TABS.map((label, i) => {
          const sel = tab === i;
          return (
            <button key={i} onClick={() => setTab(i)} style={{
              background: "none", border: "none",
              borderBottom: `2px solid ${sel ? D.accent : "transparent"}`,
              color: sel ? D.text : D.textMid,
              padding: "11px 14px", cursor: "pointer", fontSize: 13,
              fontWeight: sel ? 600 : 400, fontFamily: "'Inter',sans-serif",
              whiteSpace: "nowrap", letterSpacing: "-0.01em", transition: "color 0.12s",
            }}>
              {label}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {tab === 0 && <WPSModule />}
        {tab === 1 && <WPSValidationEngine />}
      </div>
    </div>
  );
};
