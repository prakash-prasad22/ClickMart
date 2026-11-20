'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, MapPin, Phone, User, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Panel } from '@/components/admin/kit';
import { StatusBadge } from '@/components/ui/Badge';
import Img from '@/components/ui/Img';
import { Button, Field, Skeleton } from '@/components/ui';
import { ORDER_STATUSES, ORDER_STATUS_TONE, PAYMENT_STATUS_TONE } from '@/lib/constants';
import { formatDateTime, formatPrice, titleCase } from '@/lib/utils';

export default function AdminOrderPage({ params }) {
  const { id } = use(params);
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState({ status: '', note: '', paymentStatus: '', courier: '', trackingNumber: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get(`/admin/orders/${id}`).then((o) => {
    setOrder(o);
    setForm({ status: o.status, note: '', paymentStatus: o.paymentStatus, courier: o.courier || '', trackingNumber: o.trackingNumber || '' });
  }).catch((e) => toast.error(e.message));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const save = async () => {
    if (['cancelled', 'returned'].includes(form.status) && form.status !== order.status && !window.confirm(`Mark this order as ${form.status}? Stock will be restored.`)) return;
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${id}`, form);
      toast.success('Order updated');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!order) return <Skeleton className="h-[600px] rounded-2xl" />;
  const a = order.shippingAddress || {};
  const closed = ['cancelled', 'returned'].includes(order.status);
  const mapsUrl = a.location?.lat ? `https://www.google.com/maps/search/?api=1&query=${a.location.lat},${a.location.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(', '))}`;

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="mb-2 inline-flex items-center gap-1 text-xs text-muted hover:text-ink"><ArrowLeft size={13} /> Orders</Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <StatusBadge status={order.status} tones={ORDER_STATUS_TONE} />
          </div>
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <button type="button" onClick={() => window.print()} className="btn btn-outline btn-sm rounded-xl"><Printer size={15} /> Print invoice</button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title={`Items (${order.items.length})`} bodyClassName="p-0">
            <div className="divide-y divide-line/70">
              {order.items.map((it) => (
                <div key={`${it.product}${it.variantId}`} className="flex items-center gap-4 px-5 py-4">
                  <Img src={it.image} alt={it.name} className="h-14 w-12 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{it.name}</p>
                    <p className="text-xs text-muted">{[it.variantName, it.sku && `SKU ${it.sku}`].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className="text-sm text-muted tabular-nums">{formatPrice(it.price)} × {it.qty}</span>
                  <span className="w-24 text-right font-semibold tabular-nums">{formatPrice(it.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-line/70 px-5 py-4 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="tabular-nums">{formatPrice(order.subtotal)}</span></div>
              {order.offerDiscount > 0 && <div className="flex justify-between"><span className="text-muted">Offer savings (included)</span><span className="tabular-nums text-success">{formatPrice(order.offerDiscount)}</span></div>}
              {order.couponDiscount > 0 && <div className="flex justify-between"><span className="text-muted">Coupon {order.couponCode}</span><span className="tabular-nums text-success">−{formatPrice(order.couponDiscount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span className="tabular-nums">{formatPrice(order.shippingFee)}</span></div>
              {order.tax > 0 && <div className="flex justify-between"><span className="text-muted">Tax</span><span className="tabular-nums">{formatPrice(order.tax)}</span></div>}
              <div className="flex justify-between border-t border-line/70 pt-2 text-base font-bold"><span>Total</span><span className="tabular-nums">{formatPrice(order.total)}</span></div>
            </div>
          </Panel>

          <Panel title="Timeline">
            <ol className="relative space-y-5 border-l border-line pl-6">
              {order.statusHistory.slice().reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${i === 0 ? 'bg-primary' : 'bg-line'}`} />
                  <p className="text-sm font-medium">{titleCase(h.status)}</p>
                  {h.note && <p className="text-sm text-ink-soft">{h.note}</p>}
                  <p className="text-xs text-muted">{formatDateTime(h.at)}{h.by?.name ? ` · ${h.by.name}` : ''}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Update order" className="no-print">
            <div className="space-y-4">
              <Field label="Order status">
                <select className="input" value={form.status} disabled={closed} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </select>
              </Field>
              <Field label="Payment status">
                <select className="input" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                  {['pending', 'paid', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Courier"><input className="input" value={form.courier} onChange={(e) => setForm({ ...form, courier: e.target.value })} placeholder="e.g. In-house" /></Field>
                <Field label="Tracking #"><input className="input" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} /></Field>
              </div>
              <Field label="Note (visible in timeline)"><textarea className="input" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
              <Button onClick={save} loading={saving} className="w-full rounded-xl">Save changes</Button>
            </div>
          </Panel>

          <Panel title="Customer">
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><User size={15} className="text-muted" />
                {order.user ? <Link href={`/admin/customers/${order.user._id}`} className="font-medium text-primary hover:underline">{order.user.name || 'Customer'}</Link> : '—'}
              </p>
              <p className="flex items-center gap-2"><Phone size={15} className="text-muted" />{order.user?.phone || a.phone}</p>
            </div>
          </Panel>

          <Panel title="Delivery address" action={<a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">Open map <ExternalLink size={12} /></a>}>
            <div className="flex gap-3 text-sm">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              <div className="leading-relaxed">
                <p className="font-medium">{a.fullName} · {a.phone}</p>
                <p className="text-ink-soft">{[a.line1, a.line2, a.landmark].filter(Boolean).join(', ')}</p>
                <p className="text-ink-soft">{a.city}, {a.state} {a.pincode}</p>
                {a.location?.lat && <p className="mt-1 font-mono text-xs text-muted">{a.location.lat.toFixed(5)}, {a.location.lng.toFixed(5)}</p>}
              </div>
            </div>
            {order.notes && <p className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">Note: {order.notes}</p>}
          </Panel>

          <Panel title="Payment">
            <div className="flex items-center justify-between text-sm">
              <span>{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online'}</span>
              <StatusBadge status={order.paymentStatus} tones={PAYMENT_STATUS_TONE} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
