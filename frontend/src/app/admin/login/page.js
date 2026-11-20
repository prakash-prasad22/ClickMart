'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button, Field } from '@/components/ui';

function AdminLoginInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/admin/login', { email, password });
      await refresh();
      const next = params.get('next');
      router.replace(next && next.startsWith('/admin') ? next : '/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-admin-sidebar lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(70% 60% at 30% 30%, rgb(var(--primary)/.45), transparent 60%), radial-gradient(50% 50% at 80% 90%, rgb(var(--accent)/.3), transparent 60%)' }} />
        <div className="relative flex h-full flex-col justify-between p-14 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold">C</span>
            <span className="text-lg font-bold">ClickMart <span className="ml-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Admin</span></span>
          </div>
          <div>
            <h1 className="font-display text-5xl font-light leading-tight">Run your store<br />with clarity.</h1>
            <p className="mt-4 max-w-sm text-white/60">Orders, inventory, marketing and support — all in one calm place.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-admin-bg p-6">
        <form onSubmit={submit} className="w-full max-w-sm animate-fade-up">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white"><Lock size={20} /></span>
          <h2 className="mt-6 text-2xl font-bold">Staff sign in</h2>
          <p className="mt-1 text-sm text-muted">Use the credentials provided by your administrator.</p>
          <div className="mt-8 space-y-4">
            <Field label="Email">
              <input className="input" type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input className="input pr-11" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label="Toggle password visibility">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
          </div>
          {error && <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger animate-fade-in">{error}</p>}
          <Button type="submit" variant="dark" loading={loading} className="mt-6 w-full rounded-xl">Sign in</Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return <Suspense><AdminLoginInner /></Suspense>;
}
