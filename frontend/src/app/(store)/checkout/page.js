'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Banknote, CreditCard, Lock, ShoppingBag, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import AddressForm, { AddressCard } from '@/components/store/AddressForm';
import OrderSummary, { CouponBox } from '@/components/store/OrderSummary';
import Img from '@/components/ui/Img';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { cn, formatPrice } from '@/lib/utils';

function Step({ n, title, children, done }) {
  return (
    <section className="card p-6 sm:p-8 animate-fade-up" style={{ animationDelay: `${n * 70}ms` }}>
      <h2 className="flex items-center gap-3 text-lg font-semibold">
        <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', done ? 'bg-success text-white' : 'bg-ink text-white')}>{n}</span>
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function CheckoutPage() {
  const { items, quote, hydrated, refreshQuote, couponCode, clear } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [addresses, setAddresses] = useState(null);
  const [addressId, setAddressId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [payment, setPayment] = useState('cod');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [checkQuote, setCheckQuote] = useState(null);

  useEffect(() => {
    api.get('/account/addresses').then((list) => {
      setAddresses(list);
      setAddressId((list.find((a) => a.isDefault) || list[0])?._id || null);
      if (!list.length) setAdding(true);
    }).catch(() => setAddresses([]));
  }, []);

  const selected = addresses?.find((a) => a._id === addressId);

  // Re-quote with the selected pincode to verify delivery serviceability
  useEffect(() => {
    if (!selected || !items.length) return;
    refreshQuote({ pincode: selected.pincode }).then(setCheckQuote);
  }, [selected, items, couponCode, refreshQuote]);

  const effective = checkQuote || quote;

  const saveAddress = async (form) => {
    setSavingAddr(true);
    try {
      const a = await api.post('/account/addresses', form);
      const list = await api.get('/account/addresses');
      setAddresses(list);
      setAddressId(a._id);
      setAdding(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingAddr(false);
    }
  };

  const placeOrder = async () => {
    if (!addressId) return toast.error('Please add a delivery address');
    setPlacing(true);
    try {
      const order = await api.post('/orders', { addressId, paymentMethod: payment, couponCode: couponCode || undefined, notes, items });
      clear();
      router.push(`/account/orders/${order._id}?placed=1`);
    } catch (err) {
      toast.error(err.message);
      refreshQuote();
    } finally {
      setPlacing(false);
    }
  };

  if (hydrated && !items.length) {
    return (
      <div className="container py-16">
        <EmptyState icon={ShoppingBag} title="Nothing to check out" description="Your bag is empty." action={<Link href="/shop" className="btn btn-primary">Browse products</Link>} />
      </div>
    );
  }

  const blocking = effective?.issues?.length > 0 || (effective && !effective.serviceable);

  return (
    <div className="container pt-10">
      <h1 className="font-display text-4xl font-light animate-fade-up">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Step n={1} title="Delivery address" done={!!selected}>
            {addresses === null ? (
              <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {addresses.map((a) => (
                  <AddressCard key={a._id} address={a} selected={a._id === addressId} onSelect={() => setAddressId(a._id)} />
                ))}
                <button type="button" onClick={() => setAdding(true)} className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-sm font-medium text-muted transition hover:border-primary hover:text-primary">
                  <Plus size={20} /> Add new address
                </button>
              </div>
            )}
            {effective && !effective.serviceable && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
                <AlertTriangle size={16} /> We don’t deliver to this pincode yet. Please choose a Patna address.
              </p>
            )}
          </Step>

          <Step n={2} title="Payment">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: 'cod', icon: Banknote, title: 'Cash on delivery', text: 'Pay with cash or UPI at your door', enabled: effective?.paymentMethods?.cod !== false },
                { id: 'online', icon: CreditCard, title: 'Pay online', text: 'UPI, cards & netbanking', enabled: !!effective?.paymentMethods?.online },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={!m.enabled}
                  onClick={() => setPayment(m.id)}
                  className={cn(
                    'flex items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50',
                    payment === m.id && m.enabled ? 'border-primary bg-primary-soft/40 shadow-[0_0_0_1px_rgb(var(--primary))]' : 'border-line hover:border-ink/30'
                  )}
                >
                  <m.icon size={22} className="mt-0.5 text-primary" strokeWidth={1.7} />
                  <span>
                    <span className="block text-sm font-semibold">{m.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{m.enabled ? m.text : 'Coming soon'}</span>
                  </span>
                </button>
              ))}
            </div>
            <label className="label mt-6">Delivery instructions (optional)</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Call before arriving, leave with security" maxLength={500} />
          </Step>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6 animate-fade-up" style={{ animationDelay: '150ms' }}>
            <h2 className="font-semibold">Order summary</h2>
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {effective?.items.map((l) => (
                <div key={`${l.product}${l.variantId}`} className="flex items-center gap-3">
                  <div className="relative">
                    <Img src={l.image} alt={l.name} className="h-16 w-14 rounded-lg" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">{l.qty}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    {l.variantName && <p className="text-xs text-muted">{l.variantName}</p>}
                    {!l.inStock && <p className="text-xs text-danger">Out of stock</p>}
                  </div>
                  <span className="text-sm font-medium">{formatPrice(l.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="my-5 border-t border-line pt-5"><CouponBox /></div>
            <OrderSummary quote={effective} />
            <Button size="lg" className="mt-6 w-full" loading={placing} disabled={!selected || blocking || !effective} onClick={placeOrder}>
              <Lock size={16} /> Place order · {effective ? formatPrice(effective.total) : ''}
            </Button>
            {effective?.issues?.length > 0 && <p className="mt-3 text-center text-xs text-danger">{effective.issues[0].message}</p>}
          </div>
        </aside>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add delivery address" description="Drop a pin for faster, accurate delivery" size="lg">
        <AddressForm onSubmit={saveAddress} saving={savingAddr} onCancel={() => setAdding(false)} defaultName={user?.name} defaultPhone={user?.phone} />
      </Modal>
    </div>
  );
}
