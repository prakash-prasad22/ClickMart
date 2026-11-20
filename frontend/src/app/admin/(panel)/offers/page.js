'use client';

import ResourcePage from '@/components/admin/ResourcePage';
import Badge from '@/components/ui/Badge';
import { formatDate, formatPrice, titleCase } from '@/lib/utils';

const isLive = (o) => o.isActive && (!o.startsAt || new Date(o.startsAt) <= new Date()) && (!o.endsAt || new Date(o.endsAt) >= new Date());

export default function OffersPage() {
  return (
    <ResourcePage
      title="Offers"
      singular="offer"
      description="Automatic discounts applied to product prices — no code needed. The best matching offer wins."
      endpoint="/admin/offers"
      defaults={{ isActive: true, discountType: 'percentage', appliesTo: 'all', badge: 'Offer' }}
      columns={[
        { key: 'title', label: 'Offer', render: (r) => <div><p className="font-medium">{r.title}</p><p className="text-xs text-muted">Badge: {r.badge}</p></div> },
        { key: 'value', label: 'Discount', render: (r) => (r.discountType === 'percentage' ? `${r.value}%` : formatPrice(r.value)) },
        { key: 'appliesTo', label: 'Applies to', render: (r) => titleCase(r.appliesTo) },
        { key: 'window', label: 'Schedule', render: (r) => <span className="text-xs text-muted">{r.startsAt ? formatDate(r.startsAt) : 'Now'} → {r.endsAt ? formatDate(r.endsAt) : 'No end'}</span> },
        { key: 'live', label: 'Status', render: (r) => (isLive(r) ? <Badge tone="success" dot>Live</Badge> : <Badge dot>Inactive</Badge>) },
      ]}
      fields={[
        { name: 'title', label: 'Title', required: true, placeholder: 'e.g. Diwali Dry Fruit Festival' },
        { name: 'description', label: 'Description', type: 'textarea', rows: 2 },
        { name: 'discountType', label: 'Type', type: 'select', placeholder: false, options: [{ value: 'percentage', label: 'Percentage %' }, { value: 'flat', label: 'Flat ₹ off' }], half: true },
        { name: 'value', label: 'Value', type: 'number', required: true, half: true },
        { name: 'maxDiscount', label: 'Max discount per item (₹)', type: 'number', half: true, showIf: (f) => f.discountType === 'percentage' },
        { name: 'badge', label: 'Badge text', half: true, placeholder: 'e.g. 10% off' },
        { name: 'appliesTo', label: 'Applies to', type: 'select', placeholder: false, options: ['all', 'category', 'brand', 'product'].map((v) => ({ value: v, label: v === 'all' ? 'All products' : `Selected ${v === 'category' ? 'categories' : `${v}s`}` })) },
        { name: 'categories', label: 'Categories', type: 'multiselect', optionsFrom: { endpoint: '/admin/categories' }, showIf: (f) => f.appliesTo === 'category' },
        { name: 'brands', label: 'Brands', type: 'multiselect', optionsFrom: { endpoint: '/admin/brands' }, showIf: (f) => f.appliesTo === 'brand' },
        { name: 'products', label: 'Products', type: 'multiselect', optionsFrom: { endpoint: '/admin/products' }, showIf: (f) => f.appliesTo === 'product' },
        { name: 'startsAt', label: 'Starts', type: 'date', half: true },
        { name: 'endsAt', label: 'Ends', type: 'date', half: true },
        { name: 'isActive', label: 'Status', type: 'switch', switchLabel: 'Enabled' },
      ]}
    />
  );
}
