#!/usr/bin/env node
// Generate STAFF_PIN_HASH for the staff dashboard.
// Usage:
//   npm run staff:pin -- 4821                 (reads SESSION_SECRET from .dev.vars)
//   npm run staff:pin -- 4821 my-secret       (explicit secret)
//
// Outputs the hash to paste into .dev.vars (local) and the Cloudflare Pages
// environment variables (production). The hash = SHA-256(pin + SESSION_SECRET).

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const pin = process.argv[2];
let secret = process.argv[3];

if (!pin) {
  console.error("Usage: npm run staff:pin -- <pin> [session-secret]");
  process.exit(1);
}

if (!secret) {
  try {
    const env = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8");
    const match = env.match(/^SESSION_SECRET\s*=\s*"?([^"\n]+)"?/m);
    if (match) secret = match[1].trim();
  } catch {
    /* no .dev.vars yet */
  }
}

if (!secret || secret === "a-long-random-string-change-me") {
  console.error(
    "No real SESSION_SECRET found.\n" +
      "Pass one explicitly:  npm run staff:pin -- <pin> <session-secret>\n" +
      "or set SESSION_SECRET in .dev.vars first."
  );
  process.exit(1);
}

const hash = createHash("sha256").update(pin + secret).digest("hex");

console.log("\nSTAFF_PIN_HASH=" + hash);
console.log("\nPaste this into .dev.vars and your Cloudflare Pages env vars.");
console.log("(Keep the same SESSION_SECRET in both places.)\n");
