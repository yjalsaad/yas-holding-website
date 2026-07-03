# YAS Holding — Corporate Website

Bilingual (EN/AR) corporate website for **YAS Holding**, content-managed from the
Bonsai Hub and sharing the Hub's Supabase backend. Built as a standalone repo,
separate from The Closets website, with its own distinct corporate identity
(espresso + bronze + bone).

## Stack

- **Vite + React 18** (SPA)
- **react-router-dom** v6
- **Supabase REST** (shared project `jflmbfxbhpioyniibjsj`) for Hub-managed content

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

## Pages

| Route | Page |
|-------|------|
| `/` | Home — hero, subsidiaries, commitment, group CTA |
| `/about` | About — story, mission/vision, values, ISO 9001, leadership |
| `/brands/yas-wood` | YAS Wood brand page |
| `/brands/the-closets-international` | The Closets International brand page |
| `/careers` | Careers — Hub-driven job list |
| `/contact` | Contact — details + enquiry form (writes to `yas_leads`) |

## How content is controlled from the Bonsai Hub

The site paints built-in bilingual fallbacks instantly (`src/content.js`), then
upgrades to Hub-managed copy on load. Editable data lives in four tables in the
shared Supabase project:

| Table | Purpose | Public access |
|-------|---------|---------------|
| `yas_site_content` | All page copy (`key`, `en`, `ar`) | anon **read** |
| `yas_brands` | Subsidiary cards | anon **read** |
| `yas_jobs` | Careers listings | anon **read** |
| `yas_leads` | Contact-form submissions | anon **insert** only (staff read) |

Row-level security: the public (anon) key can read content/brands/jobs and submit
a lead, but **cannot read leads** (PII protected). Writes use `p_auth_all`
(authenticated role) — the same proven pattern as the Hub's existing
`website_content` table, so the Bonsai Hub edits YAS content exactly as it edits
the Closets site content.

The SQL that provisions this is in [`supabase/001_yas_website.sql`](supabase/001_yas_website.sql)
(schema + RLS) and [`supabase/002_seed_content.sql`](supabase/002_seed_content.sql)
(initial bilingual content). Both were applied to the shared project on setup.

Editing content today: update rows in `yas_site_content` (change `en`/`ar` for a
`key`). A dedicated **YAS admin section inside the Bonsai Hub** is the next phase
(see below).

## Deploy

This is a self-contained repo. To ship it:

1. Move this folder out to its own location and create a new GitHub repo:
   ```bash
   cd yas-holding-website
   git init && git add -A && git commit -m "YAS Holding website"
   git branch -M main
   git remote add origin git@github.com:<you>/yas-holding-website.git
   git push -u origin main
   ```
2. Create a **new Vercel project** from that repo. Vercel auto-detects Vite;
   `vercel.json` sets the SPA rewrite so deep links / refresh work.
3. Point `yas-holding.com` DNS at the new Vercel project.

No environment variables are required — the Supabase URL and public anon key are
embedded (safe for the browser; RLS governs access).

## Status

- ✅ Public site (all pages, bilingual EN/AR, RTL, responsive, distinct identity)
- ✅ Supabase data layer (tables + RLS + seed) — live on the shared project
- ✅ Contact form writes real leads; content/careers read live from the Hub tables
- ✅ **Bonsai Hub admin UI** — `YasHoldingWebsiteModule.jsx` in the Hub app adds a
      "🏛️ YAS Holding Site" page (Digital Store group) with Content / Brands / Jobs /
      Leads editors. Hub build compiles; page auto-registers in the permission system.
- ⏳ New Vercel project + domain (deploy step — see above)
