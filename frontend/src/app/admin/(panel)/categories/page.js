'use client';

import ResourcePage from '@/components/admin/ResourcePage';
import Img from '@/components/ui/Img';
import Badge from '@/components/ui/Badge';

export default function CategoriesPage() {
  return (
    <ResourcePage
      title="Categories"
      singular="category"
      description="Organise your catalogue. Sub-categories appear under their parent in the store menu."
      endpoint="/admin/categories"
      defaults={{ isActive: true, sortOrder: 0 }}
      filters={[{ name: 'isActive', label: 'All statuses', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Hidden' }] }]}
      columns={[
        {
          key: 'name', label: 'Category', render: (r) => (
            <div className="flex items-center gap-3">
              <Img src={r.image} alt={r.name} className="h-10 w-10 shrink-0 rounded-lg" />
              <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted">/{r.slug}</p></div>
            </div>
          ),
        },
        { key: 'parent', label: 'Parent', render: (r) => (r.parent ? <Badge>{r.parent.name}</Badge> : <span className="text-muted">Top level</span>) },
        { key: 'sortOrder', label: 'Order' },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'slug', label: 'URL slug', hint: 'Leave blank to generate from the name', half: true },
        { name: 'parent', label: 'Parent category', type: 'select', placeholder: 'None (top level)', optionsFrom: { endpoint: '/admin/categories' }, half: true },
        { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
        { name: 'image', label: 'Image', type: 'image' },
        { name: 'sortOrder', label: 'Sort order', type: 'number', half: true },
        { name: 'isActive', label: 'Visibility', type: 'switch', switchLabel: 'Show in store', half: true },
      ]}
    />
  );
}
