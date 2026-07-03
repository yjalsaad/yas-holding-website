# YAS Wood — Shop & Accounts

The store lives under YAS Wood on the YAS Holding site and shares the Bonsai Hub
Supabase backend.

## What's included

- **Catalog** — Hub-managed products (`yas_products`) + the Collection 2023–2025
  finishes as free samples. Routes: `/shop`, `/shop/:id`.
- **Cart** — `/cart`, persisted in the browser.
- **Checkout** — `/checkout`, three modes:
  - **Place order (bank transfer)** — creates an order; team confirms + collects payment.
  - **Request a quote** — no price charged; staff respond with pricing.
  - **Pay online by card** — hosted card payment (needs a gateway; see below).
- **Accounts** — `/account`: email/password sign-up & sign-in (Supabase Auth),
  editable profile, and order history. Guests can also check out.
- **Hub admin** — the "🏛️ YAS Holding Site" module now has **Products** and
  **Orders** tabs (add/edit products with image upload; view orders/quotes/sample
  requests and update status).

## Backend (already live on the shared project)

Tables: `yas_products`, `yas_orders`, `yas_profiles`. RLS:
- Anyone reads active products and can place an order/quote.
- A logged-in customer reads/updates **only their own** profile and orders (`auth.uid()`).
- Staff (Hub) manage everything; customers can't write catalog or content.

> Security note: because customers now authenticate, all staff-editable tables
> (products, site content, brands, jobs, leads) are gated to `hub_role()`. The Hub
> writes with its service-role key (which bypasses RLS), so the admin keeps working.

## One setting to check — email confirmation

Supabase → **Authentication → Providers → Email**:
- If **"Confirm email" is ON** (default), new users must click a link in their email
  before they can sign in. The site handles this ("check your email to confirm").
- If you'd rather let people use the store immediately, turn **Confirm email OFF**.

Also set **Authentication → URL Configuration → Site URL** to your deployed URL
so confirmation links point to the right place.

## Enabling online card payments

Order-intake and quotes work today with no gateway. To turn on "Pay online by card":

1. Get a merchant account (Bahrain: **Tap Payments** or **Stripe**) and your **secret key**.
2. `supabase secrets set TAP_SECRET_KEY=sk_live_xxx`
3. Fill in the gateway call in `supabase/functions/yas-pay/index.ts` (a Tap example is sketched).
4. `supabase functions deploy yas-pay --no-verify-jwt`

The secret key stays in Supabase function secrets — never in the website repo or the
browser. Until this is done, choosing "Pay online" still saves the order and tells the
customer a secure payment link will follow.
