'use client';

import { useRouter } from 'next/navigation';
import { PageHeader, Panel, SearchInput, DataTable, Tabs, useAdminList } from '@/components/admin/kit';
import { StatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui';
import { PRIORITY_TONE, TICKET_CATEGORIES, TICKET_STATUS_TONE } from '@/lib/constants';
import { timeAgo, titleCase } from '@/lib/utils';

export default function TicketsPage() {
  const router = useRouter();
  const list = useAdminList('/admin/tickets', { status: 'open', limit: 20 });
  const c = list.data?.counts || {};

  return (
    <>
      <PageHeader title="Tickets" description="Customer support conversations." />
      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-line/70 p-4">
          <Tabs value={list.params.status || ''} onChange={(status) => list.setParams({ status })}
            tabs={[
              { value: 'open', label: 'Open', count: c.open || 0 },
              { value: 'in_progress', label: 'In progress', count: c.in_progress || 0 },
              { value: 'resolved', label: 'Resolved', count: c.resolved || 0 },
              { value: 'closed', label: 'Closed', count: c.closed || 0 },
              { value: '', label: 'All' },
            ]} />
          <select className="input h-10 w-auto bg-white" value={list.params.priority || ''} onChange={(e) => list.setParams({ priority: e.target.value })}>
            <option value="">Any priority</option>
            {['urgent', 'high', 'medium', 'low'].map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}
          </select>
          <select className="input h-10 w-auto bg-white" value={list.params.category || ''} onChange={(e) => list.setParams({ category: e.target.value })}>
            <option value="">Any topic</option>
            {TICKET_CATEGORIES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </select>
          <SearchInput value={list.params.q} onChange={(q) => list.setParams({ q })} placeholder="Subject or ticket #" className="w-full sm:ml-auto sm:w-64" />
        </div>
        <DataTable
          rows={list.data?.items}
          loading={list.loading}
          onRowClick={(t) => router.push(`/admin/tickets/${t._id}`)}
          empty="No tickets in this view"
          columns={[
            { key: 'subject', label: 'Ticket', render: (t) => <div><p className="max-w-sm truncate font-medium">{t.subject}</p><p className="text-xs text-muted">{t.ticketNumber} · {titleCase(t.category)}</p></div> },
            { key: 'user', label: 'Customer', render: (t) => <div><p>{t.user?.name || '—'}</p><p className="text-xs text-muted">{t.user?.phone}</p></div> },
            { key: 'priority', label: 'Priority', render: (t) => <StatusBadge status={t.priority} tones={PRIORITY_TONE} /> },
            { key: 'status', label: 'Status', render: (t) => <StatusBadge status={t.status} tones={TICKET_STATUS_TONE} /> },
            { key: 'assignee', label: 'Assignee', render: (t) => t.assignee?.name || <span className="text-muted">Unassigned</span> },
            { key: 'updatedAt', label: 'Updated', render: (t) => <span className="text-xs text-muted">{timeAgo(t.updatedAt)}</span> },
          ]}
        />
        {list.data?.pages > 1 && <div className="border-t border-line/70 p-4"><Pagination page={list.data.page} pages={list.data.pages} onChange={list.setPage} /></div>}
      </Panel>
    </>
  );
}
