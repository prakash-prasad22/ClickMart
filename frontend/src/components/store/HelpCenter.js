'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Accordion from './Accordion';
import { cn } from '@/lib/utils';

export default function HelpCenter({ articles }) {
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState('All');
  const topics = useMemo(() => ['All', ...new Set(articles.map((a) => a.topic))], [articles]);

  const filtered = articles.filter(
    (a) => (topic === 'All' || a.topic === topic) && (!q || `${a.title} ${a.body}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="mx-auto mt-10 max-w-3xl">
      <div className="relative">
        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for answers…" className="input h-14 rounded-full pl-12 text-base" />
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {topics.map((t) => (
          <button key={t} type="button" onClick={() => setTopic(t)} className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition', topic === t ? 'bg-ink text-white' : 'bg-ink/5 hover:bg-ink/10')}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-10">
        {filtered.length ? (
          <Accordion key={`${topic}${q}`} defaultOpen={-1} items={filtered.map((a) => ({ title: a.title, content: <p className="whitespace-pre-line">{a.body}</p> }))} />
        ) : (
          <p className="py-10 text-center text-muted">No articles match your search.</p>
        )}
      </div>
    </div>
  );
}
