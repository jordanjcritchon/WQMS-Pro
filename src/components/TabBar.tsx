import React from "react";
import { D } from "../theme";

type TabEntry = [id: string, label: string, badge?: number];

interface TabBarProps {
  tabs:      TabEntry[];
  active:    string;
  setActive: (id: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, active, setActive }) => (
  <div
    style={{
      background:   D.surface,
      borderBottom: `1px solid ${D.border}`,
      display:      "flex",
      paddingLeft:  16,
      flexShrink:   0,
      gap:          2,
    }}
  >
    {tabs.map(([id, label, badge]) => {
      const sel = active === id;
      return (
        <button
          key={id}
          onClick={() => setActive(id)}
          style={{
            background:    "none",
            border:        "none",
            borderBottom:  `2px solid ${sel ? D.accent : "transparent"}`,
            color:         sel ? D.text : D.textMid,
            padding:       "11px 14px",
            cursor:        "pointer",
            fontSize:      13,
            fontWeight:    sel ? 600 : 400,
            fontFamily:    "'Inter',sans-serif",
            display:       "flex",
            alignItems:    "center",
            gap:           7,
            whiteSpace:    "nowrap",
            letterSpacing: "-0.01em",
            transition:    "color 0.12s",
          }}
        >
          {label}
          {(badge ?? 0) > 0 && (
            <span
              style={{
                background:   D.fail,
                color:        "#fff",
                borderRadius: 99,
                padding:      "1px 6px",
                fontSize:     10,
                fontWeight:   700,
                lineHeight:   1.5,
              }}
            >
              {badge}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
