'use client';

import Link from 'next/link';
import { Heart, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import Img from '@/components/ui/Img';
import { Price, Rating } from '@/components/ui';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { cn, discountPct } from '@/lib/utils';

export default function ProductCard({ product, priority = false }) {
  const { add } = useCart();
  const { wishlist, toggleWishlist } = useAuth();
  const [added, setAdded] = useState(false);

  const variants = (product.variants || []).filter((v) => v.isActive !== false);
  const defaultVariant = variants.find((v) => v.stock > 0) || variants[0];
  const unit = defaultVariant || product;
  const inStock = (product.totalStock ?? product.stock) > 0;
  const saved = wishlist.includes(String(product._id));
  const off = discountPct(unit.mrp, unit.salePrice ?? unit.price);
  const [img1, img2] = product.images || [];

  const quickAdd = (e) => {
    e.preventDefault();
    add(product._id, defaultVariant?._id || null, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-surface-alt">
        <div className="aspect-[4/5]">
          <Img
            src={img1}
            alt={product.name}
            eager={priority}
            className="h-full w-full transition-transform duration-[1200ms] ease-quiet group-hover:scale-[1.045]"
          />
          {img2 && (
            <Img src={img2} alt="" className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700 ease-quiet group-hover:opacity-100" />
          )}
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {unit.offer?.badge && <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-fg">{unit.offer.badge}</span>}
          {!unit.offer && off >= 10 && <span className="rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur">{off}% off</span>}
          {!inStock && <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-medium text-white">Sold out</span>}
        </div>

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); toggleWishlist(product._id); }}
          className={cn(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 backdrop-blur transition-all duration-300 hover:scale-110',
            saved ? 'text-primary opacity-100' : 'text-ink-soft sm:translate-y-[-4px] sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100'
          )}
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={16} className={cn('transition', saved && 'fill-primary')} />
        </button>

        {/* Quick add */}
        {inStock && (
          <div className="absolute inset-x-3 bottom-3 sm:translate-y-[calc(100%+12px)] sm:transition-transform sm:duration-500 sm:ease-quiet sm:group-hover:translate-y-0">
            <button
              type="button"
              onClick={quickAdd}
              className={cn(
                'flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold shadow-soft backdrop-blur transition-colors duration-300',
                added ? 'bg-success text-white' : 'bg-surface/95 text-ink hover:bg-ink hover:text-white'
              )}
            >
              {added ? <Check size={15} /> : <Plus size={15} />}
              {added ? 'Added to bag' : `Quick add${defaultVariant ? ` · ${defaultVariant.name}` : ''}`}
            </button>
          </div>
        )}
      </div>

      <div className="px-0.5 pt-3.5">
        {product.brand?.name && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{product.brand.name}</p>}
        <h3 className="mt-1 line-clamp-2 text-[15px] font-medium leading-snug text-ink transition-colors duration-300 group-hover:text-primary">{product.name}</h3>
        {product.numReviews > 0 && <Rating value={product.rating} count={product.numReviews} size={12} className="mt-1.5" />}
        <Price price={unit.salePrice ?? unit.price} mrp={unit.mrp} className="mt-1.5" />
        {variants.length > 1 && <p className="mt-1 text-xs text-muted">{variants.length} options</p>}
      </div>
    </Link>
  );
}

export function ProductGrid({ products, className }) {
  return (
    <div className={cn('grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4', className)}>
      {products.map((p, i) => (
        <div key={p._id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
          <ProductCard product={p} priority={i < 4} />
        </div>
      ))}
    </div>
  );
}
