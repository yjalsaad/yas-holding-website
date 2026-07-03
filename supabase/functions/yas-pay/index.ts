// YAS Wood — hosted payment initiation (Supabase Edge Function).
//
// The storefront's "Pay online by card" option POSTs here. This function should
// create a hosted-checkout session with your gateway and return { url }, which
// the browser redirects to. Until you add a gateway secret, it returns 501 and
// the storefront gracefully falls back to "we'll send you a payment link".
//
// TO ENABLE (Bahrain-friendly gateways: Tap Payments or Stripe):
//   1. Create a merchant account and get your SECRET key.
//   2. supabase secrets set TAP_SECRET_KEY=sk_live_xxx   (or STRIPE_SECRET_KEY)
//   3. Fill in the gateway call below (Tap example sketched).
//   4. supabase functions deploy yas-pay --no-verify-jwt
//
// SECURITY: never put the secret key in the website repo or the browser — it
// lives only in Supabase function secrets. This function is the only place it's used.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { order_id, amount, currency = 'BHD', email } = await req.json();
    const TAP = Deno.env.get('TAP_SECRET_KEY');

    if (!TAP) {
      // Not configured yet — storefront handles this as "payment link to follow".
      return new Response(JSON.stringify({ error: 'payment_not_configured' }), {
        status: 501, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Example: Tap Payments hosted charge ──────────────────────────────
    // const res = await fetch('https://api.tap.company/v2/charges', {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${TAP}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     amount, currency,
    //     customer: { email },
    //     source: { id: 'src_all' },
    //     redirect: { url: `${Deno.env.get('SITE_URL')}/account?order=${order_id}` },
    //     reference: { order: order_id },
    //   }),
    // });
    // const data = await res.json();
    // return new Response(JSON.stringify({ url: data.transaction?.url }), {
    //   headers: { ...CORS, 'Content-Type': 'application/json' },
    // });

    return new Response(JSON.stringify({ error: 'gateway_not_implemented' }), {
      status: 501, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
