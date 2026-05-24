import React, { useState } from "react";
import { D, inp } from "../theme";
import { NAV, NAV_GROUPS } from "../nav";
import { NCR_DATA, NDT_EQUIP } from "../data";
import { useIsMobile } from "../hooks/useIsMobile";
import { WQLogo } from "../components";
import type { UserProfile } from "../App";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

interface SidebarProps {
  active:      string;
  setActive:   (id: string) => void;
  collapsed:   boolean;
  mobileOpen:  boolean;
  onMobileClose: () => void;
  user:        UserProfile;
  setUser:     (u: UserProfile) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  active, setActive, collapsed, mobileOpen, onMobileClose, user, setUser,
}) => {
  const isMobile = useIsMobile();
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState<UserProfile>(user);

  const openEdit   = () => { setDraft(user); setEditing(true); };
  const saveEdit   = () => { if (draft.name.trim()) setUser({ name: draft.name.trim(), role: draft.role.trim() }); setEditing(false); };
  const cancelEdit = () => setEditing(false);

  const groups: Record<string, typeof NAV> = {};
  NAV.forEach(n => { if (!groups[n.group]) groups[n.group] = []; groups[n.group].push(n); });

  const getBadge = (id: string) => {
    if (id === "ncr")        return NCR_DATA.filter(n => n.status !== "Closed").length;
    if (id === "inspection") return NDT_EQUIP.filter(e => e.calibStatus === "Expired").length;
    return 0;
  };

  const handleNav = (id: string) => {
    setActive(id);
    if (isMobile) onMobileClose();
  };

  const w = isMobile ? 260 : (collapsed ? 52 : 220);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            zIndex: 998, backdropFilter: "blur(2px)",
          }}
        />
      )}

      <div
        style={{
          width:         w,
          background:    D.surface,
          borderRight:   `1px solid ${D.border}`,
          display:       "flex",
          flexDirection: "column",
          height:        "100vh",
          flexShrink:    0,
          transition:    isMobile ? "transform 0.25s ease" : "width 0.2s ease",
          overflow:      "hidden",
          // Mobile: fixed overlay
          ...(isMobile ? {
            position:  "fixed",
            top:       0,
            left:      0,
            zIndex:    999,
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            boxShadow: mobileOpen ? "4px 0 32px rgba(0,0,0,0.6)" : "none",
          } : {}),
        }}
      >
        {/* Logo + branding */}
        <div style={{
          padding:        (!isMobile && collapsed) ? "14px 0" : "16px 14px 14px",
          borderBottom:   `1px solid ${D.border}`,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          gap:            0,
          flexShrink:     0,
          position:       "relative",
        }}>
          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={onMobileClose}
              style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: D.textSoft, cursor: "pointer", padding: 4, lineHeight: 1 }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          {/* Cloud logo — bigger when expanded */}
          <WQLogo size={(!isMobile && collapsed) ? 40 : 62} />

          {/* Full branding text — hidden when sidebar collapsed */}
          {(isMobile || !collapsed) && (
            <div style={{ marginTop: 10, textAlign: "center", width: "100%" }}>
              {/* WQMS Pro */}
              <div style={{ lineHeight: 1, marginBottom: 6 }}>
                <span style={{ color: D.text, fontWeight: 800, fontSize: 17, letterSpacing: "-0.03em" }}>WQMS</span>
                <span style={{ color: D.accent, fontWeight: 800, fontSize: 17, letterSpacing: "-0.03em", marginLeft: 4 }}>Pro</span>
              </div>
              {/* Gold-line subtitle */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${D.accent})`, opacity: 0.6 }} />
                <span style={{ color: D.accent, fontSize: 7.5, fontWeight: 700, letterSpacing: "0.12em", opacity: 0.85, whiteSpace: "nowrap" }}>WELDING QUALITY</span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${D.accent})`, opacity: 0.6 }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${D.accent})`, opacity: 0.6 }} />
                <span style={{ color: D.accent, fontSize: 7.5, fontWeight: 700, letterSpacing: "0.12em", opacity: 0.85, whiteSpace: "nowrap" }}>MANAGEMENT SYSTEM</span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${D.accent})`, opacity: 0.6 }} />
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 4 }}>
              {(isMobile || !collapsed) && (
                <div style={{
                  color: D.textSoft, fontSize: 10, fontWeight: 600,
                  letterSpacing: "0.10em", padding: "10px 16px 4px",
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
                    onClick={() => handleNav(item.id)}
                    title={!isMobile && collapsed ? item.label : undefined}
                    style={{
                      width:          "100%",
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: !isMobile && collapsed ? "center" : "flex-start",
                      gap:            9,
                      padding:        !isMobile && collapsed ? "7px 0" : "7px 10px 7px 14px",
                      border:         "none",
                      background:     sel ? D.accentFaint : "transparent",
                      color:          sel ? D.accent : D.textMid,
                      fontWeight:     sel ? 600 : 400,
                      fontSize:       isMobile ? 14 : 13,
                      cursor:         "pointer",
                      fontFamily:     "'Inter',sans-serif",
                      borderLeft:     `2px solid ${sel ? D.accent : "transparent"}`,
                      transition:     "all 0.1s",
                      textAlign:      "left",
                      margin:         "1px 0",
                      minHeight:      isMobile ? 44 : "auto",
                    }}
                  >
                    <div style={{
                      width: 24, height: 24,
                      background:    sel ? D.accent : D.surfaceAlt,
                      borderRadius:  5,
                      display:       "flex",
                      alignItems:    "center",
                      justifyContent:"center",
                      fontSize:      9,
                      fontWeight:    700,
                      color:         sel ? "#fff" : D.textSoft,
                      fontFamily:    "'DM Mono',monospace",
                      flexShrink:    0,
                      letterSpacing: "0.04em",
                      border:        `1px solid ${sel ? D.accentBorder : D.border}`,
                    }}>
                      {item.icon}
                    </div>
                    {(isMobile || !collapsed) && (
                      <span style={{ flex: 1, whiteSpace: "nowrap" }}>{item.label}</span>
                    )}
                    {(isMobile || !collapsed) && badge > 0 && (
                      <span style={{
                        background: D.fail, color: "#fff", borderRadius: 99,
                        padding: "1px 6px", fontSize: 10, fontWeight: 700, lineHeight: 1.4,
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
        {editing && (isMobile || !collapsed) ? (
          <div style={{ padding: "12px 14px", borderTop: `1px solid ${D.border}`, background: D.surfaceAlt }}>
            <div style={{ color: D.textSoft, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>EDIT PROFILE</div>
            <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Full name"
              style={{ ...inp, marginBottom: 6, fontSize: 12, padding: "6px 10px" }} autoFocus />
            <input value={draft.role} onChange={e => setDraft(d => ({ ...d, role: e.target.value }))} placeholder="Role / title"
              style={{ ...inp, marginBottom: 10, fontSize: 12, padding: "6px 10px" }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={saveEdit} style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", background: D.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Save</button>
              <button onClick={cancelEdit} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${D.border}`, background: "transparent", color: D.textMid, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div
            onClick={!isMobile && !collapsed ? openEdit : isMobile ? openEdit : undefined}
            title={!isMobile && collapsed ? user.name : "Edit profile"}
            style={{
              padding:        !isMobile && collapsed ? "12px 0" : "12px 16px",
              borderTop:      `1px solid ${D.border}`,
              display:        "flex",
              alignItems:     "center",
              justifyContent: !isMobile && collapsed ? "center" : "flex-start",
              gap:            10,
              cursor:         !isMobile && collapsed ? "default" : "pointer",
              minHeight:      isMobile ? 60 : "auto",
            }}
          >
            <div style={{
              width: 32, height: 32,
              background:    "linear-gradient(135deg, #4f52cc, #7c3aed)",
              borderRadius:  "50%",
              display:       "flex",
              alignItems:    "center",
              justifyContent:"center",
              fontSize:      12,
              color:         "#fff",
              fontWeight:    700,
              flexShrink:    0,
              letterSpacing: "0.02em",
            }}>
              {initials(user.name)}
            </div>
            {(isMobile || !collapsed) && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: D.text, fontSize: 13, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                <div style={{ color: D.textSoft, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.role}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
