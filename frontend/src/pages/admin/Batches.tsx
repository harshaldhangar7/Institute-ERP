import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner, Select } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ModuleAssignment {
  moduleId: string;
  trainerId: string;
}

export default function AdminBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    trainerId: '',
    moduleAssignments: [] as ModuleAssignment[],
    status: 'ACTIVE',
  });

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
      const payload = {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        trainerId: form.trainerId || undefined,
        isActive: form.status === 'ACTIVE',
        modules: form.moduleAssignments.map((ma) => ({
          moduleId: ma.moduleId,
          trainerId: ma.trainerId || null,
        })),
      };

      if (editing) {
        await api.put(`/admin/batches/${editing.id}`, payload);
        toast.success('Batch updated');
      } else {
        await api.post('/admin/batches', payload);
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
    setForm({ name: '', startDate: '', endDate: '', trainerId: '', moduleAssignments: [], status: 'ACTIVE' });
    setModalOpen(true);
  };

  const openEdit = (batch: any) => {
    setEditing(batch);
    setForm({
      name: batch.name || '',
      startDate: batch.startDate?.split('T')[0] || '',
      endDate: batch.endDate?.split('T')[0] || '',
      trainerId: batch.trainer?.id || '',
      moduleAssignments: batch.modules?.map((m: any) => ({
        moduleId: m.id,
        trainerId: m.trainerId || '',
      })) || [],
      status: batch.status || 'ACTIVE',
    });
    setModalOpen(true);
  };

  const addModule = () => {
    setForm({ ...form, moduleAssignments: [...form.moduleAssignments, { moduleId: '', trainerId: '' }] });
  };

  const removeModule = (index: number) => {
    setForm({ ...form, moduleAssignments: form.moduleAssignments.filter((_, i) => i !== index) });
  };

  const updateModuleAssignment = (index: number, field: keyof ModuleAssignment, value: string) => {
    const updated = [...form.moduleAssignments];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, moduleAssignments: updated });
  };

  // Filter out already-selected modules
  const getAvailableModules = (currentIndex: number) => {
    const selectedIds = form.moduleAssignments
      .filter((_, i) => i !== currentIndex)
      .map((ma) => ma.moduleId);
    return modules.filter((m: any) => !selectedIds.includes(m.id));
  };

  const columns = [
    { key: 'name', header: 'Name', render: (item: any) => item.name },
    { key: 'modules', header: 'Modules', render: (item: any) =>
      item.modules?.map((m: any) => {
        const trainerName = m.trainer?.name;
        return trainerName ? `${m.name} (${trainerName})` : m.name;
      }).join(', ') || '-'
    },
    { key: 'trainer', header: 'Batch Trainer', render: (item: any) => item.trainer?.user?.name || '-' },
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
          <Select label="Batch Trainer" value={form.trainerId} onChange={(e) => setForm({ ...form, trainerId: e.target.value })} options={trainers.map((t: any) => ({ value: t.id, label: t.user?.name || t.name || 'Unknown' }))} />

          {/* Module Assignments with Trainer per Module */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Modules</label>
              <Button type="button" size="sm" variant="secondary" onClick={addModule}>+ Add Module</Button>
            </div>
            {form.moduleAssignments.length === 0 && (
              <p className="text-sm text-gray-400">No modules added. Click "Add Module" to assign modules.</p>
            )}
            <div className="space-y-3">
              {form.moduleAssignments.map((ma, idx) => (
                <div key={idx} className="flex gap-2 items-end p-3 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <Select
                      label={idx === 0 ? 'Module' : undefined}
                      value={ma.moduleId}
                      onChange={(e) => updateModuleAssignment(idx, 'moduleId', e.target.value)}
                      options={getAvailableModules(idx).map((m: any) => ({ value: m.id, label: m.name }))}
                    />
                  </div>
                  <div className="flex-1">
                    <Select
                      label={idx === 0 ? 'Trainer' : undefined}
                      value={ma.trainerId}
                      onChange={(e) => updateModuleAssignment(idx, 'trainerId', e.target.value)}
                      options={trainers.map((t: any) => ({ value: t.id, label: t.user?.name || t.name || 'Unknown' }))}
                    />
                  </div>
                  <Button type="button" size="sm" variant="danger" onClick={() => removeModule(idx)}>✕</Button>
                </div>
              ))}
            </div>
          </div>

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
