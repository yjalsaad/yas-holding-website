import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { SUPA_URL, SUPA_KEY } from './supa.js';

// ── Supabase Auth (GoTrue) — email/password ──────────────────────────────
// Minimal REST client: sign up / sign in / refresh / sign out, with the
// session persisted to localStorage. Exposes { user, token } for authed calls.
const AUTH = SUPA_URL + '/auth/v1';
const KEY = 'yas_session';
const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

async function gotrue(path, body) {
  const r = await fetch(AUTH + path, {
    method: 'POST',
    headers: { apikey: SUPA_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error_description || data.msg || data.message || 'Authentication failed');
  return data;
}

function readSession() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
function writeSession(s) {
  try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch {}
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  const [loading, setLoading] = useState(true);

  // Restore / refresh on mount.
  useEffect(() => {
    (async () => {
      const s = readSession();
      if (s && s.refresh_token && s.expires_at && s.expires_at * 1000 < Date.now() + 60000) {
        try {
          const fresh = await gotrue('/token?grant_type=refresh_token', { refresh_token: s.refresh_token });
          const next = normalise(fresh);
          writeSession(next); setSession(next);
        } catch { writeSession(null); setSession(null); }
      }
      setLoading(false);
    })();
  }, []);

  const normalise = (d) => ({
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: d.expires_at || (Math.floor(Date.now() / 1000) + (d.expires_in || 3600)),
    user: d.user || null,
  });

  const signIn = useCallback(async (email, password) => {
    const d = await gotrue('/token?grant_type=password', { email, password });
    const s = normalise(d); writeSession(s); setSession(s); return s;
  }, []);

  const signUp = useCallback(async (email, password, fullName) => {
    const d = await gotrue('/signup', { email, password, data: { full_name: fullName || '' } });
    // If email confirmation is off, signup returns a session; otherwise no token yet.
    if (d.access_token) { const s = normalise(d); writeSession(s); setSession(s); return { session: s, needsConfirm: false }; }
    return { session: null, needsConfirm: true };
  }, []);

  const signOut = useCallback(() => { writeSession(null); setSession(null); }, []);

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.access_token || null,
    loading,
    signIn, signUp, signOut,
  }), [session, loading, signIn, signUp, signOut]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
