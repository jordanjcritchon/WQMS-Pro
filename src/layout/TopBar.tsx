import React, { useState } from "react";
import { D, inp } from "../theme";
import { NAV } from "../nav";
import { ALERTS } from "../data";
import type { UserProfile } from "../App";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

interface TopBarProps {
  active:       string;
  collapsed:    boolean;
  setCollapsed: (fn: (c: boolean) => boolean) => void;
  searchQ:      string;
  setSearchQ:   (q: string) => void;
  setActive:    (id: string) => void;
  user:         UserProfile;
}

const CREATE_ITEMS: [string, string][] = [
  ["Log Weld",       "traceability"],
  ["VT Inspection",  "vt"],
  ["Open Passport",  "passport"],
  ["Raise NCR",      "ncr"],
  ["New WPS",        "wps"],
  ["HT Record",      "heat"],
];

export const TopBar: React.FC<TopBarProps> = ({
  active, collapsed, setCollapsed, searchQ, setSearchQ, setActive, user,
}) => {
  const [showNotif,  setShowNotif]  = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const title = NAV.find(n => n.id === active);

  return (
    <div
      style={{
        background:     D.surface,
        borderBottom:   `1px solid ${D.border}`,
        padding:        "0 20px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        height:         52,
        flexShrink:     0,
        gap:            16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background:   "none",
            border:       "none",
            color:        D.textMid,
            cursor:       "pointer",
            padding:      "4px 6px",
            borderRadius: 6,
            fontSize:     18,
            lineHeight:   1,
            display:      "flex",
            alignItems:   "center",
          }}
        >
          {collapsed ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="4" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="7.25" width="8" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="4" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="2" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          )}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width:          22,
              height:         22,
              background:     D.accent,
              borderRadius:   5,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       9,
              fontWeight:     700,
              color:          "#fff",
              fontFamily:     "'DM Mono',monospace",
              letterSpacing:  "0.04em",
              flexShrink:     0,
            }}
          >
            {title?.icon}
          </div>
          <span style={{ color: D.text, fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>
            {title?.label}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="6" cy="6" r="4" stroke={D.textSoft} strokeWidth="1.5"/>
            <path d="M9.5 9.5L12 12" stroke={D.textSoft} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search…"
            style={{ ...inp, width: 220, padding: "7px 12px 7px 32px", fontSize: 13 }}
          />
        </div>

        {/* Create menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowCreate(s => !s)}
            style={{
              background:   D.accent,
              border:       "none",
              color:        "#fff",
              padding:      "7px 14px",
              borderRadius: 6,
              cursor:       "pointer",
              fontWeight:   600,
              fontSize:     13,
              fontFamily:   "'Inter',sans-serif",
              letterSpacing: "-0.01em",
              whiteSpace:   "nowrap",
            }}
          >
            + New
          </button>
          {showCreate && (
            <div
              style={{
                position:     "absolute",
                right:        0,
                top:          40,
                width:        190,
                background:   D.surface,
                border:       `1px solid ${D.border}`,
                borderRadius: 8,
                boxShadow:    D.shadowMd,
                zIndex:       2000,
                overflow:     "hidden",
                padding:      4,
              }}
            >
              {CREATE_ITEMS.map(([label, target]) => (
                <button
                  key={label}
                  onClick={() => { setActive(target); setShowCreate(false); }}
                  style={{
                    width:        "100%",
                    display:      "block",
                    padding:      "8px 12px",
                    border:       "none",
                    background:   "transparent",
                    color:        D.textMid,
                    fontSize:     13,
                    cursor:       "pointer",
                    textAlign:    "left",
                    borderRadius: 5,
                    fontFamily:   "'Inter',sans-serif",
                    fontWeight:   500,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotif(s => !s)}
            style={{
              background:   D.surfaceAlt,
              border:       `1px solid ${D.border}`,
              borderRadius: 6,
              padding:      "6px 10px",
              cursor:       "pointer",
              color:        D.textMid,
              position:     "relative",
              display:      "flex",
              alignItems:   "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C5.79 2 4 3.79 4 6v3l-1.5 2h11L12 9V6c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span
              style={{
                position:     "absolute",
                top:          5,
                right:        7,
                width:        6,
                height:       6,
                background:   D.fail,
                borderRadius: "50%",
                border:       `1.5px solid ${D.surface}`,
              }}
            />
          </button>
          {showNotif && (
            <div
              style={{
                position:     "absolute",
                right:        0,
                top:          42,
                width:        340,
                background:   D.surface,
                border:       `1px solid ${D.border}`,
                borderRadius: 10,
                boxShadow:    D.shadowMd,
                zIndex:       2000,
                overflow:     "hidden",
              }}
            >
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${D.border}`, color: D.text, fontWeight: 600, fontSize: 13 }}>
                Alerts
              </div>
              {ALERTS.map(a => (
                <div key={a.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${D.borderSoft}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                    background: a.type === "critical" ? D.fail : a.type === "warn" ? D.warn : D.textMid,
                  }} />
                  <div>
                    <div style={{ color: a.type === "critical" ? D.fail : a.type === "warn" ? D.warn : D.textMid, fontSize: 12, lineHeight: 1.5 }}>
                      {a.msg}
                    </div>
                    <div style={{ color: D.textSoft, fontSize: 11, marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div
          style={{
            width:          30,
            height:         30,
            background:     `linear-gradient(135deg, #4f52cc, #7c3aed)`,
            borderRadius:   "50%",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       11,
            color:          "#fff",
            fontWeight:     700,
            letterSpacing:  "0.02em",
            flexShrink:     0,
          }}
        >
          {initials(user.name)}
        </div>
      </div>
    </div>
  );
};
