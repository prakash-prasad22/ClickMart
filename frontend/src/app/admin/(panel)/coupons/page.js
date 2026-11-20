'use client';

import ResourcePage from '@/components/admin/ResourcePage';
import { formatDate, formatPrice } from '@/lib/utils';

export default function CouponsPage() {
  return (
    <ResourcePage
      title="Coupons"
      singular="coupon"
      description="Codes customers enter at checkout."
      endpoint="/admin/coupons"
      defaults={{ isActive: true, discountType: 'percentage', perUserLimit: 1, minOrderValue: 0 }}
      columns={[
        { key: 'code', label: 'Code', render: (r) => <div><p className="font-mono text-[13px] font-semibold tracking-wider">{r.code}</p><p className="text-xs text-muted">{r.description}</p></div> },
        { key: 'value', label: 'Discount', render: (r) => (r.discountType === 'percentage' ? `${r.value}%${r.maxDiscount ? ` (max ${formatPrice(r.maxDiscount)})` : ''}` : formatPrice(r.value)) },
        { key: 'minOrderValue', label: 'Min order', render: (r) => (r.minOrderValue ? formatPrice(r.minOrderValue) : '—') },
        { key: 'usedCount', label: 'Used', render: (r) => <span className="tabular-nums">{r.usedCount}{r.usageLimit ? ` / ${r.usageLimit}` : ''}</span> },
        { key: 'endsAt', label: 'Expires', render: (r) => (r.endsAt ? formatDate(r.endsAt) : 'Never') },
      ]}
      fields={[
        { name: 'code', label: 'Code', required: true, uppercase: true, placeholder: 'e.g. WELCOME10' },
        { name: 'description', label: 'Description', placeholder: 'Shown to customers' },
        { name: 'discountType', label: 'Type', type: 'select', placeholder: false, options: [{ value: 'percentage', label: 'Percentage %' }, { value: 'flat', label: 'Flat ₹ off' }], half: true },
        { name: 'value', label: 'Value', type: 'number', required: true, half: true },
        { name: 'maxDiscount', label: 'Max discount (₹)', type: 'number', half: true, showIf: (f) => f.discountType === 'percentage' },
        { name: 'minOrderValue', label: 'Minimum order (₹)', type: 'number', half: true },
        { name: 'usageLimit', label: 'Total uses', type: 'number', hint: 'Blank = unlimited', half: true },
        { name: 'perUserLimit', label: 'Uses per customer', type: 'number', half: true },
        { name: 'startsAt', label: 'Starts', type: 'date', half: true },
        { name: 'endsAt', label: 'Expires', type: 'date', half: true },
        { name: 'isActive', label: 'Status', type: 'switch', switchLabel: 'Enabled' },
      ]}
    />
  );
}
