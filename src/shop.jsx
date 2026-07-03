import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from './i18n.jsx';
import { useAuth } from './auth.jsx';
import { useCart } from './cart.jsx';
import { COLLECTION } from './collection.js';
import { CONTACT } from './content.js';
import { SUPA_URL, SUPA_KEY, loadProducts, placeOrder, loadMyOrders, getProfile, upsertProfile } from './supa.js';

/* ── helpers ──────────────────────────────────────────────────────────── */
const money = (n, c = 'BHD') => `${c} ${(parseFloat(n) || 0).toFixed(3)}`;
const Arrow = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
const Hero = ({ eyebrow, title, sub }) => (
  <section className="phero"><div className="wrap in">
    <span className="eyebrow" style={{ color: 'var(--gold)' }}>{eyebrow}</span>
    <h1 className="serif">{title}</h1>{sub && <p>{sub}</p>}
  </div></section>
);
const nm = (r, lang, base) => (lang === 'ar' ? (r[base + '_ar'] || r[base + '_en']) : (r[base + '_en'] || r[base + '_ar'])) || '';

/* ── Header cart link (count badge) ───────────────────────────────────── */
export function CartLink() {
  const { count } = useCart();
  return (
    <Link to="/cart" aria-label="Cart" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 999, border: '1px solid var(--line)' }}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
      {count > 0 && <span style={{ position: 'absolute', top: -4, insetInlineEnd: -4, background: 'var(--brand)', color: '#fff', fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 999, display: 'grid', placeItems: 'center', padding: '0 4px' }}>{count}</span>}
    </Link>
  );
}

/* ── Shop (catalog: products + finish samples) ────────────────────────── */
export function Shop() {
  const { t, lang } = useI18n();
  const { add } = useCart();
  const [products, setProducts] = useState(null);
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { loadProducts().then((p) => setProducts(Array.isArray(p) ? p : [])).catch(() => setProducts([])); }, []);

  const categories = useMemo(() => {
    const set = new Set();
    (products || []).forEach((p) => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [products]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (products || []).filter((p) =>
      (!cat || p.category === cat) &&
      (!s || (nm(p, lang, 'name') || '').toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s))
    );
  }, [products, cat, q, lang]);

  const chip = (active) => ({ padding: '8px 15px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
    border: active ? '1px solid var(--brand)' : '1px solid var(--line)', background: active ? 'rgba(168,121,43,.10)' : 'var(--white)', color: active ? 'var(--brand-deep)' : 'var(--ink-soft)' });

  return (
    <>
      <Hero eyebrow={t('shop.hero.eyebrow')} title={t('shop.hero.title')} sub={t('shop.hero.sub')} />
      <section className="section">
        <div className="wrap">
          <div className="sec-head rv"><span className="eyebrow">{t('shop.products.eyebrow')}</span><h2 className="serif">{t('shop.products.title')}</h2></div>

          <div className="rv" style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setCat('')} style={chip(!cat)}>{t('shop.all')}</button>
              {categories.map((c) => <button key={c} onClick={() => setCat(c)} style={chip(cat === c)}>{c}</button>)}
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('shop.search')} style={{ maxWidth: 260, border: '1.5px solid transparent', background: '#f3ede4', borderRadius: 12, padding: '11px 15px', fontSize: 15, color: 'var(--ink)', fontFamily: 'inherit' }} />
          </div>

          {products === null && <p className="lead">…</p>}
          {products && shown.length === 0 && <p className="lead" style={{ color: 'var(--muted)' }}>{t('shop.nomatch')}</p>}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))' }}>
            {shown.map((p) => (
              <div className="swatch rv" key={p.id}>
                <Link to={'/shop/' + p.id} className="swatch-img" style={{ display: 'block' }}>
                  {p.image_url ? <img src={p.image_url} alt={nm(p, lang, 'name')} loading="lazy" /> : null}
                </Link>
                <div className="swatch-meta">
                  <div className="swatch-name serif">{nm(p, lang, 'name')}</div>
                  <div className="swatch-code">{p.category}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
                    <strong style={{ color: 'var(--espresso)' }}>{money(p.price, p.currency)}</strong>
                    <button className="btn btn-gold" style={{ minHeight: 38, padding: '9px 14px', fontSize: 13 }}
                      onClick={() => add({ key: 'p_' + p.id, kind: 'product', name: nm(p, lang, 'name'), price: p.price, currency: p.currency, image: p.image_url })}>
                      {t('shop.add')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bone-2, #efe7d8)', paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head rv"><span className="eyebrow">{t('collection.hero.eyebrow')}</span><h2 className="serif">{t('shop.samples.title')}</h2><p className="lead">{t('shop.samples.sub')}</p></div>
          <div className="swatch-grid">
            {COLLECTION.map((s, i) => (
              <div className="swatch rv" key={s.name + s.code + i}>
                <div className="swatch-img"><img src={s.img} alt={s.name} loading="lazy" /></div>
                <div className="swatch-meta">
                  <div className="swatch-name serif">{s.name}</div>
                  {s.code && <div className="swatch-code">{s.code}</div>}
                  <button className="btn btn-ghost" style={{ minHeight: 36, padding: '8px 12px', fontSize: 13, marginTop: 10, width: '100%' }}
                    onClick={() => add({ key: 's_' + s.code || s.name, kind: 'sample', name: s.name + (s.code ? ' · ' + s.code : ''), code: s.code, price: 0, currency: 'BHD', image: s.img })}>
                    {t('shop.addSample')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Product detail ───────────────────────────────────────────────────── */
export function ProductDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { add } = useCart();
  const nav = useNavigate();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  useEffect(() => { loadProducts().then((all) => setP((all || []).find((x) => x.id === id) || false)).catch(() => setP(false)); }, [id]);

  if (p === null) return <section className="section"><div className="wrap"><p className="lead">…</p></div></section>;
  if (p === false) return <section className="section"><div className="wrap"><p className="lead">{t('shop.notfound')}</p><Link to="/shop" className="btn btn-dark" style={{ marginTop: 16 }}>{t('shop.back')}</Link></div></section>;
  return (
    <section className="section" style={{ paddingTop: 'clamp(40px,6vw,72px)' }}>
      <div className="wrap split" style={{ alignItems: 'start' }}>
        <div className="rv" style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid var(--line)', background: 'var(--sand)' }}>
          {p.image_url && <img src={p.image_url} alt={nm(p, lang, 'name')} style={{ width: '100%', display: 'block' }} />}
        </div>
        <div className="rv">
          <span className="eyebrow">{p.category}</span>
          <h1 className="serif" style={{ fontSize: 'clamp(30px,4vw,44px)', color: 'var(--espresso)', margin: '12px 0 10px' }}>{nm(p, lang, 'name')}</h1>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand-deep)', marginBottom: 16 }}>{money(p.price, p.currency)}</div>
          <p className="lead" style={{ marginBottom: 24 }}>{nm(p, lang, 'description')}</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={qbtn}>−</button>
              <span style={{ minWidth: 40, textAlign: 'center', fontWeight: 600 }}>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} style={qbtn}>+</button>
            </div>
            <button className="btn btn-gold" onClick={() => { add({ key: 'p_' + p.id, kind: 'product', name: nm(p, lang, 'name'), price: p.price, currency: p.currency, image: p.image_url }, qty); nav('/cart'); }}>
              {t('shop.add')} <Arrow />
            </button>
          </div>
          <Link to="/shop" style={{ display: 'inline-block', marginTop: 22, color: 'var(--brand-deep)', fontWeight: 600, fontSize: 14 }}>← {t('shop.back')}</Link>
        </div>
      </div>
    </section>
  );
}
const qbtn = { width: 40, height: 42, border: 'none', background: 'transparent', fontSize: 20, color: 'var(--ink)', cursor: 'pointer' };

/* ── Cart ─────────────────────────────────────────────────────────────── */
export function CartPage() {
  const { t } = useI18n();
  const { items, setQty, remove, subtotal } = useCart();
  const nav = useNavigate();
  return (
    <>
      <Hero eyebrow={t('nav.shop')} title={t('cart.title')} />
      <section className="section">
        <div className="wrap">
          {items.length === 0 ? (
            <div className="notice ok" style={{ background: 'var(--sand)', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}>{t('cart.empty')} <Link to="/shop" style={{ color: 'var(--brand-deep)', fontWeight: 600 }}>{t('shop.hero.title')}</Link></div>
          ) : (
            <div className="split" style={{ alignItems: 'start', gridTemplateColumns: '1.4fr 1fr' }}>
              <div>
                {items.map((it) => (
                  <div key={it.key} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ width: 68, height: 68, borderRadius: 12, overflow: 'hidden', background: 'var(--sand)', flexShrink: 0 }}>{it.image && <img src={it.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                    <div style={{ flex: 1 }}>
                      <div className="serif" style={{ fontSize: 17, color: 'var(--espresso)' }}>{it.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{it.kind === 'sample' ? t('cart.sample') : money(it.price, it.currency)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 10 }}>
                      <button onClick={() => setQty(it.key, it.qty - 1)} style={qbtn}>−</button>
                      <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 600 }}>{it.qty}</span>
                      <button onClick={() => setQty(it.key, it.qty + 1)} style={qbtn}>+</button>
                    </div>
                    <button onClick={() => remove(it.key)} aria-label="Remove" style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 20, padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 10 }}><span>{t('cart.subtotal')}</span><strong>{money(subtotal)}</strong></div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 18 }}>{t('cart.note')}</div>
                <button className="btn btn-gold" style={{ width: '100%' }} onClick={() => nav('/checkout')}>{t('cart.checkout')} <Arrow /></button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* ── Checkout (order / quote / pay-online) ────────────────────────────── */
export function Checkout() {
  const { t } = useI18n();
  const { items, subtotal, clear } = useCart();
  const { user, token } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: 'Manama', notes: '' });
  const [mode, setMode] = useState('order'); // order | quote | pay
  const [status, setStatus] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: user.user_metadata?.full_name || f.name, email: user.email || f.email }));
    if (token && user) getProfile(token, user.id).then((p) => { if (p) setForm((f) => ({ ...f, name: p.full_name || f.name, phone: p.phone || f.phone, address: p.address?.line || f.address, city: p.address?.city || f.city })); }).catch(() => {});
  }, [user, token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setStatus('sending');
    const order = {
      user_id: user?.id || null, customer_name: form.name, email: form.email, phone: form.phone || null,
      address: { line: form.address, city: form.city },
      items, subtotal, total: subtotal, currency: 'BHD',
      type: mode === 'quote' ? 'quote' : 'order',
      payment_method: mode === 'pay' ? 'Card (online)' : mode === 'quote' ? null : 'Bank transfer',
      payment_status: mode === 'pay' ? 'pending' : 'unpaid',
      status: 'new', notes: form.notes || null,
    };
    try {
      const rows = await placeOrder(order, token);
      const orderId = Array.isArray(rows) ? rows[0]?.id : null;
      if (mode === 'pay') {
        // Attempt hosted payment (edge function). Degrades gracefully if not configured.
        try {
          const r = await fetch(SUPA_URL + '/functions/v1/yas-pay', {
            method: 'POST', headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + (token || SUPA_KEY), 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, amount: subtotal, currency: 'BHD', email: form.email }),
          });
          const d = await r.json().catch(() => ({}));
          if (r.ok && d.url) { window.location.href = d.url; return; }
          setStatus('paypending'); clear(); return;
        } catch { setStatus('paypending'); clear(); return; }
      }
      clear(); setStatus(mode === 'quote' ? 'quoteok' : 'ok');
    } catch (_) { setStatus('err'); }
  };

  if (items.length === 0 && !['ok', 'quoteok', 'paypending'].includes(status)) {
    return <section className="section"><div className="wrap"><p className="lead">{t('cart.empty')}</p><Link to="/shop" className="btn btn-dark" style={{ marginTop: 16 }}>{t('shop.hero.title')}</Link></div></section>;
  }
  if (['ok', 'quoteok', 'paypending'].includes(status)) {
    const msg = status === 'quoteok' ? t('checkout.quoteok') : status === 'paypending' ? t('checkout.paypending') : t('checkout.ok');
    return (
      <section className="section" style={{ textAlign: 'center', paddingTop: 120 }}>
        <div className="wrap" style={{ maxWidth: 620 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(46,120,64,.12)', display: 'grid', placeItems: 'center', margin: '0 auto 22px', fontSize: 30 }}>✓</div>
          <h1 className="serif" style={{ fontSize: 34, color: 'var(--espresso)', marginBottom: 12 }}>{t('checkout.thanks')}</h1>
          <p className="lead">{msg}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            <Link to="/shop" className="btn btn-dark">{t('shop.hero.title')}</Link>
            {user && <Link to="/account" className="btn btn-ghost">{t('account.orders')}</Link>}
          </div>
        </div>
      </section>
    );
  }

  const modes = [['order', t('checkout.mode.order')], ['pay', t('checkout.mode.pay')], ['quote', t('checkout.mode.quote')]];
  return (
    <>
      <Hero eyebrow={t('nav.shop')} title={t('checkout.title')} />
      <section className="section">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <form className="rv" onSubmit={submit} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 20, padding: 'clamp(22px,4vw,34px)' }}>
            {!user && <div className="notice ok" style={{ background: 'var(--sand)', color: 'var(--ink-soft)', border: '1px solid var(--line)', marginBottom: 18 }}>{t('checkout.guest')} <Link to="/account" style={{ color: 'var(--brand-deep)', fontWeight: 600 }}>{t('nav.account')}</Link></div>}
            <div className="field"><label>{t('contact.form.name')}</label><input value={form.name} onChange={set('name')} required /></div>
            <div className="grid g2" style={{ gap: 16 }}>
              <div className="field"><label>{t('contact.form.email')}</label><input type="email" value={form.email} onChange={set('email')} required /></div>
              <div className="field"><label>{t('contact.form.phone')}</label><input value={form.phone} onChange={set('phone')} /></div>
            </div>
            <div className="field"><label>{t('checkout.address')}</label><input value={form.address} onChange={set('address')} /></div>
            <div className="field"><label>{t('checkout.city')}</label><input value={form.city} onChange={set('city')} /></div>

            <div style={{ margin: '10px 0 6px', fontSize: 13, fontWeight: 600 }}>{t('checkout.fulfil')}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {modes.map(([id, label]) => (
                <button type="button" key={id} onClick={() => setMode(id)} style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: mode === id ? '2px solid var(--brand)' : '1px solid var(--line)', background: mode === id ? 'rgba(168,121,43,.08)' : '#fff', color: 'var(--ink)' }}>{label}</button>
              ))}
            </div>
            <div className="field"><label>{t('checkout.notes')}</label><textarea rows="3" value={form.notes} onChange={set('notes')} /></div>
            {status === 'err' && <div className="notice err" style={{ marginBottom: 12 }}>{t('contact.form.err')}</div>}
            <button type="submit" className="btn btn-gold" style={{ width: '100%' }} disabled={status === 'sending'}>
              {status === 'sending' ? t('contact.form.sending') : mode === 'quote' ? t('checkout.submitQuote') : mode === 'pay' ? t('checkout.submitPay') : t('checkout.submitOrder')}
            </button>
          </form>

          <div className="rv" style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 20, padding: 28 }}>
            <h3 className="serif" style={{ fontSize: 20, color: 'var(--espresso)', marginBottom: 14 }}>{t('checkout.summary')}</h3>
            {items.map((it) => (
              <div key={it.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14, padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
                <span>{it.name} × {it.qty}</span><span>{it.kind === 'sample' ? '—' : money(it.price * it.qty, it.currency)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 16 }}><strong>{t('cart.subtotal')}</strong><strong>{money(subtotal)}</strong></div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Account (login / register / profile / orders) ────────────────────── */
export function Account() {
  const { t, lang } = useI18n();
  const { user, token, signIn, signUp, signOut } = useAuth();
  if (user) return <Profile />;
  return <AuthForms t={t} lang={lang} signIn={signIn} signUp={signUp} />;
}

function AuthForms({ t, signIn, signUp }) {
  const [tab, setTab] = useState('in');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try {
      if (tab === 'in') { await signIn(f.email, f.password); }
      else { const r = await signUp(f.email, f.password, f.name); if (r.needsConfirm) { setMsg(t('account.confirm')); } }
    } catch (err) { setMsg(err.message || t('account.error')); }
    finally { setBusy(false); }
  };
  return (
    <>
      <Hero eyebrow={t('nav.account')} title={tab === 'in' ? t('account.signin') : t('account.register')} />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 460 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[['in', t('account.signin')], ['up', t('account.register')]].map(([id, l]) => (
              <button key={id} onClick={() => { setTab(id); setMsg(''); }} style={{ flex: 1, padding: '11px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', border: tab === id ? '2px solid var(--brand)' : '1px solid var(--line)', background: tab === id ? 'rgba(168,121,43,.08)' : '#fff', color: 'var(--ink)' }}>{l}</button>
            ))}
          </div>
          <form onSubmit={submit} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 20, padding: 28 }}>
            {tab === 'up' && <div className="field"><label>{t('contact.form.name')}</label><input value={f.name} onChange={set('name')} required /></div>}
            <div className="field"><label>{t('contact.form.email')}</label><input type="email" value={f.email} onChange={set('email')} required /></div>
            <div className="field"><label>{t('account.password')}</label><input type="password" value={f.password} onChange={set('password')} required minLength={6} /></div>
            {msg && <div className="notice ok" style={{ background: 'var(--sand)', color: 'var(--ink-soft)', border: '1px solid var(--line)', marginBottom: 12 }}>{msg}</div>}
            <button type="submit" className="btn btn-gold" style={{ width: '100%' }} disabled={busy}>{busy ? '…' : (tab === 'in' ? t('account.signin') : t('account.register'))}</button>
          </form>
        </div>
      </section>
    </>
  );
}

function Profile() {
  const { t, lang } = useI18n();
  const { user, token, signOut } = useAuth();
  const [profile, setProfile] = useState({ full_name: user.user_metadata?.full_name || '', phone: '', line: '', city: 'Manama' });
  const [orders, setOrders] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    getProfile(token, user.id).then((p) => { if (p) setProfile({ full_name: p.full_name || '', phone: p.phone || '', line: p.address?.line || '', city: p.address?.city || 'Manama' }); }).catch(() => {});
    loadMyOrders(token).then((o) => setOrders(Array.isArray(o) ? o : [])).catch(() => setOrders([]));
  }, [token, user.id]);
  const save = async (e) => {
    e.preventDefault();
    try { await upsertProfile(token, { id: user.id, full_name: profile.full_name, phone: profile.phone, address: { line: profile.line, city: profile.city }, updated_at: new Date().toISOString() }); setSaved(true); setTimeout(() => setSaved(false), 2500); } catch {}
  };
  const set = (k) => (e) => setProfile((s) => ({ ...s, [k]: e.target.value }));
  return (
    <>
      <Hero eyebrow={t('nav.account')} title={t('account.hello') + (profile.full_name ? ', ' + profile.full_name.split(' ')[0] : '')} />
      <section className="section">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <form onSubmit={save} className="rv" style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 20, padding: 28 }}>
            <h3 className="serif" style={{ fontSize: 22, color: 'var(--espresso)', marginBottom: 14 }}>{t('account.profile')}</h3>
            <div className="field"><label>{t('contact.form.name')}</label><input value={profile.full_name} onChange={set('full_name')} /></div>
            <div className="field"><label>{t('account.email')}</label><input value={user.email} disabled style={{ opacity: .7 }} /></div>
            <div className="field"><label>{t('contact.form.phone')}</label><input value={profile.phone} onChange={set('phone')} /></div>
            <div className="field"><label>{t('checkout.address')}</label><input value={profile.line} onChange={set('line')} /></div>
            <div className="field"><label>{t('checkout.city')}</label><input value={profile.city} onChange={set('city')} /></div>
            {saved && <div className="notice ok" style={{ marginBottom: 12 }}>{t('account.saved')}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-gold" style={{ flex: 1 }}>{t('account.save')}</button>
              <button type="button" className="btn btn-ghost" onClick={signOut}>{t('account.signout')}</button>
            </div>
          </form>

          <div className="rv">
            <h3 className="serif" style={{ fontSize: 22, color: 'var(--espresso)', marginBottom: 14 }}>{t('account.orders')}</h3>
            {orders === null && <p className="lead">…</p>}
            {orders && orders.length === 0 && <div className="notice ok" style={{ background: 'var(--sand)', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}>{t('account.noorders')}</div>}
            {orders && orders.map((o) => (
              <div key={o.id} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 16, padding: 18, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <strong style={{ color: 'var(--espresso)' }}>{o.type === 'quote' ? t('checkout.mode.quote') : money(o.total, o.currency)}</strong>
                  <span className="chip">{o.status}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>{new Date(o.created_at).toLocaleDateString()} · {(o.items || []).length} {t('account.items')}{o.payment_method ? ' · ' + o.payment_method : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
