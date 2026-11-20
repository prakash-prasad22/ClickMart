'use client';

import { useEffect, useRef, useState } from 'react';
import { Star, Minus, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatPrice, discountPct } from '@/lib/utils';

export function Spinner({ size = 18, className }) {
  return <Loader2 size={size} className={cn('animate-spin', className)} />;
}

export function Button({ variant = 'primary', size, loading, className, children, ...props }) {
  return (
    <button
      className={cn('btn', `btn-${variant}`, size && `btn-${size}`, className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
}

export function Field({ label, error, hint, children, className }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-3', disabled && 'cursor-not-allowed opacity-60')}>
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300', checked ? 'bg-primary' : 'bg-ink/15')}
      >
        <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ease-quiet', checked && 'translate-x-5')} />
      </button>
      {label && <span className="text-sm text-ink-soft">{label}</span>}
    </label>
  );
}

export function Rating({ value = 0, count, size = 14, className }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex" aria-label={`Rated ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} className={i <= Math.round(value) ? 'fill-accent text-accent' : 'fill-line text-line'} />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-muted">({count})</span>}
    </div>
  );
}

export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button type="button" key={i} onMouseEnter={() => setHover(i)} onClick={() => onChange(i)} aria-label={`${i} star`}>
          <Star size={26} className={cn('transition-transform duration-200 hover:scale-110', i <= (hover || value) ? 'fill-accent text-accent' : 'fill-transparent text-line')} />
        </button>
      ))}
    </div>
  );
}

export function Price({ price, mrp, size = 'md', className }) {
  const off = discountPct(mrp, price);
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' };
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-semibold text-ink', sizes[size])}>{formatPrice(price)}</span>
      {off > 0 && (
        <>
          <span className="text-xs text-muted line-through">{formatPrice(mrp)}</span>
          <span className="text-xs font-semibold text-success">{off}% off</span>
        </>
      )}
    </div>
  );
}

export function QtyStepper({ value, onChange, min = 1, max = 99, size = 'md' }) {
  const h = size === 'sm' ? 'h-8' : 'h-11';
  return (
    <div className={cn('inline-flex items-center rounded-full border border-line bg-surface', h)}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="flex h-full w-9 items-center justify-center text-ink-soft transition hover:text-primary disabled:opacity-30" aria-label="Decrease">
        <Minus size={14} />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="flex h-full w-9 items-center justify-center text-ink-soft transition hover:text-primary disabled:opacity-30" aria-label="Increase">
        <Plus size={14} />
      </button>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      {Icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon size={26} strokeWidth={1.6} />
        </div>
      )}
      <h3 className="font-display text-xl font-medium">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">Page {page} of {pages}</span>
      <div className="flex gap-2">
        <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={16} /> Prev
        </button>
        <button type="button" className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/** Fade-up children when they scroll into view. */
export function Reveal({ as: Tag = 'div', delay = 0, className, children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={cn('reveal', className)} style={{ '--reveal-delay': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />;
}
