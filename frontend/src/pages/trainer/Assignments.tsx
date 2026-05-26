import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner, Select, Card, FileUpload } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TrainerAssignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', batchId: '', dueDate: '' });
  const [file, setFile] = useState<File | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data.data?.assignments || res.data.data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('batchId', form.batchId);
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

  const columns = [
    { key: 'title', header: 'Title', render: (item: any) => item.title },
    { key: 'batch', header: 'Batch', render: (item: any) => item.batch?.name || '-' },
    { key: 'dueDate', header: 'Due Date', render: (item: any) => item.dueDate?.split('T')[0] || '-' },
    { key: 'submissions', header: 'Submissions', render: (item: any) => item.submissions?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <Button onClick={() => { setForm({ title: '', description: '', batchId: '', dueDate: '' }); setModalOpen(true); }}>
          Create Assignment
        </Button>
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={assignments} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Assignment" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="w-full border rounded-md px-3 py-2 text-sm" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Select label="Batch" value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} options={batches.map((b: any) => ({ value: b.id, label: b.name }))} />
          <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <FileUpload label="Attach file (optional)" onFileSelect={setFile} />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
