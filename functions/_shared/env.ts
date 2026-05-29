// Shared types + helpers for Cloudflare Pages Functions.
// No runtime npm deps — everything uses fetch + Web Crypto so it runs
// natively in the Cloudflare Workers runtime.

export interface Env {
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string; // server-only; never exposed to the browser
  // Resend
  RESEND_API_KEY: string;
  FROM_EMAIL: string; // e.g. "Mory's Auto Parts <noreply@morysautoparts.com>"
  OWNER_EMAIL: string; // where lead notifications go (e.g. mory7373@gmail.com)
  // Staff auth
  STAFF_PIN_HASH: string; // hex SHA-256 of (pin + SESSION_SECRET)
  SESSION_SECRET: string; // long random string; signs session cookies & salts the PIN
  // Optional: bind a KV namespace named LOGIN_RL to enable login rate limiting.
  LOGIN_RL?: KVNamespace;
}

export function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/** Hex SHA-256 of an arbitrary string (Web Crypto, Workers-compatible). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison to avoid timing leaks on secrets. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
