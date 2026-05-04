import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { Attachment, ParsedMail } from "mailparser";
import { classifyAndExtract } from "./classifier";
import { saveFile, ensureFolders } from "./fileStore";
import { insertRecord } from "./db";

export interface ScannerStatus {
  connected:      boolean;
  lastChecked:    string | null;
  processedCount: number;
  lastError:      string | null;
  apiKeyPresent:  boolean;
}

export const status: ScannerStatus = {
  connected:      false,
  lastChecked:    null,
  processedCount: 0,
  lastError:      null,
  apiKeyPresent:  false,
};

let pollTimer: NodeJS.Timeout | null = null;

function isPDF(att: Attachment): boolean {
  return (
    att.contentType === "application/pdf" ||
    (att.filename ?? "").toLowerCase().endsWith(".pdf")
  );
}

async function processAttachment(
  att: Attachment,
  mail: ParsedMail,
  apiKey: string | undefined
): Promise<void> {
  const filename     = att.filename || "document.pdf";
  const buffer       = att.content as Buffer;
  const emailFrom    = mail.from?.text ?? "";
  const emailSubject = mail.subject ?? "";
  const dateReceived = new Date().toISOString().split("T")[0];

  const result   = await classifyAndExtract(buffer, filename, apiKey);
  const filePath = await saveFile(result.type, filename, buffer);

  insertRecord(result.type, {
    filename,
    filepath:      filePath,
    email_from:    emailFrom,
    email_subject: emailSubject,
    date_received: dateReceived,
    ...result.fields,
  });

  console.log(`[WQMS] Saved: ${filename} → ${result.type}`);
  status.processedCount++;
}

async function scanInbox(
  client: ImapFlow,
  apiKey: string | undefined,
  processAll: boolean
): Promise<void> {
  // Fetch all message sources first, then process — avoids interleaving STORE inside a FETCH stream
  const lock = await client.getMailboxLock("INBOX");
  const collected: Array<{ uid: number; source: Buffer }> = [];
  try {
    const query = processAll ? {} : { seen: false };
    const uids  = await client.search(query as Record<string, unknown>, { uid: true });
    console.log(`[WQMS] Scan (processAll=${processAll}): ${uids.length} messages found`);
    if (!uids.length) return;

    for await (const msg of client.fetch(uids, { source: true }, { uid: true })) {
      collected.push({ uid: msg.uid, source: msg.source });
    }

    // Mark all fetched messages as seen now that the fetch stream is closed
    const fetchedUids = collected.map(m => m.uid);
    if (fetchedUids.length) {
      await client.messageFlagsAdd(fetchedUids, ["\\Seen"], { uid: true });
    }
  } finally {
    lock.release();
  }

  // Process outside the lock so Claude API calls don't hold the IMAP connection open
  for (const { uid, source } of collected) {
    try {
      const parsed  = await simpleParser(source);
      const pdfAtts = (parsed.attachments ?? []).filter(isPDF);
      console.log(`[WQMS] UID ${uid}: subject="${parsed.subject}" PDFs=${pdfAtts.length}`);
      for (const att of pdfAtts) {
        await processAttachment(att, parsed, apiKey);
      }
    } catch (err) {
      console.error("[WQMS] Message processing error:", (err as Error).message);
    }
  }

  status.lastChecked = new Date().toISOString();
}

export async function startImapListener(
  email:      string,
  password:   string,
  apiKey:     string | undefined,
  processAll: boolean = false
): Promise<void> {
  status.apiKeyPresent = !!apiKey;
  await ensureFolders();

  const connect = async (): Promise<void> => {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }

    const client = new ImapFlow({
      host:   "imap.gmail.com",
      port:   993,
      secure: true,
      auth:   { user: email, pass: password },
      logger: false,
    });

    client.on("error", (err: Error) => {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      status.connected = false;
      status.lastError = err.message;
      console.error("[WQMS] IMAP error:", err.message, "— reconnecting in 30s");
      setTimeout(connect, 30_000);
    });

    try {
      await client.connect();
      status.connected = true;
      status.lastError = null;
      console.log("[WQMS] IMAP connected to outlook.office365.com");

      // Initial scan
      await scanInbox(client, apiKey, processAll);

      // Poll every 30 seconds for new unseen mail
      pollTimer = setInterval(async () => {
        try {
          if (!client.authenticated) throw new Error("Session expired");
          await scanInbox(client, apiKey, false);
        } catch (err: unknown) {
          if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
          status.connected = false;
          status.lastError = (err as Error).message;
          setTimeout(connect, 30_000);
        }
      }, 15_000);

    } catch (err: unknown) {
      status.connected = false;
      status.lastError = (err as Error).message;
      console.error("[WQMS] IMAP connect failed:", status.lastError, "— retrying in 30s");
      setTimeout(connect, 30_000);
    }
  };

  await connect();
}
