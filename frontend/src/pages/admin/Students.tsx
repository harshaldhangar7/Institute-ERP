import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner, Select, Pagination } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', mode: 'OFFLINE', batchId: '' });
  const [batches, setBatches] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students', { params: { page, limit, search } });
      setStudents(res.data.data?.students || res.data.data || []);
      setTotal(res.data.data?.total || 0);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await api.get('/admin/batches');
      setBatches(res.data.data?.batches || res.data.data || []);
    } catch {
      setBatches([]);
    }
  };

  useEffect(() => { fetchStudents(); }, [page, search]);
  useEffect(() => { fetchBatches(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/students/${editing.id}`, form);
        toast.success('Student updated');
      } else {
        await api.post('/auth/register', { ...form, role: 'STUDENT' });
        toast.success('Student created');
      }
      setModalOpen(false);
      setEditing(null);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving student');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Student deleted');
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting student');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', phone: '', mode: 'OFFLINE', batchId: '' });
    setModalOpen(true);
  };

  const openEdit = (student: any) => {
    setEditing(student);
    setForm({
      name: student.user?.name || student.name || '',
      email: student.user?.email || student.email || '',
      password: '',
      phone: student.user?.phone || '',
      mode: student.mode || 'OFFLINE',
      batchId: student.batchId || '',
    });
    setModalOpen(true);
  };

  const columns = [
    { key: 'name', header: 'Name', render: (item: any) => item.user?.name || item.name || '-' },
    { key: 'email', header: 'Email', render: (item: any) => item.user?.email || item.email || '-' },
    { key: 'mode', header: 'Mode', render: (item: any) => item.mode || '-' },
    { key: 'batch', header: 'Batch', render: (item: any) => item.batch?.name || '-' },
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
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <Button onClick={openCreate}>Add Student</Button>
      </div>

      <Input
        placeholder="Search students..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
      />

      {loading ? <Spinner /> : (
        <>
          <Table columns={columns} data={students} />
          <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          {!editing && <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />}
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Mode" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} options={[{ value: 'ONLINE', label: 'Online' }, { value: 'OFFLINE', label: 'Offline' }]} />
          <Select label="Batch" value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} options={batches.map((b: any) => ({ value: b.id, label: b.name }))} />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
