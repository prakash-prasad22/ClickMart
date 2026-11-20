'use client';

import { useState } from 'react';
import Img from '@/components/ui/Img';
import { cn } from '@/lib/utils';

export default function ProductGallery({ images = [], name }) {
  const list = images.length ? images : [null];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ on: true, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {list.length > 1 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-none md:w-20 md:flex-col">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn('w-16 shrink-0 overflow-hidden rounded-xl ring-offset-2 ring-offset-bg transition md:w-full', i === active ? 'ring-2 ring-ink' : 'opacity-60 hover:opacity-100')}
              aria-label={`View image ${i + 1}`}
            >
              <Img src={src} alt="" fallbackLabel={name} className="aspect-[4/5]" />
            </button>
          ))}
        </div>
      )}
      <div
        className="relative flex-1 cursor-zoom-in overflow-hidden rounded-[24px] bg-surface-alt"
        onMouseMove={list[active] ? onMove : undefined}
        onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
      >
        <div key={active} className="aspect-[4/5] animate-fade-in">
          <Img
            src={list[active]}
            alt={name}
            eager
            fallbackLabel={name}
            className="h-full w-full"
            imgClassName="transition-transform duration-300 ease-out"
            style={zoom.on ? { transform: 'scale(1.6)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
