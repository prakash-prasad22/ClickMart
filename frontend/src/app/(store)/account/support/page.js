'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LifeBuoy, Plus, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { Button, EmptyState, Field, Skeleton } from '@/components/ui';
import { TICKET_CATEGORIES, TICKET_STATUS_TONE } from '@/lib/constants';
import { formatDate, titleCase } from '@/lib/utils';

function SupportInner() {
  const params = useSearchParams();
  const toast = useToast();
  const [tickets, setTickets] = useState(null);
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(params.get('new') === '1');
  const [form, setForm] = useState({ subject: '', category: params.get('order') ? 'order' : 'other', orderId: params.get('order') || '', message: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/tickets').then(setTickets).catch(() => setTickets([]));
  useEffect(() => {
    load();
    api.get('/orders').then((r) => setOrders(r.items)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/tickets', form);
      toast.success('Ticket raised — we’ll reply shortly');
      setOpen(false);
      setForm({ subject: '', category: 'other', orderId: '', message: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Support tickets</h2>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={15} /> New ticket</Button>
      </div>

      {tickets === null ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets" description="Need help with an order or product? We’re here for you." action={<Link href="/help" className="btn btn-outline">Browse help articles</Link>} />
      ) : (
        <div className="card divide-y divide-line">
          {tickets.map((t) => (
            <Link key={t._id} href={`/account/support/${t._id}`} className="group flex items-center gap-4 p-5 transition hover:bg-surface-alt/40">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.subject}</p>
                <p className="text-xs text-muted">{t.ticketNumber} · {titleCase(t.category)} · Updated {formatDate(t.updatedAt)}</p>
              </div>
              <StatusBadge status={t.status} tones={TICKET_STATUS_TONE} />
              <ChevronRight size={18} className="text-muted transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="How can we help?" size="md">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Topic">
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
              </select>
            </Field>
            <Field label="Related order (optional)">
              <select className="input" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>
                <option value="">None</option>
                {orders.map((o) => <option key={o._id} value={o._id}>{o.orderNumber}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Subject"><input className="input" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
          <Field label="Message"><textarea className="input" rows={5} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what happened…" /></Field>
          <Button type="submit" loading={saving} className="w-full">Submit ticket</Button>
        </form>
      </Modal>
    </div>
  );
}

export default function SupportPage() {
  return <Suspense><SupportInner /></Suspense>;
}
