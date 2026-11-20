'use client';

import ResourcePage from '@/components/admin/ResourcePage';
import Img from '@/components/ui/Img';

export default function BrandsPage() {
  return (
    <ResourcePage
      title="Brands"
      singular="brand"
      description="Brands and artisan collectives you sell."
      endpoint="/admin/brands"
      defaults={{ isActive: true, sortOrder: 0 }}
      columns={[
        {
          key: 'name', label: 'Brand', render: (r) => (
            <div className="flex items-center gap-3">
              <Img src={r.logo} alt={r.name} className="h-10 w-10 shrink-0 rounded-full" />
              <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted">/{r.slug}</p></div>
            </div>
          ),
        },
        { key: 'origin', label: 'Origin' },
        { key: 'sortOrder', label: 'Order' },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'slug', label: 'URL slug', hint: 'Auto-generated if blank', half: true },
        { name: 'origin', label: 'Origin', placeholder: 'e.g. Bhagalpur, Bihar', half: true },
        { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
        { name: 'logo', label: 'Logo', type: 'image' },
        { name: 'sortOrder', label: 'Sort order', type: 'number', half: true },
        { name: 'isActive', label: 'Visibility', type: 'switch', switchLabel: 'Active', half: true },
      ]}
    />
  );
}
