'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Panel } from '@/components/admin/kit';
import { StatusBadge } from '@/components/ui/Badge';
import { Button, Field, Skeleton } from '@/components/ui';
import { ORDER_STATUS_TONE, TICKET_STATUS_TONE } from '@/lib/constants';
import { cn, formatDateTime, formatPrice, titleCase } from '@/lib/utils';

const QUICK_REPLIES = [
  'Thanks for reaching out! We’re looking into this and will update you shortly.',
  'Your order has been dispatched and should reach you within 24 hours.',
  'We’re sorry about this. We’ve arranged a replacement at no extra cost.',
];

export default function AdminTicketPage({ params }) {
  const { id } = use(params);
  const toast = useToast();
  const [t, setT] = useState(null);
  const [team, setTeam] = useState([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const load = () => api.get(`/admin/tickets/${id}`).then(setT).catch((e) => toast.error(e.message));
  useEffect(() => {
    load();
    api.get('/admin/tickets/meta/assignees').then((r) => setTeam(r.items)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [t?.messages?.length]);

  const reply = async (status) => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await api.post(`/admin/tickets/${id}/reply`, { body, status });
      setBody('');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const update = async (patch) => {
    try { await api.patch(`/admin/tickets/${id}`, patch); load(); toast.success('Ticket updated'); } catch (e) { toast.error(e.message); }
  };

  if (!t) return <Skeleton className="h-[600px] rounded-2xl" />;

  return (
    <div>
      <Link href="/admin/tickets" className="mb-2 inline-flex items-center gap-1 text-xs text-muted hover:text-ink"><ArrowLeft size={13} /> Tickets</Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{t.subject}</h1>
        <StatusBadge status={t.status} tones={TICKET_STATUS_TONE} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" bodyClassName="p-0">
          <div className="max-h-[520px] space-y-4 overflow-y-auto bg-admin-bg/50 p-5 scrollbar-thin">
            {t.messages.map((m) => (
              <div key={m._id} className={cn('flex', m.fromStaff ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] rounded-2xl px-4 py-3 text-sm', m.fromStaff ? 'rounded-tr-sm bg-ink text-white' : 'rounded-tl-sm border border-line bg-white')}>
                  <p className="whitespace-pre-line leading-relaxed">{m.body}</p>
                  <p className={cn('mt-1.5 text-[11px]', m.fromStaff ? 'text-white/60' : 'text-muted')}>{m.authorName} · {formatDateTime(m.at)}</p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="space-y-3 border-t border-line/70 p-4">
            <div className="flex flex-wrap gap-2">
              {QUICK_REPLIES.map((q) => (
                <button key={q} type="button" onClick={() => setBody(q)} className="max-w-[240px] truncate rounded-full border border-line px-3 py-1 text-xs text-ink-soft transition hover:border-ink/30">{q}</button>
              ))}
            </div>
            <textarea className="input" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply to the customer…" />
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" loading={sending} onClick={() => reply('resolved')} className="rounded-xl">Reply & resolve</Button>
              <Button size="sm" loading={sending} onClick={() => reply()} className="rounded-xl"><Send size={14} /> Send reply</Button>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Details">
            <div className="space-y-4">
              <Field label="Status">
                <select className="input" value={t.status} onChange={(e) => update({ status: e.target.value })}>
                  {['open', 'in_progress', 'resolved', 'closed'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select className="input" value={t.priority} onChange={(e) => update({ priority: e.target.value })}>
                  {['low', 'medium', 'high', 'urgent'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </select>
              </Field>
              <Field label="Assignee">
                <select className="input" value={t.assignee?._id || ''} onChange={(e) => update({ assignee: e.target.value || null })}>
                  <option value="">Unassigned</option>
                  {team.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </Field>
              <p className="text-xs text-muted">{t.ticketNumber} · {titleCase(t.category)} · opened {formatDateTime(t.createdAt)}</p>
            </div>
          </Panel>
          <Panel title="Customer">
            <p className="font-medium">{t.user?.name || '—'}</p>
            <p className="text-sm text-muted">{t.user?.phone}</p>
            {t.user?.email && <p className="text-sm text-muted">{t.user.email}</p>}
            {t.user && <Link href={`/admin/customers/${t.user._id}`} className="mt-3 inline-block text-xs font-semibold text-primary">View profile →</Link>}
          </Panel>
          {t.order && (
            <Panel title="Related order">
              <Link href={`/admin/orders/${t.order._id}`} className="flex items-center justify-between gap-3 hover:text-primary">
                <span className="font-medium">{t.order.orderNumber}</span>
                <StatusBadge status={t.order.status} tones={ORDER_STATUS_TONE} />
              </Link>
              <p className="mt-1 text-sm text-muted">{formatPrice(t.order.total)} · {formatDateTime(t.order.createdAt)}</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
