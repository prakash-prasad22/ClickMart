'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, MapPin, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button, Field } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user, setUser, wishlist } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '' });
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/auth/me', form);
      setUser(res.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tiles = [
    { href: '/account/orders', icon: Package, label: 'Your orders', text: 'Track, cancel or get help' },
    { href: '/account/addresses', icon: MapPin, label: 'Addresses', text: `${user?.addresses?.length || 0} saved` },
    { href: '/account/wishlist', icon: Heart, label: 'Wishlist', text: `${wishlist.length} saved items` },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="group card flex items-center gap-4 p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary"><t.icon size={19} /></span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{t.label}</p>
              <p className="text-xs text-muted">{t.text}</p>
            </div>
            <ArrowRight size={16} className="text-muted transition group-hover:translate-x-1 group-hover:text-ink" />
          </Link>
        ))}
      </div>

      <form onSubmit={save} className="card max-w-2xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Personal details</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email (optional)"><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Mobile number" hint="Used to sign in. Contact support to change it.">
            <input className="input" value={user?.phone || ''} disabled />
          </Field>
          <Field label="Member since"><input className="input" value={formatDate(user?.createdAt)} disabled /></Field>
        </div>
        <Button type="submit" loading={saving} className="mt-6">Save changes</Button>
      </form>
    </div>
  );
}
