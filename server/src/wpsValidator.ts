import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a senior welding engineer and WPS validation specialist.
You will be given a JSON object representing extracted WPS fields and (optionally) accompanying PQR data.
Validate the WPS against common welding code rules and return strict JSON only with the following shape:
{
  "overall_confidence": "HIGH|MEDIUM|LOW",
  "score": number,              // 0-100
  "status": "COMPLIANT"|"NON_COMPLIANT"|"REQUIRES_VERIFICATION",
  "issues": [ { "priority":"critical|high|medium|low", "issue":"short description", "clause":"reference if available" } ],
  "details": { /* optional per-check details */ }
}

Be concise, never output extra text, and ensure valid JSON.
`;

export async function validateWpsJson(wpsJson: any, apiKey: string): Promise<any> {
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });

  const userContent = `Validate this WPS JSON and return the result as described.
INPUT_JSON:\n${JSON.stringify(wpsJson, null, 2)}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const raw = response.content && response.content[0] && response.content[0].type === "text"
    ? response.content[0].text
    : "";

  // Try to extract JSON object from raw
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Validator returned non-JSON response");
  try {
    return JSON.parse(m[0]);
  } catch (err) {
    throw new Error("Failed to parse validator JSON: " + (err as Error).message);
  }
}

export default validateWpsJson;
