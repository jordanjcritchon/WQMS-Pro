import path from "path";
import os from "os";
import fs from "fs-extra";
import { validateWpsJson } from "./wpsValidator";

const BASE = path.join(os.homedir(), "Documents", "WQMS Documents");
const QUEUE = path.join(BASE, "WPS Uploads");
const PROCESSED = path.join(QUEUE, "processed");
const OUTFILE = path.join(BASE, "wps_validations.json");

export async function startWpsWorker(apiKey: string | undefined) {
  await fs.ensureDir(QUEUE);
  await fs.ensureDir(PROCESSED);

  if (!apiKey) {
    console.warn("[WQMS] WPS worker started without ANTHROPIC_API_KEY — validations will be skipped");
  }

  async function scanOnce() {
    try {
      const files = (await fs.readdir(QUEUE)).filter(f => f.endsWith('.json'));
      for (const f of files) {
        const full = path.join(QUEUE, f);
        try {
          const json = await fs.readJson(full);
          if (!apiKey) {
            console.log(`[WQMS] Skipping validation for ${f} (no API key)`);
          } else {
            console.log(`[WQMS] Validating WPS ${f}`);
            const result = await validateWpsJson(json, apiKey);
            // append to OUTFILE as an array
            let out = [];
            try { out = await fs.readJson(OUTFILE); } catch {}
            out.unshift({ id: Date.now(), filename: f, validated_at: new Date().toISOString(), result });
            await fs.writeJson(OUTFILE, out, { spaces: 2 });
            console.log(`[WQMS] WPS ${f} validated and saved to ${OUTFILE}`);
          }
        } catch (err) {
          console.error(`[WQMS] Failed processing ${f}: ${(err as Error).message}`);
        } finally {
          // move file to processed
          await fs.move(full, path.join(PROCESSED, f), { overwrite: true });
        }
      }
    } catch (err) {
      console.error("[WQMS] WPS worker scan error:", (err as Error).message);
    }
  }

  // Run immediately then every 30s
  await scanOnce();
  setInterval(scanOnce, 30_000);
  console.log(`[WQMS] WPS worker watching ${QUEUE}`);
}

export default startWpsWorker;
