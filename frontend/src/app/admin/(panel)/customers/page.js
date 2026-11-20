'use client';

import { useRouter } from 'next/navigation';
import { PageHeader, Panel, SearchInput, DataTable, Tabs, useAdminList } from '@/components/admin/kit';
import Badge from '@/components/ui/Badge';
import { Pagination } from '@/components/ui';
import { formatDate, formatPrice, initials, timeAgo } from '@/lib/utils';

export default function CustomersPage() {
  const router = useRouter();
  const list = useAdminList('/admin/customers', { limit: 20 });

  return (
    <>
      <PageHeader title="Customers" description="Everyone who has signed in to your store." />
      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-line/70 p-4">
          <Tabs value={list.params.isActive || ''} onChange={(isActive) => list.setParams({ isActive })} tabs={[{ value: '', label: 'All' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Suspended' }]} />
          <SearchInput value={list.params.q} onChange={(q) => list.setParams({ q })} placeholder="Name, phone or email" className="w-full sm:ml-auto sm:w-72" />
        </div>
        <DataTable
          rows={list.data?.items}
          loading={list.loading}
          onRowClick={(c) => router.push(`/admin/customers/${c._id}`)}
          empty="No customers yet"
          columns={[
            {
              key: 'name', label: 'Customer', render: (c) => (
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-deep">{initials(c.name || c.phone)}</span>
                  <div><p className="font-medium">{c.name || 'Unnamed'}</p><p className="text-xs text-muted">{c.phone}</p></div>
                </div>
              ),
            },
            { key: 'city', label: 'City', render: (c) => c.city || <span className="text-muted">—</span> },
            { key: 'orders', label: 'Orders', render: (c) => <span className="tabular-nums">{c.orders}</span> },
            { key: 'spent', label: 'Total spent', render: (c) => <span className="font-medium tabular-nums">{formatPrice(c.spent)}</span> },
            { key: 'lastOrderAt', label: 'Last order', render: (c) => <span className="text-xs text-muted">{c.lastOrderAt ? timeAgo(c.lastOrderAt) : 'Never'}</span> },
            { key: 'createdAt', label: 'Joined', render: (c) => <span className="text-xs text-muted">{formatDate(c.createdAt)}</span> },
            { key: 'isActive', label: 'Status', render: (c) => (c.isActive ? <Badge tone="success" dot>Active</Badge> : <Badge tone="danger" dot>Suspended</Badge>) },
          ]}
        />
        {list.data?.pages > 1 && <div className="border-t border-line/70 p-4"><Pagination page={list.data.page} pages={list.data.pages} onChange={list.setPage} /></div>}
      </Panel>
    </>
  );
}
