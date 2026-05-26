import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function AdminTrainers() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', specialization: '' });

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/trainers');
      setTrainers(res.data.data?.trainers || res.data.data || []);
    } catch {
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrainers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/trainers/${editing.id}`, form);
        toast.success('Trainer updated');
      } else {
        await api.post('/auth/register', { ...form, role: 'TRAINER' });
        toast.success('Trainer created');
      }
      setModalOpen(false);
      setEditing(null);
      fetchTrainers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving trainer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trainer?')) return;
    try {
      await api.delete(`/admin/trainers/${id}`);
      toast.success('Trainer deleted');
      fetchTrainers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting trainer');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', phone: '', specialization: '' });
    setModalOpen(true);
  };

  const openEdit = (trainer: any) => {
    setEditing(trainer);
    setForm({
      name: trainer.user?.name || '',
      email: trainer.user?.email || '',
      password: '',
      phone: trainer.user?.phone || '',
      specialization: trainer.specialization || '',
    });
    setModalOpen(true);
  };

  const columns = [
    { key: 'name', header: 'Name', render: (item: any) => item.user?.name || item.name || '-' },
    { key: 'email', header: 'Email', render: (item: any) => item.user?.email || item.email || '-' },
    { key: 'specialization', header: 'Specialization', render: (item: any) => item.specialization || '-' },
    { key: 'batches', header: 'Batches', render: (item: any) => item.batches?.length || 0 },
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
        <h1 className="text-2xl font-bold text-gray-900">Trainers</h1>
        <Button onClick={openCreate}>Add Trainer</Button>
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={trainers} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Trainer' : 'Add Trainer'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          {!editing && <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />}
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
