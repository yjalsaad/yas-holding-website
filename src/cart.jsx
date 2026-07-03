import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

// ── Cart (localStorage) ───────────────────────────────────────────────────
// Items: { key, kind:'product'|'sample', name, code?, price, currency, image, qty }
const KEY = 'yas_cart';
const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }, [items]);

  const add = useCallback((item, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.key === item.key);
      if (i >= 0) { const n = [...prev]; n[i] = { ...n[i], qty: n[i].qty + qty }; return n; }
      return [...prev, { ...item, qty }];
    });
  }, []);
  const setQty = useCallback((key, qty) => {
    setItems((prev) => prev.map((x) => x.key === key ? { ...x, qty: Math.max(1, qty) } : x));
  }, []);
  const remove = useCallback((key) => setItems((prev) => prev.filter((x) => x.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, x) => s + x.qty, 0);
  const subtotal = items.reduce((s, x) => s + (parseFloat(x.price) || 0) * x.qty, 0);

  const value = useMemo(() => ({ items, add, setQty, remove, clear, count, subtotal }), [items, add, setQty, remove, clear, count, subtotal]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
