import React, { useState } from "react";
import { D } from "./theme";
import { WQLogo } from "./components";

interface Props {
  onSave: (key: string) => void;
}

export function SetupScreen({ onSave }: Props) {
  const [draft, setDraft] = useState("");
  const [err,   setErr]   = useState("");

  const save = () => {
    const k = draft.trim();
    if (!k.startsWith("sk-ant-")) {
      setErr("Key should start with sk-ant- — paste it from console.anthropic.com → API Keys");
      return;
    }
    onSave(k);
  };

  return (
    <div style={{
      minHeight: "100vh", background: D.bg, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter',sans-serif", padding: 24,
    }}>
      <div style={{
        background: D.surface, border: `1px solid ${D.border}`,
        borderRadius: 16, padding: 40, maxWidth: 440, width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
      }}>
        {/* Logo / identity */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <WQLogo size={68} />
          </div>
          <div style={{ color: D.text, fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>WQMS Pro</div>
          <div style={{ color: D.textMid, fontSize: 13, marginTop: 4 }}>Welding Quality Management System</div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ color: D.text, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
            Enter your Claude API Key
          </div>
          <div style={{ color: D.textMid, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            This key powers WPS validation and document extraction. It's stored only on this device — never sent to anyone else.
          </div>

          <div style={{ marginBottom: 8 }}>
            <input
              type="password"
              value={draft}
              onChange={e => { setDraft(e.target.value); setErr(""); }}
              onKeyDown={e => e.key === "Enter" && save()}
              placeholder="sk-ant-api03-…"
              autoComplete="off"
              spellCheck={false}
              style={{
                width: "100%", padding: "11px 14px",
                background: D.surfaceAlt, border: `1px solid ${err ? D.fail : D.border}`,
                borderRadius: 8, color: D.text, fontSize: 14,
                fontFamily: "'DM Mono',monospace", outline: "none",
                boxSizing: "border-box",
              }}
            />
            {err && <div style={{ color: D.fail, fontSize: 12, marginTop: 6 }}>{err}</div>}
          </div>

          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: D.accent, fontSize: 12, textDecoration: "none" }}
          >
            Get your API key at console.anthropic.com →
          </a>
        </div>

        <button
          onClick={save}
          disabled={!draft.trim()}
          style={{
            width: "100%", padding: "13px 0",
            background: draft.trim() ? D.accent : D.surfaceAlt,
            border: "none", borderRadius: 8,
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: draft.trim() ? "pointer" : "not-allowed",
            fontFamily: "'Inter',sans-serif",
            transition: "background 0.15s",
          }}
        >
          Save &amp; Open WQMS Pro
        </button>

        <div style={{ marginTop: 20, padding: "12px 14px", background: D.surfaceAlt, borderRadius: 8, border: `1px solid ${D.border}` }}>
          <div style={{ color: D.textMid, fontSize: 11, lineHeight: 1.7 }}>
            <strong style={{ color: D.textSoft }}>Privacy:</strong> Your API key is stored only in this browser's local storage on this device. It's sent directly to Anthropic's servers when you use AI features — no intermediate server.
          </div>
        </div>
      </div>
    </div>
  );
}
