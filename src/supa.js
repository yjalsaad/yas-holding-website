// ── Supabase REST client ──────────────────────────────────────────────
// YAS Holding shares the Bonsai Hub Supabase project. The public site reads
// content the Hub manages (yas_site_content, yas_brands, yas_jobs) and writes
// contact enquiries (yas_leads). The anon key is a public client key — safe to
// ship in the browser; row-level security governs what anon can read/write.
export const SUPA_URL = 'https://jflmbfxbhpioyniibjsj.supabase.co';
export const SUPA_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbG1iZnhiaHBpb3luaWlianNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjkyNjQsImV4cCI6MjA5MDQ0NTI2NH0.XnQHF1Ivzhv6Zj12qe1Gh2x6ZyLdFfmUBweE_5SZnu0';

const H = {
  apikey: SUPA_KEY,
  Authorization: 'Bearer ' + SUPA_KEY,
  'Content-Type': 'application/json',
};

export async function api(path, opts = {}) {
  const r = await fetch(SUPA_URL + '/rest/v1/' + path, {
    headers: { ...H, ...(opts.headers || {}) },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) {
    let msg = 'request failed (' + r.status + ')';
    try {
      const e = await r.json();
      msg = e.message || e.hint || e.details || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  if (r.status === 204) return true;
  try {
    return await r.json();
  } catch (_) {
    return true;
  }
}

// Fetch the whole editable content table once. Returns { key: {en, ar} }.
// Callers merge this over the built-in fallbacks so first paint never blocks.
export async function loadSiteContent() {
  const rows = await api('yas_site_content?select=key,en,ar');
  const map = {};
  (Array.isArray(rows) ? rows : []).forEach((r) => {
    if (r && r.key) map[r.key] = { en: r.en || '', ar: r.ar || '' };
  });
  return map;
}

export async function loadBrands() {
  return api('yas_brands?select=*&active=eq.true&order=sort.asc');
}

export async function loadJobs() {
  return api('yas_jobs?select=*&active=eq.true&order=created_at.desc');
}

export async function submitLead(lead) {
  return api('yas_leads', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: [lead],
  });
}

// ── Shop / account ────────────────────────────────────────────────────────
// Authenticated REST call: uses the logged-in customer's access token as bearer
// (so RLS policies keyed on auth.uid() apply). `apikey` stays the anon key.
export async function authedApi(path, token, opts = {}) {
  const headers = {
    apikey: SUPA_KEY,
    Authorization: 'Bearer ' + (token || SUPA_KEY),
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };
  const r = await fetch(SUPA_URL + '/rest/v1/' + path, {
    ...opts, headers, body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) {
    let msg = 'request failed (' + r.status + ')';
    try { const e = await r.json(); msg = e.message || e.hint || e.details || msg; } catch (_) {}
    throw new Error(msg);
  }
  if (r.status === 204) return true;
  try { return await r.json(); } catch (_) { return true; }
}

export async function loadProducts() {
  return api('yas_products?select=*&active=eq.true&order=sort.asc,created_at.desc');
}

// Place an order/quote via the atomic RPC (inserts order + decrements product
// stock server-side; user_id is taken from the token, not the payload).
export async function placeOrder(order, token) {
  const id = await authedApi('rpc/yas_place_order', token, {
    method: 'POST',
    body: { p_order: order },
  });
  return [{ id: typeof id === 'string' ? id : (id && id.id) || null }];
}

export async function loadMyOrders(token) {
  return authedApi('yas_orders?select=*&order=created_at.desc', token);
}

export async function getProfile(token, userId) {
  const rows = await authedApi('yas_profiles?select=*&id=eq.' + userId, token);
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function upsertProfile(token, profile) {
  return authedApi('yas_profiles', token, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: [profile],
  });
}
