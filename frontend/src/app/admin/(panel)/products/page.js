'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Copy, Trash2, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageHeader, Panel, SearchInput, DataTable, ConfirmDialog, useAdminList } from '@/components/admin/kit';
import Badge from '@/components/ui/Badge';
import Img from '@/components/ui/Img';
import { Pagination, Switch } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

export default function ProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const list = useAdminList('/admin/products', { limit: 20 });
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/admin/categories', { limit: 200 }).then((r) => setCats(r.items)).catch(() => {});
    api.get('/admin/brands', { limit: 200 }).then((r) => setBrands(r.items)).catch(() => {});
  }, []);

  const patch = async (p, body) => {
    try { await api.patch(`/admin/products/${p._id}`, body); list.reload(); } catch (e) { toast.error(e.message); }
  };
  const duplicate = async (p) => {
    try { const c = await api.post(`/admin/products/${p._id}/duplicate`); toast.success('Duplicated as draft'); router.push(`/admin/products/${c._id}`); } catch (e) { toast.error(e.message); }
  };
  const remove = async () => {
    try { await api.del(`/admin/products/${deleting._id}`); toast.success('Product deleted'); setDeleting(null); list.reload(); } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <PageHeader title="Products" description="Your catalogue — dry fruits, sarees, hampers and more." actions={<Link href="/admin/products/new" className="btn btn-primary rounded-xl"><Plus size={16} /> Add product</Link>} />
      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-line/70 p-4">
          <SearchInput value={list.params.q} onChange={(q) => list.setParams({ q })} placeholder="Search name, SKU or tag" className="w-full sm:w-72" />
          <select className="input h-10 w-auto bg-white" value={list.params.category || ''} onChange={(e) => list.setParams({ category: e.target.value })}>
            <option value="">All categories</option>
            {cats.map((c) => <option key={c._id} value={c._id}>{c.parent ? '— ' : ''}{c.name}</option>)}
          </select>
          <select className="input h-10 w-auto bg-white" value={list.params.brand || ''} onChange={(e) => list.setParams({ brand: e.target.value })}>
            <option value="">All brands</option>
            {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <select className="input h-10 w-auto bg-white" value={list.params.isActive || ''} onChange={(e) => list.setParams({ isActive: e.target.value })}>
            <option value="">Any status</option>
            <option value="true">Active</option>
            <option value="false">Draft / hidden</option>
          </select>
          <span className="ml-auto text-xs text-muted">{list.data?.total ?? 0} products</span>
        </div>
        <DataTable
          rows={list.data?.items}
          loading={list.loading}
          onRowClick={(p) => router.push(`/admin/products/${p._id}`)}
          empty="No products yet — add your first one."
          columns={[
            {
              key: 'name', label: 'Product', render: (p) => (
                <div className="flex items-center gap-3">
                  <Img src={p.images?.[0]} alt={p.name} className="h-12 w-10 shrink-0 rounded-lg" />
                  <div className="min-w-0">
                    <p className="max-w-[260px] truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{p.variants?.length ? `${p.variants.length} variants` : p.sku || 'No SKU'}</p>
                  </div>
                </div>
              ),
            },
            { key: 'category', label: 'Category', render: (p) => p.category?.name || <span className="text-muted">—</span> },
            { key: 'brand', label: 'Brand', render: (p) => p.brand?.name || <span className="text-muted">—</span> },
            { key: 'price', label: 'Price', render: (p) => <div className="tabular-nums"><p className="font-medium">{p.variants?.length ? 'from ' : ''}{formatPrice(p.price)}</p>{p.mrp > p.price && <p className="text-xs text-muted line-through">{formatPrice(p.mrp)}</p>}</div> },
            { key: 'stock', label: 'Stock', render: (p) => <Badge tone={p.stock <= 0 ? 'danger' : p.stock <= p.lowStockThreshold ? 'warning' : 'success'}>{p.stock} in stock</Badge> },
            {
              key: 'flags', label: 'Active', render: (p) => (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Switch checked={p.isActive} onChange={(v) => patch(p, { isActive: v })} />
                  <button type="button" onClick={() => patch(p, { isFeatured: !p.isFeatured })} title={p.isFeatured ? 'Featured' : 'Mark as featured'} className="p-1">
                    <Star size={16} className={p.isFeatured ? 'fill-accent text-accent' : 'text-line hover:text-accent'} />
                  </button>
                </div>
              ),
            },
            {
              key: 'actions', label: '', className: 'text-right', render: (p) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="btn btn-ghost btn-icon h-8 w-8" onClick={() => duplicate(p)} title="Duplicate"><Copy size={15} /></button>
                  <button type="button" className="btn btn-ghost btn-icon h-8 w-8 hover:text-danger" onClick={() => setDeleting(p)} title="Delete"><Trash2 size={15} /></button>
                </div>
              ),
            },
          ]}
        />
        {list.data?.pages > 1 && <div className="border-t border-line/70 p-4"><Pagination page={list.data.page} pages={list.data.pages} onChange={list.setPage} /></div>}
      </Panel>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} title="Delete product?" message={`“${deleting?.name}” will be removed from your store. Past orders keep their details.`} />
    </>
  );
}
