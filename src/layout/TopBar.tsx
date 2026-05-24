import React, { useState } from "react";
import { D, inp } from "../theme";
import { NAV } from "../nav";
import { ALERTS } from "../data";
import { useIsMobile } from "../hooks/useIsMobile";
import { WQLogo } from "../components";
import type { UserProfile } from "../App";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

interface TopBarProps {
  active:        string;
  collapsed:     boolean;
  setCollapsed:  (fn: (c: boolean) => boolean) => void;
  searchQ:       string;
  setSearchQ:    (q: string) => void;
  setActive:     (id: string) => void;
  user:          UserProfile;
  onMobileMenu:  () => void;
}

const CREATE_ITEMS: [string, string][] = [
  ["Log Weld",       "weldregister"],
  ["VT Inspection",  "inspection"],
  ["Open Passport",  "weldregister"],
  ["Raise NCR",      "ncr"],
  ["New WPS",        "wps"],
  ["HT Record",      "materials"],
];

export const TopBar: React.FC<TopBarProps> = ({
  active, collapsed, setCollapsed, searchQ, setSearchQ, setActive, user, onMobileMenu,
}) => {
  const isMobile = useIsMobile();
  const [showNotif,   setShowNotif]   = useState(false);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showSearch,  setShowSearch]  = useState(false);
  const title = NAV.find(n => n.id === active);

  return (
    <div style={{
      background:     D.surface,
      borderBottom:   `1px solid ${D.border}`,
      padding:        isMobile ? "0 12px" : "0 20px",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      height:         isMobile ? 56 : 52,
      flexShrink:     0,
      gap:            8,
    }}>

      {/* Left — hamburger + title */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14, minWidth: 0 }}>
        <button
          onClick={isMobile ? onMobileMenu : () => setCollapsed(c => !c)}
          style={{
            background: "none", border: "none", color: D.textMid,
            cursor: "pointer", padding: "4px 6px", borderRadius: 6,
            fontSize: 18, lineHeight: 1,
            display: "flex", alignItems: "center", flexShrink: 0,
            minWidth: 32, minHeight: 32,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="4.5"  width="14" height="1.75" rx="0.875" fill="currentColor"/>
            <rect x="2" y="8.25" width={isMobile || !collapsed ? "14" : "9"} height="1.75" rx="0.875" fill="currentColor"/>
            <rect x="2" y="12"   width="14" height="1.75" rx="0.875" fill="currentColor"/>
          </svg>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{
            width: 24, height: 24, background: D.accent, borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, color: "#fff",
            fontFamily: "'DM Mono',monospace", letterSpacing: "0.04em", flexShrink: 0,
          }}>
            {title?.icon}
          </div>
          <span style={{
            color: D.text, fontWeight: 600,
            fontSize: isMobile ? 15 : 14,
            letterSpacing: "-0.01em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {title?.label}
          </span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, flexShrink: 0 }}>

        {/* Desktop: full search bar */}
        {!isMobile && (
          <div style={{ position: "relative" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="6" cy="6" r="4" stroke={D.textSoft} strokeWidth="1.5"/>
              <path d="M9.5 9.5L12 12" stroke={D.textSoft} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search…"
              style={{ ...inp, width: 200, padding: "7px 12px 7px 32px", fontSize: 13 }} />
          </div>
        )}

        {/* Mobile: search icon → inline expand */}
        {isMobile && showSearch && (
          <input
            value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search…" autoFocus
            onBlur={() => { if (!searchQ) setShowSearch(false); }}
            style={{ ...inp, width: 140, padding: "7px 10px", fontSize: 13 }}
          />
        )}
        {isMobile && !showSearch && (
          <button
            onClick={() => setShowSearch(true)}
            style={{ background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: D.textMid, display: "flex", alignItems: "center" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {/* + New */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowCreate(s => !s)}
            style={{
              background: D.accent, border: "none", color: "#fff",
              padding: isMobile ? "8px 12px" : "7px 14px",
              borderRadius: 6, cursor: "pointer", fontWeight: 600,
              fontSize: isMobile ? 14 : 13,
              fontFamily: "'Inter',sans-serif", letterSpacing: "-0.01em", whiteSpace: "nowrap",
            }}
          >
            {isMobile ? "+" : "+ New"}
          </button>
          {showCreate && (
            <div style={{
              position: "absolute", right: 0, top: 44,
              width: 190, background: D.surface,
              border: `1px solid ${D.border}`, borderRadius: 8,
              boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
              zIndex: 2000, overflow: "hidden", padding: 4,
            }}>
              {CREATE_ITEMS.map(([label, target]) => (
                <button key={label}
                  onClick={() => { setActive(target); setShowCreate(false); }}
                  style={{
                    width: "100%", display: "block",
                    padding: isMobile ? "12px 14px" : "8px 12px",
                    border: "none", background: "transparent",
                    color: D.textMid, fontSize: 13, cursor: "pointer",
                    textAlign: "left", borderRadius: 5,
                    fontFamily: "'Inter',sans-serif", fontWeight: 500,
                    minHeight: isMobile ? 44 : "auto",
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
              background: D.surfaceAlt, border: `1px solid ${D.border}`, borderRadius: 6,
              padding: isMobile ? "7px 9px" : "6px 10px",
              cursor: "pointer", color: D.textMid, position: "relative",
              display: "flex", alignItems: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C5.79 2 4 3.79 4 6v3l-1.5 2h11L12 9V6c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span style={{
              position: "absolute", top: 5, right: 7,
              width: 6, height: 6, background: D.fail,
              borderRadius: "50%", border: `1.5px solid ${D.surface}`,
            }}/>
          </button>
          {showNotif && (
            <div style={{
              position: "absolute", right: 0, top: 44,
              width: isMobile ? 300 : 340,
              background: D.surface, border: `1px solid ${D.border}`,
              borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
              zIndex: 2000, overflow: "hidden",
            }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${D.border}`, color: D.text, fontWeight: 600, fontSize: 13 }}>
                Alerts
              </div>
              {ALERTS.map(a => (
                <div key={a.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${D.borderSoft}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                    background: a.type === "critical" ? D.fail : a.type === "warn" ? D.warn : D.textMid,
                  }}/>
                  <div>
                    <div style={{ color: a.type === "critical" ? D.fail : a.type === "warn" ? D.warn : D.textMid, fontSize: 12, lineHeight: 1.5 }}>{a.msg}</div>
                    <div style={{ color: D.textSoft, fontSize: 11, marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Brand logo — desktop top-right */}
        {!isMobile && <WQLogo size={32} />}
      </div>
    </div>
  );
};
