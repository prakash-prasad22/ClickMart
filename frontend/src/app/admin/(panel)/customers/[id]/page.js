'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Panel, StatCard, DataTable } from '@/components/admin/kit';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { Button, Skeleton } from '@/components/ui';
import { ORDER_STATUS_TONE, TICKET_STATUS_TONE } from '@/lib/constants';
import { formatDate, formatPrice, initials, timeAgo } from '@/lib/utils';

export default function CustomerPage({ params }) {
  const { id } = use(params);
  const toast = useToast();
  const router = useRouter();
  const [c, setC] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/admin/customers/${id}`).then(setC).catch((e) => toast.error(e.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const toggle = async () => {
    if (c.isActive && !window.confirm('Suspend this customer? They will be signed out and unable to order.')) return;
    setBusy(true);
    try { await api.patch(`/admin/customers/${id}`, { isActive: !c.isActive }); load(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (!c) return <Skeleton className="h-[500px] rounded-2xl" />;

  return (
    <div>
      <Link href="/admin/customers" className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-ink"><ArrowLeft size={13} /> Customers</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary-deep">{initials(c.name || c.phone)}</span>
          <div>
            <div className="flex items-center gap-2"><h1 className="text-2xl font-bold">{c.name || 'Unnamed customer'}</h1>{!c.isActive && <Badge tone="danger">Suspended</Badge>}</div>
            <p className="text-sm text-muted">{c.phone}{c.email ? ` · ${c.email}` : ''} · joined {formatDate(c.createdAt)}</p>
          </div>
        </div>
        <Button variant={c.isActive ? 'outline' : 'primary'} size="sm" loading={busy} onClick={toggle} className="rounded-xl">{c.isActive ? 'Suspend customer' : 'Reactivate'}</Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders" value={c.stats.orders} />
        <StatCard label="Lifetime spend" value={formatPrice(c.stats.spent)} />
        <StatCard label="Last order" value={c.stats.lastOrderAt ? timeAgo(c.stats.lastOrderAt) : '—'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Orders" className="xl:col-span-2" bodyClassName="p-0">
          <DataTable
            rows={c.orders}
            onRowClick={(o) => router.push(`/admin/orders/${o._id}`)}
            empty="No orders yet"
            columns={[
              { key: 'orderNumber', label: 'Order', render: (o) => <span className="font-medium">{o.orderNumber}</span> },
              { key: 'createdAt', label: 'Date', render: (o) => formatDate(o.createdAt) },
              { key: 'items', label: 'Items', render: (o) => o.items.length },
              { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} tones={ORDER_STATUS_TONE} /> },
              { key: 'total', label: 'Total', className: 'text-right', render: (o) => <span className="font-semibold tabular-nums">{formatPrice(o.total)}</span> },
            ]}
          />
        </Panel>
        <div className="space-y-6">
          <Panel title={`Addresses (${c.addresses?.length || 0})`}>
            {!c.addresses?.length ? <p className="text-sm text-muted">No saved addresses</p> : (
              <ul className="space-y-4">
                {c.addresses.map((a) => (
                  <li key={a._id} className="flex gap-3 text-sm">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">{a.label}{a.isDefault && <span className="ml-2 text-xs text-primary">Default</span>}</p>
                      <p className="text-ink-soft">{[a.line1, a.line2].filter(Boolean).join(', ')}, {a.city} {a.pincode}</p>
                      {a.location?.lat && <a href={`https://www.google.com/maps/search/?api=1&query=${a.location.lat},${a.location.lng}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary">Map <ExternalLink size={11} /></a>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Support tickets">
            {!c.tickets?.length ? <p className="text-sm text-muted">No tickets</p> : (
              <ul className="space-y-3">
                {c.tickets.map((t) => (
                  <li key={t._id}>
                    <Link href={`/admin/tickets/${t._id}`} className="flex items-center justify-between gap-3 text-sm hover:text-primary">
                      <span className="truncate">{t.subject}</span>
                      <StatusBadge status={t.status} tones={TICKET_STATUS_TONE} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
