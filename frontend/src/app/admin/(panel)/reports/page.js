'use client';

import { useEffect, useState } from 'react';
import { Download, IndianRupee, ShoppingCart, Receipt, Users, Package, Percent } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageHeader, Panel, StatCard, Tabs, DataTable } from '@/components/admin/kit';
import { AreaChart, BarList } from '@/components/admin/Charts';
import { Skeleton } from '@/components/ui';
import { formatCompact, formatDate, formatNumber, formatPrice, titleCase } from '@/lib/utils';

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const PRESETS = { '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 90 days', '365': 'Last 12 months', custom: 'Custom' };

function downloadCsv(name, rows) {
  if (!rows.length) return;
  const head = Object.keys(rows[0]);
  const csv = [head.join(','), ...rows.map((r) => head.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = name;
  a.click();
}

export default function ReportsPage() {
  const toast = useToast();
  const [preset, setPreset] = useState('30');
  const [range, setRange] = useState({ from: daysAgo(29), to: iso(new Date()) });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (preset !== 'custom') setRange({ from: daysAgo(Number(preset) - 1), to: iso(new Date()) });
  }, [preset]);

  useEffect(() => {
    setLoading(true);
    const groupBy = preset === '365' ? 'month' : 'day';
    api.get('/admin/reports', { ...range, groupBy }).then(setData).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, [range, preset, toast]);

  const t = data?.totals;
  const monthly = preset === '365';

  return (
    <>
      <PageHeader
        title="Reports"
        description={data ? `${formatDate(data.from)} – ${formatDate(data.to)}` : 'Sales performance'}
        actions={<button type="button" className="btn btn-outline btn-sm rounded-xl" onClick={() => downloadCsv(`sales-${range.from}-to-${range.to}.csv`, data?.series || [])}><Download size={15} /> Export CSV</button>}
      />

      {/* Filters live in one row above the charts */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Tabs value={preset} onChange={setPreset} tabs={Object.entries(PRESETS).map(([value, label]) => ({ value, label }))} />
        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" className="input h-10 w-auto bg-white" value={range.from} max={range.to} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
            <span className="text-muted">→</span>
            <input type="date" className="input h-10 w-auto bg-white" value={range.to} min={range.from} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
          </div>
        )}
      </div>

      {!data ? (
        <div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Net revenue" value={formatPrice(t.revenue)} icon={IndianRupee} hint="excl. cancelled & returned" />
            <StatCard label="Orders" value={formatNumber(t.orders)} icon={ShoppingCart} tone="info" />
            <StatCard label="Average order value" value={formatPrice(t.aov)} icon={Receipt} tone="accent" />
            <StatCard label="Units sold" value={formatNumber(t.items)} icon={Package} tone="info" />
            <StatCard label="Discounts given" value={formatPrice(t.discounts)} icon={Percent} tone="accent" hint="offers + coupons" />
            <StatCard label="New customers" value={formatNumber(t.newCustomers)} icon={Users} tone="success" />
          </div>

          <Panel title={`Revenue by ${monthly ? 'month' : 'day'}`}>
            <AreaChart
              data={data.series}
              height={280}
              format={(v, axis) => (axis ? formatCompact(v) : formatPrice(v))}
              formatLabel={(l, long) => (monthly ? formatDate(`${l}-01`, { month: 'short', year: long ? 'numeric' : '2-digit' }) : formatDate(l, long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' }))}
              secondary={(p) => `${p.orders} orders`}
            />
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Revenue by category">
              <BarList items={data.byCategory.map((c) => ({ label: c._id, value: c.revenue, qty: c.qty }))} format={formatCompact} sub={(i) => `· ${i.qty} units`} />
            </Panel>
            <Panel title="Revenue by city">
              <BarList items={data.byCity.map((c) => ({ label: c._id || 'Unknown', value: c.revenue, orders: c.orders }))} format={formatCompact} sub={(i) => `· ${i.orders} orders`} />
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="Top products" className="xl:col-span-2" bodyClassName="p-0" action={<button type="button" className="text-xs font-semibold text-primary" onClick={() => downloadCsv('top-products.csv', data.topProducts.map((p) => ({ product: p.name, units: p.qty, revenue: p.revenue })))}>Export</button>}>
              <DataTable
                rows={data.topProducts}
                rowKey="name"
                empty="No sales in this period"
                columns={[
                  { key: 'rank', label: '#', render: (p) => <span className="text-muted">{data.topProducts.indexOf(p) + 1}</span> },
                  { key: 'name', label: 'Product', render: (p) => <span className="font-medium">{p.name}</span> },
                  { key: 'qty', label: 'Units', className: 'text-right', render: (p) => <span className="tabular-nums">{p.qty}</span> },
                  { key: 'revenue', label: 'Revenue', className: 'text-right', render: (p) => <span className="font-semibold tabular-nums">{formatPrice(p.revenue)}</span> },
                ]}
              />
            </Panel>
            <div className="space-y-6">
              <Panel title="Payment methods">
                <BarList items={data.byPayment.map((p) => ({ label: p._id === 'cod' ? 'Cash on delivery' : 'Online', value: p.revenue, orders: p.orders }))} format={formatCompact} sub={(i) => `· ${i.orders}`} />
              </Panel>
              <Panel title="Orders by status">
                <BarList items={data.byStatus.map((s) => ({ label: titleCase(s._id), value: s.count })).sort((a, b) => b.value - a.value)} />
              </Panel>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
