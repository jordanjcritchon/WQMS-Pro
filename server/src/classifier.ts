import Anthropic from "@anthropic-ai/sdk";
import type { DocType } from "./db";

export interface ClassificationResult {
  type: DocType;
  fields: Record<string, string>;
}

const SYSTEM_PROMPT = `You are a welding quality management document specialist.
Analyse the provided document and do two things:
1. Classify it as exactly one of: MATERIAL_CERT, CONSUMABLE_CERT, NDT_REPORT, HEAT_TREATMENT_REPORT, UNKNOWN
2. Extract all relevant fields

Field requirements by type:
- MATERIAL_CERT:         heat_number, material_grade, standard, supplier, date_received, job_no, linked_weld
- CONSUMABLE_CERT:       product_name, batch_number, standard, supplier, date_received, job_no
- NDT_REPORT:            weld_id, process (RT/UT/MT/PT/VT/TOFD), wps_ref, result (PASS or FAIL), standard, inspector, report_date, job_no
- HEAT_TREATMENT_REPORT: job_no, weld_id, temperature, duration, result (PASS or FAIL), standard, report_date

Respond ONLY with valid JSON — no markdown, no explanation:
{
  "type": "DOCUMENT_TYPE",
  "fields": {
    "field_name": "extracted value, or empty string if not found"
  }
}`;

function extractJSON(raw: string): ClassificationResult {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { type: "UNKNOWN", fields: {} };
  try {
    return JSON.parse(match[0]) as ClassificationResult;
  } catch {
    return { type: "UNKNOWN", fields: {} };
  }
}

export async function classifyAndExtract(
  buffer: Buffer,
  filename: string,
  apiKey: string | undefined
): Promise<ClassificationResult> {
  if (!apiKey) {
    return {
      type: "UNKNOWN",
      fields: { note: "No ANTHROPIC_API_KEY configured — document saved but not classified" },
    };
  }

  const client = new Anthropic({ apiKey });

  // Try text extraction first (cheaper, faster)
  let textContent = "";
  try {
    // Lazy require to avoid pdf-parse test-file side effects at import time
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
    const parsed = await pdfParse(buffer);
    textContent = parsed.text.trim();
  } catch {
    // pdf-parse failed — fall through to vision
  }

  if (textContent.length > 200) {
    // Text-based PDF — send extracted text
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Filename: ${filename}\n\nDocument text:\n${textContent.slice(0, 7000)}`,
      }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    return extractJSON(raw);
  }

  // Scanned / image PDF — use Claude vision with document block
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: buffer.toString("base64"),
          },
        } as Anthropic.DocumentBlockParam,
        {
          type: "text",
          text: `Filename: ${filename}. Classify and extract all fields from this document.`,
        },
      ],
    }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  return extractJSON(raw);
}
