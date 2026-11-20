'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

const OTP_LEN = 6;

function OtpInput({ value, onChange, onComplete, error }) {
  const refs = useRef([]);
  const digits = value.padEnd(OTP_LEN, ' ').split('').slice(0, OTP_LEN);

  const setAt = (i, d) => {
    const arr = value.padEnd(OTP_LEN, ' ').split('');
    arr[i] = d;
    const next = arr.join('').replace(/\s+$/, '');
    onChange(next);
    if (next.replace(/\s/g, '').length === OTP_LEN) onComplete?.(next);
  };

  return (
    <div className="flex justify-between gap-2" onPaste={(e) => {
      const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
      if (text) {
        e.preventDefault();
        onChange(text);
        refs.current[Math.min(text.length, OTP_LEN - 1)]?.focus();
        if (text.length === OTP_LEN) onComplete?.(text);
      }
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d.trim()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          autoFocus={i === 0}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1);
            setAt(i, v || ' ');
            if (v && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d.trim() && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowRight' && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
          }}
          className={cn(
            'h-14 w-full rounded-xl border bg-surface text-center text-xl font-semibold transition focus:border-primary focus:shadow-ring focus:outline-none',
            error ? 'border-danger animate-[shake_.3s]' : 'border-line',
            d.trim() && 'border-ink/40'
          )}
        />
      ))}
    </div>
  );
}

function LoginInner() {
  const [step, setStep] = useState('phone'); // phone | otp | name
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();
  const params = useSearchParams();
  const { setUser, refresh } = useAuth();
  const toast = useToast();
  const next = params.get('next') || '/account';

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phone)) return setError('Enter your 10-digit mobile number');
    setLoading(true);
    try {
      const res = await api.post('/auth/otp/send', { phone });
      setDevOtp(res.devOtp || '');
      setStep('otp');
      setOtp('');
      setCooldown(30);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code = otp) => {
    if (code.replace(/\s/g, '').length !== OTP_LEN || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/otp/verify', { phone, code });
      setUser(res.user);
      if (!res.user.name) {
        setStep('name');
      } else {
        await refresh();
        toast.success(`Welcome back, ${res.user.name.split(' ')[0]}`);
        router.replace(next);
      }
    } catch (err) {
      setError(err.message);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const saveName = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (name.trim()) await api.patch('/auth/me', { name });
      await refresh();
      toast.success('Welcome to ClickMart!');
      router.replace(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container grid min-h-[calc(100vh-180px)] items-center gap-10 py-10 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden h-[620px] overflow-hidden rounded-[28px] bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(70% 60% at 80% 20%, rgb(var(--primary)/.55), transparent 60%), radial-gradient(60% 50% at 10% 90%, rgb(var(--accent)/.45), transparent 60%)' }} />
        <div className="absolute inset-0 bg-grain opacity-60 mix-blend-overlay" />
        <div className="relative">
          <p className="eyebrow text-accent">Members get more</p>
          <h2 className="mt-4 font-display text-5xl font-light leading-tight">Track orders, save addresses, and check out in seconds.</h2>
          <p className="mt-4 max-w-sm text-white/70">Plus early access to festive hampers and members-only offers.</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md animate-fade-up">
        {step === 'phone' && (
          <form onSubmit={sendOtp}>
            <p className="eyebrow">Sign in or create account</p>
            <h1 className="mt-3 font-display text-4xl font-light">Welcome</h1>
            <p className="mt-2 text-muted">We’ll send a one-time code to your mobile.</p>
            <label className="label mt-8">Mobile number</label>
            <div className={cn('flex h-14 items-center overflow-hidden rounded-xl border bg-surface transition focus-within:border-primary focus-within:shadow-ring', error ? 'border-danger' : 'border-line')}>
              <span className="flex h-full items-center border-r border-line px-4 text-sm font-medium text-ink-soft">+91</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                autoComplete="tel-national"
                autoFocus
                placeholder="98765 43210"
                className="h-full flex-1 bg-transparent px-4 text-lg tracking-wide outline-none placeholder:text-muted/50"
              />
            </div>
            {error && <p className="field-error">{error}</p>}
            <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">Get OTP</Button>
            <p className="mt-6 text-center text-xs text-muted">By continuing you agree to our terms & privacy policy.</p>
          </form>
        )}

        {step === 'otp' && (
          <div>
            <button type="button" onClick={() => setStep('phone')} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
              <ArrowLeft size={15} /> Change number
            </button>
            <h1 className="font-display text-4xl font-light">Verify your number</h1>
            <p className="mt-2 text-muted">Enter the 6-digit code sent to <span className="font-medium text-ink">+91 {phone}</span></p>
            {devOtp && (
              <p className="mt-4 rounded-lg bg-info-soft px-3 py-2 text-xs text-info">Development mode — your code is <b className="tracking-widest">{devOtp}</b></p>
            )}
            <div className="mt-8">
              <OtpInput value={otp} onChange={setOtp} onComplete={verify} error={!!error} />
            </div>
            {error && <p className="field-error mt-2">{error}</p>}
            <Button size="lg" loading={loading} className="mt-6 w-full" onClick={() => verify()}>Verify & continue</Button>
            <p className="mt-6 text-center text-sm text-muted">
              Didn’t get it?{' '}
              {cooldown > 0 ? <span>Resend in {cooldown}s</span> : <button type="button" onClick={sendOtp} className="font-medium text-primary">Resend code</button>}
            </p>
            <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck size={13} /> Never share your OTP with anyone</p>
          </div>
        )}

        {step === 'name' && (
          <form onSubmit={saveName}>
            <p className="eyebrow">Almost done</p>
            <h1 className="mt-3 font-display text-4xl font-light">What should we call you?</h1>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Your full name" className="input mt-8 h-14 text-lg" autoComplete="name" />
            <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">Continue</Button>
            <button type="button" onClick={saveName} className="mt-3 w-full text-sm text-muted hover:text-ink">Skip for now</button>
          </form>
        )}

        <p className="mt-10 text-center text-xs text-muted">
          Staff member? <Link href="/admin/login" className="underline hover:text-ink">Admin sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
