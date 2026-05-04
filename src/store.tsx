import React, { createContext, useContext } from "react";
import { usePersistedState } from "./hooks/usePersistedState";
import {
  WPS_DATA, PQR_DATA, WELDER_DATA, PROJECTS, NCR_DATA, VT_REPORTS,
  MAT_RAW, MAT_CONS, NDT_DATA, HT_DATA, ITP_DATA,
  WELD_PASSPORTS, WELD_MAP_NODES, MDR_PACKAGES,
} from "./data";
import type {
  WPS, PQR, Welder, Project, NCR, VTReport,
  RawMaterial, Consumable, NDTRecord, HeatTreatment,
  ITP, WeldPassport, WeldMapNode, MDRPackage,
} from "./types";

// ── API Key ───────────────────────────────────────────────────────────────────
const APIKEY_KEY = "wqms_api_key";
export function getStoredApiKey(): string { return localStorage.getItem(APIKEY_KEY) ?? ""; }
export function storeApiKey(key: string)  { localStorage.setItem(APIKEY_KEY, key); }

// ── Store shape ───────────────────────────────────────────────────────────────
interface Store {
  apiKey:        string;
  setApiKey:     (k: string) => void;

  wpsData:       WPS[];
  setWpsData:    (v: WPS[] | ((p: WPS[]) => WPS[])) => void;

  pqrData:       PQR[];
  setPqrData:    (v: PQR[] | ((p: PQR[]) => PQR[])) => void;

  welderData:    Welder[];
  setWelderData: (v: Welder[] | ((p: Welder[]) => Welder[])) => void;

  projects:      Project[];
  setProjects:   (v: Project[] | ((p: Project[]) => Project[])) => void;

  ncrData:       NCR[];
  setNcrData:    (v: NCR[] | ((p: NCR[]) => NCR[])) => void;

  vtReports:     VTReport[];
  setVtReports:  (v: VTReport[] | ((p: VTReport[]) => VTReport[])) => void;

  matRaw:        RawMaterial[];
  setMatRaw:     (v: RawMaterial[] | ((p: RawMaterial[]) => RawMaterial[])) => void;

  matCons:       Consumable[];
  setMatCons:    (v: Consumable[] | ((p: Consumable[]) => Consumable[])) => void;

  ndtData:       NDTRecord[];
  setNdtData:    (v: NDTRecord[] | ((p: NDTRecord[]) => NDTRecord[])) => void;

  htData:        HeatTreatment[];
  setHtData:     (v: HeatTreatment[] | ((p: HeatTreatment[]) => HeatTreatment[])) => void;

  itpData:       ITP[];
  setItpData:    (v: ITP[] | ((p: ITP[]) => ITP[])) => void;

  passports:     WeldPassport[];
  setPassports:  (v: WeldPassport[] | ((p: WeldPassport[]) => WeldPassport[])) => void;

  mapNodes:      WeldMapNode[];
  setMapNodes:   (v: WeldMapNode[] | ((p: WeldMapNode[]) => WeldMapNode[])) => void;

  mdrPackages:   MDRPackage[];
  setMdrPackages:(v: MDRPackage[] | ((p: MDRPackage[]) => MDRPackage[])) => void;
}

const Ctx = createContext<Store | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [apiKey,       setApiKeyRaw]    = usePersistedState<string>(APIKEY_KEY, "");
  const setApiKey = (k: string) => { setApiKeyRaw(k); };

  const [wpsData,      setWpsData]      = usePersistedState<WPS[]>("wqms_wps",         WPS_DATA);
  const [pqrData,      setPqrData]      = usePersistedState<PQR[]>("wqms_pqr",         PQR_DATA);
  const [welderData,   setWelderData]   = usePersistedState<Welder[]>("wqms_welders",   WELDER_DATA);
  const [projects,     setProjects]     = usePersistedState<Project[]>("wqms_projects", PROJECTS);
  const [ncrData,      setNcrData]      = usePersistedState<NCR[]>("wqms_ncr",         NCR_DATA);
  const [vtReports,    setVtReports]    = usePersistedState<VTReport[]>("wqms_vt",      VT_REPORTS);
  const [matRaw,       setMatRaw]       = usePersistedState<RawMaterial[]>("wqms_matraw",  MAT_RAW);
  const [matCons,      setMatCons]      = usePersistedState<Consumable[]>("wqms_matcons",  MAT_CONS);
  const [ndtData,      setNdtData]      = usePersistedState<NDTRecord[]>("wqms_ndt",    NDT_DATA);
  const [htData,       setHtData]       = usePersistedState<HeatTreatment[]>("wqms_ht", HT_DATA);
  const [itpData,      setItpData]      = usePersistedState<ITP[]>("wqms_itp",         ITP_DATA);
  const [passports,    setPassports]    = usePersistedState<WeldPassport[]>("wqms_passports", WELD_PASSPORTS);
  const [mapNodes,     setMapNodes]     = usePersistedState<WeldMapNode[]>("wqms_mapnodes",   WELD_MAP_NODES);
  const [mdrPackages,  setMdrPackages]  = usePersistedState<MDRPackage[]>("wqms_mdr",   MDR_PACKAGES);

  return (
    <Ctx.Provider value={{
      apiKey, setApiKey,
      wpsData, setWpsData, pqrData, setPqrData,
      welderData, setWelderData, projects, setProjects,
      ncrData, setNcrData, vtReports, setVtReports,
      matRaw, setMatRaw, matCons, setMatCons,
      ndtData, setNdtData, htData, setHtData,
      itpData, setItpData, passports, setPassports,
      mapNodes, setMapNodes, mdrPackages, setMdrPackages,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be inside DataProvider");
  return ctx;
}
