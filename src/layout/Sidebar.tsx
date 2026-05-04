import React, { useState } from "react";
import { D, inp } from "../theme";
import { NAV, NAV_GROUPS } from "../nav";
import { NCR_DATA, NDT_EQUIP } from "../data";
import type { UserProfile } from "../App";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

interface SidebarProps {
  active:    string;
  setActive: (id: string) => void;
  collapsed: boolean;
  user:      UserProfile;
  setUser:   (u: UserProfile) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ active, setActive, collapsed, user, setUser }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState<UserProfile>(user);

  const openEdit = () => { setDraft(user); setEditing(true); };
  const saveEdit = () => { if (draft.name.trim()) { setUser({ name: draft.name.trim(), role: draft.role.trim() }); } setEditing(false); };
  const cancelEdit = () => setEditing(false);
  const groups: Record<string, typeof NAV> = {};
  NAV.forEach(n => {
    if (!groups[n.group]) groups[n.group] = [];
    groups[n.group].push(n);
  });

  const getBadge = (id: string) => {
    if (id === "ncr") return NCR_DATA.filter(n => n.status !== "Closed").length;
    if (id === "ndt") return NDT_EQUIP.filter(e => e.calibStatus === "Expired").length;
    return 0;
  };

  return (
    <div
      style={{
        width:         collapsed ? 52 : 220,
        background:    D.surface,
        borderRight:   `1px solid ${D.border}`,
        display:       "flex",
        flexDirection: "column",
        height:        "100vh",
        flexShrink:    0,
        transition:    "width 0.2s ease",
        overflow:      "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding:      collapsed ? "18px 0" : "18px 16px",
          borderBottom: `1px solid ${D.border}`,
          display:      "flex",
          alignItems:   "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap:          10,
          flexShrink:   0,
        }}
      >
        <div
          style={{
            width:          28,
            height:         28,
            background:     D.accent,
            borderRadius:   7,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
            <rect x="8" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.5" />
            <rect x="1" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.5" />
            <rect x="8" y="8" width="5" height="5" rx="1" fill="white" />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: D.text, fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
              WQMS<span style={{ color: D.accent }}> Pro</span>
            </div>
            <div style={{ color: D.textSoft, fontSize: 10, whiteSpace: "nowrap", letterSpacing: "0.05em", marginTop: 1 }}>
              ISO 3834 · v3.0
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 4 }}>
            {!collapsed && (
              <div style={{
                color:         D.textSoft,
                fontSize:      10,
                fontWeight:    600,
                letterSpacing: "0.10em",
                padding:       "10px 16px 4px",
              }}>
                {NAV_GROUPS[group]}
              </div>
            )}
            {items.map(item => {
              const sel   = active === item.id;
              const badge = getBadge(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    width:          "100%",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap:            9,
                    padding:        collapsed ? "7px 0" : "6px 10px 6px 14px",
                    border:         "none",
                    background:     sel ? D.accentFaint : "transparent",
                    color:          sel ? D.accent : D.textMid,
                    fontWeight:     sel ? 600 : 400,
                    fontSize:       13,
                    cursor:         "pointer",
                    fontFamily:     "'Inter',sans-serif",
                    borderLeft:     `2px solid ${sel ? D.accent : "transparent"}`,
                    transition:     "all 0.1s",
                    textAlign:      "left",
                    margin:         "1px 0",
                  }}
                >
                  <div
                    style={{
                      width:          22,
                      height:         22,
                      background:     sel ? D.accent : D.surfaceAlt,
                      borderRadius:   5,
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      fontSize:       9,
                      fontWeight:     700,
                      color:          sel ? "#fff" : D.textSoft,
                      fontFamily:     "'DM Mono',monospace",
                      flexShrink:     0,
                      letterSpacing:  "0.04em",
                      border:         `1px solid ${sel ? D.accentBorder : D.border}`,
                    }}
                  >
                    {item.icon}
                  </div>
                  {!collapsed && (
                    <span style={{ flex: 1, whiteSpace: "nowrap", fontSize: 13 }}>{item.label}</span>
                  )}
                  {!collapsed && badge > 0 && (
                    <span style={{
                      background:   D.fail,
                      color:        "#fff",
                      borderRadius: 99,
                      padding:      "1px 6px",
                      fontSize:     10,
                      fontWeight:   700,
                      lineHeight:   1.4,
                    }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User footer */}
      {editing && !collapsed ? (
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${D.border}`, background: D.surfaceAlt }}>
          <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>EDIT PROFILE</div>
          <input
            value={draft.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder="Full name"
            style={{ ...inp, marginBottom: 6, fontSize: 12, padding: "6px 10px" }}
            autoFocus
          />
          <input
            value={draft.role}
            onChange={e => setDraft(d => ({ ...d, role: e.target.value }))}
            placeholder="Role / title"
            style={{ ...inp, marginBottom: 10, fontSize: 12, padding: "6px 10px" }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={saveEdit}
              style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", background: D.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${D.border}`, background: "transparent", color: D.textMid, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={collapsed ? undefined : openEdit}
          title={collapsed ? user.name : "Click to edit profile"}
          style={{
            padding:        collapsed ? "12px 0" : "12px 16px",
            borderTop:      `1px solid ${D.border}`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap:            10,
            cursor:         collapsed ? "default" : "pointer",
          }}
        >
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
              flexShrink:     0,
              letterSpacing:  "0.02em",
            }}
          >
            {initials(user.name)}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: D.text, fontSize: 13, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ color: D.textSoft, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.role}</div>
            </div>
          )}
          {!collapsed && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
              <path d="M8.5 1.5a1.5 1.5 0 0 1 2.12 2.12L4 10.24l-2.5.5.5-2.5L8.5 1.5z" stroke={D.textSoft} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      )}
    </div>
  );
};
