// Generates PWA PNG icons — run once: node scripts/gen-icons.mjs
import { writeFileSync, mkdirSync } from "fs";
import { createCanvas } from "canvas";

function renderIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const s = size / 512;

  // Outer rounded rect
  ctx.fillStyle = "#09090f";
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, 90 * s);
  ctx.fill();

  // Inner bg
  ctx.fillStyle = "#101018";
  ctx.beginPath();
  ctx.roundRect(30 * s, 30 * s, 452 * s, 452 * s, 70 * s);
  ctx.fill();

  // Primary weld arc
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 28 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(110 * s, 320 * s);
  ctx.quadraticCurveTo(256 * s, 140 * s, 402 * s, 320 * s);
  ctx.stroke();

  // Cap pass
  ctx.strokeStyle = "#8b5cf6";
  ctx.lineWidth = 14 * s;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(130 * s, 320 * s);
  ctx.quadraticCurveTo(256 * s, 160 * s, 382 * s, 320 * s);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Label
  ctx.fillStyle = "#6366f1";
  ctx.font = `bold ${96 * s}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("WQMS", 256 * s, 430 * s);

  return canvas.toBuffer("image/png");
}

mkdirSync("public", { recursive: true });
writeFileSync("public/pwa-192x192.png",    renderIcon(192));
writeFileSync("public/pwa-512x512.png",    renderIcon(512));
writeFileSync("public/apple-touch-icon.png", renderIcon(180));
console.log("✓ Icons generated in public/");
