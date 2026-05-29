// POST /api/staff/login  { pin: string }
// Verifies the PIN against STAFF_PIN_HASH (= SHA-256(pin + SESSION_SECRET))
// and, on success, sets a signed HttpOnly session cookie.
//
// Brute-force protection: if a KV namespace is bound as LOGIN_RL, failed
// attempts are counted per IP and locked out after MAX_ATTEMPTS within WINDOW.
// Without KV it degrades to a fixed delay on failure. For belt-and-suspenders,
// also add a Cloudflare WAF rate-limit rule on this route (see SETUP.md).

import { type Env, json, sha256Hex, timingSafeEqual } from "../../_shared/env";
import { signSession, sessionSetCookie } from "../../_shared/session";

const MAX_ATTEMPTS = 8;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

function clientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0].trim() ||
    "unknown"
  );
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.STAFF_PIN_HASH || !env.SESSION_SECRET) {
    console.error("Staff auth not configured (missing STAFF_PIN_HASH/SESSION_SECRET).");
    return json({ error: "Login is not configured yet." }, 503);
  }

  const ip = clientIp(request);
  const rlKey = `login:${ip}`;
  const rl = env.LOGIN_RL;

  // Lockout check
  if (rl) {
    const count = Number((await rl.get(rlKey)) || 0);
    if (count >= MAX_ATTEMPTS) {
      return json({ error: "Too many attempts. Try again in a few minutes." }, 429);
    }
  }

  let pin = "";
  try {
    const body = (await request.json()) as { pin?: string };
    pin = typeof body.pin === "string" ? body.pin.trim() : "";
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!pin) return json({ error: "Enter your PIN." }, 400);

  const candidate = await sha256Hex(pin + env.SESSION_SECRET);
  const ok = timingSafeEqual(candidate, env.STAFF_PIN_HASH.toLowerCase());

  if (!ok) {
    if (rl) {
      const count = Number((await rl.get(rlKey)) || 0) + 1;
      await rl.put(rlKey, String(count), { expirationTtl: WINDOW_SECONDS });
    } else {
      // No KV available — at least slow down online brute force.
      await new Promise((r) => setTimeout(r, 400));
    }
    return json({ error: "Incorrect PIN." }, 401);
  }

  // Success — clear any failed-attempt counter and issue the session.
  if (rl) await rl.delete(rlKey);
  const token = await signSession(env);
  return json({ ok: true }, 200, { "Set-Cookie": sessionSetCookie(token) });
};
