import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import HelpCenter from '@/components/store/HelpCenter';
import { serverApi } from '@/lib/server-api';

export const metadata = { title: 'Help centre' };

export default async function HelpPage() {
  const [articles, settings] = await Promise.all([serverApi('/store/help', { fallback: [] }), serverApi('/store/settings', { fallback: {} })]);
  return (
    <div className="container pt-12">
      <div className="mx-auto max-w-2xl text-center animate-fade-up">
        <p className="eyebrow">Help centre</p>
        <h1 className="mt-3 font-display text-5xl font-light">How can we help?</h1>
        <p className="mt-3 text-muted">Answers to common questions about orders, delivery, payments and returns.</p>
      </div>
      <HelpCenter articles={articles || []} />
      <div className="mx-auto mt-16 flex max-w-3xl flex-col items-center gap-4 rounded-[28px] bg-surface-alt/70 p-10 text-center">
        <MessageCircle size={28} className="text-primary" strokeWidth={1.6} />
        <h2 className="font-display text-2xl">Still need help?</h2>
        <p className="text-sm text-muted">Raise a ticket and our Patna team will get back to you, usually within a few hours. {settings?.supportPhone && <>Or call us at {settings.supportPhone}.</>}</p>
        <Link href="/account/support?new=1" className="btn btn-primary">Contact support</Link>
      </div>
    </div>
  );
}
