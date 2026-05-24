import React, { useState } from "react";
import { D } from "./theme";
import { WQLogo } from "./components";
import { supabase } from "./lib/supabase";

export function isLoggedIn(): boolean {
  return false; // always use Supabase session check in App.tsx
}

export function logout() {
  supabase?.auth.signOut();
}

interface Props { onLogin: () => void; }

export function LoginScreen({ onLogin }: Props) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState("");
  const [showPw,   setShowPw]   = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) { setErr("Please enter your email and password."); return; }
    if (isSignUp && password !== confirm) { setErr("Passwords do not match."); return; }
    if (isSignUp && password.length < 8)  { setErr("Password must be at least 8 characters."); return; }

    if (!supabase) {
      // Demo mode — no Supabase configured
      onLogin();
      return;
    }

    setLoading(true);
    setErr("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) { setErr(error.message); return; }
        onLogin();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setErr("Incorrect email or password.");
          } else {
            setErr(error.message);
          }
          return;
        }
        onLogin();
      }
    } finally {
      setLoading(false);
    }
  };

  const eyeIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: "block" }}>
      {showPw ? (
        <>
          <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4"/>
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4"/>
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
        </>
      )}
    </svg>
  );

  return (
    <div style={{
      minHeight: "100vh", background: D.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter',sans-serif", padding: 24,
      backgroundImage: `
        radial-gradient(ellipse 60% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%),
        radial-gradient(ellipse 40% 30% at 80% 100%, rgba(139,92,246,0.07) 0%, transparent 60%)
      `,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <WQLogo size={84} />
          </div>
          <div style={{ color: D.text, fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            WQMS <span style={{ color: D.accent }}>Pro</span>
          </div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: 260 }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${D.accent})`, opacity: 0.7 }} />
              <span style={{ color: D.accent, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", whiteSpace: "nowrap" }}>WELDING QUALITY</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${D.accent})`, opacity: 0.7 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: 260 }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${D.accent})`, opacity: 0.7 }} />
              <span style={{ color: D.accent, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", whiteSpace: "nowrap" }}>MANAGEMENT SYSTEM</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${D.accent})`, opacity: 0.7 }} />
            </div>
          </div>
          <div style={{
            display: "inline-block", marginTop: 10,
            background: D.accentFaint, border: `1px solid ${D.accentBorder}`,
            borderRadius: 99, padding: "2px 10px",
            color: D.accent, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
          }}>
            ISO 3834 · v3.0
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: D.surface, border: `1px solid ${D.border}`,
          borderRadius: 18, padding: 36,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)",
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ color: D.text, fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
              {isSignUp ? "Create your account" : "Sign in"}
            </div>
            <div style={{ color: D.textMid, fontSize: 13 }}>
              {isSignUp ? "Set up your WQMS Pro account." : "Enter your credentials to access WQMS Pro."}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: D.textSoft, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", marginBottom: 6 }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErr(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="your@email.com"
              autoComplete="email"
              autoFocus
              style={{
                width: "100%", padding: "11px 14px", boxSizing: "border-box",
                background: D.surfaceAlt, border: `1px solid ${D.border}`,
                borderRadius: 8, color: D.text, fontSize: 14,
                fontFamily: "'Inter',sans-serif", outline: "none",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: isSignUp ? 14 : 20 }}>
            <label style={{ display: "block", color: D.textSoft, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", marginBottom: 6 }}>
              PASSWORD
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setErr(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder={isSignUp ? "Min 8 characters" : "Enter password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                style={{
                  width: "100%", padding: "11px 42px 11px 14px", boxSizing: "border-box",
                  background: D.surfaceAlt, border: `1px solid ${err ? D.fail : D.border}`,
                  borderRadius: 8, color: D.text, fontSize: 14,
                  fontFamily: "'Inter',sans-serif", outline: "none",
                }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: D.textMid, cursor: "pointer", padding: 0, display: "flex",
              }}>
                {eyeIcon}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          {isSignUp && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: D.textSoft, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", marginBottom: 6 }}>
                CONFIRM PASSWORD
              </label>
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setErr(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="Re-enter password"
                autoComplete="new-password"
                style={{
                  width: "100%", padding: "11px 14px", boxSizing: "border-box",
                  background: D.surfaceAlt, border: `1px solid ${err ? D.fail : D.border}`,
                  borderRadius: 8, color: D.text, fontSize: 14,
                  fontFamily: "'Inter',sans-serif", outline: "none",
                }}
              />
            </div>
          )}

          {/* Error */}
          {err && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: D.failBg, border: `1px solid ${D.failBorder}`, borderRadius: 8, color: D.fail, fontSize: 13 }}>
              {err}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "13px 0",
              background: loading ? D.surfaceAlt : `linear-gradient(135deg, ${D.accent}, #7c3aed)`,
              border: "none", borderRadius: 8,
              color: loading ? D.textMid : "#fff", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Inter',sans-serif",
              boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
              letterSpacing: "-0.01em",
            }}
          >
            {loading ? "Please wait…" : isSignUp ? "Create Account & Sign In" : "Sign In"}
          </button>

          {/* Toggle sign up / sign in */}
          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button
              onClick={() => { setIsSignUp(v => !v); setErr(""); }}
              style={{ background: "none", border: "none", color: D.accent, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
            >
              {isSignUp ? "Already have an account? Sign in" : "First time? Create an account"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, color: D.textSoft, fontSize: 11 }}>
          Secured by Supabase · ISO 3834 Compliant
        </div>
      </div>
    </div>
  );
}
