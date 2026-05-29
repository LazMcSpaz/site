// POST /api/leads — receive a part request, store it in Supabase, and send
// two emails via Resend: a confirmation to the submitter and a notification
// to the shop owner. Cloudflare Pages Function (Workers runtime).

import { type Env, json } from "../_shared/env";

interface LeadInput {
  name?: string;
  phone?: string;
  email?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  part_needed?: string;
  condition_pref?: string;
  language_pref?: string;
  message?: string;
  company?: string; // honeypot
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );

const clean = (v: unknown, max = 500): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: LeadInput;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // Honeypot — silently accept so bots don't learn they were caught.
  if (clean(body.company)) return json({ ok: true });

  const lead = {
    name: clean(body.name, 120),
    phone: clean(body.phone, 40),
    email: clean(body.email, 200),
    vehicle_year: clean(body.vehicle_year, 4),
    vehicle_make: clean(body.vehicle_make, 60),
    vehicle_model: clean(body.vehicle_model, 60),
    part_needed: clean(body.part_needed, 300),
    condition_pref: clean(body.condition_pref, 20) || "any",
    language_pref: clean(body.language_pref, 5) || "en",
    message: clean(body.message, 2000),
    source: "website",
    status: "new",
  };

  // Required fields
  if (!lead.name || !lead.phone || !lead.email || !lead.part_needed) {
    return json({ error: "Please fill in your name, phone, email, and the part you need." }, 400);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) {
    return json({ error: "That email address doesn't look right." }, 400);
  }

  // --- 1. Store in Supabase (PostgREST) ---
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(lead),
    });
    if (!res.ok) {
      console.error("Supabase insert failed", res.status, await res.text());
      return json({ error: "We couldn't save your request. Please call us at 305-835-2777." }, 502);
    }
  } catch (e) {
    console.error("Supabase insert error", e);
    return json({ error: "We couldn't save your request. Please call us at 305-835-2777." }, 502);
  }

  // --- 2. Emails via Resend (best-effort; lead is already saved) ---
  const vehicle = [lead.vehicle_year, lead.vehicle_make, lead.vehicle_model]
    .filter(Boolean)
    .join(" ") || "—";

  const ownerHtml = `
    <h2>New part request from the website</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td><b>Name</b></td><td>${esc(lead.name)}</td></tr>
      <tr><td><b>Phone</b></td><td>${esc(lead.phone)}</td></tr>
      <tr><td><b>Email</b></td><td>${esc(lead.email)}</td></tr>
      <tr><td><b>Vehicle</b></td><td>${esc(vehicle)}</td></tr>
      <tr><td><b>Part needed</b></td><td>${esc(lead.part_needed)}</td></tr>
      <tr><td><b>Condition</b></td><td>${esc(lead.condition_pref)}</td></tr>
      <tr><td><b>Language</b></td><td>${esc(lead.language_pref)}</td></tr>
      <tr><td valign="top"><b>Message</b></td><td>${esc(lead.message) || "—"}</td></tr>
    </table>`;

  const customerHtml = `
    <div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">
      <p>Hi ${esc(lead.name)},</p>
      <p>Thanks for reaching out to <b>Mory's Auto Parts and Glass</b>. We got your request for:</p>
      <p style="padding:10px 14px;background:#f6efe1;border-left:4px solid #da861c">
        <b>${esc(lead.part_needed)}</b><br>${esc(vehicle)}
      </p>
      <p>We'll work our network and get back to you with options and pricing — usually the same week. If it's urgent, call us at <b>305-835-2777</b>.</p>
      <p style="color:#555">— Mory's Auto Parts and Glass · 151 E 10th Ave, Hialeah, FL</p>
    </div>`;

  const sendEmail = (to: string, subject: string, html: string, replyTo?: string) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.FROM_EMAIL, to, subject, html, reply_to: replyTo }),
    });

  try {
    await Promise.allSettled([
      sendEmail(env.OWNER_EMAIL, `New part request: ${lead.part_needed} (${vehicle})`, ownerHtml, lead.email),
      sendEmail(lead.email, "We got your part request — Mory's Auto Parts", customerHtml),
    ]);
  } catch (e) {
    // Don't fail the request just because email hiccupped — the lead is saved.
    console.error("Resend error", e);
  }

  return json({ ok: true });
};
