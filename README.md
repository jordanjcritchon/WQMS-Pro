# WQMS Pro — Local Setup

This repository contains the WQMS Pro frontend (Vite + React) and a small Node server that provides:

- IMAP inbox scanning and automatic PDF classification + storage
- File saving to local `~/Documents/WQMS Documents`
- A server-side Anthropic (Claude) proxy endpoint for safe AI calls

Quick start (macOS / Linux):

1. Copy the server env example and edit values:

```bash
cp server/.env.example server/.env
# Edit server/.env and set EMAIL, EMAIL_PASSWORD, ANTHROPIC_API_KEY
```

2. Install dependencies (already installed by the dev here):

```bash
npm install
cd server && npm install
```

3. Start the server and frontend for development (in separate terminals):

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
# Use the local Anthropic proxy so frontend uses the server API key
export LOCAL_ANTHROPIC_PROXY=true
npm run dev
```

4. Access frontend at the Vite URL (e.g. http://localhost:5173) and ensure setup API keys are configured via the Setup screen.

Notes and next steps:

- The server IMAP listener runs automatically when the server starts (it will retry on failures).
- Classified documents are saved under `~/Documents/WQMS Documents` in organized folders and JSON registers.
- The frontend includes a full `WPSValidationEngine` UI to extract and validate WPS documents using Anthropic.
- For production: build the frontend (`npm run build`) and serve the static files; run the server as a daemon (systemd/pm2).
- To use the server-side Anthropic proxy in production, ensure `ANTHROPIC_API_KEY` is set in `server/.env` and remove the browser-stored API key if desired.

If you want, I can:

- Add a server-side WPS validation endpoint and automatic background validation of newly-saved WPS files.
- Add a `dev:all` script and a small process manager configuration for production (pm2/systemd).
- Implement CI to run tests and lint.

Tell me which one you'd like me to implement next and I'll proceed.
