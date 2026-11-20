'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Accordion({ items, defaultOpen = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => (
        <div key={item.title}>
          <button type="button" onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between py-5 text-left font-medium transition hover:text-primary" aria-expanded={open === i}>
            {item.title}
            <Plus size={18} className={cn('transition-transform duration-500 ease-quiet', open === i && 'rotate-45')} />
          </button>
          <div className={cn('grid transition-all duration-500 ease-quiet', open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
            <div className="overflow-hidden">
              <div className="pb-6 text-sm leading-relaxed text-ink-soft">{item.content}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
