'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IndianRupee, ShoppingCart, Users, Receipt, Clock, MessageSquareText, Star, PackageX, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, Panel, StatCard, DataTable } from '@/components/admin/kit';
import { AreaChart, BarList } from '@/components/admin/Charts';
import { StatusBadge } from '@/components/ui/Badge';
import Img from '@/components/ui/Img';
import { Skeleton } from '@/components/ui';
import { ORDER_STATUS_TONE } from '@/lib/constants';
import { formatCompact, formatDate, formatNumber, formatPrice, timeAgo, titleCase } from '@/lib/utils';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard').then(setD).catch((e) => setError(e.message));
  }, []);

  if (error) return <Panel><p className="text-sm text-danger">{error}</p><p className="mt-1 text-xs text-muted">Is the API running and MongoDB configured?</p></Panel>;

  const attention = d && [
    { label: 'Orders to process', value: d.attention.pendingOrders, icon: Clock, href: '/admin/orders?status=pending', perm: 'orders' },
    { label: 'Open tickets', value: d.attention.openTickets, icon: MessageSquareText, href: '/admin/tickets', perm: 'tickets' },
    { label: 'Reviews to moderate', value: d.attention.pendingReviews, icon: Star, href: '/admin/reviews', perm: 'reviews' },
    { label: 'Low-stock products', value: d.attention.lowStock, icon: PackageX, href: '/admin/inventory?status=low', perm: 'inventory' },
  ].filter((a) => user?.permissions?.includes(a.perm));

  return (
    <>
      <PageHeader title={`${greeting()}, ${user?.name?.split(' ')[0] || 'there'}`} description={`Here’s what’s happening with your store · ${formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}`} />

      {!d ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue · 30 days" value={formatCompact(d.kpis.revenue30)} change={d.kpis.revenue30Change} hint="vs previous 30 days" icon={IndianRupee} />
            <StatCard label="Orders · 30 days" value={formatNumber(d.kpis.orders30)} change={d.kpis.orders30Change} hint={`${d.kpis.todayOrders} today`} icon={ShoppingCart} tone="info" />
            <StatCard label="Avg. order value" value={formatPrice(d.kpis.aov30)} hint="last 30 days" icon={Receipt} tone="accent" />
            <StatCard label="Customers" value={formatNumber(d.kpis.customers)} change={d.kpis.newCustomersChange} hint={`${d.kpis.newCustomers30} new this month`} icon={Users} tone="success" />
          </div>

          {attention.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {attention.map((a) => (
                <Link key={a.label} href={a.href} className="group flex items-center gap-3 rounded-2xl border border-line/70 bg-white px-4 py-3 transition hover:border-ink/20 hover:shadow-soft">
                  <a.icon size={18} className={a.value ? 'text-primary' : 'text-muted'} />
                  <span className="flex-1 text-sm text-ink-soft">{a.label}</span>
                  <span className="text-lg font-bold tabular-nums">{a.value}</span>
                  <ArrowRight size={15} className="text-muted transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="Revenue · last 14 days" className="xl:col-span-2" action={<span className="text-sm font-semibold tabular-nums">{formatPrice(d.series.reduce((s, x) => s + x.revenue, 0))}</span>}>
              <AreaChart
                data={d.series}
                format={(v, axis) => (axis ? formatCompact(v) : formatPrice(v))}
                formatLabel={(l, long) => formatDate(l, long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' })}
                secondary={(p) => `${p.orders} orders`}
              />
            </Panel>
            <Panel title="Top products · 30 days">
              <BarList items={d.topProducts.map((p) => ({ label: p.name, value: p.revenue, qty: p.qty }))} format={formatCompact} sub={(i) => `· ${i.qty} sold`} />
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="Recent orders" className="xl:col-span-2" bodyClassName="p-0" action={<Link href="/admin/orders" className="text-xs font-semibold text-primary">View all</Link>}>
              <DataTable
                rows={d.recentOrders}
                onRowClick={(o) => router.push(`/admin/orders/${o._id}`)}
                empty="No orders yet"
                columns={[
                  { key: 'orderNumber', label: 'Order', render: (o) => <span className="font-medium">{o.orderNumber}</span> },
                  { key: 'customer', label: 'Customer', render: (o) => o.shippingAddress?.fullName || o.user?.name || '—' },
                  { key: 'createdAt', label: 'Placed', render: (o) => <span className="text-muted">{timeAgo(o.createdAt)}</span> },
                  { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} tones={ORDER_STATUS_TONE} /> },
                  { key: 'total', label: 'Total', className: 'text-right', render: (o) => <span className="font-semibold tabular-nums">{formatPrice(o.total)}</span> },
                ]}
              />
            </Panel>

            <div className="space-y-6">
              <Panel title="Low stock" action={<Link href="/admin/inventory?status=low" className="text-xs font-semibold text-primary">Manage</Link>}>
                {d.lowStock.length === 0 ? <p className="text-sm text-muted">All products are well stocked.</p> : (
                  <ul className="space-y-3">
                    {d.lowStock.map((p) => (
                      <li key={p._id} className="flex items-center gap-3">
                        <Img src={p.images?.[0]} alt={p.name} className="h-10 w-10 shrink-0 rounded-lg" />
                        <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${p.stock <= 0 ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning'}`}>{p.stock} left</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
              <Panel title="Orders by status · 30 days">
                <BarList items={d.statusBreakdown.map((s) => ({ label: titleCase(s._id), value: s.count })).sort((a, b) => b.value - a.value)} />
              </Panel>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
