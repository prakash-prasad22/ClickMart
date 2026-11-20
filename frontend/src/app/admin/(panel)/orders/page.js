'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader, Panel, SearchInput, DataTable, Tabs, useAdminList } from '@/components/admin/kit';
import { StatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui';
import { ORDER_STATUSES, ORDER_STATUS_TONE, PAYMENT_STATUS_TONE } from '@/lib/constants';
import { formatDateTime, formatPrice, titleCase } from '@/lib/utils';

function toCsv(rows) {
  const head = ['Order', 'Date', 'Customer', 'Phone', 'City', 'Pincode', 'Items', 'Total', 'Payment', 'Payment status', 'Status'];
  const lines = rows.map((o) => [
    o.orderNumber, new Date(o.createdAt).toISOString(), o.shippingAddress?.fullName, o.shippingAddress?.phone, o.shippingAddress?.city,
    o.shippingAddress?.pincode, o.items.reduce((s, i) => s + i.qty, 0), o.total, o.paymentMethod, o.paymentStatus, o.status,
  ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  return [head.join(','), ...lines].join('\n');
}

function OrdersInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const list = useAdminList('/admin/orders', { status: sp.get('status') || '', limit: 20 });
  const [counts, setCounts] = useState({});

  useEffect(() => { api.get('/admin/orders/stats/counts').then(setCounts).catch(() => {}); }, [list.data]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(list.data?.items || [])], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <>
      <PageHeader title="Orders" description="Track, update and fulfil customer orders." actions={<button type="button" className="btn btn-outline btn-sm rounded-xl" onClick={exportCsv}><Download size={15} /> Export page</button>} />
      <Panel bodyClassName="p-0">
        <div className="space-y-3 border-b border-line/70 p-4">
          <Tabs
            value={list.params.status || ''}
            onChange={(status) => list.setParams({ status })}
            tabs={[{ value: '', label: 'All', count: counts.all || 0 }, ...ORDER_STATUSES.map((s) => ({ value: s, label: titleCase(s), count: counts[s] || 0 }))]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={list.params.q} onChange={(q) => list.setParams({ q })} placeholder="Order #, name, phone or pincode" className="w-full sm:w-80" />
            <select className="input h-10 w-auto bg-white" value={list.params.paymentStatus || ''} onChange={(e) => list.setParams({ paymentStatus: e.target.value })}>
              <option value="">Any payment</option>
              {['pending', 'paid', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
            <input type="date" className="input h-10 w-auto bg-white" value={list.params.from || ''} onChange={(e) => list.setParams({ from: e.target.value })} aria-label="From date" />
            <input type="date" className="input h-10 w-auto bg-white" value={list.params.to || ''} onChange={(e) => list.setParams({ to: e.target.value })} aria-label="To date" />
          </div>
        </div>
        <DataTable
          rows={list.data?.items}
          loading={list.loading}
          onRowClick={(o) => router.push(`/admin/orders/${o._id}`)}
          empty="No orders match these filters"
          columns={[
            { key: 'orderNumber', label: 'Order', render: (o) => <span className="font-semibold">{o.orderNumber}</span> },
            { key: 'createdAt', label: 'Date', render: (o) => <span className="text-muted">{formatDateTime(o.createdAt)}</span> },
            { key: 'customer', label: 'Customer', render: (o) => <div><p className="font-medium">{o.shippingAddress?.fullName}</p><p className="text-xs text-muted">{o.shippingAddress?.city} · {o.shippingAddress?.pincode}</p></div> },
            { key: 'items', label: 'Items', render: (o) => o.items.reduce((s, i) => s + i.qty, 0) },
            { key: 'payment', label: 'Payment', render: (o) => <div className="flex flex-col items-start gap-1"><span className="text-xs uppercase text-muted">{o.paymentMethod}</span><StatusBadge status={o.paymentStatus} tones={PAYMENT_STATUS_TONE} /></div> },
            { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} tones={ORDER_STATUS_TONE} /> },
            { key: 'total', label: 'Total', className: 'text-right', render: (o) => <span className="font-semibold tabular-nums">{formatPrice(o.total)}</span> },
          ]}
        />
        {list.data?.pages > 1 && <div className="border-t border-line/70 p-4"><Pagination page={list.data.page} pages={list.data.pages} onChange={list.setPage} /></div>}
      </Panel>
    </>
  );
}

export default function OrdersPage() {
  return <Suspense><OrdersInner /></Suspense>;
}
