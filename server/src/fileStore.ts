import path from "path";
import os from "os";
import fs from "fs-extra";
import type { DocType } from "./db";

const BASE = path.join(os.homedir(), "Documents", "WQMS Documents");

const FOLDERS: Record<DocType, string> = {
  MATERIAL_CERT:          path.join(BASE, "Material Certificates"),
  CONSUMABLE_CERT:        path.join(BASE, "Welding Consumable Certificates"),
  NDT_REPORT:             path.join(BASE, "NDT Reports"),
  HEAT_TREATMENT_REPORT:  path.join(BASE, "Heat Treatment Reports"),
  UNKNOWN:                path.join(BASE, "Unclassified"),
};

export async function ensureFolders(): Promise<void> {
  await Promise.all(Object.values(FOLDERS).map(f => fs.ensureDir(f)));
}

export async function saveFile(
  type: DocType,
  originalName: string,
  data: Buffer
): Promise<string> {
  const folder = FOLDERS[type];
  const safe = originalName.replace(/[^a-zA-Z0-9._\- ]/g, "_");
  let dest = path.join(folder, safe);

  if (await fs.pathExists(dest)) {
    const ext  = path.extname(safe);
    const base = path.basename(safe, ext);
    dest = path.join(folder, `${base}_${Date.now()}${ext}`);
  }

  await fs.outputFile(dest, data);
  return dest;
}

export function baseDir(): string {
  return BASE;
}
