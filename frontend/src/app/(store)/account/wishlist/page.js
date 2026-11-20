'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/store/ProductCard';
import { EmptyState, Skeleton } from '@/components/ui';

export default function WishlistPage() {
  const { wishlist } = useAuth();
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.get('/account/wishlist').then((r) => setItems(r.items)).catch(() => setItems([]));
  }, []);

  if (!items) return <div className="grid grid-cols-2 gap-6 md:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />)}</div>;
  const visible = items.filter((p) => wishlist.includes(String(p._id)));
  if (!visible.length) {
    return <EmptyState icon={Heart} title="Your wishlist is empty" description="Tap the heart on any product to save it for later." action={<Link href="/shop" className="btn btn-primary">Discover products</Link>} />;
  }
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
      {visible.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}
