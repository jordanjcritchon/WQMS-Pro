import "dotenv/config";
import { google }   from "googleapis";
import Anthropic    from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ── Env validation ────────────────────────────────────────────────────────────

const REQUIRED = [
  "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN",
  "SUPABASE_URL", "SUPABASE_SERVICE_KEY",
];
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[WQMS] FATAL: ${key} is not set`);
    process.exit(1);
  }
}

const CERT_EMAIL = process.env.CERT_EMAIL || "wqmscerts@gmail.com";
const POLL_MS    = 5 * 60 * 1000; // poll every 5 minutes

// ── Clients ───────────────────────────────────────────────────────────────────

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const gmail     = google.gmail({ version: "v1", auth: oauth2Client });
const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const SUPPORTED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

// ── Claude extraction ─────────────────────────────────────────────────────────

const CERT_SCHEMA = `{
  "cert_type": "",
  "cert_ref": "",
  "supplier": "",
  "test_date": "",
  "standard": "",
  "heat_no": "",
  "grade": "",
  "item_size": "",
  "cev": null,
  "classification": "",
  "manufacturer": "",
  "batch_no": "",
  "report_no": "",
  "method": "",
  "weld_id": "",
  "technician": "",
  "cert_level": "",
  "result": "",
  "defects_found": [],
  "ht_type": "",
  "component_id": "",
  "material": "",
  "target_temp": null,
  "soak_time": null,
  "actual_temp": null,
  "cert_no": "",
  "welder_name": "",
  "stamp_no": "",
  "process": "",
  "material_group": "",
  "positions": [],
  "expiry_date": "",
  "test_lab": ""
}`;

async function extractCertData(base64Data, mimeType) {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set — skipping extraction");
  const safeMime = mimeType === "image/jpg" ? "image/jpeg" : mimeType;

  const contentBlock = safeMime === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Data } }
    : { type: "image",    source: { type: "base64", media_type: safeMime,          data: base64Data } };

  const msg = await anthropic.messages.create({
    model:      "claude-opus-4-8",
    max_tokens: 8192,
    messages: [{
      role:    "user",
      content: [
        contentBlock,
        { type: "text", text: `You are a welding QA document specialist. Read EVERY PAGE of this document thoroughly.

CRITICAL INSTRUCTION: Many PDFs contain multiple certificates — one per page or section. You MUST extract EVERY certificate separately. Missing a certificate is a serious QA failure.

Steps:
1. Count how many distinct certificates or reports are in this document
2. Extract ALL of them — one JSON object per certificate
3. Return a JSON ARRAY — always an array, even if only one cert found

Classify each as one of:
- material       (material test certificate / mill cert)
- consumable     (electrode / filler wire / flux cert)
- ndt            (NDT report: RT, UT, MT, PT, VT)
- heat_treatment (PWHT / heat treatment record)
- welder_qual    (welder qualification certificate)
- wps            (welding procedure specification)
- other

Each object in the array must use this exact structure (empty string or null for unknown fields):
${CERT_SCHEMA}

Return ONLY the JSON array — no markdown, no explanation, no preamble.
For NDT result use PASS or FAIL only.` },
      ],
    }],
  });

  const text = msg.content[0].text.trim()
    .replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) throw new Error(`Claude returned non-JSON: "${text.slice(0, 120)}"`);
  const parsed = JSON.parse(arrayMatch[0]);
  return Array.isArray(parsed) ? parsed : [parsed];
}

// ── Supabase Storage upload ───────────────────────────────────────────────────

async function uploadToStorage(bucket, storagePath, base64Data, mimeType) {
  const buffer = Buffer.from(base64Data, "base64");
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, { contentType: mimeType, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

// ── Save to correct Supabase register ────────────────────────────────────────

async function saveToRegister(inboxId, extracted, docPath, docUrl) {
  const t    = extracted.cert_type;
  const base = { inbox_id: inboxId, document_path: docPath, document_url: docUrl, raw_extracted: extracted };

  if (t === "material") {
    await supabase.from("material_cert_register").insert({
      ...base,
      cert_ref: extracted.cert_ref, heat_no: extracted.heat_no,
      grade: extracted.grade,       standard: extracted.standard,
      supplier: extracted.supplier, test_date: extracted.test_date,
      item_size: extracted.item_size, cev: extracted.cev,
    });
  } else if (t === "consumable") {
    await supabase.from("consumable_cert_register").insert({
      ...base,
      cert_ref: extracted.cert_ref,         classification: extracted.classification,
      manufacturer: extracted.manufacturer, batch_no: extracted.batch_no,
      standard: extracted.standard,         test_date: extracted.test_date,
    });
  } else if (t === "ndt") {
    await supabase.from("ndt_report_register").insert({
      ...base,
      report_no: extracted.report_no || extracted.cert_ref,
      method: extracted.method,         weld_id: extracted.weld_id,
      technician: extracted.technician, cert_level: extracted.cert_level,
      standard: extracted.standard,     result: extracted.result,
      test_date: extracted.test_date,   defects_found: extracted.defects_found || [],
    });
  } else if (t === "heat_treatment") {
    await supabase.from("ht_report_register").insert({
      ...base,
      report_no: extracted.report_no || extracted.cert_ref,
      ht_type: extracted.ht_type,         component_id: extracted.component_id,
      weld_id: extracted.weld_id,         material: extracted.material,
      target_temp: extracted.target_temp, soak_time: extracted.soak_time,
      actual_temp: extracted.actual_temp, result: extracted.result,
      test_date: extracted.test_date,     technician: extracted.technician,
    });
  } else if (t === "welder_qual") {
    await supabase.from("welder_cert_register").insert({
      ...base,
      cert_no: extracted.cert_no || extracted.cert_ref,
      welder_name: extracted.welder_name,       stamp_no: extracted.stamp_no,
      standard: extracted.standard,             process: extracted.process,
      material_group: extracted.material_group, positions: extracted.positions || [],
      test_date: extracted.test_date,           expiry_date: extracted.expiry_date,
      test_lab: extracted.test_lab,
    });
  }
  // wps / other: stored in cert_inbox only
}

// ── Walk Gmail message payload to find attachments ────────────────────────────

function collectAttachments(payload, out = []) {
  if (payload.body?.attachmentId && payload.filename) {
    out.push({
      filename:     payload.filename,
      mimeType:     payload.mimeType,
      attachmentId: payload.body.attachmentId,
    });
  }
  for (const part of payload.parts || []) collectAttachments(part, out);
  return out;
}

// ── Mark a message as read ────────────────────────────────────────────────────

async function markAsRead(messageId) {
  try {
    await gmail.users.messages.modify({
      userId: "me", id: messageId,
      requestBody: { removeLabelIds: ["UNREAD"] },
    });
  } catch (e) {
    console.warn(`[WQMS] Could not mark ${messageId} as read:`, e.message);
  }
}

// ── Process one email ─────────────────────────────────────────────────────────

async function processEmail(messageId) {
  // Skip if already in cert_inbox (handles partial failures from previous runs)
  const { data: existing } = await supabase
    .from("cert_inbox").select("id")
    .eq("gmail_message_id", messageId).maybeSingle();

  if (existing) {
    await markAsRead(messageId);
    return;
  }

  const msg     = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
  const headers = msg.data.payload.headers || [];
  const subject = headers.find(h => h.name === "Subject")?.value || "";
  const from    = headers.find(h => h.name === "From")?.value    || "";
  const date    = headers.find(h => h.name === "Date")?.value    || "";

  const fromMatch = from.match(/^(.+?)\s*<([^>]+)>$/);
  const fromEmail = fromMatch ? fromMatch[2].trim() : from.trim();
  const fromName  = fromMatch ? fromMatch[1].trim() : "";

  console.log(`[WQMS] Email: "${subject}" from ${fromEmail}`);

  const attParts = collectAttachments(msg.data.payload)
    .filter(a => SUPPORTED_TYPES.includes(a.mimeType));

  const { data: inboxRow, error: inboxErr } = await supabase
    .from("cert_inbox")
    .insert({
      gmail_message_id: messageId,
      from_email:       fromEmail,
      from_name:        fromName,
      subject,
      received_at:      date ? new Date(date).toISOString() : new Date().toISOString(),
      attachment_count: attParts.length,
    })
    .select().single();

  if (inboxErr) {
    if (inboxErr.code === "23505") { await markAsRead(messageId); return; }
    console.error("[WQMS] inbox insert error:", inboxErr.message);
    return;
  }

  // Mark as read immediately — prevents reprocessing if extraction crashes
  await markAsRead(messageId);

  if (attParts.length === 0) {
    console.log(`[WQMS] No supported attachments in "${subject}"`);
    return;
  }

  const bucketMap = {
    material: "certs-material", consumable: "certs-consumable",
    ndt: "certs-ndt", heat_treatment: "certs-ht",
    welder_qual: "certs-welder", wps: "wps-documents",
  };

  for (const att of attParts) {
    try {
      console.log(`[WQMS] Downloading: ${att.filename} (attachmentId: ${att.attachmentId?.slice(0,20)}…)`);
      const attRes = await gmail.users.messages.attachments.get({
        userId: "me", messageId, id: att.attachmentId,
      });

      // Gmail API uses base64url — convert to standard base64
      const base64 = (attRes.data.data || "").replace(/-/g, "+").replace(/_/g, "/");
      console.log(`[WQMS] Downloaded ${att.filename}: ${(base64.length * 0.75 / 1024).toFixed(0)} KB`);

      if (!base64) {
        console.warn(`[WQMS] Skipping ${att.filename}: empty attachment data from Gmail API`);
        continue;
      }

      // Skip tiny images — they're inline logos/signatures, not cert documents
      const sizeKB = base64.length * 0.75 / 1024;
      if (att.mimeType.startsWith("image/") && sizeKB < 15) {
        console.log(`[WQMS] Skipping ${att.filename}: ${sizeKB.toFixed(0)} KB inline image (not a cert)`);
        continue;
      }

      // Claude's image limit is 5 MB decoded (~6.7 MB base64)
      const MAX_B64 = 6_700_000;
      if (base64.length > MAX_B64) {
        const sizeMB = (base64.length * 0.75 / 1e6).toFixed(1);
        console.warn(`[WQMS] Skipping ${att.filename}: too large (${sizeMB} MB, limit 5 MB)`);
        await supabase.from("cert_inbox")
          .update({ processing_error: `Attachment too large: ${sizeMB} MB (limit 5 MB)` })
          .eq("id", inboxRow.id);
        continue;
      }

      console.log(`[WQMS] Extracting: ${att.filename} (${att.mimeType})`);
      const certs = await extractCertData(base64, att.mimeType);
      console.log(`[WQMS] Found ${certs.length} cert(s) in ${att.filename}`);

      const safeName    = att.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${new Date().toISOString().slice(0, 10)}/${inboxRow.id}/${safeName}`;
      let docUrl = "";
      try {
        const bucket = bucketMap[certs[0]?.cert_type] || "certs-material";
        docUrl = await uploadToStorage(bucket, storagePath, base64, att.mimeType);
      } catch (e) {
        console.warn("[WQMS] Storage upload failed:", e.message);
      }

      for (let i = 0; i < certs.length; i++) {
        console.log(`[WQMS] Saving cert ${i + 1}/${certs.length}: ${certs[i].cert_type}`);
        await saveToRegister(inboxRow.id, certs[i], storagePath, docUrl);
      }

      const certTypes = [...new Set(certs.map(c => c.cert_type))].join(", ");
      await supabase.from("cert_inbox")
        .update({ extracted: true, cert_type: certTypes }).eq("id", inboxRow.id);

      console.log(`[WQMS] ✓ ${att.filename} → ${certs.length} cert(s): ${certTypes}`);
    } catch (e) {
      console.error(`[WQMS] Failed on ${att.filename}:`, e.message);
      await supabase.from("cert_inbox")
        .update({ processing_error: e.message }).eq("id", inboxRow.id);
    }
    await new Promise(r => setTimeout(r, 500)); // avoid Gmail API rate limiting on multi-attachment emails
  }
}

// ── Poll for unread emails ────────────────────────────────────────────────────

async function pollOnce() {
  try {
    const res      = await gmail.users.messages.list({ userId: "me", q: "is:unread", maxResults: 20 });
    const messages = res.data.messages || [];

    if (messages.length === 0) { console.log("[WQMS] No new messages"); return; }

    console.log(`[WQMS] ${messages.length} unread message(s)`);
    for (const m of messages) {
      await processEmail(m.id);
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (e) {
    console.error("[WQMS] Poll error:", e.message);
  }
}

// ── Sync deletions ────────────────────────────────────────────────────────────

async function syncDeletions() {
  try {
    const res        = await gmail.users.messages.list({ userId: "me", maxResults: 500 });
    const currentIds = new Set((res.data.messages || []).map(m => m.id));

    const { data: stored } = await supabase.from("cert_inbox").select("id, gmail_message_id");
    if (!stored || stored.length === 0) return;

    const deleted = stored.filter(r => !currentIds.has(r.gmail_message_id));
    if (deleted.length > 0) {
      await supabase.from("cert_inbox").delete().in("id", deleted.map(r => r.id));
      console.log(`[WQMS] Removed ${deleted.length} deleted email(s) from feed`);
    }
  } catch (e) {
    console.error("[WQMS] syncDeletions error:", e.message);
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────

console.log("╔══════════════════════════════════════╗");
console.log("║  WQMS Pro — Gmail Cert Worker        ║");
console.log("╠══════════════════════════════════════╣");
console.log(`║  Inbox : ${CERT_EMAIL.padEnd(27)}║`);
console.log("║  Mode  : Gmail API (HTTPS)           ║");
console.log("╚══════════════════════════════════════╝\n");

console.log(`[WQMS] Polling every 5 minutes via Gmail API`);
await pollOnce();
await syncDeletions();
setInterval(async () => { await pollOnce(); await syncDeletions(); }, POLL_MS);
