'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, ImagePlus, X, Loader2, GripVertical } from 'lucide-react';
import { api, uploadImages } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import Img from '@/components/ui/Img';
import { Button, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

export function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, className, children, bodyClassName }) {
  return (
    <section className={cn('rounded-2xl border border-line/70 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.03)]', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-4">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className={cn(bodyClassName ?? 'p-5')}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, change, hint, icon: Icon, tone = 'primary' }) {
  const up = change > 0;
  const tones = { primary: 'bg-primary-soft text-primary', info: 'bg-info-soft text-info', success: 'bg-success-soft text-success', accent: 'bg-accent-soft text-accent' };
  return (
    <div className="rounded-2xl border border-line/70 bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {Icon && <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tones[tone])}><Icon size={17} /></span>}
      </div>
      <p className="mt-3 text-[28px] font-bold leading-none tracking-tight tabular-nums">{value}</p>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {change !== null && change !== undefined && (
          <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold', up ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change)}%
          </span>
        )}
        {hint && <span className="text-muted">{hint}</span>}
      </div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  const [v, setV] = useState(value || '');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    const t = setTimeout(() => onChange(v), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);
  return (
    <div className={cn('relative', className)}>
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} className="input h-10 bg-white pl-10" />
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-ink/[0.04] p-1 scrollbar-none">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cn('flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200', value === t.value ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}
        >
          {t.label}
          {t.count !== undefined && <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', value === t.value ? 'bg-ink/[0.06]' : 'bg-transparent')}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Generic data-fetch hook for admin lists */
export function useAdminList(endpoint, initialParams = {}) {
  const [params, setParams] = useState({ page: 1, ...initialParams });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const key = JSON.stringify(params);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.get(endpoint, JSON.parse(key)));
    } catch (e) {
      toast?.error(e.message);
      setData((d) => d || { items: [], total: 0, page: 1, pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [endpoint, key, toast]);

  useEffect(() => { load(); }, [load]);

  const update = useCallback((patch) => setParams((p) => ({ ...p, page: 1, ...patch })), []);
  return { data, loading, params, setParams: update, setPage: (page) => setParams((p) => ({ ...p, page })), reload: load };
}

export function DataTable({ columns, rows, loading, onRowClick, empty = 'Nothing to show yet', rowKey = '_id' }) {
  return (
    <div className="overflow-x-auto">
      <table className="table-admin">
        <thead>
          <tr>{columns.map((c) => <th key={c.key || c.label} className={c.className}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {loading && !rows?.length
            ? [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>{columns.map((c) => <td key={c.key || c.label}><Skeleton className="h-4 w-full max-w-[140px]" /></td>)}</tr>
              ))
            : rows?.map((row, i) => (
                <tr
                  key={row[rowKey] || i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && 'cursor-pointer', loading && 'opacity-60')}
                >
                  {columns.map((c) => <td key={c.key || c.label} className={c.className}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && !rows?.length && <p className="py-14 text-center text-sm text-muted">{empty}</p>}
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Delete', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <p className="text-sm text-muted">{message || 'This action cannot be undone.'}</p>
    </Modal>
  );
}

/** Upload + order + remove images. value: string[] (or string when single) */
export function ImageUploader({ value, onChange, multiple = true, max = 8 }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [drag, setDrag] = useState(null);
  const list = multiple ? value || [] : value ? [value] : [];
  const emit = (arr) => onChange(multiple ? arr : arr[0] || '');

  const upload = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const urls = await uploadImages(files);
      emit(multiple ? [...list, ...urls].slice(0, max) : urls.slice(0, 1));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const move = (from, to) => {
    const arr = [...list];
    const [x] = arr.splice(from, 1);
    arr.splice(to, 0, x);
    emit(arr);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {list.map((src, i) => (
          <div
            key={src + i}
            draggable={multiple}
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (drag !== null && drag !== i) move(drag, i); setDrag(null); }}
            className="group relative h-24 w-24 overflow-hidden rounded-xl border border-line"
          >
            <Img src={src} alt="" className="h-full w-full" />
            {i === 0 && multiple && <span className="absolute bottom-1 left-1 rounded bg-ink/70 px-1.5 text-[10px] font-medium text-white">Cover</span>}
            {multiple && <GripVertical size={14} className="absolute left-1 top-1 cursor-grab text-white opacity-0 drop-shadow transition group-hover:opacity-100" />}
            <button type="button" onClick={() => emit(list.filter((_, j) => j !== i))} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition group-hover:opacity-100" aria-label="Remove image">
              <X size={13} />
            </button>
          </div>
        ))}
        {list.length < (multiple ? max : 1) && (
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
            className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-xs text-muted transition hover:border-primary hover:text-primary"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            {busy ? 'Uploading' : 'Upload'}
            <input type="file" accept="image/*" multiple={multiple} className="hidden" onChange={(e) => upload(e.target.files)} />
          </label>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" className="input h-9 text-xs" />
        <button type="button" className="btn btn-outline btn-sm h-9 shrink-0" onClick={() => { if (url.trim()) { emit(multiple ? [...list, url.trim()] : [url.trim()]); setUrl(''); } }}>Add</button>
      </div>
    </div>
  );
}
