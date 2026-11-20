'use client';

import { PageHeader, Panel, SearchInput, useAdminList } from '@/components/admin/kit';
import Badge from '@/components/ui/Badge';
import { Pagination, Skeleton } from '@/components/ui';
import { formatDateTime, initials, timeAgo, titleCase } from '@/lib/utils';

const ACTION_TONE = { created: 'success', deleted: 'danger', updated: 'info', stock_updated: 'accent', signed_in: 'neutral', suspended: 'danger' };

function describe(log) {
  const m = log.meta || {};
  const name = m.name || m.orderNumber || m.ticketNumber || '';
  if (log.action === 'stock_updated') return `${name}${m.variant ? ` (${m.variant})` : ''}: stock ${m.before} → ${m.after}`;
  if (m.changes?.status) return `${name}: ${titleCase(m.changes.status[0])} → ${titleCase(m.changes.status[1])}`;
  return name;
}

export default function ActivityPage() {
  const list = useAdminList('/admin/activity', { limit: 30 });
  const entities = list.data?.entities || [];

  return (
    <>
      <PageHeader title="Activity log" description="An audit trail of every change made by your team." />
      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-line/70 p-4">
          <select className="input h-10 w-auto bg-white" value={list.params.entity || ''} onChange={(e) => list.setParams({ entity: e.target.value })}>
            <option value="">Everything</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <SearchInput value={list.params.q} onChange={(q) => list.setParams({ q })} placeholder="Search action or person" className="w-full sm:ml-auto sm:w-64" />
        </div>
        <ul className="divide-y divide-line/70">
          {list.loading && !list.data && [1, 2, 3, 4].map((i) => <li key={i} className="p-4"><Skeleton className="h-10" /></li>)}
          {list.data?.items.map((log) => (
            <li key={log._id} className="flex items-start gap-4 px-5 py-4 transition hover:bg-surface-alt/30">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] text-xs font-semibold">{initials(log.actorName || '?')}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{log.actorName || 'System'}</span>{' '}
                  <span className="text-muted">{titleCase(log.action).toLowerCase()}</span>{' '}
                  <Badge tone={ACTION_TONE[log.action] || 'neutral'}>{log.entity}</Badge>
                </p>
                {describe(log) && <p className="mt-0.5 truncate text-sm text-ink-soft">{describe(log)}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted" title={formatDateTime(log.createdAt)}>{timeAgo(log.createdAt)}</p>
                <p className="text-[11px] text-muted/70">{titleCase(log.actorRole || '')}</p>
              </div>
            </li>
          ))}
        </ul>
        {!list.loading && !list.data?.items.length && <p className="py-14 text-center text-sm text-muted">No activity yet</p>}
        {list.data?.pages > 1 && <div className="border-t border-line/70 p-4"><Pagination page={list.data.page} pages={list.data.pages} onChange={list.setPage} /></div>}
      </Panel>
    </>
  );
}
