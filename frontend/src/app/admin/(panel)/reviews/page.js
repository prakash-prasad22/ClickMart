'use client';

import { Check, X, Trash2, BadgeCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageHeader, Panel, SearchInput, Tabs, useAdminList } from '@/components/admin/kit';
import { StatusBadge } from '@/components/ui/Badge';
import Img from '@/components/ui/Img';
import { Pagination, Rating, Skeleton } from '@/components/ui';
import { REVIEW_STATUS_TONE } from '@/lib/constants';
import { timeAgo } from '@/lib/utils';

export default function ReviewsPage() {
  const toast = useToast();
  const list = useAdminList('/admin/reviews', { status: 'pending', limit: 15 });
  const counts = list.data?.counts || {};

  const act = async (r, status) => {
    try {
      if (status === 'delete') {
        if (!window.confirm('Delete this review permanently?')) return;
        await api.del(`/admin/reviews/${r._id}`);
      } else {
        await api.patch(`/admin/reviews/${r._id}`, { status });
      }
      toast.success(status === 'delete' ? 'Review deleted' : `Review ${status}`);
      list.reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader title="Reviews" description="Approve customer reviews before they appear on product pages." />
      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-line/70 p-4">
          <Tabs value={list.params.status || ''} onChange={(status) => list.setParams({ status })}
            tabs={[{ value: 'pending', label: 'Pending', count: counts.pending || 0 }, { value: 'approved', label: 'Approved', count: counts.approved || 0 }, { value: 'rejected', label: 'Rejected', count: counts.rejected || 0 }, { value: '', label: 'All' }]} />
          <select className="input h-10 w-auto bg-white" value={list.params.rating || ''} onChange={(e) => list.setParams({ rating: e.target.value })}>
            <option value="">Any rating</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
          </select>
          <SearchInput value={list.params.q} onChange={(q) => list.setParams({ q })} placeholder="Search review text" className="w-full sm:ml-auto sm:w-64" />
        </div>

        <div className="divide-y divide-line/70">
          {list.loading && !list.data && [1, 2, 3].map((i) => <div key={i} className="p-5"><Skeleton className="h-20" /></div>)}
          {list.data?.items.map((r) => (
            <div key={r._id} className="flex flex-col gap-4 p-5 transition hover:bg-surface-alt/30 sm:flex-row">
              <div className="flex w-full shrink-0 items-start gap-3 sm:w-56">
                <Img src={r.product?.images?.[0]} alt="" className="h-14 w-12 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <a href={`/product/${r.product?.slug}`} target="_blank" rel="noreferrer" className="line-clamp-2 text-sm font-medium hover:text-primary">{r.product?.name || 'Deleted product'}</a>
                  <p className="mt-0.5 text-xs text-muted">{r.user?.name || r.user?.phone}</p>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <Rating value={r.rating} />
                  <StatusBadge status={r.status} tones={REVIEW_STATUS_TONE} />
                  {r.verifiedPurchase && <span className="inline-flex items-center gap-1 text-xs text-success"><BadgeCheck size={13} /> Verified</span>}
                  <span className="text-xs text-muted">{timeAgo(r.createdAt)}</span>
                </div>
                {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                {r.comment && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{r.comment}</p>}
              </div>
              <div className="flex shrink-0 items-start gap-1.5">
                {r.status !== 'approved' && <button type="button" onClick={() => act(r, 'approved')} className="btn btn-sm h-8 rounded-lg bg-success-soft px-3 text-success hover:bg-success hover:text-white"><Check size={14} /> Approve</button>}
                {r.status !== 'rejected' && <button type="button" onClick={() => act(r, 'rejected')} className="btn btn-outline btn-sm h-8 rounded-lg px-3"><X size={14} /> Reject</button>}
                <button type="button" onClick={() => act(r, 'delete')} className="btn btn-ghost btn-icon h-8 w-8 hover:text-danger" aria-label="Delete"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {!list.loading && !list.data?.items.length && <p className="py-14 text-center text-sm text-muted">No reviews here. 🎉</p>}
        </div>
        {list.data?.pages > 1 && <div className="border-t border-line/70 p-4"><Pagination page={list.data.page} pages={list.data.pages} onChange={list.setPage} /></div>}
      </Panel>
    </>
  );
}
