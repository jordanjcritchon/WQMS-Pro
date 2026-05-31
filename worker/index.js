/**
 * WQMS Pro — Gmail Cert Inbox Worker (IMAP)
 *
 * Polls wqmscerts@gmail.com every 2 minutes via IMAP.
 * For each new unread email with attachments:
 *   1. Downloads the PDF/image attachment
 *   2. Sends to Claude for classification + data extraction
 *   3. Saves structured data to the correct Supabase register
 *   4. Stores the PDF in Supabase Storage
 *   5. Marks the email as read
 */

import "dotenv/config";
import { ImapFlow } from "imapflow";
import Anthropic    from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────

const POLL_MS    = 30 * 1000;
const CERT_EMAIL = process.env.CERT_EMAIL || "wqmscerts@gmail.com";
const APP_PASS   = process.env.GMAIL_APP_PASSWORD;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUPPORTED_TYPES = [
  "application/pdf",
  "image/jpeg", "image/jpg", "image/png",
];

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
  const contentBlock = mimeType === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Data } }
    : { type: "image",    source: { type: "base64", media_type: mimeType,           data: base64Data } };

  const msg = await anthropic.messages.create({
    model:      "claude-opus-4-7",
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
  const parsed = JSON.parse(text);
  // Always return an array
  return Array.isArray(parsed) ? parsed : [parsed];
}

// ── Supabase Storage upload ───────────────────────────────────────────────────

async function uploadToStorage(bucket, path, base64Data, mimeType) {
  const buffer = Buffer.from(base64Data, "base64");
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ── Save to correct Supabase register ────────────────────────────────────────

async function saveToRegister(inboxId, extracted, docPath, docUrl) {
  const t = extracted.cert_type;
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
      cert_ref: extracted.cert_ref,     classification: extracted.classification,
      manufacturer: extracted.manufacturer, batch_no: extracted.batch_no,
      standard: extracted.standard,     test_date: extracted.test_date,
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
      ht_type: extracted.ht_type,       component_id: extracted.component_id,
      weld_id: extracted.weld_id,       material: extracted.material,
      target_temp: extracted.target_temp, soak_time: extracted.soak_time,
      actual_temp: extracted.actual_temp, result: extracted.result,
      test_date: extracted.test_date,   technician: extracted.technician,
    });
  } else if (t === "welder_qual") {
    await supabase.from("welder_cert_register").insert({
      ...base,
      cert_no: extracted.cert_no || extracted.cert_ref,
      welder_name: extracted.welder_name, stamp_no: extracted.stamp_no,
      standard: extracted.standard,       process: extracted.process,
      material_group: extracted.material_group, positions: extracted.positions || [],
      test_date: extracted.test_date,     expiry_date: extracted.expiry_date,
      test_lab: extracted.test_lab,
    });
  }
  // wps / other: stored in cert_inbox only
}

// ── Process one email ─────────────────────────────────────────────────────────

async function processEmail(client, uid) {
  const msg = await client.fetchOne(uid, {
    source:    true,
    envelope:  true,
    bodyParts: true,
  }, { uid: true });

  if (!msg) return;

  const env     = msg.envelope;
  const from    = env.from?.[0] || {};
  const fromEmail = from.address || "";
  const fromName  = from.name   || "";
  const subject   = env.subject || "";
  const receivedAt = env.date?.toISOString() || new Date().toISOString();

  console.log(`[WQMS] Email: "${subject}" from ${fromEmail}`);

  // Fetch full message to get attachments
  const data = await client.download(uid, undefined, { uid: true });
  if (!data) return;

  // Parse MIME parts
  const chunks = [];
  for await (const chunk of data.content) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("binary");

  // Extract attachments from raw MIME
  const attachments = parseMimeAttachments(raw);

  // Record in cert_inbox
  const { data: inboxRow, error: inboxErr } = await supabase
    .from("cert_inbox")
    .insert({
      gmail_message_id: String(uid),
      from_email:       fromEmail,
      from_name:        fromName,
      subject:          subject,
      received_at:      receivedAt,
      attachment_count: attachments.length,
    })
    .select()
    .single();

  if (inboxErr) {
    if (inboxErr.code === "23505") {
      console.log(`[WQMS] Already processed uid ${uid}, skipping`);
      return;
    }
    console.error("[WQMS] inbox insert error:", inboxErr.message);
    return;
  }

  for (const att of attachments) {
    if (!SUPPORTED_TYPES.includes(att.mimeType)) continue;

    try {
      console.log(`[WQMS] Extracting: ${att.filename} (${att.mimeType})`);
      const certs = await extractCertData(att.base64, att.mimeType);
      console.log(`[WQMS] Found ${certs.length} cert(s) in ${att.filename}`);

      const bucketMap = {
        material: "certs-material", consumable: "certs-consumable",
        ndt: "certs-ndt", heat_treatment: "certs-ht",
        welder_qual: "certs-welder", wps: "wps-documents",
      };

      // Upload the PDF once, reuse URL for all certs found inside it
      const safeName    = att.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${new Date().toISOString().slice(0,10)}/${inboxRow.id}/${safeName}`;
      let docUrl = "";
      try {
        const firstBucket = bucketMap[certs[0]?.cert_type] || "certs-material";
        docUrl = await uploadToStorage(firstBucket, storagePath, att.base64, att.mimeType);
      } catch (e) {
        console.warn("[WQMS] Storage upload failed:", e.message);
      }

      // Save each extracted cert to its register
      for (let i = 0; i < certs.length; i++) {
        const extracted = certs[i];
        console.log(`[WQMS] Saving cert ${i + 1}/${certs.length}: ${extracted.cert_type}`);
        await saveToRegister(inboxRow.id, extracted, storagePath, docUrl);
      }

      const certTypes = [...new Set(certs.map(c => c.cert_type))].join(", ");
      await supabase.from("cert_inbox")
        .update({ extracted: true, cert_type: certTypes })
        .eq("id", inboxRow.id);

      console.log(`[WQMS] ✓ ${att.filename} → ${certs.length} cert(s): ${certTypes}`);

    } catch (e) {
      console.error(`[WQMS] Failed on ${att.filename}:`, e.message);
      await supabase.from("cert_inbox")
        .update({ processing_error: e.message })
        .eq("id", inboxRow.id);
    }
  }

  // Mark as read
  await client.messageFlagsAdd([uid], ["\\Seen"], { uid: true });
}

// ── Simple MIME attachment parser ─────────────────────────────────────────────

function parseMimeAttachments(raw) {
  const attachments = [];
  const boundaryMatch = raw.match(/boundary="?([^"\r\n;]+)"?/i);
  if (!boundaryMatch) return attachments;

  const boundary = "--" + boundaryMatch[1];
  const parts    = raw.split(boundary);

  for (const part of parts) {
    const filenameMatch = part.match(/filename\*?=(?:UTF-8'')?["']?([^"'\r\n;]+)["']?/i);
    const ctMatch       = part.match(/Content-Type:\s*([^\r\n;]+)/i);
    const teMatch       = part.match(/Content-Transfer-Encoding:\s*(\S+)/i);

    if (!filenameMatch || !ctMatch) continue;

    const filename = decodeURIComponent(filenameMatch[1].trim());
    const mimeType = ctMatch[1].trim().toLowerCase();
    const encoding = (teMatch?.[1] || "").toLowerCase();

    if (!SUPPORTED_TYPES.includes(mimeType)) continue;

    // Find the body (after the double blank line)
    const bodyStart = part.indexOf("\r\n\r\n");
    if (bodyStart === -1) continue;

    let body = part.slice(bodyStart + 4);
    // Remove trailing boundary markers
    const endIdx = body.indexOf("--");
    if (endIdx !== -1) body = body.slice(0, endIdx);
    body = body.trim();

    if (encoding === "base64") {
      const base64 = body.replace(/\s/g, "");
      attachments.push({ filename, mimeType, base64 });
    }
  }

  return attachments;
}

// ── Poll loop ─────────────────────────────────────────────────────────────────

async function poll() {
  console.log(`[WQMS] Polling ${CERT_EMAIL}…`);

  const client = new ImapFlow({
    host:   "imap.gmail.com",
    port:   993,
    secure: true,
    auth: { user: CERT_EMAIL, pass: APP_PASS.replace(/\s/g, "") },
    logger: false,
  });

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");

    // Find all unread messages
    const uids = await client.search({ seen: false });

    if (uids.length === 0) {
      console.log("[WQMS] No new messages");
    } else {
      console.log(`[WQMS] ${uids.length} unread message(s)`);
      for (const uid of uids) {
        await processEmail(client, uid);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  } catch (err) {
    console.error("[WQMS] IMAP error:", err.message);
  } finally {
    try { await client.logout(); } catch {}
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────

console.log("╔══════════════════════════════════════╗");
console.log("║  WQMS Pro — Gmail Cert Worker        ║");
console.log("╠══════════════════════════════════════╣");
console.log(`║  Inbox : ${CERT_EMAIL.padEnd(27)}║`);
console.log("║  Poll  : every 30 seconds            ║");
console.log("╚══════════════════════════════════════╝\n");

poll();
setInterval(poll, POLL_MS);
