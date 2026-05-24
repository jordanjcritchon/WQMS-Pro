/**
 * WQMS Pro — Data Access Layer
 *
 * All database queries live here. Components import from this file,
 * never directly from @supabase/supabase-js.
 *
 * Each function has a fallback to static data when Supabase is not
 * configured (demo / offline mode).
 */

import { supabase } from "./supabase";
import type {
  Project, WPS, PQR, Welder, WelderQualification, NCR, VTReport,
  RawMaterial, Consumable, NDTRecord, NDTEquipment, NDTTechnician,
  HeatTreatment, ITP, ITPStep, WeldPassport, WeldMapNode, MDRPackage, Alert,
} from "../types";

// ── static fallbacks (used when Supabase not configured) ──────────────────────
import * as STATIC from "../data";

// ─────────────────────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  if (!supabase) return STATIC.PROJECTS;
  const { data, error } = await supabase.from("projects").select("*").order("id");
  if (error) throw error;
  return (data ?? []).map(rowToProject);
}

export async function upsertProject(p: Project): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("projects").upsert(projectToRow(p));
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// WPS
// ─────────────────────────────────────────────────────────────────────────────

export async function getWPSList(): Promise<WPS[]> {
  if (!supabase) return STATIC.WPS_DATA;
  const { data, error } = await supabase.from("wps").select("*").order("id");
  if (error) throw error;
  return (data ?? []).map(rowToWPS);
}

export async function upsertWPS(w: WPS): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("wps").upsert(wpsToRow(w));
  if (error) throw error;
}

export async function deleteWPS(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("wps").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// PQR
// ─────────────────────────────────────────────────────────────────────────────

export async function getPQRList(): Promise<PQR[]> {
  if (!supabase) return STATIC.PQR_DATA;
  const { data, error } = await supabase.from("pqr").select("*").order("id");
  if (error) throw error;
  return (data ?? []).map(rowToPQR);
}

export async function upsertPQR(p: PQR): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("pqr").upsert(pqrToRow(p));
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Welders
// ─────────────────────────────────────────────────────────────────────────────

export async function getWelders(): Promise<Welder[]> {
  if (!supabase) return STATIC.WELDER_DATA;
  const { data: welders, error: we } = await supabase.from("welders").select("*").order("id");
  if (we) throw we;
  const { data: quals, error: qe } = await supabase.from("welder_qualifications").select("*").order("welder_id");
  if (qe) throw qe;
  return (welders ?? []).map(w => ({
    id:             w.id,
    stampNo:        w.stamp_no,
    firstName:      w.first_name,
    lastName:       w.last_name,
    employer:       w.employer ?? "",
    trade:          w.trade ?? "",
    status:         w.status,
    qualifications: (quals ?? []).filter(q => q.welder_id === w.id).map(rowToQual),
  }));
}

export async function upsertWelder(w: Welder): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("welders").upsert({
    id: w.id, stamp_no: w.stampNo, first_name: w.firstName, last_name: w.lastName,
    employer: w.employer, trade: w.trade, status: w.status,
  });
  if (error) throw error;
  for (const q of w.qualifications) {
    const { error: qe } = await supabase.from("welder_qualifications").upsert(qualToRow(q, w.id));
    if (qe) throw qe;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NCR
// ─────────────────────────────────────────────────────────────────────────────

export async function getNCRs(): Promise<NCR[]> {
  if (!supabase) return STATIC.NCR_DATA;
  const { data, error } = await supabase.from("ncrs").select("*").order("raised", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToNCR);
}

export async function upsertNCR(n: NCR): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("ncrs").upsert(ncrToRow(n));
  if (error) throw error;
}

export async function deleteNCR(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("ncrs").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// VT Reports
// ─────────────────────────────────────────────────────────────────────────────

export async function getVTReports(): Promise<VTReport[]> {
  if (!supabase) return STATIC.VT_REPORTS;
  const { data, error } = await supabase.from("vt_reports").select("*").order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToVT);
}

export async function upsertVTReport(r: VTReport): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("vt_reports").upsert({
    id: r.id, job_no: r.jobNo, weld_id: r.weldId, project: r.project,
    result: r.result, date: r.date, inspector: r.inspector,
    defects: r.defects, standard: r.standard, notes: r.notes ?? null,
  });
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Materials
// ─────────────────────────────────────────────────────────────────────────────

export async function getMaterials(): Promise<RawMaterial[]> {
  if (!supabase) return STATIC.MAT_RAW;
  const { data, error } = await supabase.from("materials").select("*").order("id");
  if (error) throw error;
  return (data ?? []).map(rowToMaterial);
}

export async function upsertMaterial(m: RawMaterial): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("materials").upsert(materialToRow(m));
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Consumables
// ─────────────────────────────────────────────────────────────────────────────

export async function getConsumables(): Promise<Consumable[]> {
  if (!supabase) return STATIC.MAT_CONS;
  const { data, error } = await supabase.from("consumables").select("*").order("id");
  if (error) throw error;
  return (data ?? []).map(rowToConsumable);
}

export async function upsertConsumable(c: Consumable): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("consumables").upsert(consumableToRow(c));
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// NDT
// ─────────────────────────────────────────────────────────────────────────────

export async function getNDTRecords(): Promise<NDTRecord[]> {
  if (!supabase) return STATIC.NDT_DATA;
  const { data, error } = await supabase.from("ndt_records").select("*").order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToNDT);
}

export async function upsertNDTRecord(r: NDTRecord): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("ndt_records").upsert({
    id: r.id, weld_id: r.weldId, method: r.method, tech_name: r.techName,
    tech_qual: r.techQual, result: r.result, accept_std: r.acceptStd,
    date: r.date, defects: r.defects, repair_required: r.repairRequired, ncr_ref: r.ncrRef,
  });
  if (error) throw error;
}

export async function getNDTEquipment(): Promise<NDTEquipment[]> {
  if (!supabase) return STATIC.NDT_EQUIP;
  const { data, error } = await supabase.from("ndt_equipment").select("*").order("id");
  if (error) throw error;
  return (data ?? []).map(rowToNDTEquip);
}

export async function getNDTTechnicians(): Promise<NDTTechnician[]> {
  if (!supabase) return STATIC.NDT_TECHS;
  const { data, error } = await supabase.from("ndt_technicians").select("*").order("id");
  if (error) throw error;
  return (data ?? []).map(rowToNDTTech);
}

// ─────────────────────────────────────────────────────────────────────────────
// Heat Treatment
// ─────────────────────────────────────────────────────────────────────────────

export async function getHeatTreatments(): Promise<HeatTreatment[]> {
  if (!supabase) return STATIC.HT_DATA;
  const { data, error } = await supabase.from("heat_treatments").select("*").order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToHT);
}

export async function upsertHeatTreatment(h: HeatTreatment): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("heat_treatments").upsert(htToRow(h));
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// ITP
// ─────────────────────────────────────────────────────────────────────────────

export async function getITPs(): Promise<ITP[]> {
  if (!supabase) return STATIC.ITP_DATA;
  const { data: itps, error: ie } = await supabase.from("itp").select("*").order("id");
  if (ie) throw ie;
  const { data: steps, error: se } = await supabase.from("itp_steps").select("*").order("seq");
  if (se) throw se;
  return (itps ?? []).map(i => ({
    id: i.id, projectId: i.project_id, itpNo: i.itp_no, rev: i.rev,
    component: i.component, standard: i.standard, status: i.status,
    clientApproval: i.client_approval,
    steps: (steps ?? []).filter(s => s.itp_id === i.id).map(rowToStep),
  }));
}

export async function updateITPStep(itpId: string, seq: number, patch: Partial<ITPStep>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("itp_steps")
    .update({
      status:          patch.status,
      signed_inspector: patch.signedInspector,
      signed_client:   patch.signedClient,
      date:            patch.date,
      updated_at:      new Date().toISOString(),
    })
    .eq("itp_id", itpId)
    .eq("seq", seq);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Weld Passports
// ─────────────────────────────────────────────────────────────────────────────

export async function getWeldPassports(projectId?: string): Promise<WeldPassport[]> {
  if (!supabase) {
    return projectId
      ? STATIC.WELD_PASSPORTS.filter(p => p.projectId === projectId)
      : STATIC.WELD_PASSPORTS;
  }
  let q = supabase.from("weld_passports").select("*").order("id");
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToPassport);
}

export async function upsertWeldPassport(p: WeldPassport): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("weld_passports").upsert(passportToRow(p));
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Weld Map Nodes
// ─────────────────────────────────────────────────────────────────────────────

export async function getWeldMapNodes(projectId?: string): Promise<WeldMapNode[]> {
  if (!supabase) return STATIC.WELD_MAP_NODES;
  let q = supabase.from("weld_map_nodes").select("*").order("id");
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToNode);
}

export async function updateWeldNodeStatus(id: string, status: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("weld_map_nodes")
    .update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// MDR Packages
// ─────────────────────────────────────────────────────────────────────────────

export async function getMDRPackages(): Promise<MDRPackage[]> {
  if (!supabase) return STATIC.MDR_PACKAGES;
  const { data, error } = await supabase.from("mdr_packages").select("*").order("id");
  if (error) throw error;
  return (data ?? []).map(rowToMDR);
}

export async function upsertMDRPackage(m: MDRPackage): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("mdr_packages").upsert({
    id: m.id, project_id: m.projectId, title: m.title, rev: m.rev,
    status: m.status, completeness: m.completeness, client: m.client,
    issue_date: m.issueDate, sections: m.sections, missing: m.missing,
    created_by: m.createdBy, updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Alerts
// ─────────────────────────────────────────────────────────────────────────────

export async function getAlerts(): Promise<Alert[]> {
  if (!supabase) return STATIC.ALERTS;
  const { data, error } = await supabase
    .from("alerts").select("*").eq("dismissed", false).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(a => ({ id: a.id, type: a.type, msg: a.msg, time: a.time }));
}

export async function dismissAlert(id: number): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("alerts").update({ dismissed: true }).eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Readiness Checks
// ─────────────────────────────────────────────────────────────────────────────

export async function getReadinessChecks(): Promise<Record<string, Record<string, { item: string; status: string; note: string }[]>>> {
  if (!supabase) return STATIC.READINESS_CHECKS as unknown as Record<string, Record<string, { item: string; status: string; note: string }[]>>;
  const { data, error } = await supabase.from("readiness_checks").select("*").order("id");
  if (error) throw error;
  const result: Record<string, Record<string, { item: string; status: string; note: string }[]>> = {};
  for (const row of data ?? []) {
    if (!result[row.project_id]) result[row.project_id] = {};
    if (!result[row.project_id][row.category]) result[row.project_id][row.category] = [];
    result[row.project_id][row.category].push({ item: row.item, status: row.status, note: row.note ?? "" });
  }
  return result;
}

export async function updateReadinessCheck(projectId: string, category: string, item: string, status: string, note: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("readiness_checks")
    .update({ status, note, updated_at: new Date().toISOString() })
    .eq("project_id", projectId).eq("category", category).eq("item", item);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cert Inbox (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

export async function getCertInbox() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cert_inbox").select("*").order("received_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMaterialCertRegister() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("material_cert_register")
    .select("*, cert_inbox(from_name,subject,received_at)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getConsumableCertRegister() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("consumable_cert_register")
    .select("*, cert_inbox(from_name,subject,received_at)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getNDTReportRegister() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ndt_report_register")
    .select("*, cert_inbox(from_name,subject,received_at)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getHTReportRegister() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ht_report_register")
    .select("*, cert_inbox(from_name,subject,received_at)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getWelderCertRegister() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("welder_cert_register")
    .select("*, cert_inbox(from_name,subject,received_at)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// File storage
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadDocument(bucket: string, path: string, file: File): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function getDocumentURL(bucket: string, path: string): Promise<string> {
  if (!supabase) return "";
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function createSignedURL(bucket: string, path: string, expiresIn = 3600): Promise<string> {
  if (!supabase) return "";
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// Row mappers (DB column names → TypeScript interface names)
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProject(r: any): Project {
  return {
    id: r.id, name: r.name, client: r.client, status: r.status,
    progress: r.progress, standard: r.standard, due: r.due,
    welds: { total: r.welds_total, complete: r.welds_complete, pending: r.welds_pending, rejected: r.welds_rejected },
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectToRow(p: Project): any {
  return {
    id: p.id, name: p.name, client: p.client, status: p.status,
    progress: p.progress, standard: p.standard, due: p.due,
    welds_total: p.welds.total, welds_complete: p.welds.complete,
    welds_pending: p.welds.pending, welds_rejected: p.welds.rejected,
    updated_at: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToWPS(r: any): WPS {
  return {
    id: r.id, rev: r.rev, title: r.title, standard: r.standard,
    processes: r.processes ?? [], materialGroups: r.material_groups ?? [],
    pqrRef: r.pqr_ref ?? "", positions: r.positions ?? [],
    thicknessRange: r.thickness_range ?? "", heatInput: r.heat_input ?? "",
    preheat: r.preheat ?? "", interpass: r.interpass ?? "",
    consumable: r.consumable ?? "", shieldingGas: r.shielding_gas ?? "",
    approvedBy: r.approved_by ?? "", approvalDate: r.approval_date ?? "",
    status: r.status, expiryDate: r.expiry_date ?? undefined,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wpsToRow(w: WPS): any {
  return {
    id: w.id, rev: w.rev, title: w.title, standard: w.standard,
    processes: w.processes, material_groups: w.materialGroups,
    pqr_ref: w.pqrRef, positions: w.positions,
    thickness_range: w.thicknessRange, heat_input: w.heatInput,
    preheat: w.preheat, interpass: w.interpass,
    consumable: w.consumable, shielding_gas: w.shieldingGas,
    approved_by: w.approvedBy, approval_date: w.approvalDate,
    status: w.status, expiry_date: w.expiryDate ?? null,
    updated_at: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPQR(r: any): PQR {
  return { id: r.id, wpsRef: r.wps_ref ?? "", testDate: r.test_date ?? "", testLab: r.test_lab ?? "", standard: r.standard ?? "", result: r.result ?? "", tests: r.tests ?? [] };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pqrToRow(p: PQR): any {
  return { id: p.id, wps_ref: p.wpsRef, test_date: p.testDate, test_lab: p.testLab, standard: p.standard, result: p.result, tests: p.tests };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToQual(r: any): WelderQualification {
  return {
    id: r.id, standard: r.standard, process: r.process,
    materialGroup: r.material_group ?? "", jointType: r.joint_type ?? "",
    positions: r.positions ?? [], thicknessRange: r.thickness_range ?? "",
    testDate: r.test_date ?? "", expiryDate: r.expiry_date ?? "",
    testPiece: r.test_piece ?? "", result: r.result ?? "",
    testLab: r.test_lab ?? "", wpsUsed: r.wps_used ?? "",
    certNo: r.cert_no ?? "", continuityOk: r.continuity_ok ?? true,
    lastActivity: r.last_activity ?? "",
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function qualToRow(q: WelderQualification, welderId: string): any {
  return {
    id: q.id, welder_id: welderId, standard: q.standard, process: q.process,
    material_group: q.materialGroup, joint_type: q.jointType,
    positions: q.positions, thickness_range: q.thicknessRange,
    test_date: q.testDate, expiry_date: q.expiryDate, test_piece: q.testPiece,
    result: q.result, test_lab: q.testLab, wps_used: q.wpsUsed,
    cert_no: q.certNo, continuity_ok: q.continuityOk, last_activity: q.lastActivity,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToNCR(r: any): NCR {
  return { id: r.id, weldId: r.weld_id, project: r.project, defect: r.defect, status: r.status, priority: r.priority, raised: r.raised, assignee: r.assignee ?? "", capa: r.capa ?? "" };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ncrToRow(n: NCR): any {
  return { id: n.id, weld_id: n.weldId, project: n.project, defect: n.defect, status: n.status, priority: n.priority, raised: n.raised, assignee: n.assignee, capa: n.capa, updated_at: new Date().toISOString() };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToVT(r: any): VTReport {
  return { id: r.id, jobNo: r.job_no ?? "", weldId: r.weld_id, project: r.project, result: r.result, date: r.date, inspector: r.inspector ?? "", defects: r.defects ?? [], standard: r.standard ?? "", notes: r.notes ?? "" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMaterial(r: any): RawMaterial {
  return { id: r.id, heatNo: r.heat_no, grade: r.grade, standard: r.standard ?? "", matGroup: r.mat_group ?? "", size: r.size ?? "", supplier: r.supplier ?? "", mtcStatus: r.mtc_status ?? "", pmiStatus: r.pmi_status ?? "", location: r.location ?? "", traceability: r.traceability ?? "", linkedWelds: r.linked_welds ?? [], cev: r.cev ?? null, supplier_cert: r.supplier_cert ?? null };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function materialToRow(m: RawMaterial): any {
  return { id: m.id, heat_no: m.heatNo, grade: m.grade, standard: m.standard, mat_group: m.matGroup, size: m.size, supplier: m.supplier, mtc_status: m.mtcStatus, pmi_status: m.pmiStatus, location: m.location, traceability: m.traceability, linked_welds: m.linkedWelds, cev: m.cev, supplier_cert: m.supplier_cert, updated_at: new Date().toISOString() };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToConsumable(r: any): Consumable {
  return { id: r.id, type: r.type, classification: r.classification ?? "", manufacturer: r.manufacturer ?? "", batch: r.batch ?? "", location: r.location ?? "", issueStatus: r.issue_status ?? "", expiry: r.expiry ?? "", rebakeStatus: r.rebake_status ?? "", issuedTo: r.issued_to ?? "", wpsCompat: r.wps_compat ?? [] };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function consumableToRow(c: Consumable): any {
  return { id: c.id, type: c.type, classification: c.classification, manufacturer: c.manufacturer, batch: c.batch, location: c.location, issue_status: c.issueStatus, expiry: c.expiry, rebake_status: c.rebakeStatus, issued_to: c.issuedTo, wps_compat: c.wpsCompat, updated_at: new Date().toISOString() };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToNDT(r: any): NDTRecord {
  return { id: r.id, weldId: r.weld_id, method: r.method, techName: r.tech_name ?? "", techQual: r.tech_qual ?? "", result: r.result ?? "", acceptStd: r.accept_std ?? "", date: r.date ?? "", defects: r.defects ?? [], repairRequired: r.repair_required ?? false, ncrRef: r.ncr_ref ?? null };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToNDTEquip(r: any): NDTEquipment {
  return { id: r.id, type: r.type ?? "", manufacturer: r.manufacturer ?? "", model: r.model ?? "", serial: r.serial ?? "", calibDue: r.calib_due ?? "", calibStatus: r.calib_status, location: r.location ?? "" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToNDTTech(r: any): NDTTechnician {
  return { id: r.id, name: r.name, cert: r.cert ?? "", methods: r.methods ?? [], level: r.level ?? "", certBody: r.cert_body ?? "", employer: r.employer ?? "", expiryDate: r.expiry_date ?? "", status: r.status };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToHT(r: any): HeatTreatment {
  return { id: r.id, jobId: r.job_id ?? "", componentId: r.component_id ?? "", weldId: r.weld_id ?? "", material: r.material ?? "", thickness: r.thickness ?? 0, type: r.type ?? "", standard: r.standard ?? "", targetTemp: r.target_temp ?? 0, soakTime: r.soak_time ?? 0, actualStatus: r.actual_status ?? "", technician: r.technician ?? "", date: r.date ?? "", compliant: r.compliant ?? null };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function htToRow(h: HeatTreatment): any {
  return { id: h.id, job_id: h.jobId, component_id: h.componentId, weld_id: h.weldId, material: h.material, thickness: h.thickness, type: h.type, standard: h.standard, target_temp: h.targetTemp, soak_time: h.soakTime, actual_status: h.actualStatus, technician: h.technician, date: h.date, compliant: h.compliant, updated_at: new Date().toISOString() };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStep(r: any): ITPStep {
  return { seq: r.seq, activity: r.activity, criteria: r.criteria ?? "", method: r.method ?? "", holdType: r.hold_type, status: r.status, signedInspector: r.signed_inspector ?? "", signedClient: r.signed_client ?? "", date: r.date ?? "" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToNode(r: any): WeldMapNode {
  return { id: r.id, x: r.x, y: r.y, status: r.status, weldType: r.weld_type ?? "", process: r.process ?? "", welder: r.welder ?? "" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMDR(r: any): MDRPackage {
  return { id: r.id, projectId: r.project_id ?? "", title: r.title, rev: r.rev ?? "A", status: r.status ?? "", completeness: r.completeness ?? 0, client: r.client ?? "", issueDate: r.issue_date ?? null, sections: r.sections ?? [], missing: r.missing ?? [], createdBy: r.created_by ?? "" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPassport(r: any): WeldPassport {
  return {
    id: r.id, projectId: r.project_id ?? "", componentId: r.component_id ?? "",
    drawingNo: r.drawing_no ?? "", jointNo: r.joint_no ?? "", spoolNo: r.spool_no ?? "",
    weldType: r.weld_type ?? "", jointDesign: r.joint_design ?? "", size: r.size ?? "",
    position: r.position ?? "", process: r.process ?? "", dateWelded: r.date_welded ?? "",
    welderId: r.welder_id ?? "", welderName: r.welder_name ?? "", stampNo: r.stamp_no ?? "",
    qualRef: r.qual_ref ?? "", qualValid: r.qual_valid ?? true,
    coordinator: r.coordinator ?? "", inspector: r.inspector ?? "",
    wpsId: r.wps_id ?? "", wpsRev: r.wps_rev ?? "", pqrRef: r.pqr_ref ?? "",
    standard: r.standard ?? "", matGroup: r.mat_group ?? "",
    thicknessOk: r.thickness_ok ?? true, processOk: r.process_ok ?? true, consumableOk: r.consumable_ok ?? true,
    matId: r.mat_id ?? "", heatNo: r.heat_no ?? "", matCertRef: r.mat_cert_ref ?? "",
    pmiStatus: r.pmi_status ?? "", consumableId: r.consumable_id ?? "",
    consumableBatch: r.consumable_batch ?? "", weldingGas: r.welding_gas ?? "",
    fitupStatus: r.fitup_status ?? "", inprocessStatus: r.inprocess_status ?? "",
    vtResult: r.vt_result ?? "", vtDate: r.vt_date ?? "", vtInspector: r.vt_inspector ?? "",
    ndtResults: r.ndt_results ?? [], htRef: r.ht_ref ?? null, htType: r.ht_type ?? null,
    htResult: r.ht_result ?? null, dimensionalResult: r.dimensional_result ?? "",
    pressureTestResult: r.pressure_test_result ?? "",
    repairCount: r.repair_count ?? 0, repairs: r.repairs ?? [], ncrRefs: r.ncr_refs ?? [],
    finalStatus: r.final_status ?? "", overallStatus: r.overall_status ?? "",
    timeline: r.timeline ?? [], attachments: r.attachments ?? [],
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function passportToRow(p: WeldPassport): any {
  return {
    id: p.id, project_id: p.projectId, component_id: p.componentId,
    drawing_no: p.drawingNo, joint_no: p.jointNo, spool_no: p.spoolNo,
    weld_type: p.weldType, joint_design: p.jointDesign, size: p.size,
    position: p.position, process: p.process, date_welded: p.dateWelded,
    welder_id: p.welderId || null, welder_name: p.welderName, stamp_no: p.stampNo,
    qual_ref: p.qualRef, qual_valid: p.qualValid,
    coordinator: p.coordinator, inspector: p.inspector,
    wps_id: p.wpsId || null, wps_rev: p.wpsRev, pqr_ref: p.pqrRef,
    standard: p.standard, mat_group: p.matGroup,
    thickness_ok: p.thicknessOk, process_ok: p.processOk, consumable_ok: p.consumableOk,
    mat_id: p.matId || null, heat_no: p.heatNo, mat_cert_ref: p.matCertRef,
    pmi_status: p.pmiStatus, consumable_id: p.consumableId || null,
    consumable_batch: p.consumableBatch, welding_gas: p.weldingGas,
    fitup_status: p.fitupStatus, inprocess_status: p.inprocessStatus,
    vt_result: p.vtResult, vt_date: p.vtDate, vt_inspector: p.vtInspector,
    ndt_results: p.ndtResults, ht_ref: p.htRef, ht_type: p.htType, ht_result: p.htResult,
    dimensional_result: p.dimensionalResult, pressure_test_result: p.pressureTestResult,
    repair_count: p.repairCount, repairs: p.repairs, ncr_refs: p.ncrRefs,
    final_status: p.finalStatus, overall_status: p.overallStatus,
    timeline: p.timeline, attachments: p.attachments,
    updated_at: new Date().toISOString(),
  };
}
