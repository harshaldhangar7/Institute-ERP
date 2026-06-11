import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner, Select, Card, Badge, FileUpload } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TrainerAssignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    batchId: '',
    moduleId: '',
    dueDate: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trainer/lectures');
      const lecturesData = res.data.data?.lectures || res.data.data || [];
      // Get unique batch IDs from lectures to fetch assignments
      const batchIds = [...new Set(lecturesData.map((l: any) => l.batchId))];
      let allAssignments: any[] = [];
      for (const batchId of batchIds) {
        try {
          const aRes = await api.get(`/assignments/batch/${batchId}`);
          const batchAssignments = aRes.data.data || [];
          allAssignments = [...allAssignments, ...batchAssignments];
        } catch { /* skip */ }
      }
      setAssignments(allAssignments);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await api.get('/trainer/batches');
      setBatches(res.data.data?.batches || res.data.data || []);
    } catch {
      setBatches([]);
    }
  };

  useEffect(() => { fetchAssignments(); fetchBatches(); }, []);

  // Fetch modules when batch changes
  const handleBatchChange = async (batchId: string) => {
    setForm((prev) => ({ ...prev, batchId, moduleId: '' }));
    setModules([]);
    setLectures([]);
    if (!batchId) return;
    try {
      const res = await api.get(`/trainer/batches/${batchId}/modules`);
      setModules(res.data.data || []);
    } catch {
      setModules([]);
    }
  };

  // Fetch lectures/topics when module changes (to show what was taught)
  const handleModuleChange = async (moduleId: string) => {
    setForm((prev) => ({ ...prev, moduleId }));
    setLectures([]);
    if (!moduleId || !form.batchId) return;
    try {
      const res = await api.get('/trainer/lectures');
      const all = res.data.data?.lectures || res.data.data || [];
      // Filter lectures for this batch + module
      const filtered = all.filter((l: any) => l.batchId === form.batchId && l.moduleId === moduleId);
      setLectures(filtered);
    } catch {
      setLectures([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batchId) { toast.error('Please select a batch'); return; }
    if (!form.moduleId) { toast.error('Please select a module'); return; }
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('batchId', form.batchId);
      formData.append('moduleId', form.moduleId);
      if (form.dueDate) formData.append('dueDate', form.dueDate);
      if (file) formData.append('file', file);

      await api.post('/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Assignment created');
      setModalOpen(false);
      setFile(null);
      fetchAssignments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating assignment');
    }
  };

  const openCreate = () => {
    setForm({ title: '', description: '', batchId: '', moduleId: '', dueDate: '' });
    setFile(null);
    setModules([]);
    setLectures([]);
    setModalOpen(true);
  };

  const columns = [
    { key: 'title', header: 'Title', render: (item: any) => item.title },
    { key: 'module', header: 'Module', render: (item: any) => item.module?.name || '-' },
    { key: 'dueDate', header: 'Due Date', render: (item: any) => item.dueDate?.split('T')[0] || '-' },
    { key: 'file', header: 'File', render: (item: any) => item.filePath ? <Badge variant="info">Attached</Badge> : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <Button onClick={openCreate}>Create Assignment</Button>
      </div>

      {loading ? <Spinner /> : assignments.length === 0 ? (
        <Card><p className="text-gray-500 text-center">No assignments created yet</p></Card>
      ) : (
        <Table columns={columns} data={assignments} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Assignment">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Select Batch */}
          <Select
            label="Batch"
            value={form.batchId}
            onChange={(e) => handleBatchChange(e.target.value)}
            options={batches.map((b: any) => ({ value: b.id, label: b.name }))}
          />

          {/* Step 2: Select Module (filtered by batch) */}
          <Select
            label="Module"
            value={form.moduleId}
            onChange={(e) => handleModuleChange(e.target.value)}
            options={modules.map((m: any) => ({ value: m.moduleId || m.module?.id || m.id, label: m.module?.name || m.name }))}
          />
          {form.batchId && modules.length === 0 && (
            <p className="text-xs text-amber-600">No modules assigned to this batch.</p>
          )}

          {/* Show topics covered in this module (for reference) */}
          {lectures.length > 0 && (
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Topics covered in this module</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {lectures.map((l: any) => (
                  <p key={l.id} className="text-sm text-gray-700">
                    • {l.topics || 'Untitled'} <span className="text-xs text-gray-400">({l.date?.split('T')[0]})</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Assignment Details */}
          <Input label="Assignment Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Build a React Todo App" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Assignment instructions and requirements..."
            />
          </div>
          <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <FileUpload label="Attach file (optional)" onFileSelect={setFile} />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Create Assignment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
