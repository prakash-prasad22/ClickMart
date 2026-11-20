'use client';

import { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice, cn } from '@/lib/utils';

export function CouponBox() {
  const { couponCode, setCouponCode, quote } = useCart();
  const [code, setCode] = useState('');
  const applied = quote?.coupon;

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-dashed border-success/50 bg-success-soft/60 px-4 py-3 animate-scale-in">
        <div className="flex items-center gap-2 text-sm">
          <Tag size={15} className="text-success" />
          <span className="font-semibold">{applied.code}</span>
          <span className="text-success">−{formatPrice(quote.couponDiscount)}</span>
        </div>
        <button type="button" onClick={() => setCouponCode('')} className="text-muted hover:text-ink" aria-label="Remove coupon"><X size={16} /></button>
      </div>
    );
  }
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) setCouponCode(code.trim().toUpperCase()); }} className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" className="input h-10 uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal" />
        <button className="btn btn-outline btn-sm h-10 shrink-0">Apply</button>
      </form>
      {couponCode && quote?.couponError && <p className="field-error">{quote.couponError}</p>}
    </div>
  );
}

export default function OrderSummary({ quote, className, children }) {
  if (!quote) return null;
  const rows = [
    ['Bag total (MRP)', formatPrice(quote.mrpTotal)],
    quote.mrpTotal - quote.subtotal - 0 > 0 && ['Discount on MRP', `−${formatPrice(quote.mrpTotal - quote.subtotal)}`, 'text-success'],
    quote.couponDiscount > 0 && [`Coupon (${quote.coupon?.code})`, `−${formatPrice(quote.couponDiscount)}`, 'text-success'],
    ['Delivery', quote.shippingFee ? formatPrice(quote.shippingFee) : 'Free', !quote.shippingFee && 'text-success'],
    quote.tax > 0 && ['Tax', formatPrice(quote.tax)],
  ].filter(Boolean);

  return (
    <div className={cn('space-y-3 text-sm', className)}>
      {rows.map(([l, v, cls]) => (
        <div key={l} className="flex justify-between">
          <span className="text-muted">{l}</span>
          <span className={cn('font-medium', cls)}>{v}</span>
        </div>
      ))}
      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-semibold">{formatPrice(quote.total)}</span>
      </div>
      {quote.savings > 0 && <p className="rounded-lg bg-success-soft px-3 py-2 text-center text-xs font-medium text-success">You’re saving {formatPrice(quote.savings)} on this order</p>}
      {children}
    </div>
  );
}
