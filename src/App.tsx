import React, { useState, useEffect } from "react";
import { D } from "./theme";
import { DataProvider, useStore } from "./store";
import { SetupScreen } from "./SetupScreen";
import { LoginScreen } from "./LoginScreen";
import { supabase } from "./lib/supabase";
import { Sidebar } from "./layout/Sidebar";
import { TopBar }  from "./layout/TopBar";
import { DashboardModule }    from "./modules/DashboardModule";
import { ProjectsModule }     from "./modules/ProjectsModule";
import { WeldRegisterModule } from "./modules/WeldRegisterModule";
import { WPSHubModule }       from "./modules/WPSHubModule";
import { InspectionModule }   from "./modules/InspectionModule";
import { WeldersModule }      from "./modules/WeldersModule";
import { MaterialsHubModule } from "./modules/MaterialsHubModule";
import { NCRModule }          from "./modules/NCRModule";
import { ComplianceModule }   from "./modules/ComplianceModule";
import { MDRModule }          from "./modules/MDRModule";
import { ReadinessModule }    from "./modules/ReadinessModule";
import { ReportsModule }      from "./modules/ReportsModule";
import { PlaceholderModule }  from "./modules/PlaceholderModule";

const GLOBAL_STYLES = (border: string, accent: string, accentFaint: string, textSoft: string) => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #07070d; }
  ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 10px; }
  input::placeholder, textarea::placeholder { color: ${textSoft}; opacity: 0.6; }
  input:focus, select:focus, textarea:focus { border-color: ${accent} !important; box-shadow: 0 0 0 3px ${accentFaint}; }
  button { transition: opacity 0.12s; }
  button:hover { opacity: 0.85; }
  select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2345455a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px !important;
  }
  @media print {
    body { background: white !important; }
    .no-print { display: none !important; }
    .print-white { background: white !important; color: black !important; }
  }
  @media (max-width: 767px) {
    div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
    table { min-width: 600px; }
    div[style*="overflow-x: auto"], div[style*="overflowX"] { overflow-x: auto !important; }
    div[style*="borderBottom"][style*="flex"] { overflow-x: auto; }
    div[style*="padding: 20px"] { padding: 12px !important; }
    div[style*="padding: 18px"] { padding: 10px !important; }
    input, select, textarea { font-size: 16px !important; }
    div[style*="maxWidth: 700"], div[style*="maxWidth: 740"], div[style*="maxWidth: 800"] { max-width: 100% !important; }
  }
`;

export interface CrossModuleTarget { weldId: string; project: string; }
export interface UserProfile       { name: string; role: string; }

const DEFAULT_USER: UserProfile = { name: "John Mitchell", role: "Welding Coordinator" };
const PROFILE_KEY = "wqms_profile";

function AppShell() {
  const { apiKey, setApiKey } = useStore();

  const [active,         setActive]         = useState("dashboard");
  const [collapsed,      setCollapsed]      = useState(false);
  const [mobileNavOpen,  setMobileNavOpen]  = useState(false);
  const [searchQ,        setSearchQ]        = useState("");
  const [passportTarget, setPassportTarget] = useState<string | null>(null);
  const [ncrTarget,      setNcrTarget]      = useState<CrossModuleTarget | null>(null);
  const [vtTarget,       setVtTarget]       = useState<CrossModuleTarget | null>(null);
  const [user, setUserState] = useState<UserProfile>(() => {
    try { const s = localStorage.getItem(PROFILE_KEY); return s ? JSON.parse(s) : DEFAULT_USER; } catch { return DEFAULT_USER; }
  });

  if (!apiKey) return <SetupScreen onSave={k => setApiKey(k)} />;

  const setUser = (u: UserProfile) => { setUserState(u); localStorage.setItem(PROFILE_KEY, JSON.stringify(u)); };

  const openPassport = (id: string) => { setPassportTarget(id); setActive("weldregister"); };
  const openNCR      = (weldId: string, project: string) => { setNcrTarget({ weldId, project }); setActive("ncr"); };
  const openVT       = (weldId: string, project: string) => { setVtTarget({ weldId, project }); setActive("inspection"); };

  const setActiveSafe = (id: string) => {
    if (id !== "weldregister") setPassportTarget(null);
    if (id !== "ncr")          setNcrTarget(null);
    if (id !== "inspection")   setVtTarget(null);
    setActive(id);
  };

  const renderModule = () => {
    switch (active) {
      case "dashboard":    return <DashboardModule    setActive={setActiveSafe} />;
      case "projects":     return <ProjectsModule />;
      case "weldregister": return <WeldRegisterModule preselect={passportTarget} openNCR={openNCR} openVT={openVT} initialTab={passportTarget ? "passport" : "map"} />;
      case "wps":          return <WPSHubModule />;
      case "inspection":   return <InspectionModule   preselect={vtTarget} onOpenNCR={openNCR} initialTab={vtTarget ? "vt" : "vt"} />;
      case "welders":      return <WeldersModule />;
      case "materials":    return <MaterialsHubModule />;
      case "ncr":          return <NCRModule preselect={ncrTarget} />;
      case "compliance":   return <ComplianceModule   setActive={setActiveSafe} />;
      case "readiness":    return <ReadinessModule />;
      case "reports":      return <ReportsModule />;
      default:             return <PlaceholderModule id={active} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: D.bg, fontFamily: "'Inter',sans-serif", color: D.text, overflow: "hidden" }}>
      <style>{GLOBAL_STYLES(D.border, D.accent, D.accentFaint, D.textSoft)}</style>
      <Sidebar active={active} setActive={setActiveSafe} collapsed={collapsed} mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} user={user} setUser={setUser} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar active={active} collapsed={collapsed} setCollapsed={setCollapsed} searchQ={searchQ} setSearchQ={setSearchQ} setActive={setActiveSafe} user={user} onMobileMenu={() => setMobileNavOpen(o => !o)} />
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {renderModule()}
        </div>
      </div>
    </div>
  );
}

export default function WQMSApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // No Supabase configured — skip auth, go straight in
      setLoggedIn(true);
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div style={{ height: "100vh", background: D.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: D.textSoft, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>Loading…</div>
      </div>
    );
  }

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  return (
    <DataProvider>
      <style>{GLOBAL_STYLES(D.border, D.accent, D.accentFaint, D.textSoft)}</style>
      <AppShell />
    </DataProvider>
  );
}
