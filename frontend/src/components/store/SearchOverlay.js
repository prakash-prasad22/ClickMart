'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Search, X, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import Img from '@/components/ui/Img';

const SUGGESTIONS = ['Almonds', 'Cashews', 'Tussar silk', 'Banarasi', 'Gift hamper', 'Dates'];

export default function SearchOverlay({ open, onClose, categories = [] }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return undefined;
    setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return undefined;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/store/products', { q, limit: 6 }, { signal: ctrl.signal });
        setResults(res.items);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  if (!open || typeof document === 'undefined') return null;

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    onClose();
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-bg shadow-lift animate-fade-up" style={{ animationDuration: '.4s' }}>
        <div className="container py-6">
          <form onSubmit={submit} className="flex items-center gap-3 border-b-2 border-ink pb-3">
            <Search size={22} className="text-muted" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search almonds, sarees, hampers…"
              className="flex-1 bg-transparent font-display text-2xl outline-none placeholder:text-muted/60 sm:text-3xl"
            />
            <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close search">
              <X size={20} />
            </button>
          </form>

          <div className="grid gap-8 py-6 md:grid-cols-[220px_1fr]">
            <div>
              <p className="eyebrow mb-3 text-muted">Popular</p>
              <div className="flex flex-wrap gap-2 md:flex-col md:items-start">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border border-line px-3 py-1 text-sm transition hover:border-ink md:border-0 md:px-0 md:hover:text-primary">
                    {s}
                  </button>
                ))}
              </div>
              {categories.length > 0 && (
                <>
                  <p className="eyebrow mb-3 mt-6 text-muted">Categories</p>
                  <div className="flex flex-wrap gap-2 md:flex-col md:items-start">
                    {categories.map((c) => (
                      <Link key={c._id} href={`/shop?category=${c.slug}`} onClick={onClose} className="text-sm transition hover:text-primary">{c.name}</Link>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="min-h-[120px]">
              {loading && <p className="text-sm text-muted">Searching…</p>}
              {!loading && q && results.length === 0 && <p className="text-sm text-muted">No products match “{q}”.</p>}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((p, i) => (
                  <Link
                    key={p._id}
                    href={`/product/${p.slug}`}
                    onClick={onClose}
                    className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface animate-fade-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <Img src={p.images?.[0]} alt={p.name} className="h-16 w-14 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-sm text-muted">{formatPrice(p.salePrice)}</p>
                    </div>
                    <ArrowUpRight size={16} className="text-muted opacity-0 transition group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
              {results.length > 0 && (
                <button type="button" onClick={submit} className="mt-4 text-sm font-medium text-primary link-underline">See all results</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
