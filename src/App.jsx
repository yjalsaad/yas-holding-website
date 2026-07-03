import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FALLBACKS, CONTACT } from './content.js';
import { COLLECTION } from './collection.js';
import { loadSiteContent, loadJobs, loadBrands, submitLead } from './supa.js';

/* ────────────────────────────────────────────────────────────────────────
   i18n + Hub-managed content
   ──────────────────────────────────────────────────────────────────────── */
const I18n = createContext(null);
const useI18n = () => useContext(I18n);

function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('yas_lang') || 'en'; } catch { return 'en'; }
  });
  const [managed, setManaged] = useState({}); // { key: {en, ar} } from Supabase

  // Load Hub-managed content once; merge over fallbacks at read time.
  useEffect(() => {
    let alive = true;
    loadSiteContent().then((m) => { if (alive) setManaged(m || {}); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Reflect language on <html> for RTL + font switching.
  useEffect(() => {
    try { localStorage.setItem('yas_lang', lang); } catch {}
    const el = document.documentElement;
    el.setAttribute('lang', lang);
    el.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  const t = useMemo(() => (key) => {
    const m = managed[key];
    if (m && m[lang]) return m[lang];
    const f = FALLBACKS[key];
    if (f && f[lang]) return f[lang];
    return f ? (f.en || key) : key;
  }, [managed, lang]);

  const value = useMemo(() => ({ lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr' }), [lang, t]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

/* ── Scroll reveal ──────────────────────────────────────────────────────── */
function useReveal() {
  const loc = useLocation();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.rv'));
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('vis')); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [loc.pathname]);
}

/* ── Icons (inline, currentColor) ───────────────────────────────────────── */
const I = {
  arrow: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>),
  leaf: (p) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6" /></svg>),
  ruler: (p) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m21.3 8.7-8.6 8.6a2 2 0 0 1-2.8 0l-3.2-3.2a2 2 0 0 1 0-2.8l8.6-8.6a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8Z" /><path d="m7.5 10.5 2 2M10.5 7.5l2 2M13.5 4.5l2 2" /></svg>),
  gem: (p) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 3h12l4 6-10 12L2 9Z" /><path d="M11 3 8 9l4 12 4-12-3-6M2 9h20" /></svg>),
  pin: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>),
  phone: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" /></svg>),
  mail: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>),
  clock: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  ig: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5-2.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" /></svg>),
  fb: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" /></svg>),
  li: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.75-2.05 4 0 4.4 2.6 4.4 6V21H21v-5.3c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H13z" /></svg>),
};

/* ── Header ─────────────────────────────────────────────────────────────── */
const NAV = [
  ['nav.home', '/'],
  ['nav.about', '/about'],
  ['nav.careers', '/careers'],
  ['nav.contact', '/contact'],
];

function Logo() {
  return (
    <span className="logo" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 64 64"><path d="M20 18l12 15 12-15" fill="none" stroke="#c8a34e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /><line x1="32" y1="33" x2="32" y2="47" stroke="#c8a34e" strokeWidth="5" strokeLinecap="round" /></svg>
    </span>
  );
}

function Header() {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); setBrandsOpen(false); }, [loc.pathname]);

  return (
    <header className="hdr">
      <div className="wrap hdr-in">
        <Link to="/" className="brandmark" aria-label="YAS Holding home">
          <Logo />
          <span className="name">{t('brand.name')}<small>{t('brand.tagline')}</small></span>
        </Link>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.home')}</NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.about')}</NavLink>
          <div style={{ position: 'relative' }} onMouseEnter={() => setBrandsOpen(true)} onMouseLeave={() => setBrandsOpen(false)}>
            <button className="nav" style={{ border: 'none', background: 'none', padding: '9px 15px', borderRadius: 999, fontSize: 14.5, fontWeight: 500, color: 'var(--ink-soft)' }} onClick={() => setBrandsOpen((v) => !v)}>{t('nav.brands')} ▾</button>
            {brandsOpen && (
              <div style={{ position: 'absolute', top: '100%', insetInlineStart: 0, background: '#fff', border: '1px solid var(--line)', borderRadius: 12, boxShadow: 'var(--shadow-2)', padding: 8, minWidth: 230, zIndex: 60 }}>
                <Link to="/brands/yas-wood" style={{ display: 'block', padding: '10px 14px', borderRadius: 8, fontSize: 14.5, color: 'var(--ink)' }}>{t('ywood.hero.title')}</Link>
                <Link to="/brands/the-closets-international" style={{ display: 'block', padding: '10px 14px', borderRadius: 8, fontSize: 14.5, color: 'var(--ink)' }}>{t('closets.hero.title')}</Link>
                <Link to="/brands/fittings-house" style={{ display: 'block', padding: '10px 14px', borderRadius: 8, fontSize: 14.5, color: 'var(--ink)' }}>{t('fittings.hero.title')}</Link>
              </div>
            )}
          </div>
          <NavLink to="/collection" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.collection')}</NavLink>
          <NavLink to="/quality" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.quality')}</NavLink>
          <NavLink to="/careers" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.careers')}</NavLink>
          <NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : ''}>{t('nav.contact')}</NavLink>
        </nav>

        <div className="nav-right">
          <button className="langtoggle" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} aria-label="Toggle language">
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
          <Link to="/contact" className="btn btn-dark" style={{ padding: '10px 20px' }}>{t('cta.contact')}</Link>
          <button className="burger" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
        </div>
      </div>
      <div className={'mobile-nav' + (open ? ' open' : '')}>
        <Link to="/">{t('nav.home')}</Link>
        <Link to="/about">{t('nav.about')}</Link>
        <Link to="/brands/yas-wood">{t('ywood.hero.title')}</Link>
        <Link to="/brands/the-closets-international">{t('closets.hero.title')}</Link>
        <Link to="/brands/fittings-house">{t('fittings.hero.title')}</Link>
        <Link to="/collection">{t('nav.collection')}</Link>
        <Link to="/quality">{t('nav.quality')}</Link>
        <Link to="/careers">{t('nav.careers')}</Link>
        <Link to="/contact">{t('nav.contact')}</Link>
      </div>
    </header>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
function Footer() {
  const { t } = useI18n();
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="cols">
          <div>
            <div className="brandmark" style={{ color: 'var(--bone)' }}>
              <Logo />
              <span className="name" style={{ color: 'var(--bone)' }}>{t('brand.name')}<small style={{ color: 'var(--taupe)' }}>{t('brand.tagline')}</small></span>
            </div>
            <p className="brand-blurb">{t('footer.blurb')}</p>
            <div className="socials">
              <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><I.ig /></a>
              <a href={CONTACT.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><I.fb /></a>
              <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><I.li /></a>
            </div>
          </div>
          <div>
            <h4>{t('footer.quick')}</h4>
            <Link to="/">{t('nav.home')}</Link>
            <Link to="/about">{t('nav.about')}</Link>
            <Link to="/careers">{t('nav.careers')}</Link>
            <Link to="/contact">{t('nav.contact')}</Link>
          </div>
          <div>
            <h4>{t('footer.brands')}</h4>
            <Link to="/brands/yas-wood">{t('ywood.hero.title')}</Link>
            <Link to="/brands/the-closets-international">{t('closets.hero.title')}</Link>
            <Link to="/brands/fittings-house">{t('fittings.hero.title')}</Link>
            <Link to="/collection">{t('collection.hero.title')}</Link>
            <Link to="/quality">{t('nav.quality')}</Link>
          </div>
          <div>
            <h4>{t('footer.contact')}</h4>
            <a href={'tel:' + CONTACT.phoneHref}>{CONTACT.phone}</a>
            <a href={'mailto:' + CONTACT.email}>{CONTACT.email}</a>
            <span style={{ display: 'block', padding: '6px 0', fontSize: 14.5 }}>{t('contact.addr.v')}</span>
          </div>
        </div>
        <div className="base">
          <span>{t('footer.rights')}</span>
          <span>{t('contact.addr.v')}</span>
        </div>
      </div>
    </footer>
  );
}

/* ── Reusable bits ──────────────────────────────────────────────────────── */
function SecHead({ eyebrow, title, sub, center }) {
  return (
    <div className={'sec-head rv' + (center ? ' center' : '')}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="serif">{title}</h2>
      {sub && <p className="lead">{sub}</p>}
    </div>
  );
}

function PageHero({ eyebrow, title, sub }) {
  return (
    <section className="phero">
      <div className="wrap in">
        <span className="eyebrow" style={{ color: 'var(--bronze)' }}>{eyebrow}</span>
        <h1 className="serif">{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    </section>
  );
}

/* ── Pages ──────────────────────────────────────────────────────────────── */
function Home() {
  const { t } = useI18n();
  useReveal();
  const [brands, setBrands] = useState([]);
  useEffect(() => { loadBrands().then((b) => setBrands(Array.isArray(b) ? b : [])).catch(() => {}); }, []);
  const logoFor = (key) => { const b = brands.find((x) => x.key === key); return b && b.logo_url ? b.logo_url : ''; };
  const subs = [
    { g: 'Y', key: 'yas-wood', to: '/brands/yas-wood', t: 'ywood.hero.title', d: 'ywood.hero.sub' },
    { g: 'C', key: 'the-closets-international', to: '/brands/the-closets-international', t: 'closets.hero.title', d: 'closets.hero.sub' },
    { g: 'F', key: 'fittings-house', to: '/brands/fittings-house', t: 'fittings.hero.title', d: 'fittings.hero.sub' },
  ];
  const commit = [
    { ic: <I.leaf />, t: 'home.commit.1.t', d: 'home.commit.1.d' },
    { ic: <I.ruler />, t: 'home.commit.2.t', d: 'home.commit.2.d' },
    { ic: <I.gem />, t: 'home.commit.3.t', d: 'home.commit.3.d' },
  ];
  const stats = [['home.stat1.n', 'home.stat1.l'], ['home.stat2.n', 'home.stat2.l'], ['home.stat3.n', 'home.stat3.l'], ['home.stat4.n', 'home.stat4.l']];
  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <span className="eyebrow" style={{ color: 'var(--bronze)' }}>{t('home.hero.eyebrow')}</span>
          <h1 className="serif" style={{ marginTop: 16 }}>{t('home.hero.title')}</h1>
          <p className="lead">{t('home.hero.subtitle')}</p>
          <div className="cta-row">
            <Link to="/about" className="btn btn-gold">{t('cta.explore')} <I.arrow /></Link>
            <Link to="/contact" className="btn btn-ghost-light">{t('cta.contact')}</Link>
          </div>
          <div className="hero-stats">
            {stats.map(([n, l]) => (
              <div className="stat" key={n}><div className="n serif">{t(n)}</div><div className="l">{t(l)}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SecHead eyebrow={t('home.subs.eyebrow')} title={t('home.subs.title')} sub={t('home.subs.sub')} />
          <div className="grid g3">
            {subs.map((s) => {
              const logo = logoFor(s.key);
              return (
                <Link to={s.to} className="brand-card rv" key={s.to}>
                  {logo
                    ? <span className="badge" style={{ background: '#fff', border: '1px solid var(--line)', overflow: 'hidden' }}><img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
                    : <span className="badge serif">{s.g}</span>}
                  <h3 className="serif">{t(s.t)}</h3>
                  <p>{t(s.d)}</p>
                  <span className="more">{t('cta.learnmore')} <I.arrow /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bone-2)' }}>
        <div className="wrap">
          <SecHead eyebrow={t('home.commit.eyebrow')} title={t('home.commit.title')} center />
          <div className="grid g3">
            {commit.map((c) => (
              <div className="value rv" key={c.t}>
                <span className="ic">{c.ic}</span>
                <h3 className="serif">{t(c.t)}</h3>
                <p>{t(c.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="band rv">
            <h2 className="serif">{t('home.band.title')}</h2>
            <p>{t('home.band.sub')}</p>
            <Link to="/contact" className="btn btn-gold">{t('cta.contact')} <I.arrow /></Link>
          </div>
        </div>
      </section>
    </>
  );
}

function About() {
  const { t } = useI18n();
  useReveal();
  const values = [
    { ic: <I.leaf />, t: 'home.commit.1.t', d: 'home.commit.1.d' },
    { ic: <I.ruler />, t: 'home.commit.2.t', d: 'home.commit.2.d' },
    { ic: <I.gem />, t: 'home.commit.3.t', d: 'home.commit.3.d' },
  ];
  return (
    <>
      <PageHero eyebrow={t('about.hero.eyebrow')} title={t('about.hero.title')} sub={t('about.hero.sub')} />
      <section className="section">
        <div className="wrap split">
          <div className="rv">
            <span className="eyebrow">{t('about.story.title')}</span>
            <h2 className="serif" style={{ fontSize: 'clamp(28px,3.6vw,42px)', color: 'var(--espresso)', margin: '14px 0 20px' }}>{t('about.story.title')}</h2>
            <p className="lead" style={{ marginBottom: 18 }}>{t('about.story.p1')}</p>
            <p style={{ color: 'var(--ink-soft)' }}>{t('about.story.p2')}</p>
          </div>
          <div className="media rv"><span className="glyph serif">YAS</span></div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bone-2)' }}>
        <div className="wrap grid g2">
          <div className="value rv" style={{ padding: 36 }}>
            <h3 className="serif" style={{ fontSize: 26 }}>{t('about.mv.mission.t')}</h3>
            <p style={{ fontSize: 16 }}>{t('about.mv.mission.d')}</p>
          </div>
          <div className="value rv" style={{ padding: 36 }}>
            <h3 className="serif" style={{ fontSize: 26 }}>{t('about.mv.vision.t')}</h3>
            <p style={{ fontSize: 16 }}>{t('about.mv.vision.d')}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SecHead title={t('about.values.title')} center />
          <div className="grid g3">
            {values.map((v) => (
              <div className="value rv" key={v.t}><span className="ic">{v.ic}</span><h3 className="serif">{t(v.t)}</h3><p>{t(v.d)}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--espresso)', color: 'var(--bone)' }}>
        <div className="wrap split">
          <div className="rv">
            <span className="eyebrow" style={{ color: 'var(--bronze)' }}>{t('about.iso.eyebrow')}</span>
            <h2 className="serif" style={{ fontSize: 'clamp(28px,3.8vw,44px)', margin: '14px 0 18px' }}>{t('about.iso.title')}</h2>
            <p style={{ color: 'rgba(246,241,231,.8)', fontSize: 16.5, lineHeight: 1.75 }}>{t('about.iso.p')}</p>
          </div>
          <div className="rv" style={{ background: 'rgba(200,163,78,.10)', border: '1px solid var(--line-dark)', borderRadius: 24, padding: 40 }}>
            <span className="eyebrow" style={{ color: 'var(--bronze)' }}>{t('about.leader.eyebrow')}</span>
            <p className="serif" style={{ fontSize: 'clamp(22px,2.6vw,30px)', color: 'var(--bone)', margin: '18px 0 22px', lineHeight: 1.35 }}>{t('about.leader.quote')}</p>
            <div style={{ fontWeight: 600, color: 'var(--bone)' }}>{t('about.leader.name')}</div>
            <div style={{ color: 'var(--bronze)', fontSize: 14.5 }}>{t('about.leader.role')}</div>
          </div>
        </div>
      </section>
    </>
  );
}

function BrandPage({ prefix, glyph, features, ctaHref, ctaKey }) {
  const { t } = useI18n();
  useReveal();
  return (
    <>
      <PageHero eyebrow={t(prefix + '.hero.eyebrow')} title={t(prefix + '.hero.title')} sub={t(prefix + '.hero.sub')} />
      <section className="section">
        <div className="wrap split">
          <div className="rv">
            <h2 className="serif" style={{ fontSize: 'clamp(28px,3.6vw,42px)', color: 'var(--espresso)', marginBottom: 18 }}>{t(prefix + '.body.title')}</h2>
            <p className="lead">{t(prefix + '.body.p')}</p>
            {ctaHref && <a href={ctaHref} target="_blank" rel="noopener noreferrer" className="btn btn-dark" style={{ marginTop: 26 }}>{t(ctaKey)} <I.arrow /></a>}
          </div>
          <div className="media rv"><span className="glyph serif">{glyph}</span></div>
        </div>
      </section>
      {features && (
        <section className="section" style={{ background: 'var(--bone-2)' }}>
          <div className="wrap grid g3">
            {features.map((f) => (
              <div className="value rv" key={f}><h3 className="serif">{t(prefix + '.' + f + '.t')}</h3><p>{t(prefix + '.' + f + '.d')}</p></div>
            ))}
          </div>
        </section>
      )}
      <section className="section">
        <div className="wrap"><div className="band rv"><h2 className="serif">{t('home.band.title')}</h2><p>{t('home.band.sub')}</p><Link to="/contact" className="btn btn-gold">{t('cta.contact')} <I.arrow /></Link></div></div>
      </section>
    </>
  );
}

function Quality() {
  const { t } = useI18n();
  useReveal();
  const pillars = [['quality.p1.t', 'quality.p1.d'], ['quality.p2.t', 'quality.p2.d'], ['quality.p3.t', 'quality.p3.d'], ['quality.p4.t', 'quality.p4.d']];
  const tools = [['quality.tool1.t', 'quality.tool1.d'], ['quality.tool2.t', 'quality.tool2.d'], ['quality.tool3.t', 'quality.tool3.d']];
  return (
    <>
      <PageHero eyebrow={t('quality.hero.eyebrow')} title={t('quality.hero.title')} sub={t('quality.hero.sub')} />
      <section className="section">
        <div className="wrap split">
          <div className="rv">
            <span className="eyebrow">{t('quality.intro.title')}</span>
            <h2 className="serif" style={{ fontSize: 'clamp(28px,3.6vw,42px)', color: 'var(--espresso)', margin: '14px 0 18px' }}>{t('quality.intro.title')}</h2>
            <p className="lead">{t('quality.intro.p')}</p>
          </div>
          <div className="rv" style={{ background: 'rgba(200,163,78,.10)', border: '1px solid var(--line)', borderRadius: 24, padding: 40, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(30px,4vw,44px)', color: 'var(--espresso)', fontWeight: 700 }}>ISO 9001:2015</div>
            <div style={{ color: 'var(--bronze-deep)', fontWeight: 600, marginTop: 8 }}>{t('quality.cert.title')}</div>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14.5, marginTop: 14 }}>{t('quality.cert.p')}</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bone-2)' }}>
        <div className="wrap">
          <SecHead title={t('quality.pillars.title')} center />
          <div className="grid g4">
            {pillars.map(([tt, dd], i) => (
              <div className="value rv" key={tt}>
                <span className="ic serif" style={{ fontWeight: 700, fontSize: 20 }}>{i + 1}</span>
                <h3 className="serif" style={{ fontSize: 19 }}>{t(tt)}</h3>
                <p>{t(dd)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SecHead eyebrow={t('quality.tools.title')} title={t('quality.tools.title')} sub={t('quality.tools.sub')} />
          <div className="grid g3">
            {tools.map(([tt, dd]) => (
              <div className="value rv" key={tt}><h3 className="serif">{t(tt)}</h3><p>{t(dd)}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap"><div className="band rv"><h2 className="serif">{t('home.band.title')}</h2><p>{t('home.band.sub')}</p><Link to="/contact" className="btn btn-gold">{t('cta.contact')} <I.arrow /></Link></div></div>
      </section>
    </>
  );
}

function Collection() {
  const { t } = useI18n();
  useReveal();
  return (
    <>
      <PageHero eyebrow={t('collection.hero.eyebrow')} title={t('collection.hero.title')} sub={t('collection.hero.sub')} />
      <section className="section">
        <div className="wrap">
          <div className="rv" style={{ marginBottom: 26, color: 'var(--muted)', fontSize: 14, fontWeight: 600, letterSpacing: '.02em' }}>
            {COLLECTION.length} {t('collection.count')}
          </div>
          <div className="swatch-grid">
            {COLLECTION.map((sw, i) => (
              <div className="swatch rv" key={sw.name + sw.code + i}>
                <div className="swatch-img"><img src={sw.img} alt={sw.name} loading="lazy" /></div>
                <div className="swatch-meta">
                  <div className="swatch-name serif">{sw.name}</div>
                  {sw.code && <div className="swatch-code">{sw.code}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap"><div className="band rv"><h2 className="serif">{t('home.band.title')}</h2><p>{t('home.band.sub')}</p><Link to="/contact" className="btn btn-gold">{t('collection.cta')} <I.arrow /></Link></div></div>
      </section>
    </>
  );
}

function Careers() {
  const { t, lang } = useI18n();
  useReveal();
  const [jobs, setJobs] = useState(null);
  useEffect(() => { loadJobs().then((j) => setJobs(Array.isArray(j) ? j : [])).catch(() => setJobs([])); }, []);
  return (
    <>
      <PageHero eyebrow={t('careers.hero.eyebrow')} title={t('careers.hero.title')} sub={t('careers.hero.sub')} />
      <section className="section">
        <div className="wrap">
          <SecHead title={t('careers.open.title')} />
          {jobs === null && <p className="lead">…</p>}
          {jobs && jobs.length === 0 && <div className="notice ok" style={{ background: 'var(--bone-2)', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}>{t('careers.empty')}</div>}
          {jobs && jobs.length > 0 && (
            <div className="grid" style={{ gap: 14 }}>
              {jobs.map((j) => {
                const title = lang === 'ar' ? (j.title_ar || j.title_en) : (j.title_en || j.title_ar);
                const meta = [j.department, j.location, j.type].filter(Boolean).join(' · ');
                return (
                  <div className="job rv" key={j.id}>
                    <div>
                      <h3 className="serif">{title}</h3>
                      {meta && <div className="meta">{meta}</div>}
                    </div>
                    <a href={'mailto:careers@yas-holding.com?subject=' + encodeURIComponent('Application: ' + (title || ''))} className="btn btn-ghost">{t('careers.apply')} <I.arrow /></a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Contact() {
  const { t } = useI18n();
  useReveal();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState(''); // '', 'sending', 'ok', 'err'
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('sending');
    try {
      await submitLead({
        name: form.name, email: form.email, phone: form.phone || null,
        subject: form.subject || null, message: form.message,
        source: 'yas-holding-website', created_at: new Date().toISOString(),
      });
      setStatus('ok');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (_) { setStatus('err'); }
  };
  const items = [
    { ic: <I.pin />, k: 'contact.addr.k', v: t('contact.addr.v') },
    { ic: <I.phone />, k: 'contact.phone.k', v: CONTACT.phone, href: 'tel:' + CONTACT.phoneHref },
    { ic: <I.mail />, k: 'contact.email.k', v: CONTACT.email, href: 'mailto:' + CONTACT.email },
    { ic: <I.clock />, k: 'contact.hours.k', v: t('contact.hours.v') },
  ];
  return (
    <>
      <PageHero eyebrow={t('contact.hero.eyebrow')} title={t('contact.hero.title')} sub={t('contact.hero.sub')} />
      <section className="section">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <div className="rv">
            <h2 className="serif" style={{ fontSize: 'clamp(26px,3.2vw,36px)', color: 'var(--espresso)', marginBottom: 8 }}>{t('contact.info.title')}</h2>
            {items.map((it) => (
              <div className="contact-item" key={it.k}>
                <span className="ic">{it.ic}</span>
                <div>
                  <div className="k">{t(it.k)}</div>
                  {it.href ? <a className="v" href={it.href} style={{ color: 'var(--bronze-deep)' }}>{it.v}</a> : <div className="v">{it.v}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="rv" style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 20, padding: 'clamp(24px,4vw,36px)' }}>
            <h2 className="serif" style={{ fontSize: 26, color: 'var(--espresso)', marginBottom: 18 }}>{t('contact.form.title')}</h2>
            <form onSubmit={submit}>
              <div className="field"><label>{t('contact.form.name')}</label><input value={form.name} onChange={set('name')} required /></div>
              <div className="grid g2" style={{ gap: 16 }}>
                <div className="field"><label>{t('contact.form.email')}</label><input type="email" value={form.email} onChange={set('email')} required /></div>
                <div className="field"><label>{t('contact.form.phone')}</label><input value={form.phone} onChange={set('phone')} /></div>
              </div>
              <div className="field"><label>{t('contact.form.subject')}</label><input value={form.subject} onChange={set('subject')} /></div>
              <div className="field"><label>{t('contact.form.message')}</label><textarea rows="5" value={form.message} onChange={set('message')} required /></div>
              {status === 'ok' && <div className="notice ok" style={{ marginBottom: 14 }}>{t('contact.form.ok')}</div>}
              {status === 'err' && <div className="notice err" style={{ marginBottom: 14 }}>{t('contact.form.err')}</div>}
              <button type="submit" className="btn btn-gold" disabled={status === 'sending'} style={{ width: '100%' }}>
                {status === 'sending' ? t('contact.form.sending') : t('contact.form.send')}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

function NotFound() {
  const { t } = useI18n();
  return (
    <section className="section" style={{ textAlign: 'center', paddingTop: 140, paddingBottom: 140 }}>
      <div className="wrap">
        <h1 className="serif" style={{ fontSize: 64, color: 'var(--espresso)' }}>404</h1>
        <p className="lead" style={{ marginTop: 12 }}>Page not found.</p>
        <Link to="/" className="btn btn-dark" style={{ marginTop: 24 }}>{t('nav.home')} <I.arrow /></Link>
      </div>
    </section>
  );
}

/* ── Title / scroll management ──────────────────────────────────────────── */
const TITLES = {
  '/': 'YAS Holding — Premium Wood & Custom Furniture',
  '/about': 'About — YAS Holding',
  '/brands/yas-wood': 'YAS Wood — YAS Holding',
  '/brands/the-closets-international': 'The Closets International — YAS Holding',
  '/brands/fittings-house': 'Fittings House — YAS Holding',
  '/quality': 'Quality & ISO 9001 — YAS Holding',
  '/collection': 'Collection 2023–2025 — YAS Holding',
  '/samples/collection2023-2025': 'Collection 2023–2025 — YAS Holding',
  '/careers': 'Careers — YAS Holding',
  '/contact': 'Contact — YAS Holding',
};
function Chrome() {
  const loc = useLocation();
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.title = TITLES[loc.pathname] || 'YAS Holding';
  }, [loc.pathname]);
  return null;
}

export default function App() {
  return (
    <I18nProvider>
      <Chrome />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/brands/yas-wood" element={<BrandPage prefix="ywood" glyph="Y" features={['f1', 'f2', 'f3']} />} />
          <Route path="/brands/the-closets-international" element={<BrandPage prefix="closets" glyph="C" ctaHref={CONTACT.closetsSite} ctaKey="closets.cta" />} />
          <Route path="/brands/fittings-house" element={<BrandPage prefix="fittings" glyph="F" features={['f1', 'f2', 'f3']} />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/samples/collection2023-2025" element={<Collection />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </I18nProvider>
  );
}
