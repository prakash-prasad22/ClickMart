'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal, X, Check } from 'lucide-react';
import { Drawer } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

export const SORT_OPTIONS = [
  ['featured', 'Featured'],
  ['newest', 'Newest'],
  ['popular', 'Bestselling'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['rating', 'Top rated'],
];

const PRICE_BUCKETS = [
  ['', '500', 'Under ₹500'],
  ['500', '1000', '₹500 – ₹1,000'],
  ['1000', '3000', '₹1,000 – ₹3,000'],
  ['3000', '10000', '₹3,000 – ₹10,000'],
  ['10000', '', 'Above ₹10,000'],
];

function useParamsUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (patch) => {
    const sp = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? sp.set(k, v) : sp.delete(k)));
    sp.delete('page');
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  };
}

function toggleList(current, value) {
  const set = new Set((current || '').split(',').filter(Boolean));
  set.has(value) ? set.delete(value) : set.add(value);
  return [...set].join(',');
}

function FilterBody({ categories, brands }) {
  const params = useSearchParams();
  const update = useParamsUpdater();
  const cat = params.get('category') || '';
  const brand = params.get('brand') || '';
  const minP = params.get('minPrice') || '';
  const maxP = params.get('maxPrice') || '';
  const roots = categories.filter((c) => !c.parent);

  const Check2 = ({ on }) => (
    <span className={cn('flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition', on ? 'border-primary bg-primary text-white' : 'border-line bg-surface')}>
      {on && <Check size={12} strokeWidth={3} />}
    </span>
  );

  return (
    <div className="space-y-8">
      <div>
        <h4 className="mb-3 text-sm font-semibold">Category</h4>
        <ul className="space-y-1">
          {roots.map((c) => (
            <li key={c._id}>
              <button type="button" onClick={() => update({ category: toggleList(cat, c.slug) })} className="flex w-full items-center gap-3 rounded-lg py-1.5 text-left text-sm text-ink-soft transition hover:text-ink">
                <Check2 on={cat.split(',').includes(c.slug)} />
                <span className="flex-1">{c.name}</span>
                <span className="text-xs text-muted">{c.productCount}</span>
              </button>
              <ul className="ml-[30px]">
                {categories.filter((s) => String(s.parent) === String(c._id)).map((s) => (
                  <li key={s._id}>
                    <button type="button" onClick={() => update({ category: toggleList(cat, s.slug) })} className="flex w-full items-center gap-3 py-1 text-left text-[13px] text-muted transition hover:text-ink">
                      <Check2 on={cat.split(',').includes(s.slug)} />
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      {brands.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold">Brand</h4>
          <ul className="space-y-1">
            {brands.map((b) => (
              <li key={b._id}>
                <button type="button" onClick={() => update({ brand: toggleList(brand, b.slug) })} className="flex w-full items-center gap-3 py-1.5 text-left text-sm text-ink-soft transition hover:text-ink">
                  <Check2 on={brand.split(',').includes(b.slug)} />
                  {b.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="mb-3 text-sm font-semibold">Price</h4>
        <div className="flex flex-wrap gap-2">
          {PRICE_BUCKETS.map(([min, max, label]) => {
            const on = minP === min && maxP === max;
            return (
              <button
                key={label}
                type="button"
                onClick={() => update(on ? { minPrice: '', maxPrice: '' } : { minPrice: min, maxPrice: max })}
                className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition', on ? 'border-ink bg-ink text-white' : 'border-line bg-surface hover:border-ink/40')}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <button type="button" onClick={() => update({ inStock: params.get('inStock') ? '' : 'true' })} className="flex items-center gap-3 text-sm text-ink-soft">
          <Check2 on={params.get('inStock') === 'true'} />
          In stock only
        </button>
      </div>
    </div>
  );
}

export function SortSelect() {
  const params = useSearchParams();
  const update = useParamsUpdater();
  return (
    <select value={params.get('sort') || 'featured'} onChange={(e) => update({ sort: e.target.value })} className="input h-10 w-auto rounded-full pl-4 text-[13px]" aria-label="Sort by">
      {SORT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

export function ActiveFilters({ categories, brands }) {
  const params = useSearchParams();
  const update = useParamsUpdater();
  const chips = [];
  (params.get('category') || '').split(',').filter(Boolean).forEach((slug) => {
    chips.push({ label: categories.find((c) => c.slug === slug)?.name || slug, clear: () => update({ category: toggleList(params.get('category'), slug) }) });
  });
  (params.get('brand') || '').split(',').filter(Boolean).forEach((slug) => {
    chips.push({ label: brands.find((b) => b.slug === slug)?.name || slug, clear: () => update({ brand: toggleList(params.get('brand'), slug) }) });
  });
  if (params.get('minPrice') || params.get('maxPrice')) chips.push({ label: `₹${params.get('minPrice') || 0} – ${params.get('maxPrice') ? `₹${params.get('maxPrice')}` : 'above'}`, clear: () => update({ minPrice: '', maxPrice: '' }) });
  if (params.get('q')) chips.push({ label: `“${params.get('q')}”`, clear: () => update({ q: '' }) });
  if (params.get('inStock')) chips.push({ label: 'In stock', clear: () => update({ inStock: '' }) });
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button key={c.label} type="button" onClick={c.clear} className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.06] px-3 py-1 text-xs font-medium transition hover:bg-ink/10 animate-scale-in">
          {c.label} <X size={12} />
        </button>
      ))}
      <button type="button" onClick={() => update({ category: '', brand: '', minPrice: '', maxPrice: '', q: '', inStock: '' })} className="text-xs font-medium text-primary link-underline">
        Clear all
      </button>
    </div>
  );
}

export default function ShopFilters({ categories, brands }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24">
          <FilterBody categories={categories} brands={brands} />
        </div>
      </aside>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline btn-sm lg:hidden">
        <SlidersHorizontal size={15} /> Filters
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} side="left" title="Filters" width="max-w-sm">
        <div className="p-6"><FilterBody categories={categories} brands={brands} /></div>
      </Drawer>
    </>
  );
}
