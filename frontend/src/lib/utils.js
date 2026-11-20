export const cn = (...classes) => classes.flat().filter(Boolean).join(' ');

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const formatPrice = (n) => inr.format(Number(n || 0));

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
export const formatCompact = (n) => `₹${compact.format(Number(n || 0))}`;
export const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(Number(n || 0));

export const formatDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Intl.DateTimeFormat('en-IN', opts).format(new Date(d)) : '—';
export const formatDateTime = (d) =>
  formatDate(d, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function timeAgo(d) {
  if (!d) return '';
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  const units = [[60, 'min'], [24, 'hr'], [7, 'day'], [4.35, 'wk'], [12, 'mo']];
  let v = s / 60;
  for (const [step, label] of units) {
    if (v < step) return `${Math.floor(v)} ${label}${Math.floor(v) === 1 ? '' : 's'} ago`;
    v /= step;
  }
  return `${Math.floor(v)} yr ago`;
}

export const discountPct = (mrp, price) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

export const titleCase = (s = '') => String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'U';

export const cartKey = (productId, variantId) => `${productId}:${variantId || ''}`;

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
