import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner, Select, MultiSelect } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', trainerId: '', moduleIds: [] as string[], status: 'ACTIVE' });

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/batches');
      setBatches(res.data.data?.batches || res.data.data || []);
    } catch {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const res = await api.get('/admin/trainers');
      setTrainers(res.data.data?.trainers || res.data.data || []);
    } catch {
      setTrainers([]);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await api.get('/admin/modules');
      setModules(res.data.data?.modules || res.data.data || []);
    } catch {
      setModules([]);
    }
  };

  useEffect(() => { fetchBatches(); fetchTrainers(); fetchModules(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/batches/${editing.id}`, form);
        toast.success('Batch updated');
      } else {
        await api.post('/admin/batches', form);
        toast.success('Batch created');
      }
      setModalOpen(false);
      setEditing(null);
      fetchBatches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving batch');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this batch?')) return;
    try {
      await api.delete(`/admin/batches/${id}`);
      toast.success('Batch deleted');
      fetchBatches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting batch');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', startDate: '', endDate: '', trainerId: '', moduleIds: [], status: 'ACTIVE' });
    setModalOpen(true);
  };

  const openEdit = (batch: any) => {
    setEditing(batch);
    setForm({
      name: batch.name || '',
      startDate: batch.startDate?.split('T')[0] || '',
      endDate: batch.endDate?.split('T')[0] || '',
      trainerId: batch.trainer?.id || '',
      moduleIds: batch.modules?.map((m: any) => m.id) || [],
      status: batch.status || 'ACTIVE',
    });
    setModalOpen(true);
  };

  const columns = [
    { key: 'name', header: 'Name', render: (item: any) => item.name },
    { key: 'modules', header: 'Modules', render: (item: any) => item.modules?.map((m: any) => m.name).join(', ') || '-' },
    { key: 'trainer', header: 'Trainer', render: (item: any) => item.trainer?.user?.name || '-' },
    { key: 'startDate', header: 'Start Date', render: (item: any) => item.startDate ? format(new Date(item.startDate), 'MMM d, yyyy') : '-' },
    { key: 'status', header: 'Status', render: (item: any) => item.status || '-' },
    { key: 'students', header: 'Students', render: (item: any) => item.studentCount || 0 },
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
        <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
        <Button onClick={openCreate}>Add Batch</Button>
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={batches} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Batch' : 'Add Batch'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Batch Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <Select label="Trainer" value={form.trainerId} onChange={(e) => setForm({ ...form, trainerId: e.target.value })} options={trainers.map((t: any) => ({ value: t.id, label: t.user?.name || t.name || 'Unknown' }))} />
          <MultiSelect
            label="Modules"
            options={modules.map((m: any) => ({ value: m.id, label: m.name }))}
            value={form.moduleIds}
            onChange={(moduleIds) => setForm({ ...form, moduleIds })}
          />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'COMPLETED', label: 'Completed' }, { value: 'UPCOMING', label: 'Upcoming' }]} />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
