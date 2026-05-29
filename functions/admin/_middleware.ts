// Edge guard for everything under /admin/*.
// Runs before the static admin pages are served. Unauthenticated visitors are
// redirected to the login page; the login page itself is always allowed.

import type { Env } from "../_shared/env";
import { getCookie, verifySession } from "../_shared/session";

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/admin";

  // The login page must be reachable without a session.
  if (path === "/admin/login") return next();

  const token = getCookie(request);
  const valid = await verifySession(env, token);
  if (!valid) {
    return Response.redirect(`${url.origin}/admin/login`, 302);
  }

  return next();
};
