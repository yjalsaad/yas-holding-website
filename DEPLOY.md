# Deploying YAS Holding

Two things ship separately:

1. **The public site** (this `yas-holding-website/` folder) → a new GitHub repo + new Vercel project.
2. **The Hub admin module** (already committed inside the `closets-hub` repo) → deploys with the Hub.

---

## 1. Publish the public site

### a. Move it out and create a repo

This folder currently lives inside `closets-hub/` for convenience. Move it to its own location first so it's a clean standalone repo:

```bash
# from your home folder
mv ~/Downloads/closets-hub/yas-holding-website ~/Downloads/yas-holding-website
cd ~/Downloads/yas-holding-website

git init
git add -A
git commit -m "YAS Holding website — initial"
git branch -M main
```

### b. Create the GitHub repo and push

Create an empty repo at github.com (e.g. `yas-holding-website`), then:

```bash
git remote add origin git@github.com:<your-account>/yas-holding-website.git
git push -u origin main
```

### c. Create the Vercel project

1. Go to vercel.com → **Add New… → Project** → import `yas-holding-website`.
2. Vercel auto-detects **Vite**. Framework preset: *Vite*. Build command `npm run build`, output `dist` — already set in `vercel.json`, so accept defaults.
3. No environment variables needed (Supabase URL + public anon key are embedded; RLS governs access).
4. **Deploy.** You'll get a `*.vercel.app` URL to preview.

### d. Point the domain

In the Vercel project → **Settings → Domains** → add your production domain (and its `www.` variant). Vercel shows the DNS records to set at your registrar (an `A` / `CNAME`). Once DNS propagates, the site is live on your domain.

> Adding the domain in Vercel and updating DNS is what switches it over — do this when you're ready to go live.

---

## 2. Ship the Hub admin page

The admin module (`src/YasHoldingWebsiteModule.jsx` + 3 wiring lines in `src/App.js`) is in the **closets-hub** repo. Commit and push it so it deploys with the Hub:

```bash
cd ~/Downloads/closets-hub
git add -A
git commit -m "Add YAS Holding website admin (content/brands/jobs/leads + logo uploads)"
git push origin main
```

After the Hub redeploys, sign in as an admin → **Digital Store → 🏛️ YAS Holding Site**. You can edit every bilingual string, manage the three brands (with logo uploads), post jobs, and read contact-form enquiries — all live on the site.

---

## Backend (already done)

The Supabase tables, RLS and seed content are **already live** on the shared project
(`jflmbfxbhpioyniibjsj`). Nothing to run — see `supabase/001_yas_website.sql` and
`supabase/002_seed_content.sql` for the record.

## Quick verification after deploy

- Public site loads at the Vercel URL; toggle **العربية** — layout mirrors (RTL) and copy switches.
- `/quality`, `/brands/fittings-house`, `/careers`, `/contact` all load on refresh (SPA rewrite).
- Submit the contact form → the enquiry appears in the Hub's **YAS Holding Site → Leads** tab.
- Edit a string in the Hub **Content** tab, Save, reload the site → the change is live.
