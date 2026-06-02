import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjs from "pdfjs-dist";
import { D } from "../theme";
import type { ProjectDrawing } from "../types";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  drawing:   ProjectDrawing;
  onClose:   () => void;
  onSave:    (rotation: number) => Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const DrawingViewer: React.FC<Props> = ({ drawing, onClose, onSave }) => {
  const [rotation,    setRotation]    = useState(drawing.rotation ?? 0);
  const [pageNum,     setPageNum]     = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [scale,       setScale]       = useState(1.2);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef    = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const renderRef = useRef<pdfjs.RenderTask | null>(null);

  // Load the PDF once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const resp   = await fetch(drawing.url);
        const buffer = await resp.arrayBuffer();
        const doc    = await pdfjs.getDocument({ data: buffer }).promise;
        if (cancelled) { doc.destroy(); return; }
        pdfRef.current = doc;
        setTotalPages(doc.numPages);
        setPageNum(1);
      } catch (e) {
        if (!cancelled) setError("Failed to load PDF. Check network or try re-uploading.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; pdfRef.current?.destroy(); pdfRef.current = null; };
  }, [drawing.url]);

  // Render whenever page, rotation or scale changes
  const renderPage = useCallback(async () => {
    const pdf    = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;

    if (renderRef.current) { renderRef.current.cancel(); }

    const page = await pdf.getPage(pageNum);
    // Build viewport with rotation applied
    const viewport = page.getViewport({ scale, rotation });
    canvas.width  = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d")!;
    const task = page.render({ canvasContext: ctx, viewport });
    renderRef.current = task;
    try { await task.promise; } catch { /* cancelled */ }
  }, [pageNum, rotation, scale]);

  useEffect(() => { if (!loading) renderPage(); }, [loading, renderPage]);

  const rotate = (dir: 1 | -1) =>
    setRotation(r => ((r + dir * 90) + 360) % 360);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(rotation); onClose(); }
    catch (e: unknown) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  // ── Layout ──
  const overlay:   React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1100, display: "flex", flexDirection: "column" };
  const toolbar:   React.CSSProperties = { background: D.surface, borderBottom: `1px solid ${D.border}`, padding: "10px 16px", display: "flex", gap: 12, alignItems: "center", flexShrink: 0 };
  const canvasWrap: React.CSSProperties = { flex: 1, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24, background: "#1a1a2e" };
  const tbBtn = (active?: boolean): React.CSSProperties => ({
    background: active ? D.accent : D.surfaceAlt, color: active ? "#fff" : D.textMid,
    border: `1px solid ${active ? D.accent : D.border}`, borderRadius: 6,
    padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600,
  });

  return (
    <div style={overlay}>
      {/* Toolbar */}
      <div style={toolbar}>
        {/* Title */}
        <div style={{ color: D.text, fontWeight: 700, fontSize: 14, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          📐 {drawing.name}
        </div>

        {/* Page nav */}
        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button style={tbBtn()} onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum === 1}>‹</button>
            <span style={{ color: D.textMid, fontSize: 12, whiteSpace: "nowrap" }}>Page {pageNum} / {totalPages}</span>
            <button style={tbBtn()} onClick={() => setPageNum(p => Math.min(totalPages, p + 1))} disabled={pageNum === totalPages}>›</button>
          </div>
        )}

        {/* Zoom */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button style={tbBtn()} onClick={() => setScale(s => Math.max(0.4, s - 0.2))}>−</button>
          <span style={{ color: D.textMid, fontSize: 12, width: 40, textAlign: "center" }}>{Math.round(scale * 100)}%</span>
          <button style={tbBtn()} onClick={() => setScale(s => Math.min(3, s + 0.2))}>+</button>
        </div>

        {/* Rotation */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ color: D.textSoft, fontSize: 11 }}>Rotate:</span>
          <button style={tbBtn()} onClick={() => rotate(-1)} title="Rotate left 90°">↺</button>
          <span style={{ color: D.textMid, fontSize: 12, width: 36, textAlign: "center" }}>{rotation}°</span>
          <button style={tbBtn()} onClick={() => rotate(1)}  title="Rotate right 90°">↻</button>
        </div>

        {/* Actions */}
        <button
          style={{ ...tbBtn(true), background: saving ? D.textSoft : "#2a5a1a" }}
          onClick={handleSave} disabled={saving}
        >
          {saving ? "Saving…" : "✓ Save Rotation"}
        </button>
        <button style={tbBtn()} onClick={onClose}>✕ Close</button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: D.failBg, border: `1px solid ${D.failBorder}`, color: D.fail, padding: "10px 16px", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Canvas area */}
      <div style={canvasWrap}>
        {loading ? (
          <div style={{ color: "#888", fontSize: 14, marginTop: 80 }}>Loading drawing…</div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.6)", background: "#fff", maxWidth: "100%" }}
          />
        )}
      </div>
    </div>
  );
};
