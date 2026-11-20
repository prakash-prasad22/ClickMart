'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, PartyPopper, LifeBuoy, MapPin, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/Badge';
import Img from '@/components/ui/Img';
import Modal from '@/components/ui/Modal';
import { Button, Skeleton } from '@/components/ui';
import { ORDER_STATUS_TONE, ORDER_TRACK_STEPS, ORDER_STEP_LABEL, PAYMENT_STATUS_TONE } from '@/lib/constants';
import { cn, formatDate, formatDateTime, formatPrice } from '@/lib/utils';

function Tracker({ order }) {
  if (['cancelled', 'returned'].includes(order.status)) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
        <XCircle size={18} /> This order was {order.status}.
      </div>
    );
  }
  const current = ORDER_TRACK_STEPS.indexOf(order.status);
  const at = (s) => order.statusHistory?.slice().reverse().find((h) => h.status === s)?.at;
  return (
    <ol className="grid grid-cols-6 gap-1">
      {ORDER_TRACK_STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="relative flex flex-col items-center text-center">
            {i > 0 && <span className={cn('absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2 transition-colors duration-700', i <= current ? 'bg-primary' : 'bg-line')} />}
            <span className={cn('relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-500', done ? 'border-primary bg-primary text-white' : 'border-line bg-surface', i === current && 'ring-4 ring-primary/15')}>
              {done && <Check size={14} strokeWidth={3} />}
            </span>
            <span className={cn('mt-2 text-[11px] font-medium leading-tight sm:text-xs', done ? 'text-ink' : 'text-muted')}>{ORDER_STEP_LABEL[s]}</span>
            {at(s) && <span className="mt-0.5 hidden text-[10px] text-muted sm:block">{formatDate(at(s), { day: 'numeric', month: 'short' })}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderDetailPage({ params }) {
  const { id } = use(params);
  const placed = useSearchParams().get('placed');
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  const cancel = async () => {
    setCancelling(true);
    try {
      setOrder(await api.post(`/orders/${id}/cancel`));
      toast.success('Order cancelled');
      setConfirmCancel(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (error) return <p className="text-muted">{error}</p>;
  if (!order) return <Skeleton className="h-96 rounded-2xl" />;
  const a = order.shippingAddress || {};

  return (
    <div className="space-y-6">
      {placed && (
        <div className="relative overflow-hidden rounded-2xl bg-ink p-8 text-white animate-scale-in">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(60% 80% at 90% 0%, rgb(var(--primary)/.5), transparent 60%)' }} />
          <div className="relative flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10"><PartyPopper size={22} className="text-accent" /></span>
            <div>
              <h2 className="font-display text-3xl font-light">Thank you! Your order is placed.</h2>
              <p className="mt-2 text-white/70">We’ve received order <b className="text-white">{order.orderNumber}</b>. You’ll get an SMS when it’s on the way.</p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted">Order</p>
            <h2 className="text-xl font-semibold">{order.orderNumber}</h2>
            <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} tones={ORDER_STATUS_TONE} />
        </div>
        <div className="mt-8"><Tracker order={order} /></div>
        {order.trackingNumber && <p className="mt-6 text-sm text-muted">Tracking: <b className="text-ink">{order.courier} {order.trackingNumber}</b></p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card divide-y divide-line p-6">
          {order.items.map((it) => (
            <div key={`${it.product}${it.variantId}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <Img src={it.image} alt={it.name} className="h-20 w-16 rounded-lg" />
              <div className="flex-1">
                <p className="text-sm font-medium">{it.name}</p>
                {it.variantName && <p className="text-xs text-muted">{it.variantName}</p>}
                <p className="mt-1 text-xs text-muted">Qty {it.qty} × {formatPrice(it.price)}</p>
              </div>
              <span className="text-sm font-semibold">{formatPrice(it.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="card space-y-2.5 p-6 text-sm">
            <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.couponDiscount > 0 && <div className="flex justify-between text-success"><span>Coupon {order.couponCode}</span><span>−{formatPrice(order.couponDiscount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted">Delivery</span><span>{order.shippingFee ? formatPrice(order.shippingFee) : 'Free'}</span></div>
            {order.tax > 0 && <div className="flex justify-between"><span className="text-muted">Tax</span><span>{formatPrice(order.tax)}</span></div>}
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-muted">{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online'}</span>
              <StatusBadge status={order.paymentStatus} tones={PAYMENT_STATUS_TONE} />
            </div>
          </div>

          <div className="card p-6 text-sm">
            <p className="flex items-center gap-2 font-semibold"><MapPin size={16} className="text-primary" /> Delivering to</p>
            <p className="mt-3 font-medium">{a.fullName}</p>
            <p className="mt-1 leading-relaxed text-ink-soft">{[a.line1, a.line2, a.landmark].filter(Boolean).join(', ')}<br />{a.city}, {a.state} {a.pincode}</p>
            <p className="mt-1 text-muted">{a.phone}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Link href={`/account/support?new=1&order=${order._id}`} className="btn btn-outline"><LifeBuoy size={16} /> Get help with this order</Link>
            {['pending', 'confirmed'].includes(order.status) && (
              <Button variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => setConfirmCancel(true)}>Cancel order</Button>
            )}
          </div>
        </div>
      </div>

      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel this order?" size="sm"
        footer={<><Button variant="ghost" onClick={() => setConfirmCancel(false)}>Keep order</Button><Button variant="danger" loading={cancelling} onClick={cancel}>Yes, cancel</Button></>}>
        <p className="text-sm text-muted">Order {order.orderNumber} for {formatPrice(order.total)} will be cancelled. This can’t be undone.</p>
      </Modal>
    </div>
  );
}
