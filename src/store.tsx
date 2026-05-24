import React, { createContext, useContext, useState, useEffect } from "react";
import * as db from "./lib/db";
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

// ── API key (kept for backwards compat with SetupScreen) ──────────────────────
const APIKEY_KEY = "wqms_api_key";
export function getStoredApiKey(): string { return localStorage.getItem(APIKEY_KEY) ?? ""; }
export function storeApiKey(key: string)  { localStorage.setItem(APIKEY_KEY, key); }

// ── Store shape ───────────────────────────────────────────────────────────────
interface Store {
  apiKey:        string;
  setApiKey:     (k: string) => void;
  loading:       boolean;

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

  /** Reload everything from Supabase (call after mutations) */
  refresh:       () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [apiKey,      setApiKeyState] = useState(() => getStoredApiKey());
  const [loading,     setLoading]     = useState(true);

  const [wpsData,     setWpsData]     = useState<WPS[]>(WPS_DATA);
  const [pqrData,     setPqrData]     = useState<PQR[]>(PQR_DATA);
  const [welderData,  setWelderData]  = useState<Welder[]>(WELDER_DATA);
  const [projects,    setProjects]    = useState<Project[]>(PROJECTS);
  const [ncrData,     setNcrData]     = useState<NCR[]>(NCR_DATA);
  const [vtReports,   setVtReports]   = useState<VTReport[]>(VT_REPORTS);
  const [matRaw,      setMatRaw]      = useState<RawMaterial[]>(MAT_RAW);
  const [matCons,     setMatCons]     = useState<Consumable[]>(MAT_CONS);
  const [ndtData,     setNdtData]     = useState<NDTRecord[]>(NDT_DATA);
  const [htData,      setHtData]      = useState<HeatTreatment[]>(HT_DATA);
  const [itpData,     setItpData]     = useState<ITP[]>(ITP_DATA);
  const [passports,   setPassports]   = useState<WeldPassport[]>(WELD_PASSPORTS);
  const [mapNodes,    setMapNodes]    = useState<WeldMapNode[]>(WELD_MAP_NODES);
  const [mdrPackages, setMdrPackages] = useState<MDRPackage[]>(MDR_PACKAGES);

  const setApiKey = (k: string) => {
    setApiKeyState(k);
    localStorage.setItem(APIKEY_KEY, k);
  };

  const loadFromSupabase = async () => {
    setLoading(true);
    try {
      const [
        proj, wps, pqr, welders, ncrs, vt,
        mats, cons, ndt, ht, itp,
        pass, nodes, mdr,
      ] = await Promise.all([
        db.getProjects(),
        db.getWPSList(),
        db.getPQRList(),
        db.getWelders(),
        db.getNCRs(),
        db.getVTReports(),
        db.getMaterials(),
        db.getConsumables(),
        db.getNDTRecords(),
        db.getHeatTreatments(),
        db.getITPs(),
        db.getWeldPassports(),
        db.getWeldMapNodes(),
        db.getMDRPackages(),
      ]);

      setProjects(proj);
      setWpsData(wps);
      setPqrData(pqr);
      setWelderData(welders);
      setNcrData(ncrs);
      setVtReports(vt);
      setMatRaw(mats);
      setMatCons(cons);
      setNdtData(ndt);
      setHtData(ht);
      setItpData(itp);
      setPassports(pass);
      setMapNodes(nodes);
      setMdrPackages(mdr);
    } catch (e) {
      console.warn("[WQMS] Supabase load failed, using static data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFromSupabase(); }, []);

  return (
    <Ctx.Provider value={{
      apiKey, setApiKey, loading,
      wpsData, setWpsData, pqrData, setPqrData,
      welderData, setWelderData, projects, setProjects,
      ncrData, setNcrData, vtReports, setVtReports,
      matRaw, setMatRaw, matCons, setMatCons,
      ndtData, setNdtData, htData, setHtData,
      itpData, setItpData, passports, setPassports,
      mapNodes, setMapNodes, mdrPackages, setMdrPackages,
      refresh: loadFromSupabase,
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
