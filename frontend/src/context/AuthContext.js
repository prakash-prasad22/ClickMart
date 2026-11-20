'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const refresh = useCallback(async () => {
    try {
      const { user: u } = await api.get('/auth/me');
      setUser(u);
      if (u && u.role === 'customer') {
        const w = await api.get('/account/wishlist').catch(() => null);
        setWishlist((w?.ids || []).map(String));
      } else {
        setWishlist([]);
      }
      return u;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async (redirectTo = '/') => {
    await api.post('/auth/logout').catch(() => {});
    setUser(null);
    setWishlist([]);
    window.dispatchEvent(new Event('cm:logout'));
    router.push(redirectTo);
    router.refresh();
  }, [router]);

  const toggleWishlist = useCallback(
    async (productId) => {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      const id = String(productId);
      const had = wishlist.includes(id);
      setWishlist((w) => (had ? w.filter((x) => x !== id) : [...w, id])); // optimistic
      try {
        const res = await api.post(`/account/wishlist/${id}`);
        setWishlist(res.ids.map(String));
        toast?.success(res.added ? 'Saved to your wishlist' : 'Removed from wishlist');
      } catch (e) {
        setWishlist((w) => (had ? [...w, id] : w.filter((x) => x !== id)));
        toast?.error(e.message);
      }
    },
    [user, wishlist, router, pathname, toast]
  );

  const value = useMemo(
    () => ({ user, setUser, loading, refresh, logout, wishlist, toggleWishlist, isStaff: user && user.role !== 'customer' }),
    [user, loading, refresh, logout, wishlist, toggleWishlist]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
