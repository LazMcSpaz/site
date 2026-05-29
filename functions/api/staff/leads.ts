// Staff leads inbox API. Lives under /api (outside the /admin middleware),
// so each handler verifies the session cookie itself.
//   GET   /api/staff/leads?status=new   → list leads (newest first)
//   PATCH /api/staff/leads  { id, status } → update a lead's status

import { type Env, json } from "../../_shared/env";
import { getCookie, verifySession } from "../../_shared/session";

const STATUSES = ["new", "contacted", "quoted", "closed"] as const;
type Status = (typeof STATUSES)[number];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireAuth(request: Request, env: Env): Promise<boolean> {
  return verifySession(env, getCookie(request));
}

function sbHeaders(env: Env): HeadersInit {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

function notConfigured(env: Env): boolean {
  return !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await requireAuth(request, env))) return json({ error: "Unauthorized" }, 401);
  if (notConfigured(env)) return json({ error: "Supabase is not connected yet." }, 503);

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let query = `${env.SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`;
  if (status && (STATUSES as readonly string[]).includes(status)) {
    query += `&status=eq.${status}`;
  }

  try {
    const res = await fetch(query, { headers: sbHeaders(env) });
    if (!res.ok) {
      console.error("Supabase leads fetch failed", res.status, await res.text());
      return json({ error: "Could not load leads." }, 502);
    }
    const rows = await res.json();
    return json({ leads: rows });
  } catch (e) {
    console.error("Supabase leads fetch error", e);
    return json({ error: "Could not load leads." }, 502);
  }
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await requireAuth(request, env))) return json({ error: "Unauthorized" }, 401);
  if (notConfigured(env)) return json({ error: "Supabase is not connected yet." }, 503);

  let id = "";
  let status = "";
  try {
    const body = (await request.json()) as { id?: string; status?: string };
    id = typeof body.id === "string" ? body.id : "";
    status = typeof body.status === "string" ? body.status : "";
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (!UUID_RE.test(id)) return json({ error: "Invalid lead id." }, 400);
  if (!(STATUSES as readonly string[]).includes(status)) {
    return json({ error: "Invalid status." }, 400);
  }

  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...sbHeaders(env), Prefer: "return=minimal" },
      body: JSON.stringify({ status: status as Status }),
    });
    if (!res.ok) {
      console.error("Supabase status update failed", res.status, await res.text());
      return json({ error: "Could not update the lead." }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("Supabase status update error", e);
    return json({ error: "Could not update the lead." }, 502);
  }
};
