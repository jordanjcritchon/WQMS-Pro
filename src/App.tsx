import React, { useState } from "react";
import { D } from "./theme";
import { DataProvider, useStore } from "./store";
import { SetupScreen } from "./SetupScreen";
import { Sidebar } from "./layout/Sidebar";
import { TopBar }  from "./layout/TopBar";
import { DashboardModule }    from "./modules/DashboardModule";
import { ProjectsModule }     from "./modules/ProjectsModule";
import { WeldMapModule }      from "./modules/WeldMapModule";
import { WeldPassportModule } from "./modules/WeldPassportModule";
import { ReadinessModule }    from "./modules/ReadinessModule";
import { WPSModule }          from "./modules/WPSModule";
import { WeldersModule }      from "./modules/WeldersModule";
import { TraceabilityModule } from "./modules/TraceabilityModule";
import { VTModule }           from "./modules/VTModule";
import { NDTModule }          from "./modules/NDTModule";
import { ITPModule }          from "./modules/ITPModule";
import { HeatModule }         from "./modules/HeatModule";
import { MaterialsModule }    from "./modules/MaterialsModule";
import { NCRModule }          from "./modules/NCRModule";
import { MDRModule }          from "./modules/MDRModule";
import { CertInboxModule }   from "./modules/CertInboxModule";
import WPSValidationEngine    from "./WPSValidationEngine";
import { PlaceholderModule }  from "./modules/PlaceholderModule";

const GLOBAL_STYLES = (border: string, accent: string, accentFaint: string, textSoft: string) => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #09090f; }
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
`;

export interface CrossModuleTarget {
  weldId:  string;
  project: string;
}

export interface UserProfile {
  name: string;
  role: string;
}

const DEFAULT_USER: UserProfile = { name: "John Mitchell", role: "Welding Coordinator" };
const PROFILE_KEY = "wqms_profile";

function AppShell() {
  const { apiKey, setApiKey } = useStore();

  const [active,         setActive]         = useState("dashboard");
  const [collapsed,      setCollapsed]      = useState(false);
  const [searchQ,        setSearchQ]        = useState("");
  const [passportTarget, setPassportTarget] = useState<string | null>(null);
  const [ncrTarget,      setNcrTarget]      = useState<CrossModuleTarget | null>(null);
  const [vtTarget,       setVtTarget]       = useState<CrossModuleTarget | null>(null);
  const [user, setUserState] = useState<UserProfile>(() => {
    try { const s = localStorage.getItem(PROFILE_KEY); return s ? JSON.parse(s) : DEFAULT_USER; } catch { return DEFAULT_USER; }
  });

  // Show setup screen if no API key stored yet
  if (!apiKey) {
    return <SetupScreen onSave={k => setApiKey(k)} />;
  }

  const setUser = (u: UserProfile) => {
    setUserState(u);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(u));
  };

  const openPassport = (id: string) => { setPassportTarget(id); setActive("passport"); };
  const openNCR = (weldId: string, project: string) => { setNcrTarget({ weldId, project }); setActive("ncr"); };
  const openVT  = (weldId: string, project: string) => { setVtTarget({ weldId, project }); setActive("vt"); };

  const setActiveSafe = (id: string) => {
    if (id !== "passport") setPassportTarget(null);
    if (id !== "ncr")      setNcrTarget(null);
    if (id !== "vt")       setVtTarget(null);
    setActive(id);
  };

  const renderModule = () => {
    switch (active) {
      case "dashboard":    return <DashboardModule    setActive={setActiveSafe} />;
      case "projects":     return <ProjectsModule />;
      case "weldmap":      return <WeldMapModule      openPassport={openPassport} openNCR={openNCR} openVT={openVT} />;
      case "passport":     return <WeldPassportModule preselect={passportTarget} />;
      case "readiness":    return <ReadinessModule />;
      case "wps":          return <WPSModule />;
      case "wpsvalidate":  return <WPSValidationEngine />;
      case "welders":      return <WeldersModule />;
      case "traceability": return <TraceabilityModule />;
      case "vt":           return <VTModule  preselect={vtTarget}  onOpenNCR={openNCR} />;
      case "ndt":          return <NDTModule />;
      case "itp":          return <ITPModule />;
      case "heat":         return <HeatModule />;
      case "materials":    return <MaterialsModule />;
      case "ncr":          return <NCRModule preselect={ncrTarget} />;
      case "mdr":          return <MDRModule />;
      case "certinbox":    return <CertInboxModule />;
      default:             return <PlaceholderModule id={active} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: D.bg, fontFamily: "'Inter',sans-serif", color: D.text, overflow: "hidden" }}>
      <style>{GLOBAL_STYLES(D.border, D.accent, D.accentFaint, D.textSoft)}</style>
      <Sidebar active={active} setActive={setActiveSafe} collapsed={collapsed} user={user} setUser={setUser} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          active={active}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          searchQ={searchQ}
          setSearchQ={setSearchQ}
          setActive={setActiveSafe}
          user={user}
        />
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {renderModule()}
        </div>
      </div>
    </div>
  );
}

export default function WQMSApp() {
  return (
    <DataProvider>
      <style>{GLOBAL_STYLES(D.border, D.accent, D.accentFaint, D.textSoft)}</style>
      <AppShell />
    </DataProvider>
  );
}
