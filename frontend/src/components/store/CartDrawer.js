'use client';

import Link from 'next/link';
import { ShoppingBag, Trash2, Truck } from 'lucide-react';
import { Drawer } from '@/components/ui/Modal';
import { QtyStepper, Skeleton, EmptyState } from '@/components/ui';
import Img from '@/components/ui/Img';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';

export function FreeShippingMeter({ quote }) {
  if (!quote?.freeShippingAbove) return null;
  const remaining = Math.max(0, quote.freeShippingAbove - (quote.subtotal - quote.couponDiscount));
  const pct = Math.min(100, ((quote.subtotal - quote.couponDiscount) / quote.freeShippingAbove) * 100);
  return (
    <div className="rounded-xl bg-surface-alt/70 p-3.5">
      <p className="flex items-center gap-2 text-[13px] text-ink-soft">
        <Truck size={16} className="text-primary" />
        {remaining > 0 ? (
          <span>Add <b className="text-ink">{formatPrice(remaining)}</b> more for free delivery</span>
        ) : (
          <span className="font-medium text-success">You’ve unlocked free delivery</span>
        )}
      </p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-quiet" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CartLine({ line, compact = false }) {
  const { update, remove } = useCart();
  return (
    <div className="flex gap-4 py-4">
      <Link href={`/product/${line.slug}`} className="shrink-0">
        <Img src={line.image} alt={line.name} className={compact ? 'h-24 w-20 rounded-xl' : 'h-32 w-28 rounded-xl'} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${line.slug}`} className="line-clamp-2 text-sm font-medium transition hover:text-primary">{line.name}</Link>
            {line.variantName && <p className="mt-0.5 text-xs text-muted">{line.variantName}</p>}
          </div>
          <button type="button" onClick={() => remove(line.product, line.variantId)} className="text-muted transition hover:text-danger" aria-label="Remove item">
            <Trash2 size={16} />
          </button>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <QtyStepper size="sm" value={line.qty} max={Math.max(1, Math.min(99, line.available))} onChange={(q) => update(line.product, line.variantId, q)} />
          <div className="text-right">
            <p className="text-sm font-semibold">{formatPrice(line.lineTotal)}</p>
            {line.mrp > line.price && <p className="text-xs text-muted line-through">{formatPrice(line.mrp * line.qty)}</p>}
          </div>
        </div>
        {!line.inStock && <p className="mt-2 text-xs font-medium text-danger">{line.available > 0 ? `Only ${line.available} available` : 'Out of stock'}</p>}
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { drawerOpen, closeDrawer, items, quote, quoteLoading, count } = useCart();
  const empty = items.length === 0;

  return (
    <Drawer
      open={drawerOpen}
      onClose={closeDrawer}
      title={`Your bag${count ? ` (${count})` : ''}`}
      footer={
        !empty && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="text-lg font-semibold">{quote ? formatPrice(quote.subtotal) : '—'}</span>
            </div>
            {quote?.savings > 0 && <p className="text-right text-xs font-medium text-success">You save {formatPrice(quote.savings)}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/cart" onClick={closeDrawer} className="btn btn-outline">View bag</Link>
              <Link href="/checkout" onClick={closeDrawer} className="btn btn-primary">Checkout</Link>
            </div>
            <p className="text-center text-xs text-muted">Shipping & coupons calculated at checkout</p>
          </div>
        )
      }
    >
      {empty ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Discover hand-sorted dry fruits and handwoven sarees."
          action={<Link href="/shop" onClick={closeDrawer} className="btn btn-primary">Start shopping</Link>}
        />
      ) : (
        <div className="px-6 py-4">
          <FreeShippingMeter quote={quote} />
          {!quote && quoteLoading ? (
            <div className="space-y-4 py-4">
              {items.map((i) => (
                <div key={i.product + i.variantId} className="flex gap-4">
                  <Skeleton className="h-24 w-20 rounded-xl" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/3" /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-line/70">
              {quote?.items.map((line) => <CartLine key={`${line.product}${line.variantId}`} line={line} compact />)}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
