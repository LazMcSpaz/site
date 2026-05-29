// POST /api/staff/logout — clear the session cookie.
import { type Env, json } from "../../_shared/env";
import { sessionClearCookie } from "../../_shared/session";

export const onRequestPost: PagesFunction<Env> = async () => {
  return json({ ok: true }, 200, { "Set-Cookie": sessionClearCookie() });
};
