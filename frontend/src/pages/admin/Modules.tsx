import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner, Select, Card, Badge } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function AdminModules() {
  const [modules, setModules] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', duration: '' });
  const [viewMode, setViewMode] = useState<'modules' | 'batches'>('modules');

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

  const fetchBatches = async () => {
    try {
      const res = await api.get('/admin/batches');
      setBatches(res.data.data?.batches || res.data.data || []);
    } catch {
      setBatches([]);
    }
  };

  useEffect(() => { fetchModules(); fetchBatches(); }, []);

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

  const moduleColumns = [
    { key: 'name', header: 'Module Name', render: (item: any) => (
      <div>
        <p className="font-medium">{item.name}</p>
        {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
      </div>
    )},
    { key: 'duration', header: 'Duration', render: (item: any) => item.duration ? `${item.duration} hrs` : '-' },
    { key: 'batches', header: 'Assigned to Batches', render: (item: any) => (
      <div className="flex flex-wrap gap-1">
        {item.batches?.length > 0
          ? item.batches.map((b: any) => (
              <Badge key={b.id} variant="info">{b.name}</Badge>
            ))
          : <span className="text-gray-400 text-sm">Not assigned</span>
        }
      </div>
    )},
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
        <h1 className="text-2xl font-bold text-gray-900">Modules & Courses</h1>
        <Button onClick={openCreate}>Add Module</Button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={viewMode === 'modules' ? 'primary' : 'secondary'}
          onClick={() => setViewMode('modules')}
        >
          All Modules
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'batches' ? 'primary' : 'secondary'}
          onClick={() => setViewMode('batches')}
        >
          Batch → Module Map
        </Button>
      </div>

      {loading ? <Spinner /> : viewMode === 'modules' ? (
        <Table columns={moduleColumns} data={modules} />
      ) : (
        /* Batch-Module Relationship View */
        <div className="space-y-4">
          {batches.length === 0 ? (
            <Card><p className="text-gray-500 text-center">No batches created yet</p></Card>
          ) : (
            batches.map((batch: any) => (
              <Card key={batch.id} title={batch.name}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={batch.status === 'ACTIVE' ? 'success' : 'default'}>{batch.status}</Badge>
                  <span className="text-sm text-gray-500">{batch.studentCount || 0} students</span>
                  {batch.trainer?.user?.name && (
                    <span className="text-sm text-gray-500">• Batch Trainer: <strong>{batch.trainer.user.name}</strong></span>
                  )}
                </div>
                {batch.modules?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Module</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Trainer</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.modules.map((mod: any) => (
                          <tr key={mod.id} className="border-b border-gray-100">
                            <td className="py-2 px-3 font-medium">{mod.name}</td>
                            <td className="py-2 px-3">{mod.trainer?.name || <span className="text-gray-400">Not assigned</span>}</td>
                            <td className="py-2 px-3">
                              <Badge variant={mod.status === 'COMPLETED' ? 'success' : mod.status === 'IN_PROGRESS' ? 'warning' : 'default'}>
                                {mod.status || 'PENDING'}
                              </Badge>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${mod.completionPercent || 0}%` }} />
                                </div>
                                <span className="text-xs text-gray-500">{mod.completionPercent || 0}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No modules assigned to this batch. <a href="/admin/batches" className="text-indigo-600 hover:underline">Assign modules →</a></p>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Module' : 'Add Module'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Module Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
