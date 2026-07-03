-- ============================================================================
-- YAS Holding website — data layer (shared Bonsai Hub Supabase project)
-- Tables the public site reads (content/brands/jobs) + the contact inbox (leads).
-- Public (anon) can read content/brands/jobs and submit leads; only authenticated
-- staff (any hub_role) can manage content and read/manage leads.
-- Idempotent: safe to re-run.
-- ============================================================================

create table if not exists public.yas_site_content (
  key        text primary key,
  en         text default '',
  ar         text default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.yas_brands (
  id         uuid primary key default gen_random_uuid(),
  key        text,
  name_en    text, name_ar text,
  blurb_en   text, blurb_ar text,
  logo_url   text, url text,
  sort       int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.yas_jobs (
  id             uuid primary key default gen_random_uuid(),
  title_en       text, title_ar text,
  department     text, location text, type text,
  description_en text, description_ar text,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists public.yas_leads (
  id         uuid primary key default gen_random_uuid(),
  name       text, email text, phone text,
  subject    text, message text,
  source     text, status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.yas_site_content enable row level security;
alter table public.yas_brands       enable row level security;
alter table public.yas_jobs         enable row level security;
alter table public.yas_leads        enable row level security;

-- Public read (content is not sensitive)
drop policy if exists yas_content_anon_read on public.yas_site_content;
create policy yas_content_anon_read on public.yas_site_content for select to anon, authenticated using (true);
drop policy if exists yas_brands_anon_read on public.yas_brands;
create policy yas_brands_anon_read on public.yas_brands for select to anon, authenticated using (true);
drop policy if exists yas_jobs_anon_read on public.yas_jobs;
create policy yas_jobs_anon_read on public.yas_jobs for select to anon, authenticated using (true);

-- Staff write — mirrors the proven Bonsai Hub website-table pattern (p_auth_all):
-- ALL for the authenticated role. The Hub authenticates its REST calls with an
-- elevated key, exactly as it does for website_content / website_configurator_settings.
drop policy if exists p_auth_all on public.yas_site_content;
create policy p_auth_all on public.yas_site_content for all to authenticated using (true) with check (true);
drop policy if exists p_auth_all on public.yas_brands;
create policy p_auth_all on public.yas_brands for all to authenticated using (true) with check (true);
drop policy if exists p_auth_all on public.yas_jobs;
create policy p_auth_all on public.yas_jobs for all to authenticated using (true) with check (true);

-- Leads: anyone submits (contact form); only authenticated staff read/manage
-- (no anon SELECT — PII protected).
drop policy if exists p_auth_all on public.yas_leads;
create policy p_auth_all on public.yas_leads for all to authenticated using (true) with check (true);
drop policy if exists yas_leads_anon_insert on public.yas_leads;
create policy yas_leads_anon_insert on public.yas_leads for insert to anon, authenticated with check (true);

grant select on public.yas_site_content, public.yas_brands, public.yas_jobs to anon, authenticated;
grant insert on public.yas_leads to anon, authenticated;
grant select, update, delete on public.yas_leads to authenticated;
grant all on public.yas_site_content, public.yas_brands, public.yas_jobs to authenticated;
