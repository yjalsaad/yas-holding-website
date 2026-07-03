import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FALLBACKS } from './content.js';
import { loadSiteContent } from './supa.js';

// ── i18n + Hub-managed content ────────────────────────────────────────────
const I18n = createContext(null);
export const useI18n = () => useContext(I18n);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('yas_lang') || 'en'; } catch { return 'en'; }
  });
  const [managed, setManaged] = useState({});

  useEffect(() => {
    let alive = true;
    loadSiteContent().then((m) => { if (alive) setManaged(m || {}); }).catch(() => {});
    return () => { alive = false; };
  }, []);

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
