import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function AdminCounsellors() {
  const [counsellors, setCounsellors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  const fetchCounsellors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/counsellors');
      setCounsellors(res.data.data?.counsellors || res.data.data || []);
    } catch {
      setCounsellors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCounsellors(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/counsellors/${editing.id}`, form);
        toast.success('Counsellor updated');
      } else {
        await api.post('/auth/register', { ...form, role: 'COUNSELLOR' });
        toast.success('Counsellor created');
      }
      setModalOpen(false);
      setEditing(null);
      fetchCounsellors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving counsellor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this counsellor?')) return;
    try {
      await api.delete(`/admin/counsellors/${id}`);
      toast.success('Counsellor deleted');
      fetchCounsellors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting counsellor');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (counsellor: any) => {
    setEditing(counsellor);
    setForm({
      name: counsellor.user?.name || '',
      email: counsellor.user?.email || '',
      password: '',
      phone: counsellor.user?.phone || '',
    });
    setModalOpen(true);
  };

  const columns = [
    { key: 'name', header: 'Name', render: (item: any) => item.user?.name || item.name || '-' },
    { key: 'email', header: 'Email', render: (item: any) => item.user?.email || item.email || '-' },
    { key: 'students', header: 'Students Assigned', render: (item: any) => item.students?.length || 0 },
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
        <h1 className="text-2xl font-bold text-gray-900">Counsellors</h1>
        <Button onClick={openCreate}>Add Counsellor</Button>
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={counsellors} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Counsellor' : 'Add Counsellor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          {!editing && <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />}
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
