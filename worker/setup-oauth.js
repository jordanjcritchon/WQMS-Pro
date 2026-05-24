/**
 * WQMS Pro — Gmail OAuth Setup
 *
 * Run this ONCE to get your Gmail refresh token.
 * Then add GOOGLE_REFRESH_TOKEN to your Railway env vars.
 *
 * Usage: node setup-oauth.js
 */

import "dotenv/config";
import { google } from "googleapis";
import readline from "readline";

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env");
  process.exit(1);
}

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, "urn:ietf:wg:oauth:2.0:oob");

const authUrl = auth.generateAuthUrl({
  access_type: "offline",
  prompt:      "consent",
  scope:       ["https://www.googleapis.com/auth/gmail.modify"],
});

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║  WQMS Pro — Gmail Authorization Setup               ║");
console.log("╚══════════════════════════════════════════════════════╝\n");
console.log("1. Open this URL in your browser (sign in as wqmscerts@gmail.com):\n");
console.log("   " + authUrl + "\n");
console.log("2. Click Allow, then copy the authorization code shown.\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("3. Paste the authorization code here: ", async (code) => {
  rl.close();
  try {
    const { tokens } = await auth.getToken(code.trim());
    console.log("\n✅ Success! Add these to your Railway environment variables:\n");
    console.log("   GOOGLE_REFRESH_TOKEN=" + tokens.refresh_token);
    console.log("\nKeep this token secret — it grants access to your Gmail inbox.\n");
  } catch (err) {
    console.error("❌ Failed to get token:", err.message);
  }
});
