import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./routes";
import { startImapListener } from "./imap";
import { startWpsWorker } from "./wpsWorker";

dotenv.config();

const { EMAIL, EMAIL_PASSWORD, ANTHROPIC_API_KEY, PORT = "3001" } = process.env;

if (!EMAIL || !EMAIL_PASSWORD) {
  console.error("[WQMS] ERROR: EMAIL and EMAIL_PASSWORD must be set in server/.env");
  process.exit(1);
}

if (!ANTHROPIC_API_KEY) {
  console.warn(
    "[WQMS] WARNING: ANTHROPIC_API_KEY not set — documents will be saved but not classified.\n" +
    "         Add your key to server/.env and restart to enable AI classification."
  );
}

const app = express();
app.use(cors({ origin: /^http:\/\/192\.168\.\d+\.\d+:\d+$|^http:\/\/localhost:\d+$/ }));
app.use(express.json());
app.use("/api", router);

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`[WQMS] API server listening on http://localhost:${PORT}`);
});

// processAll=true on first run so any existing unread emails are picked up
startImapListener(EMAIL, EMAIL_PASSWORD, ANTHROPIC_API_KEY || undefined, true);
// Start WPS worker to automatically validate queued WPS JSON files
startWpsWorker(ANTHROPIC_API_KEY || undefined).catch(err => console.error("[WQMS] WPS worker failed to start:", err.message));
