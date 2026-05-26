import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function AdminModules() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', duration: '' });

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/modules');
      setModules(res.data.data?.modules || res.data.data || []);
    } catch {
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModules(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, duration: form.duration ? Number(form.duration) : undefined };
      if (editing) {
        await api.put(`/admin/modules/${editing.id}`, payload);
        toast.success('Module updated');
      } else {
        await api.post('/admin/modules', payload);
        toast.success('Module created');
      }
      setModalOpen(false);
      setEditing(null);
      fetchModules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving module');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this module?')) return;
    try {
      await api.delete(`/admin/modules/${id}`);
      toast.success('Module deleted');
      fetchModules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting module');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', duration: '' });
    setModalOpen(true);
  };

  const openEdit = (mod: any) => {
    setEditing(mod);
    setForm({ name: mod.name || '', description: mod.description || '', duration: mod.duration?.toString() || '' });
    setModalOpen(true);
  };

  const columns = [
    { key: 'name', header: 'Name', render: (item: any) => item.name },
    { key: 'description', header: 'Description', render: (item: any) => item.description || '-' },
    { key: 'duration', header: 'Duration (hrs)', render: (item: any) => item.duration || '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Modules</h1>
        <Button onClick={openCreate}>Add Module</Button>
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={modules} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Module' : 'Add Module'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Duration (hours)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
