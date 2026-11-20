'use client';

import { useEffect, useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import AddressForm, { AddressCard } from '@/components/store/AddressForm';
import { Button, EmptyState, Skeleton } from '@/components/ui';

export default function AddressesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/account/addresses').then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  const save = async (form) => {
    setSaving(true);
    try {
      if (editing === 'new') await api.post('/account/addresses', form);
      else await api.put(`/account/addresses/${editing._id}`, form);
      toast.success('Address saved');
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm('Delete this address?')) return;
    await api.del(`/account/addresses/${a._id}`).catch((e) => toast.error(e.message));
    load();
  };

  const makeDefault = async (a) => {
    await api.put(`/account/addresses/${a._id}`, { isDefault: true }).catch((e) => toast.error(e.message));
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Saved addresses</h2>
        <Button size="sm" onClick={() => setEditing('new')}><Plus size={15} /> Add address</Button>
      </div>
      {list === null ? (
        <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      ) : list.length === 0 ? (
        <EmptyState icon={MapPin} title="No saved addresses" description="Add an address for faster checkout." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((a) => (
            <AddressCard
              key={a._id}
              address={a}
              actions={
                <>
                  <button type="button" className="font-medium text-primary hover:underline" onClick={() => setEditing(a)}>Edit</button>
                  {!a.isDefault && <button type="button" className="text-muted hover:text-ink" onClick={() => makeDefault(a)}>Set default</button>}
                  <button type="button" className="text-muted hover:text-danger" onClick={() => remove(a)}>Delete</button>
                </>
              }
            />
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add address' : 'Edit address'} size="lg">
        {editing && (
          <AddressForm initial={editing === 'new' ? null : editing} onSubmit={save} saving={saving} onCancel={() => setEditing(null)} defaultName={user?.name} defaultPhone={user?.phone} />
        )}
      </Modal>
    </div>
  );
}
