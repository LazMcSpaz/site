// Signed session tokens for the staff dashboard.
// Token format:  base64url(payloadJSON) "." base64url(HMAC_SHA256(payload, SESSION_SECRET))
// Stored in an HttpOnly, Secure, SameSite=Strict cookie so it's invisible to JS
// and not sent cross-site. No npm deps — uses Web Crypto.

import { type Env, timingSafeEqual } from "./env";

const COOKIE_NAME = "ms_staff";
const DEFAULT_TTL = 60 * 60 * 8; // 8 hours

interface Payload {
  sub: string;
  exp: number; // unix seconds
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0;
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return b64urlEncode(new Uint8Array(sig));
}

export async function signSession(env: Env, ttlSeconds = DEFAULT_TTL): Promise<string> {
  const payload: Payload = { sub: "staff", exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(env.SESSION_SECRET, body);
  return `${body}.${sig}`;
}

export async function verifySession(env: Env, token: string | null): Promise<boolean> {
  if (!token) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expected = await hmac(env.SESSION_SECRET, body);
  if (!timingSafeEqual(sig, expected)) return false;
  try {
    const payload: Payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
    return payload.sub === "staff" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function getCookie(request: Request, name = COOKIE_NAME): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export function sessionSetCookie(token: string, ttlSeconds = DEFAULT_TTL): string {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${ttlSeconds}`;
}

export function sessionClearCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
