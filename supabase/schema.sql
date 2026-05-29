-- Mory's Auto Parts — Supabase schema
-- Run this in the Supabase SQL editor (or via the CLI) once per project.

create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  name           text not null,
  phone          text not null,
  email          text not null,
  vehicle_year   text,
  vehicle_make   text,
  vehicle_model  text,
  part_needed    text not null,
  condition_pref text default 'any',   -- new | used | aftermarket | any
  language_pref  text default 'en',    -- en | es
  message        text,
  source         text default 'website',
  status         text default 'new'    -- new | contacted | quoted | closed
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx     on public.leads (status);

-- Lock the table down. With RLS enabled and NO policies, the anon and
-- authenticated API keys can neither read nor write this table. Our Cloudflare
-- function uses the SERVICE ROLE key, which bypasses RLS — so the website
-- backend can insert leads, but a browser can never touch this data directly.
alter table public.leads enable row level security;
