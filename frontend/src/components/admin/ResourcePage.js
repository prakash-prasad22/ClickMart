'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Drawer } from '@/components/ui/Modal';
import { Button, Field, Switch, Pagination } from '@/components/ui';
import { PageHeader, Panel, SearchInput, DataTable, ConfirmDialog, ImageUploader, useAdminList } from './kit';

/** Load <select> options from another admin endpoint */
function useOptions(fields) {
  const [opts, setOpts] = useState({});
  useEffect(() => {
    fields.filter((f) => f.optionsFrom).forEach(async (f) => {
      try {
        const res = await api.get(f.optionsFrom.endpoint, { limit: 200 });
        setOpts((o) => ({ ...o, [f.name]: res.items.map((x) => ({ value: x._id, label: x[f.optionsFrom.labelKey || 'name'] })) }));
      } catch { /* ignore */ }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return opts;
}

const toDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export function FieldInput({ field, value, onChange, options }) {
  const opts = field.options || options || [];
  switch (field.type) {
    case 'textarea':
      return <textarea className="input" rows={field.rows || 4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
    case 'number':
      return <input type="number" className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} min={field.min} step={field.step || 'any'} placeholder={field.placeholder} />;
    case 'switch':
      return <Switch checked={!!value} onChange={onChange} label={field.switchLabel} />;
    case 'select':
      return (
        <select className="input" value={value?._id || value || ''} onChange={(e) => onChange(e.target.value || null)}>
          {field.placeholder !== false && <option value="">{field.placeholder || 'Select…'}</option>}
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'multiselect': {
      const vals = (value || []).map((v) => String(v?._id || v));
      return (
        <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-xl border border-line p-2">
          {opts.length === 0 && <span className="p-1 text-xs text-muted">No options</span>}
          {opts.map((o) => {
            const on = vals.includes(String(o.value));
            return (
              <button key={o.value} type="button" onClick={() => onChange(on ? vals.filter((v) => v !== String(o.value)) : [...vals, String(o.value)])}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${on ? 'border-primary bg-primary-soft text-primary-deep' : 'border-line hover:border-ink/30'}`}>
                {o.label}
              </button>
            );
          })}
        </div>
      );
    }
    case 'date':
      return <input type="date" className="input" value={toDateInput(value)} onChange={(e) => onChange(e.target.value || null)} />;
    case 'image':
      return <ImageUploader value={value} onChange={onChange} multiple={false} />;
    case 'images':
      return <ImageUploader value={value} onChange={onChange} multiple />;
    case 'password':
      return <input type="password" className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} autoComplete="new-password" placeholder={field.placeholder} />;
    default:
      return <input type={field.type || 'text'} className="input" value={value ?? ''} onChange={(e) => onChange(field.uppercase ? e.target.value.toUpperCase() : e.target.value)} placeholder={field.placeholder} />;
  }
}

/**
 * Config-driven CRUD screen: searchable table + slide-over form.
 * Used for categories, brands, offers, coupons, banners, help content and team.
 */
export default function ResourcePage({
  title, description, endpoint, columns, fields, defaults = {}, filters = [], searchPlaceholder, singular = 'item',
  toggleField = 'isActive', transform = (d) => d, canDelete = true,
}) {
  const toast = useToast();
  const list = useAdminList(endpoint, { limit: 20 });
  const options = useOptions(fields);
  const [editing, setEditing] = useState(null); // null | {} (new) | doc
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const open = (doc) => {
    setEditing(doc || {});
    setErrors({});
    setForm(doc ? { ...doc } : { ...defaults });
  };

  const visibleFields = fields.filter((f) => !f.showIf || f.showIf(form, !editing?._id));

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    visibleFields.forEach((f) => {
      const required = typeof f.required === 'function' ? f.required(!editing?._id) : f.required;
      if (required && (form[f.name] === undefined || form[f.name] === null || form[f.name] === '')) errs[f.name] = 'Required';
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const payload = transform(Object.fromEntries(fields.map((f) => [f.name, form[f.name]]).filter(([, v]) => v !== undefined)), !editing?._id);
      if (editing?._id) await api.put(`${endpoint}/${editing._id}`, payload);
      else await api.post(endpoint, payload);
      toast.success(`${singular[0].toUpperCase()}${singular.slice(1)} saved`);
      setEditing(null);
      list.reload();
    } catch (err) {
      toast.error(err.message);
      if (err.data?.details) setErrors(err.data.details);
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (row) => {
    try {
      await api.patch(`${endpoint}/${row._id}`, { [toggleField]: !row[toggleField] });
      list.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    setBusyDelete(true);
    try {
      await api.del(`${endpoint}/${deleting._id}`);
      toast.success('Deleted');
      setDeleting(null);
      list.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyDelete(false);
    }
  };

  const tableColumns = [
    ...columns,
    toggleField && {
      key: '_toggle',
      label: 'Active',
      render: (row) => <div onClick={(e) => e.stopPropagation()}><Switch checked={!!row[toggleField]} onChange={() => quickToggle(row)} /></div>,
    },
    {
      key: '_actions',
      label: '',
      className: 'text-right w-24',
      render: (row) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn btn-ghost btn-icon h-8 w-8" onClick={() => open(row)} aria-label="Edit"><Pencil size={15} /></button>
          {canDelete && <button type="button" className="btn btn-ghost btn-icon h-8 w-8 hover:text-danger" onClick={() => setDeleting(row)} aria-label="Delete"><Trash2 size={15} /></button>}
        </div>
      ),
    },
  ].filter(Boolean);

  return (
    <>
      <PageHeader title={title} description={description} actions={<Button onClick={() => open(null)} className="rounded-xl"><Plus size={16} /> Add {singular}</Button>} />
      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-line/70 p-4">
          <SearchInput value={list.params.q} onChange={(q) => list.setParams({ q })} placeholder={searchPlaceholder || `Search ${title.toLowerCase()}…`} className="w-full sm:w-72" />
          {filters.map((f) => (
            <select key={f.name} className="input h-10 w-auto bg-white" value={list.params[f.name] || ''} onChange={(e) => list.setParams({ [f.name]: e.target.value })}>
              <option value="">{f.label}</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
          <span className="ml-auto text-xs text-muted">{list.data?.total ?? 0} total</span>
        </div>
        <DataTable columns={tableColumns} rows={list.data?.items} loading={list.loading} onRowClick={open} empty={`No ${title.toLowerCase()} yet — add your first ${singular}.`} />
        {list.data?.pages > 1 && <div className="border-t border-line/70 p-4"><Pagination page={list.data.page} pages={list.data.pages} onChange={list.setPage} /></div>}
      </Panel>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?._id ? `Edit ${singular}` : `New ${singular}`}
        width="max-w-lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button form="resource-form" type="submit" loading={saving} className="rounded-xl">Save</Button>
          </div>
        }
      >
        <form id="resource-form" onSubmit={save} className="grid grid-cols-2 gap-4 p-6">
          {visibleFields.map((f) => (
            <Field key={f.name} label={f.label} hint={f.hint} error={errors[f.name]} className={f.half ? 'col-span-2 sm:col-span-1' : 'col-span-2'}>
              <FieldInput field={f} value={form[f.name]} options={options[f.name]} onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))} />
            </Field>
          ))}
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busyDelete}
        title={`Delete ${singular}?`}
        message={`“${deleting?.name || deleting?.title || deleting?.code || ''}” will be permanently removed.`}
      />
    </>
  );
}
