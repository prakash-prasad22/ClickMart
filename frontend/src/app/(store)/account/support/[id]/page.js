'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/Badge';
import { Button, Skeleton } from '@/components/ui';
import { TICKET_STATUS_TONE } from '@/lib/constants';
import { cn, formatDateTime, titleCase } from '@/lib/utils';

export default function TicketPage({ params }) {
  const { id } = use(params);
  const toast = useToast();
  const [ticket, setTicket] = useState(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { api.get(`/tickets/${id}`).then(setTicket).catch((e) => toast.error(e.message)); }, [id, toast]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [ticket?.messages?.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      setTicket(await api.post(`/tickets/${id}/messages`, { body }));
      setBody('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!ticket) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-6">
        <div>
          <Link href="/account/support" className="mb-2 inline-flex items-center gap-1 text-xs text-muted hover:text-ink"><ArrowLeft size={13} /> All tickets</Link>
          <h2 className="text-lg font-semibold">{ticket.subject}</h2>
          <p className="text-xs text-muted">{ticket.ticketNumber} · {titleCase(ticket.category)}{ticket.order ? ` · Order ${ticket.order.orderNumber}` : ''}</p>
        </div>
        <StatusBadge status={ticket.status} tones={TICKET_STATUS_TONE} />
      </div>
      <div className="max-h-[480px] space-y-4 overflow-y-auto bg-surface-alt/30 p-6 scrollbar-thin">
        {ticket.messages.map((m) => (
          <div key={m._id} className={cn('flex animate-fade-up', m.fromStaff ? 'justify-start' : 'justify-end')}>
            <div className={cn('max-w-[80%] rounded-2xl px-4 py-3 text-sm', m.fromStaff ? 'rounded-tl-sm border border-line bg-surface' : 'rounded-tr-sm bg-ink text-white')}>
              <p className="whitespace-pre-line leading-relaxed">{m.body}</p>
              <p className={cn('mt-1.5 text-[11px]', m.fromStaff ? 'text-muted' : 'text-white/60')}>{m.fromStaff ? `${m.authorName} · ClickMart` : 'You'} · {formatDateTime(m.at)}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {ticket.status !== 'closed' && (
        <form onSubmit={send} className="flex gap-2 border-t border-line p-4">
          <input className="input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply…" />
          <Button type="submit" loading={sending} className="shrink-0"><Send size={15} /> Send</Button>
        </form>
      )}
    </div>
  );
}
