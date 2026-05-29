# Mory's Auto Parts — Setup & Deploy

Astro static site + Cloudflare Pages Functions backend. Database on Supabase, email via Resend.

## Stack at a glance

| Concern | Tech | Where |
|---|---|---|
| Pages / UI | Astro (static) | `src/` → builds to `dist/` |
| Backend API | Cloudflare Pages Functions | `functions/` (zero npm deps; fetch + Web Crypto) |
| Database | Supabase Postgres (`leads` table) | written only from the server function |
| Email | Resend REST API | confirmation to submitter + notification to owner |
| Staff auth | PIN → SHA-256 hash check → signed HttpOnly cookie | `functions/api/staff/*` + `functions/admin/_middleware.ts` |

## Routes

- `/` home · `/contact` · `/service-area` + 8 city pages · `/admin/login` · `/admin` (guarded)
- API: `POST /api/leads`, `POST /api/staff/login`, `POST /api/staff/logout`

---

## 1. Supabase

1. Create a project at supabase.com.
2. SQL editor → run `supabase/schema.sql` (creates the `leads` table with RLS locked down).
3. Grab from Project Settings → API:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — never put in client code)

## 2. Resend

1. Create an account at resend.com, add and **verify the sending domain** (e.g. `morysautoparts.com`).
2. Create an API key → `RESEND_API_KEY`.
3. Set `FROM_EMAIL` to a verified address, e.g. `Mory's Auto Parts <noreply@morysautoparts.com>`.
4. Set `OWNER_EMAIL` to where leads should go (currently `mory7373@gmail.com`).

## 3. Staff PIN

```bash
# pick a SESSION_SECRET (long random string) first, then:
npm run staff:pin -- 4821 "your-long-session-secret"
```
Copy the printed `STAFF_PIN_HASH`. Use the **same** `SESSION_SECRET` everywhere.

## 4. Environment variables

Local (`wrangler pages dev`): copy `.dev.vars.example` → `.dev.vars` and fill in.
Production: Cloudflare Pages → Settings → Environment variables (mark all as **encrypted**):

```
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
RESEND_API_KEY, FROM_EMAIL, OWNER_EMAIL,
STAFF_PIN_HASH, SESSION_SECRET
```

---

## Local development

```bash
npm run dev        # Astro only — fast UI preview. API routes & auth do NOT run here.
npm run preview:cf # build + `wrangler pages dev dist` — full stack incl. functions + auth.
```
Use `preview:cf` (needs `.dev.vars`) to test the form and staff login locally.

## Deploy to Cloudflare Pages

1. Push the `site/` folder to a Git repo (make `site/` the repo root).
2. Cloudflare dashboard → Pages → Connect to Git.
3. Build command: `npm run build` · Build output: `dist` · (Functions in `functions/` are auto-detected.)
4. Add the environment variables above.
5. Add the custom domain `morysautoparts.com` and update DNS.

## Login rate limiting (recommended)

The login route locks out brute force when a **KV namespace bound as `LOGIN_RL`** is present (8 failed attempts per IP per 15 min → 429). Without it, the route falls back to a fixed delay on failure.

To enable in production: Cloudflare → Workers & Pages → KV → create a namespace, then bind it to the Pages project as `LOGIN_RL`. For belt-and-suspenders, also add a Cloudflare WAF rate-limit rule on `/api/staff/login`.

## Regenerating brand assets

Favicons and the social/OG image are generated from `public/morys_logo.png`:
```bash
node scripts/gen-assets.mjs   # → favicon-32.png, apple-touch-icon.png, og-image.jpg
```
Re-run if the logo changes.

## Security notes

- The `leads` table has RLS on with **no policies** — only the service-role key (used server-side) can touch it. The browser can never read or write it.
- Staff session cookie is HttpOnly + Secure + SameSite=Strict, signed with HMAC-SHA256.
- PINs are low-entropy. The login route does constant-time comparison + KV lockout (above). Add a WAF rule and/or Turnstile before launch for extra safety.
- `.dev.vars` is gitignored — never commit real secrets.

## Still to wire (future passes)

- **Leads inbox** is built (`/admin/leads`); **P&L tool** still pending Alex's spec.
- Spanish (`/es/`) routes — content is English-only for now.
- Real photos (see ratios noted in each `PhotoPlaceholder`).
- Curated Google reviews live in `src/data/content.ts` (`reviews`) — swap in real ones.
- Local note: don't pass `--outfile=/tmp/_worker.js` to wrangler; it treats `_worker.js` as a special name and a stale one poisons later builds.
