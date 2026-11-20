'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageHeader, Panel } from '@/components/admin/kit';
import { Button, Field, Switch, Skeleton } from '@/components/ui';

export default function SettingsPage() {
  const toast = useToast();
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/admin/settings').then((d) => setS({ ...d, serviceablePincodePrefixes: (d.serviceablePincodePrefixes || []).join(', ') })).catch((e) => toast.error(e.message)); }, [toast]);

  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const setNested = (k, sub, v) => setS((x) => ({ ...x, [k]: { ...(x[k] || {}), [sub]: v } }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { _id, createdAt, updatedAt, __v, ...payload } = s;
      await api.put('/admin/settings', { ...payload, shippingFee: Number(s.shippingFee), freeShippingAbove: Number(s.freeShippingAbove), taxRate: Number(s.taxRate) });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!s) return <Skeleton className="h-[600px] rounded-2xl" />;

  return (
    <form onSubmit={save}>
      <PageHeader title="Settings" description="Store-wide configuration." actions={<Button type="submit" loading={saving} className="rounded-xl">Save settings</Button>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Store details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store name"><input className="input" value={s.storeName || ''} onChange={(e) => set('storeName', e.target.value)} /></Field>
            <Field label="Currency symbol"><input className="input" value={s.currencySymbol || ''} onChange={(e) => set('currencySymbol', e.target.value)} /></Field>
            <Field label="Tagline" className="sm:col-span-2"><input className="input" value={s.tagline || ''} onChange={(e) => set('tagline', e.target.value)} /></Field>
            <Field label="Support email"><input className="input" type="email" value={s.supportEmail || ''} onChange={(e) => set('supportEmail', e.target.value)} /></Field>
            <Field label="Support phone"><input className="input" value={s.supportPhone || ''} onChange={(e) => set('supportPhone', e.target.value)} /></Field>
            <Field label="Store address" className="sm:col-span-2"><textarea className="input" rows={2} value={s.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label="Announcement bar" hint="Shown at the top of every page. Leave empty to hide." className="sm:col-span-2"><input className="input" value={s.announcement || ''} onChange={(e) => set('announcement', e.target.value)} /></Field>
          </div>
        </Panel>

        <Panel title="Delivery & charges">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Delivery fee (₹)"><input type="number" min="0" className="input" value={s.shippingFee ?? 0} onChange={(e) => set('shippingFee', e.target.value)} /></Field>
            <Field label="Free delivery above (₹)"><input type="number" min="0" className="input" value={s.freeShippingAbove ?? 0} onChange={(e) => set('freeShippingAbove', e.target.value)} /></Field>
            <Field label="Tax added at checkout (%)" hint="Keep 0 if prices already include GST"><input type="number" min="0" step="0.01" className="input" value={s.taxRate ?? 0} onChange={(e) => set('taxRate', e.target.value)} /></Field>
            <Field label="Serviceable pincode prefixes" hint="Comma separated, e.g. 800, 801 for Patna. Empty = deliver everywhere."><input className="input" value={s.serviceablePincodePrefixes} onChange={(e) => set('serviceablePincodePrefixes', e.target.value)} /></Field>
            <Field label="Store latitude" hint="Map default centre"><input type="number" step="any" className="input" value={s.storeLocation?.lat ?? ''} onChange={(e) => setNested('storeLocation', 'lat', Number(e.target.value))} /></Field>
            <Field label="Store longitude"><input type="number" step="any" className="input" value={s.storeLocation?.lng ?? ''} onChange={(e) => setNested('storeLocation', 'lng', Number(e.target.value))} /></Field>
          </div>
        </Panel>

        <Panel title="Payments">
          <div className="space-y-4">
            <Switch checked={s.codEnabled} onChange={(v) => set('codEnabled', v)} label="Cash on delivery" />
            <Switch checked={s.onlinePaymentEnabled} onChange={(v) => set('onlinePaymentEnabled', v)} label="Online payments (requires Razorpay keys in backend/.env — integration pending)" />
          </div>
        </Panel>

        <Panel title="Social links">
          <div className="grid gap-4">
            {['instagram', 'facebook', 'whatsapp'].map((k) => (
              <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
                <input className="input" value={s.socials?.[k] || ''} onChange={(e) => setNested('socials', k, e.target.value)} placeholder={k === 'whatsapp' ? 'https://wa.me/91XXXXXXXXXX' : `https://${k}.com/yourstore`} />
              </Field>
            ))}
          </div>
        </Panel>
      </div>
    </form>
  );
}
