import { Router } from "express";
import { exec } from "child_process";
import path from "path";
import os from "os";
import { queryTable } from "./db";
import { status } from "./imap";
import { baseDir } from "./fileStore";

export const router = Router();

// ── Scanner status ──────────────────────────────────────────────
router.get("/status", (_req, res) => {
  res.json(status);
});

// ── Registers ───────────────────────────────────────────────────
router.get("/registers/materials",      (_req, res) => res.json(queryTable("material_certificates")));
router.get("/registers/consumables",    (_req, res) => res.json(queryTable("consumable_certificates")));
router.get("/registers/ndt",            (_req, res) => res.json(queryTable("ndt_reports")));
router.get("/registers/heat-treatment", (_req, res) => res.json(queryTable("heat_treatment_reports")));
router.get("/registers/unclassified",   (_req, res) => res.json(queryTable("unclassified_documents")));

// ── Open file in default OS app ─────────────────────────────────
router.post("/file/open", (req, res) => {
  const { filepath } = req.body as { filepath?: string };
  if (!filepath) { res.status(400).json({ error: "filepath required" }); return; }

  // Only allow files inside our managed directory
  const allowed = path.resolve(baseDir());
  const target  = path.resolve(filepath);
  if (!target.startsWith(allowed)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  // macOS: open | Windows: start | Linux: xdg-open
  const cmd =
    process.platform === "win32"  ? `start "" "${target}"` :
    process.platform === "darwin" ? `open "${target}"` :
    `xdg-open "${target}"`;

  exec(cmd, (err) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json({ success: true });
  });
});
