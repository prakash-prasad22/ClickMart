'use client';

import Link from 'next/link';
import { ShoppingBag, ArrowRight, Lock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CartLine, FreeShippingMeter } from '@/components/store/CartDrawer';
import OrderSummary, { CouponBox } from '@/components/store/OrderSummary';
import { EmptyState, Skeleton } from '@/components/ui';

export default function CartPage() {
  const { items, quote, hydrated, count } = useCart();

  if (hydrated && items.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState icon={ShoppingBag} title="Your bag is empty" description="Looks like you haven’t added anything yet." action={<Link href="/shop" className="btn btn-primary">Continue shopping</Link>} />
      </div>
    );
  }

  return (
    <div className="container pt-10">
      <h1 className="font-display text-4xl font-light animate-fade-up">Your bag <span className="text-muted">({count})</span></h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          <FreeShippingMeter quote={quote} />
          {quote?.issues?.length > 0 && (
            <div className="mt-4 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
              {quote.issues.map((i) => <p key={i.message}>{i.message}</p>)}
            </div>
          )}
          <div className="mt-2 divide-y divide-line">
            {!quote ? (
              [1, 2].map((i) => <div key={i} className="flex gap-4 py-4"><Skeleton className="h-32 w-28 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-1/4" /></div></div>)
            ) : (
              quote.items.map((line) => <CartLine key={`${line.product}${line.variantId}`} line={line} />)
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-5 p-6">
            <h2 className="font-semibold">Order summary</h2>
            <CouponBox />
            <OrderSummary quote={quote} />
            <Link href="/checkout" className="btn btn-primary btn-lg w-full group">
              Proceed to checkout <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><Lock size={12} /> Secure checkout</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
