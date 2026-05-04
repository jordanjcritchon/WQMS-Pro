import path from "path";
import os from "os";
import fs from "fs-extra";

const BASE = path.join(os.homedir(), "Documents", "WQMS Documents");
fs.ensureDirSync(BASE);

export type DocType =
  | "MATERIAL_CERT"
  | "CONSUMABLE_CERT"
  | "NDT_REPORT"
  | "HEAT_TREATMENT_REPORT"
  | "UNKNOWN";

// ── Generic JSON table ──────────────────────────────────────────
function tablePath(name: string) {
  return path.join(BASE, `${name}.json`);
}

function readTable<T extends { id: number }>(name: string): T[] {
  try { return fs.readJsonSync(tablePath(name)) as T[]; } catch { return []; }
}

function writeTable<T>(name: string, rows: T[]): void {
  fs.writeJsonSync(tablePath(name), rows, { spaces: 2 });
}

function nextId(name: string): number {
  const rows = readTable(name);
  return rows.length === 0 ? 1 : Math.max(...rows.map(r => r.id)) + 1;
}

function insertRow(name: string, fields: Record<string, string>): void {
  const rows = readTable(name);
  rows.unshift({ id: nextId(name), created_at: new Date().toISOString(), ...fields });
  writeTable(name, rows);
}

// ── Public API ──────────────────────────────────────────────────
export function insertRecord(type: DocType, data: Record<string, string>): void {
  const d = (k: string) => data[k] ?? "";

  switch (type) {
    case "MATERIAL_CERT":
      insertRow("material_certificates", {
        filename: d("filename"), filepath: d("filepath"),
        heat_number: d("heat_number"), material_grade: d("material_grade"),
        standard: d("standard"), supplier: d("supplier"),
        date_received: d("date_received"), job_no: d("job_no"),
        linked_weld: d("linked_weld"),
        email_subject: d("email_subject"), email_from: d("email_from"),
      });
      break;

    case "CONSUMABLE_CERT":
      insertRow("consumable_certificates", {
        filename: d("filename"), filepath: d("filepath"),
        product_name: d("product_name"), batch_number: d("batch_number"),
        standard: d("standard"), supplier: d("supplier"),
        date_received: d("date_received"), job_no: d("job_no"),
        email_subject: d("email_subject"), email_from: d("email_from"),
      });
      break;

    case "NDT_REPORT":
      insertRow("ndt_reports", {
        filename: d("filename"), filepath: d("filepath"),
        weld_id: d("weld_id"), process: d("process"), wps_ref: d("wps_ref"),
        result: d("result"), standard: d("standard"), inspector: d("inspector"),
        report_date: d("report_date"), job_no: d("job_no"),
        email_subject: d("email_subject"), email_from: d("email_from"),
      });
      break;

    case "HEAT_TREATMENT_REPORT":
      insertRow("heat_treatment_reports", {
        filename: d("filename"), filepath: d("filepath"),
        job_no: d("job_no"), weld_id: d("weld_id"),
        temperature: d("temperature"), duration: d("duration"),
        result: d("result"), standard: d("standard"),
        report_date: d("report_date"),
        email_subject: d("email_subject"), email_from: d("email_from"),
      });
      break;

    default:
      insertRow("unclassified_documents", {
        filename: d("filename"), filepath: d("filepath"),
        email_subject: d("email_subject"), email_from: d("email_from"),
        note: d("note"),
      });
  }
}

export function queryTable(name: string): unknown[] {
  return readTable(name);
}
