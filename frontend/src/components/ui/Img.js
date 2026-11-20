'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Warm, deterministic placeholder palettes (used when an image is missing).
const TINTS = [
  ['#F4E7D7', '#E9D3B8', '#A87D3C'],
  ['#F3E3DD', '#E6C7BC', '#9C4A32'],
  ['#E8EBDF', '#D3D9C2', '#5E6B45'],
  ['#EFE6EF', '#DCCADC', '#7A4E7A'],
  ['#E4EAF0', '#CBD6E1', '#3F5D7A'],
];

function hash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Placeholder({ label = '', className }) {
  const [a, b, fg] = TINTS[hash(label) % TINTS.length];
  const letter = (label.trim()[0] || 'C').toUpperCase();
  return (
    <div
      className={cn('relative flex h-full w-full items-center justify-center overflow-hidden', className)}
      style={{ background: `radial-gradient(120% 90% at 30% 20%, ${a} 0%, ${b} 100%)` }}
      aria-hidden
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.12]" preserveAspectRatio="none">
        <defs>
          <pattern id={`p${hash(label)}`} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="22" stroke={fg} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#p${hash(label)})`} />
      </svg>
      <span className="relative font-display text-[clamp(2.5rem,9vw,5rem)] font-light italic" style={{ color: fg, opacity: 0.55 }}>
        {letter}
      </span>
    </div>
  );
}

/** Lazy image with a soft fade-in and a designed fallback. */
export default function Img({ src, alt = '', className, imgClassName, fallbackLabel, eager = false, ...rest }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef(null);

  // Images served from cache can finish loading before hydration attaches onLoad.
  useEffect(() => {
    setFailed(false);
    const el = ref.current;
    setLoaded(!!(el && el.complete && el.naturalWidth));
  }, [src]);

  if (!src || failed) {
    return (
      <div className={cn('overflow-hidden', className)}>
        <Placeholder label={fallbackLabel || alt} />
      </div>
    );
  }
  return (
    <div className={cn('overflow-hidden bg-surface-alt', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn('h-full w-full object-cover transition-opacity duration-700 ease-quiet', loaded ? 'opacity-100' : 'opacity-0', imgClassName)}
        {...rest}
      />
    </div>
  );
}
