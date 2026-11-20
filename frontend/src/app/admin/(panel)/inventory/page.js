'use client';

import { Suspense, Fragment, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Boxes, AlertTriangle, PackageX, IndianRupee, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageHeader, Panel, SearchInput, StatCard, Tabs, useAdminList } from '@/components/admin/kit';
import Badge from '@/components/ui/Badge';
import Img from '@/components/ui/Img';
import { Pagination, Skeleton } from '@/components/ui';
import { formatCompact, formatNumber } from '@/lib/utils';

function StockEditor({ productId, variantId, stock, onSaved }) {
  const toast = useToast();
  const [value, setValue] = useState(stock);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const dirty = Number(value) !== stock;

  const save = async (mode, v) => {
    setSaving(true);
    try {
      await api.patch(`/admin/inventory/${productId}`, { variantId, mode, value: v });
      setDone(true);
      setTimeout(() => setDone(false), 1200);
      onSaved();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button type="button" disabled={saving} onClick={() => save('adjust', -1)} className="btn btn-outline h-8 w-8 rounded-lg px-0" aria-label="Decrease by 1">−</button>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && dirty && save('set', Number(value))}
        className="input h-8 w-20 rounded-lg text-center tabular-nums"
        aria-label="Stock quantity"
      />
      <button type="button" disabled={saving} onClick={() => save('adjust', 1)} className="btn btn-outline h-8 w-8 rounded-lg px-0" aria-label="Increase by 1">+</button>
      <button type="button" disabled={!dirty || saving} onClick={() => save('set', Number(value))} className={`btn h-8 rounded-lg px-3 text-xs ${done ? 'bg-success text-white' : 'btn-dark'}`}>
        {done ? <Check size={14} /> : 'Set'}
      </button>
    </div>
  );
}

const stockTone = (stock, threshold) => (stock <= 0 ? 'danger' : stock <= threshold ? 'warning' : 'success');

function InventoryInner() {
  const sp = useSearchParams();
  const list = useAdminList('/admin/inventory', { status: sp.get('status') || '', limit: 25 });
  const s = list.data?.summary;

  return (
    <>
      <PageHeader title="Inventory" description="Stock levels across products and variants. Changes are recorded in the activity log." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {s ? (
          <>
            <StatCard label="Products" value={formatNumber(s.total)} icon={Boxes} tone="info" />
            <StatCard label="Units in stock" value={formatNumber(s.units)} icon={Boxes} />
            <StatCard label="Low / out of stock" value={`${s.low} / ${s.out}`} icon={AlertTriangle} tone="accent" />
            <StatCard label="Stock value (at selling price)" value={formatCompact(s.value)} icon={IndianRupee} tone="success" />
          </>
        ) : [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-line/70 p-4">
          <Tabs value={list.params.status || ''} onChange={(status) => list.setParams({ status })} tabs={[{ value: '', label: 'All' }, { value: 'low', label: 'Low stock' }, { value: 'out', label: 'Out of stock' }, { value: 'in', label: 'Healthy' }]} />
          <SearchInput value={list.params.q} onChange={(q) => list.setParams({ q })} placeholder="Search product or SKU" className="w-full sm:ml-auto sm:w-72" />
        </div>
        <div className="overflow-x-auto">
          <table className="table-admin">
            <thead><tr><th>Product / variant</th><th>SKU</th><th>Status</th><th className="text-right">Stock</th></tr></thead>
            <tbody>
              {list.data?.items.map((p) => (
                <Fragment key={p._id}>
                  <tr className={p.variants?.length ? 'bg-surface-alt/30' : ''}>
                    <td>
                      <Link href={`/admin/products/${p._id}`} className="flex items-center gap-3 hover:text-primary">
                        <Img src={p.images?.[0]} alt={p.name} className="h-10 w-9 shrink-0 rounded-lg" />
                        <span className="font-medium">{p.name}</span>
                        {!p.isActive && <Badge>Draft</Badge>}
                      </Link>
                    </td>
                    <td className="text-xs text-muted">{p.variants?.length ? `${p.variants.length} variants` : p.sku || '—'}</td>
                    <td><Badge tone={stockTone(p.stock, p.lowStockThreshold)} dot>{p.stock <= 0 ? 'Out of stock' : p.stock <= p.lowStockThreshold ? 'Low' : 'In stock'}</Badge></td>
                    <td className="text-right">
                      {p.variants?.length ? <span className="font-semibold tabular-nums">{p.stock} total</span> : <StockEditor key={p.stock} productId={p._id} stock={p.stock} onSaved={list.reload} />}
                    </td>
                  </tr>
                  {p.variants?.map((v) => (
                    <tr key={v._id}>
                      <td className="pl-16 text-sm text-ink-soft">↳ {p.variantLabel}: <span className="font-medium text-ink">{v.name}</span></td>
                      <td className="text-xs text-muted">{v.sku || '—'}</td>
                      <td><Badge tone={stockTone(v.stock, p.lowStockThreshold)}>{v.stock}</Badge></td>
                      <td><StockEditor key={v.stock} productId={p._id} variantId={v._id} stock={v.stock} onSaved={list.reload} /></td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
          {list.loading && !list.data && <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>}
          {!list.loading && !list.data?.items.length && (
            <div className="flex flex-col items-center py-14 text-sm text-muted"><PackageX size={28} strokeWidth={1.5} className="mb-2" />No products in this view</div>
          )}
        </div>
        {list.data?.pages > 1 && <div className="border-t border-line/70 p-4"><Pagination page={list.data.page} pages={list.data.pages} onChange={list.setPage} /></div>}
      </Panel>
    </>
  );
}

export default function InventoryPage() {
  return <Suspense><InventoryInner /></Suspense>;
}
