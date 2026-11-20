'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { Rating, StarInput, Button } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function Reviews({ product, reviews, distribution }) {
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });
  const [saving, setSaving] = useState(false);
  const total = Object.values(distribution || {}).reduce((a, b) => a + b, 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.rating) return toast.error('Please choose a star rating');
    setSaving(true);
    try {
      await api.post('/reviews', { product: product._id, ...form });
      toast.success('Thank you! Your review will appear once approved.');
      setOpen(false);
      setForm({ rating: 0, title: '', comment: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="reviews" className="grid gap-12 lg:grid-cols-[320px_1fr]">
      <div>
        <h2 className="section-title">Reviews</h2>
        <div className="mt-6 flex items-end gap-3">
          <span className="font-display text-6xl font-light">{product.rating?.toFixed(1) || '0.0'}</span>
          <div className="pb-2">
            <Rating value={product.rating} size={16} />
            <p className="mt-1 text-xs text-muted">{product.numReviews} reviews</p>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          {[5, 4, 3, 2, 1].map((n) => (
            <div key={n} className="flex items-center gap-3 text-xs">
              <span className="w-3 text-muted">{n}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-accent" style={{ width: `${total ? (distribution[n] / total) * 100 : 0}%` }} />
              </div>
              <span className="w-6 text-right text-muted">{distribution?.[n] || 0}</span>
            </div>
          ))}
        </div>
        {user ? (
          <Button variant="outline" className="mt-8 w-full" onClick={() => setOpen(true)}>Write a review</Button>
        ) : (
          <Link href={`/login?next=/product/${product.slug}`} className="btn btn-outline mt-8 w-full">Sign in to review</Link>
        )}
      </div>

      <div className="divide-y divide-line">
        {reviews.length === 0 && <p className="py-6 text-muted">No reviews yet. Be the first to share your thoughts.</p>}
        {reviews.map((r) => (
          <article key={r._id} className="py-6 first:pt-0">
            <div className="flex items-center justify-between gap-4">
              <Rating value={r.rating} />
              <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
            </div>
            {r.title && <h3 className="mt-3 font-medium">{r.title}</h3>}
            {r.comment && <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{r.comment}</p>}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
              {r.user?.name}
              {r.verifiedPurchase && <span className="inline-flex items-center gap-1 text-success"><BadgeCheck size={13} /> Verified purchase</span>}
            </p>
          </article>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Write a review" description={product.name}>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label">Your rating</label>
            <StarInput value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Sum it up in a few words" maxLength={120} />
          </div>
          <div>
            <label className="label">Review</label>
            <textarea className="input" rows={4} value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="What did you like or dislike?" />
          </div>
          <Button type="submit" loading={saving} className="w-full">Submit review</Button>
        </form>
      </Modal>
    </section>
  );
}
