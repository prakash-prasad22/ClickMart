'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { cartKey } from '@/lib/utils';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const STORAGE_KEY = 'cm_cart_v1';
const COUPON_KEY = 'cm_coupon_v1';

const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
};

function merge(a, b) {
  const map = new Map();
  [...a, ...b].forEach((i) => {
    const key = cartKey(i.product, i.variantId);
    const prev = map.get(key);
    map.set(key, { product: String(i.product), variantId: i.variantId ? String(i.variantId) : null, qty: Math.max(prev?.qty || 0, i.qty) });
  });
  return [...map.values()];
}

/**
 * The bag lives in localStorage (works for guests) and is mirrored to the
 * user's account when signed in. Prices always come from the server quote.
 */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [couponCode, setCouponCodeState] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const syncedUser = useRef(null);
  const quoteSeq = useRef(0);

  // Load from storage
  useEffect(() => {
    setItems(read(STORAGE_KEY, []));
    setCouponCodeState(read(COUPON_KEY, ''));
    setHydrated(true);
    const onLogout = () => {
      setItems([]);
      setCouponCodeState('');
      syncedUser.current = null;
    };
    window.addEventListener('cm:logout', onLogout);
    return () => window.removeEventListener('cm:logout', onLogout);
  }, []);

  // Persist locally
  useEffect(() => {
    if (hydrated) write(STORAGE_KEY, items);
  }, [items, hydrated]);
  useEffect(() => {
    if (hydrated) write(COUPON_KEY, couponCode);
  }, [couponCode, hydrated]);

  // On sign-in: merge the server bag with the local one
  useEffect(() => {
    if (!hydrated || !user || user.role !== 'customer' || syncedUser.current) return;
    syncedUser.current = `pending:${user._id}`;
    api.get('/cart')
      .then(({ items: remote }) => {
        syncedUser.current = user._id; // only now may local changes be pushed
        setItems((local) => merge(local, remote || []));
      })
      .catch(() => { syncedUser.current = null; });
  }, [user, hydrated]);

  // Mirror changes to the server (debounced)
  useEffect(() => {
    if (!hydrated || !user || user.role !== 'customer' || syncedUser.current !== user._id) return undefined;
    const t = setTimeout(() => api.put('/cart', { items }).catch(() => {}), 600);
    return () => clearTimeout(t);
  }, [items, user, hydrated]);

  // Re-price whenever the bag or coupon changes
  const refreshQuote = useCallback(async (extra = {}) => {
    const seq = ++quoteSeq.current;
    if (!items.length) {
      setQuote(null);
      return null;
    }
    setQuoteLoading(true);
    try {
      const q = await api.post('/cart/quote', { items, couponCode: couponCode || undefined, ...extra });
      if (seq === quoteSeq.current) setQuote(q);
      return q;
    } catch {
      return null;
    } finally {
      if (seq === quoteSeq.current) setQuoteLoading(false);
    }
  }, [items, couponCode]);

  useEffect(() => {
    if (!hydrated) return undefined;
    const t = setTimeout(refreshQuote, 150);
    return () => clearTimeout(t);
  }, [refreshQuote, hydrated]);

  const add = useCallback((productId, variantId = null, qty = 1, { open = true } = {}) => {
    setItems((prev) => {
      const key = cartKey(productId, variantId);
      const found = prev.find((i) => cartKey(i.product, i.variantId) === key);
      if (found) return prev.map((i) => (i === found ? { ...i, qty: Math.min(99, i.qty + qty) } : i));
      return [...prev, { product: String(productId), variantId: variantId ? String(variantId) : null, qty }];
    });
    if (open) setDrawerOpen(true);
  }, []);

  const update = useCallback((productId, variantId, qty) => {
    const key = cartKey(productId, variantId);
    setItems((prev) => prev.map((i) => (cartKey(i.product, i.variantId) === key ? { ...i, qty } : i)));
  }, []);

  const remove = useCallback((productId, variantId) => {
    const key = cartKey(productId, variantId);
    setItems((prev) => prev.filter((i) => cartKey(i.product, i.variantId) !== key));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setCouponCodeState('');
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      hydrated,
      add,
      update,
      remove,
      clear,
      quote,
      quoteLoading,
      refreshQuote,
      couponCode,
      setCouponCode: setCouponCodeState,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [items, hydrated, add, update, remove, clear, quote, quoteLoading, refreshQuote, couponCode, drawerOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
