'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_SLIDES = [
  {
    _id: 'd1',
    eyebrow: 'New season',
    title: 'The Harvest Edit',
    subtitle: 'Hand-sorted almonds, cashews & walnuts — from the orchard to your doorstep in Patna.',
    ctaLabel: 'Shop dry fruits',
    link: '/shop',
  },
  {
    _id: 'd2',
    eyebrow: 'Handloom stories',
    title: 'Woven in Bihar',
    subtitle: 'Bhagalpuri Tussar & Madhubani sarees by master weavers.',
    ctaLabel: 'Explore sarees',
    link: '/shop',
  },
];

const INTERVAL = 6500;

// Decorative backdrop used when a banner has no image
function Backdrop({ index }) {
  const tones = [
    'radial-gradient(80% 90% at 85% 30%, rgb(var(--primary) / .55) 0%, transparent 60%), radial-gradient(60% 70% at 10% 100%, rgb(var(--accent) / .45) 0%, transparent 60%)',
    'radial-gradient(70% 80% at 80% 70%, rgb(var(--accent) / .55) 0%, transparent 60%), radial-gradient(60% 70% at 15% 10%, rgb(var(--primary) / .4) 0%, transparent 60%)',
  ];
  return (
    <div className="absolute inset-0 bg-ink">
      <div className="absolute inset-0" style={{ background: tones[index % tones.length] }} />
      <div className="absolute inset-0 bg-grain opacity-60 mix-blend-overlay" />
      <svg className="absolute -right-24 top-1/2 h-[140%] -translate-y-1/2 text-white/[0.06]" viewBox="0 0 200 200" fill="none" aria-hidden>
        {[90, 70, 50, 30].map((r) => <circle key={r} cx="100" cy="100" r={r} stroke="currentColor" strokeWidth="0.6" />)}
      </svg>
    </div>
  );
}

export default function HeroCarousel({ banners }) {
  const slides = banners?.length ? banners : DEFAULT_SLIDES;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const t = setTimeout(() => setActive((a) => (a + 1) % slides.length), INTERVAL);
    return () => clearTimeout(t);
  }, [active, paused, slides.length]);

  return (
    <section className="container pt-4" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative h-[560px] overflow-hidden rounded-[28px] sm:h-[600px]">
        {slides.map((s, i) => (
          <div
            key={s._id}
            className={cn('absolute inset-0 transition-opacity duration-1000 ease-quiet', i === active ? 'z-10 opacity-100' : 'z-0 opacity-0')}
            aria-hidden={i !== active}
          >
            {s.image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt="" className={cn('absolute inset-0 h-full w-full object-cover', i === active && 'animate-ken-burns')} />
                <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/35 to-transparent" />
              </>
            ) : (
              <Backdrop index={i} />
            )}

            <div className="relative flex h-full items-end p-8 sm:items-center sm:p-14 lg:p-20">
              {i === active && (
                <div className="max-w-xl text-white">
                  {s.eyebrow && <p className="eyebrow text-accent animate-fade-up">{s.eyebrow}</p>}
                  <h1 className="mt-4 font-display text-5xl font-light leading-[1.02] sm:text-7xl animate-fade-up" style={{ animationDelay: '80ms' }}>
                    {s.title}
                  </h1>
                  {s.subtitle && (
                    <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg animate-fade-up" style={{ animationDelay: '160ms' }}>
                      {s.subtitle}
                    </p>
                  )}
                  <div className="mt-8 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '240ms' }}>
                    <Link href={s.link || '/shop'} className="btn btn-lg bg-white text-ink hover:bg-white/90 group">
                      {s.ctaLabel || 'Shop now'}
                      <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {slides.length > 1 && (
          <div className="absolute bottom-6 right-6 z-20 flex gap-2 sm:bottom-10 sm:right-10">
            {slides.map((s, i) => (
              <button key={s._id} type="button" onClick={() => setActive(i)} className="group py-2" aria-label={`Go to slide ${i + 1}`}>
                <span className="block h-[3px] w-10 overflow-hidden rounded-full bg-white/30">
                  <span
                    key={`${active}-${paused}`}
                    className={cn('block h-full origin-left rounded-full bg-white', i === active ? '' : 'scale-x-0', i < active && 'scale-x-100')}
                    style={i === active && !paused ? { animation: `progress ${INTERVAL}ms linear both` } : i === active ? { transform: 'scaleX(1)' } : undefined}
                  />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
