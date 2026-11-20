'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Truck, ShieldCheck, MapPin, Zap } from 'lucide-react';
import { Price, QtyStepper, Rating, Button } from '@/components/ui';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { cn, formatPrice } from '@/lib/utils';

function PincodeCheck({ prefixes = [] }) {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState(null);
  const check = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) return setResult({ ok: false, msg: 'Enter a valid 6-digit pincode' });
    const ok = !prefixes.length || prefixes.some((p) => pin.startsWith(p));
    setResult(ok ? { ok, msg: 'Delivery available · usually within 24–48 hrs' } : { ok, msg: 'We don’t deliver here yet — coming soon!' });
  };
  return (
    <form onSubmit={check} className="rounded-2xl border border-line p-4">
      <p className="flex items-center gap-2 text-sm font-medium"><MapPin size={16} className="text-primary" /> Check delivery</p>
      <div className="mt-3 flex gap-2">
        <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="Enter pincode" className="input h-10" />
        <button className="btn btn-outline btn-sm h-10 shrink-0">Check</button>
      </div>
      {result && <p className={cn('mt-2 text-xs font-medium animate-fade-in', result.ok ? 'text-success' : 'text-danger')}>{result.msg}</p>}
    </form>
  );
}

export default function ProductPurchase({ product, settings }) {
  const variants = (product.variants || []).filter((v) => v.isActive !== false);
  const [variantId, setVariantId] = useState(() => (variants.find((v) => v.stock > 0) || variants[0])?._id || null);
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const { wishlist, toggleWishlist } = useAuth();
  const router = useRouter();

  const unit = useMemo(() => variants.find((v) => v._id === variantId) || product, [variantId, variants, product]);
  const stock = unit.stock ?? 0;
  const saved = wishlist.includes(String(product._id));

  const addToBag = () => add(product._id, variantId, qty);
  const buyNow = () => {
    add(product._id, variantId, qty, { open: false });
    router.push('/checkout');
  };

  return (
    <div>
      {product.brand && <p className="eyebrow">{product.brand.name}</p>}
      <h1 className="mt-3 font-display text-3xl font-normal leading-tight sm:text-[2.6rem]">{product.name}</h1>
      {product.numReviews > 0 && (
        <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
          <Rating value={product.rating} /> {product.rating} · {product.numReviews} reviews
        </a>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Price price={unit.salePrice ?? unit.price} mrp={unit.mrp} size="lg" />
        {unit.offer && <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-deep">{unit.offer.title}</span>}
      </div>
      <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>

      {product.shortDescription && <p className="mt-6 leading-relaxed text-ink-soft">{product.shortDescription}</p>}

      {variants.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-sm">
            <span className="font-semibold">{product.variantLabel || 'Option'}:</span>{' '}
            <span className="text-muted">{variants.find((v) => v._id === variantId)?.name}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const out = v.stock <= 0;
              return (
                <button
                  key={v._id}
                  type="button"
                  onClick={() => { setVariantId(v._id); setQty(1); }}
                  className={cn(
                    'relative min-w-[84px] rounded-xl border px-4 py-2.5 text-left text-sm transition-all duration-300',
                    v._id === variantId ? 'border-ink bg-ink text-white shadow-soft' : 'border-line bg-surface hover:border-ink/40',
                    out && 'opacity-50'
                  )}
                >
                  <span className="block font-medium">{v.name}</span>
                  <span className={cn('block text-xs', v._id === variantId ? 'text-white/70' : 'text-muted')}>{out ? 'Sold out' : formatPrice(v.salePrice ?? v.price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <QtyStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(10, stock))} />
        <Button variant="dark" size="lg" className="flex-1" disabled={stock <= 0} onClick={addToBag}>
          <ShoppingBag size={18} /> {stock > 0 ? 'Add to bag' : 'Sold out'}
        </Button>
        <button
          type="button"
          onClick={() => toggleWishlist(product._id)}
          className={cn('btn btn-outline btn-lg w-[52px] px-0', saved && 'border-primary text-primary')}
          aria-label="Wishlist"
        >
          <Heart size={19} className={cn(saved && 'fill-primary')} />
        </button>
      </div>
      {stock > 0 && (
        <Button variant="primary" size="lg" className="mt-3 w-full" onClick={buyNow}>
          <Zap size={17} /> Buy now
        </Button>
      )}
      {stock > 0 && stock <= 5 && <p className="mt-3 text-sm font-medium text-warning">Hurry — only {stock} left</p>}

      <div className="mt-8 space-y-3">
        <PincodeCheck prefixes={settings?.serviceablePincodePrefixes} />
        <div className="grid grid-cols-2 gap-3 text-xs text-ink-soft">
          <div className="flex items-center gap-2 rounded-xl bg-surface-alt/60 p-3"><Truck size={16} className="text-primary" /> Free delivery above {formatPrice(settings?.freeShippingAbove || 999)}</div>
          <div className="flex items-center gap-2 rounded-xl bg-surface-alt/60 p-3"><ShieldCheck size={16} className="text-primary" /> Cash on delivery available</div>
        </div>
      </div>
    </div>
  );
}
