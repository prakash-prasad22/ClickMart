'use client';

import { useState } from 'react';
import { Home, Briefcase, MapPin } from 'lucide-react';
import MapPicker from './MapPicker';
import { Button, Field, Switch } from '@/components/ui';
import { cn } from '@/lib/utils';

const EMPTY = { label: 'Home', fullName: '', phone: '', line1: '', line2: '', landmark: '', city: 'Patna', state: 'Bihar', pincode: '', country: 'India', location: null, formattedAddress: '', isDefault: false };
const LABELS = [['Home', Home], ['Work', Briefcase], ['Other', MapPin]];

export default function AddressForm({ initial, onSubmit, onCancel, saving, defaultName = '', defaultPhone = '' }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, fullName: defaultName, phone: defaultPhone?.replace(/^\+91/, '') || '', ...(initial || {}) }));
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  // Fill area/city/state/pincode from the map; keep what the user typed for house/flat
  const onMap = (geo) =>
    setForm((f) => ({
      ...f,
      location: geo.location,
      formattedAddress: geo.formattedAddress || f.formattedAddress,
      line2: geo.line2 ?? f.line2,
      city: geo.city || f.city,
      state: geo.state || f.state,
      pincode: geo.pincode || f.pincode,
      country: geo.country || f.country,
    }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!/^\+?\d{10,13}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid phone number';
    if (!form.line1.trim()) e.line1 = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.state.trim()) e.state = 'Required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter a 6-digit pincode';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <MapPicker value={form} onChange={onMap} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.fullName}>
          <input className="input" value={form.fullName} onChange={set('fullName')} autoComplete="name" />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input className="input" value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" />
        </Field>
        <Field label="House / flat / building" error={errors.line1} className="sm:col-span-2">
          <input className="input" value={form.line1} onChange={set('line1')} placeholder="e.g. Flat 302, Shanti Apartments" />
        </Field>
        <Field label="Area / street" className="sm:col-span-2">
          <input className="input" value={form.line2} onChange={set('line2')} placeholder="e.g. Boring Road" />
        </Field>
        <Field label="Landmark (optional)">
          <input className="input" value={form.landmark} onChange={set('landmark')} placeholder="Near…" />
        </Field>
        <Field label="Pincode" error={errors.pincode}>
          <input className="input" value={form.pincode} onChange={(e) => set('pincode')(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" />
        </Field>
        <Field label="City" error={errors.city}>
          <input className="input" value={form.city} onChange={set('city')} />
        </Field>
        <Field label="State" error={errors.state}>
          <input className="input" value={form.state} onChange={set('state')} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {LABELS.map(([l, Icon]) => (
            <button key={l} type="button" onClick={() => set('label')(l)} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition', form.label === l ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink/40')}>
              <Icon size={13} /> {l}
            </button>
          ))}
        </div>
        <Switch checked={form.isDefault} onChange={set('isDefault')} label="Make default" />
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-5">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" loading={saving}>Save address</Button>
      </div>
    </form>
  );
}

export function AddressCard({ address, selected, onSelect, actions }) {
  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => onSelect && e.key === 'Enter' && onSelect()}
      className={cn(
        'relative rounded-2xl border p-5 text-left transition-all duration-300',
        onSelect && 'cursor-pointer',
        selected ? 'border-primary bg-primary-soft/40 shadow-[0_0_0_1px_rgb(var(--primary))]' : 'border-line bg-surface hover:border-ink/30'
      )}
    >
      <div className="flex items-center gap-2">
        {onSelect && (
          <span className={cn('flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 transition', selected ? 'border-primary' : 'border-line')}>
            {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
          </span>
        )}
        <span className="text-sm font-semibold">{address.fullName}</span>
        <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] font-medium text-ink-soft">{address.label}</span>
        {address.isDefault && <span className="text-[11px] font-medium text-primary">Default</span>}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        {[address.line1, address.line2, address.landmark].filter(Boolean).join(', ')}
        <br />
        {address.city}, {address.state} {address.pincode}
      </p>
      <p className="mt-1 text-sm text-muted">{address.phone}</p>
      {actions && <div className="mt-3 flex gap-4 text-sm" onClick={(e) => e.stopPropagation()}>{actions}</div>}
    </div>
  );
}
