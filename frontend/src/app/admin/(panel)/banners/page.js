'use client';

import ResourcePage from '@/components/admin/ResourcePage';
import Img from '@/components/ui/Img';
import Badge from '@/components/ui/Badge';

export default function BannersPage() {
  return (
    <ResourcePage
      title="Banners"
      singular="banner"
      description="Hero slides and promo tiles on the home page. Recommended hero size: 1920×900."
      endpoint="/admin/banners"
      defaults={{ isActive: true, placement: 'hero', sortOrder: 0, ctaLabel: 'Shop now', link: '/shop' }}
      filters={[{ name: 'placement', label: 'All placements', options: [{ value: 'hero', label: 'Hero' }, { value: 'promo', label: 'Promo' }] }]}
      columns={[
        {
          key: 'title', label: 'Banner', render: (r) => (
            <div className="flex items-center gap-3">
              <Img src={r.image} alt={r.title} className="h-12 w-20 shrink-0 rounded-lg" />
              <div><p className="font-medium">{r.title}</p><p className="max-w-xs truncate text-xs text-muted">{r.subtitle}</p></div>
            </div>
          ),
        },
        { key: 'placement', label: 'Placement', render: (r) => <Badge tone={r.placement === 'hero' ? 'primary' : 'info'}>{r.placement}</Badge> },
        { key: 'link', label: 'Link', render: (r) => <span className="font-mono text-xs text-muted">{r.link}</span> },
        { key: 'sortOrder', label: 'Order' },
      ]}
      fields={[
        { name: 'title', label: 'Headline', required: true },
        { name: 'eyebrow', label: 'Eyebrow', placeholder: 'e.g. New season', half: true },
        { name: 'placement', label: 'Placement', type: 'select', placeholder: false, options: [{ value: 'hero', label: 'Hero carousel' }, { value: 'promo', label: 'Promo tile' }], half: true },
        { name: 'subtitle', label: 'Subtitle', type: 'textarea', rows: 2 },
        { name: 'image', label: 'Image', type: 'image', hint: 'Without an image, an elegant gradient is shown' },
        { name: 'ctaLabel', label: 'Button text', half: true },
        { name: 'link', label: 'Link', placeholder: '/shop?category=sarees', half: true },
        { name: 'startsAt', label: 'Show from', type: 'date', half: true },
        { name: 'endsAt', label: 'Show until', type: 'date', half: true },
        { name: 'sortOrder', label: 'Sort order', type: 'number', half: true },
        { name: 'isActive', label: 'Status', type: 'switch', switchLabel: 'Visible', half: true },
      ]}
    />
  );
}
