'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Panel, ImageUploader } from './kit';
import { Button, Field, Switch } from '@/components/ui';
import { discountPct } from '@/lib/utils';

const EMPTY = {
  name: '', slug: '', shortDescription: '', description: '', category: '', brand: '', images: [],
  price: '', mrp: '', sku: '', stock: 0, lowStockThreshold: 5, variantLabel: 'Weight', variants: [],
  attributes: [], tags: [], isFeatured: false, isActive: true, seo: { title: '', description: '' },
};

const PRESETS = {
  'Weights (250g / 500g / 1kg)': { label: 'Weight', names: ['250 g', '500 g', '1 kg'] },
  'Saree colours': { label: 'Colour', names: ['Red', 'Maroon', 'Green'] },
};

export default function ProductForm({ id }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const hasVariants = form.variants.length > 0;

  useEffect(() => {
    api.get('/admin/categories', { limit: 200 }).then((r) => setCats(r.items)).catch(() => {});
    api.get('/admin/brands', { limit: 200 }).then((r) => setBrands(r.items)).catch(() => {});
    if (id) {
      api.get(`/admin/products/${id}`).then((p) => {
        setForm({ ...EMPTY, ...p, category: p.category || '', brand: p.brand || '', seo: { ...EMPTY.seo, ...(p.seo || {}) } });
        setLoading(false);
      }).catch((e) => toast.error(e.message));
    }
  }, [id, toast]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setVariant = (i, k, v) => setForm((f) => ({ ...f, variants: f.variants.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));
  const addVariant = (name = '') => setForm((f) => ({ ...f, variants: [...f.variants, { name, sku: '', price: f.price || '', mrp: f.mrp || '', stock: 0, isActive: true }] }));

  const applyPreset = (key) => {
    const p = PRESETS[key];
    setForm((f) => ({ ...f, variantLabel: p.label, variants: p.names.map((name) => ({ name, sku: '', price: '', mrp: '', stock: 0, isActive: true })) }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!hasVariants && (form.price === '' || form.price === null)) e.price = 'Price is required';
    form.variants.forEach((v, i) => {
      if (!v.name) e[`v${i}`] = 'Each variant needs a name';
      if (v.price === '' || v.price === null) e[`v${i}`] = 'Each variant needs a price';
    });
    setErrors(e);
    if (Object.keys(e).length) toast.error(Object.values(e)[0]);
    return !Object.keys(e).length;
  };

  const save = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const num = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));
    const payload = {
      ...form,
      price: hasVariants ? 0 : num(form.price),
      mrp: num(form.mrp),
      stock: num(form.stock) ?? 0,
      lowStockThreshold: num(form.lowStockThreshold) ?? 5,
      variants: form.variants.map((v) => ({ ...v, price: num(v.price), mrp: num(v.mrp), stock: num(v.stock) ?? 0 })),
      attributes: form.attributes.filter((a) => a.key && a.value),
    };
    delete payload._id; delete payload.createdAt; delete payload.updatedAt; delete payload.__v;
    delete payload.rating; delete payload.numReviews; delete payload.soldCount;
    try {
      if (id) {
        await api.put(`/admin/products/${id}`, payload);
        toast.success('Product saved');
      } else {
        const p = await api.post('/admin/products', payload);
        toast.success('Product created');
        router.replace(`/admin/products/${p._id}`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-96 skeleton rounded-2xl" />;

  return (
    <form onSubmit={save}>
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line/70 bg-admin-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div>
          <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"><ArrowLeft size={13} /> Products</Link>
          <h1 className="text-xl font-bold">{id ? form.name || 'Edit product' : 'New product'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {id && form.slug && <a href={`/product/${form.slug}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><ExternalLink size={14} /> View</a>}
          <Button type="submit" loading={saving} className="rounded-xl">{id ? 'Save changes' : 'Create product'}</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Basics">
            <div className="space-y-4">
              <Field label="Product name" error={errors.name}><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. California Almonds — Premium" /></Field>
              <Field label="Short description" hint="Shown near the price and in search results"><input className="input" value={form.shortDescription || ''} onChange={(e) => set('shortDescription', e.target.value)} /></Field>
              <Field label="Full description"><textarea className="input" rows={6} value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></Field>
            </div>
          </Panel>

          <Panel title="Images">
            <ImageUploader value={form.images} onChange={(v) => set('images', v)} />
            <p className="mt-2 text-xs text-muted">Drag to reorder. The first image is the cover; the second appears on hover in the store.</p>
          </Panel>

          <Panel
            title="Pricing & variants"
            action={!hasVariants && (
              <select className="input h-8 w-auto text-xs" value="" onChange={(e) => e.target.value && applyPreset(e.target.value)}>
                <option value="">Add variants from preset…</option>
                {Object.keys(PRESETS).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            )}
          >
            {!hasVariants ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Selling price (₹)" error={errors.price}><input type="number" min="0" step="any" className="input" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} /></Field>
                  <Field label="MRP (₹)" hint={discountPct(form.mrp, form.price) ? `${discountPct(form.mrp, form.price)}% off` : 'Optional'}><input type="number" min="0" step="any" className="input" value={form.mrp ?? ''} onChange={(e) => set('mrp', e.target.value)} /></Field>
                  <Field label="SKU"><input className="input" value={form.sku || ''} onChange={(e) => set('sku', e.target.value)} /></Field>
                  <Field label="Stock"><input type="number" min="0" className="input" value={form.stock ?? 0} onChange={(e) => set('stock', e.target.value)} /></Field>
                  <Field label="Low-stock alert at"><input type="number" min="0" className="input" value={form.lowStockThreshold ?? 5} onChange={(e) => set('lowStockThreshold', e.target.value)} /></Field>
                </div>
                <button type="button" onClick={() => addVariant()} className="text-sm font-medium text-primary hover:underline">+ This product has options (size, weight, colour…)</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Option name" hint="Shown to customers, e.g. Weight or Colour"><input className="input" value={form.variantLabel} onChange={(e) => set('variantLabel', e.target.value)} /></Field>
                  <Field label="Low-stock alert at (per variant)"><input type="number" min="0" className="input" value={form.lowStockThreshold ?? 5} onChange={(e) => set('lowStockThreshold', e.target.value)} /></Field>
                </div>
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="table-admin">
                    <thead><tr><th>{form.variantLabel || 'Option'}</th><th>Price ₹</th><th>MRP ₹</th><th>Stock</th><th>SKU</th><th>On</th><th /></tr></thead>
                    <tbody>
                      {form.variants.map((v, i) => (
                        <tr key={v._id || i} className={errors[`v${i}`] ? 'bg-danger-soft/40' : ''}>
                          <td><input className="input h-9 min-w-[100px]" value={v.name} onChange={(e) => setVariant(i, 'name', e.target.value)} placeholder="500 g" /></td>
                          <td><input type="number" min="0" step="any" className="input h-9 w-24" value={v.price ?? ''} onChange={(e) => setVariant(i, 'price', e.target.value)} /></td>
                          <td><input type="number" min="0" step="any" className="input h-9 w-24" value={v.mrp ?? ''} onChange={(e) => setVariant(i, 'mrp', e.target.value)} /></td>
                          <td><input type="number" min="0" className="input h-9 w-20" value={v.stock ?? 0} onChange={(e) => setVariant(i, 'stock', e.target.value)} /></td>
                          <td><input className="input h-9 w-28" value={v.sku || ''} onChange={(e) => setVariant(i, 'sku', e.target.value)} /></td>
                          <td><Switch checked={v.isActive !== false} onChange={(val) => setVariant(i, 'isActive', val)} /></td>
                          <td><button type="button" className="btn btn-ghost btn-icon h-8 w-8 hover:text-danger" onClick={() => set('variants', form.variants.filter((_, j) => j !== i))} aria-label="Remove variant"><Trash2 size={15} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={() => addVariant()} className="btn btn-outline btn-sm rounded-xl"><Plus size={14} /> Add variant</button>
              </div>
            )}
          </Panel>

          <Panel title="Specifications" action={<button type="button" className="text-xs font-semibold text-primary" onClick={() => set('attributes', [...form.attributes, { key: '', value: '' }])}>+ Add row</button>}>
            {form.attributes.length === 0 && <p className="text-sm text-muted">Add details like Fabric, Origin, Shelf life, Care…</p>}
            <div className="space-y-2">
              {form.attributes.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input h-9 w-40" value={a.key} placeholder="Fabric" onChange={(e) => set('attributes', form.attributes.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
                  <input className="input h-9" value={a.value} placeholder="Tussar silk" onChange={(e) => set('attributes', form.attributes.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                  <button type="button" className="btn btn-ghost btn-icon h-9 w-9 shrink-0 hover:text-danger" onClick={() => set('attributes', form.attributes.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Status">
            <div className="space-y-4">
              <Switch checked={form.isActive} onChange={(v) => set('isActive', v)} label={form.isActive ? 'Active — visible in store' : 'Draft — hidden from store'} />
              <Switch checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} label="Feature on home page" />
            </div>
          </Panel>

          <Panel title="Organisation">
            <div className="space-y-4">
              <Field label="Category">
                <select className="input" value={form.category || ''} onChange={(e) => set('category', e.target.value)}>
                  <option value="">Uncategorised</option>
                  {cats.map((c) => <option key={c._id} value={c._id}>{c.parent ? `— ${c.name}` : c.name}</option>)}
                </select>
              </Field>
              <Field label="Brand">
                <select className="input" value={form.brand || ''} onChange={(e) => set('brand', e.target.value)}>
                  <option value="">No brand</option>
                  {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Tags" hint="Press Enter to add — used in search">
                <div className="flex flex-wrap gap-1.5 rounded-xl border border-line p-2">
                  {form.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-2.5 py-0.5 text-xs">
                      {t}<button type="button" onClick={() => set('tags', form.tags.filter((x) => x !== t))} className="text-muted hover:text-danger" aria-label={`Remove ${t}`}>×</button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                        e.preventDefault();
                        const t = tagInput.trim().toLowerCase();
                        if (!form.tags.includes(t)) set('tags', [...form.tags, t]);
                        setTagInput('');
                      }
                    }}
                    className="min-w-[80px] flex-1 bg-transparent px-1 text-sm outline-none"
                    placeholder="almonds"
                  />
                </div>
              </Field>
            </div>
          </Panel>

          <Panel title="Search engine listing">
            <div className="space-y-4">
              <Field label="URL slug" hint="Leave blank to auto-generate"><input className="input" value={form.slug || ''} onChange={(e) => set('slug', e.target.value)} /></Field>
              <Field label="Meta title"><input className="input" value={form.seo?.title || ''} onChange={(e) => set('seo', { ...form.seo, title: e.target.value })} /></Field>
              <Field label="Meta description"><textarea className="input" rows={3} value={form.seo?.description || ''} onChange={(e) => set('seo', { ...form.seo, description: e.target.value })} /></Field>
            </div>
          </Panel>
        </div>
      </div>
    </form>
  );
}
