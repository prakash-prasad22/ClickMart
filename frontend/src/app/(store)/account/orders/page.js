'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/Badge';
import Img from '@/components/ui/Img';
import { EmptyState, Pagination, Skeleton } from '@/components/ui';
import { ORDER_STATUS_TONE } from '@/lib/constants';
import { formatDate, formatPrice } from '@/lib/utils';

export default function OrdersPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/orders', { page }).then(setData).catch(() => setData({ items: [] }));
  }, [page]);

  if (!data) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>;
  if (!data.items.length) {
    return <EmptyState icon={Package} title="No orders yet" description="When you place an order, it will show up here." action={<Link href="/shop" className="btn btn-primary">Start shopping</Link>} />;
  }

  return (
    <div className="space-y-4">
      {data.items.map((o, i) => (
        <Link key={o._id} href={`/account/orders/${o._id}`} className="group card block p-5 transition duration-300 hover:shadow-soft animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{o.orderNumber}</p>
              <p className="text-xs text-muted">Placed {formatDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={o.status} tones={ORDER_STATUS_TONE} />
              <span className="font-semibold">{formatPrice(o.total)}</span>
              <ChevronRight size={18} className="text-muted transition group-hover:translate-x-1" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {o.items.slice(0, 5).map((it) => <Img key={`${it.product}${it.variantId}`} src={it.image} alt={it.name} className="h-16 w-14 rounded-lg" />)}
            {o.items.length > 5 && <span className="flex h-16 w-14 items-center justify-center rounded-lg bg-surface-alt text-xs text-muted">+{o.items.length - 5}</span>}
          </div>
        </Link>
      ))}
      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </div>
  );
}
