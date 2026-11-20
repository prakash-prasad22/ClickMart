'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Single-series area chart with crosshair tooltip.
 * One series → no legend (the panel title names it); colour = brand primary.
 */
export function AreaChart({ data, valueKey = 'revenue', labelKey = 'date', format = (v) => v, formatLabel = (l) => l, height = 240, secondary }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [W, setW] = useState(800);

  // Draw at the real pixel width so text and strokes never stretch
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [data.length > 0]);
  const H = height;
  const pad = { t: 16, r: 12, b: 28, l: 48 };

  const { points, max, ticks } = useMemo(() => {
    const vals = data.map((d) => d[valueKey] || 0);
    const rawMax = Math.max(1, ...vals);
    const mag = 10 ** Math.floor(Math.log10(rawMax));
    const niceMax = Math.ceil(rawMax / mag) * mag;
    const pts = data.map((d, i) => ({
      x: pad.l + (data.length === 1 ? 0.5 : i / (data.length - 1)) * (W - pad.l - pad.r),
      y: pad.t + (1 - (d[valueKey] || 0) / niceMax) * (H - pad.t - pad.b),
      d,
    }));
    return { points: pts, max: niceMax, ticks: [0, 0.25, 0.5, 0.75, 1].map((f) => f * niceMax) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, valueKey, H, W]);

  if (!data.length) return <div ref={wrapRef} className="flex items-center justify-center text-sm text-muted" style={{ height }}>No data for this period</div>;

  // Smooth path (monotone-ish cubic)
  const line = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = arr[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
  }, '');
  const area = `${line} L${points.at(-1).x},${H - pad.b} L${points[0].x},${H - pad.b} Z`;

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    points.forEach((p, i) => { if (Math.abs(p.x - x) < Math.abs(points[best].x - x)) best = i; });
    setHover(best);
  };

  const labelEvery = Math.ceil(data.length / Math.max(3, Math.floor(W / 110)));
  const hp = hover !== null ? points[hover] : null;

  return (
    <div ref={wrapRef} className="relative">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.22" />
            <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => {
          const y = pad.t + (1 - t / max) * (H - pad.t - pad.b);
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="rgb(var(--line))" strokeDasharray={t ? '3 4' : undefined} vectorEffect="non-scaling-stroke" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">{format(t, true)}</text>
            </g>
          );
        })}
        <path d={area} fill="url(#areaFill)" />
        <path d={line} fill="none" stroke="rgb(var(--primary))" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        {points.map((p, i) => i % labelEvery === 0 && (
          <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="11" fill="rgb(var(--muted))">{formatLabel(p.d[labelKey])}</text>
        ))}
        {hp && (
          <g>
            <line x1={hp.x} x2={hp.x} y1={pad.t} y2={H - pad.b} stroke="rgb(var(--ink) / 0.25)" vectorEffect="non-scaling-stroke" />
            <circle cx={hp.x} cy={hp.y} r="5" fill="rgb(var(--primary))" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </g>
        )}
      </svg>
      {hp && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[130px] -translate-x-1/2 rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lift"
          style={{ left: `${Math.min(88, Math.max(12, (hp.x / W) * 100))}%` }}
        >
          <p className="text-muted">{formatLabel(hp.d[labelKey], true)}</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">{format(hp.d[valueKey])}</p>
          {secondary && <p className="text-muted">{secondary(hp.d)}</p>}
        </div>
      )}
    </div>
  );
}

/** Horizontal bar list — magnitude by length, one hue. */
export function BarList({ items, format = (v) => v, valueKey = 'value', labelKey = 'label', sub }) {
  const max = Math.max(1, ...items.map((i) => i[valueKey] || 0));
  if (!items.length) return <p className="py-6 text-center text-sm text-muted">No data yet</p>;
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it[labelKey]} className="group" title={`${it[labelKey]}: ${format(it[valueKey])}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate font-medium text-ink">{it[labelKey]}</span>
            <span className="shrink-0 tabular-nums text-ink-soft">{format(it[valueKey])}{sub && <span className="ml-1.5 text-muted">{sub(it)}</span>}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink/[0.05]">
            <div className={cn('h-full rounded-full bg-primary transition-all duration-700 ease-quiet group-hover:bg-primary-deep')} style={{ width: `${((it[valueKey] || 0) / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
