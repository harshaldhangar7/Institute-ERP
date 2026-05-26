import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner, FileUpload } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TrainerResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState<File | null>(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await api.get('/resources');
      setResources(res.data.data?.resources || res.data.data || []);
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('file', file);

      await api.post('/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Resource uploaded');
      setModalOpen(false);
      setFile(null);
      fetchResources();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error uploading resource');
    }
  };

  const columns = [
    { key: 'title', header: 'Title', render: (item: any) => item.title },
    { key: 'description', header: 'Description', render: (item: any) => item.description || '-' },
    { key: 'createdAt', header: 'Uploaded', render: (item: any) => item.createdAt?.split('T')[0] || '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        <Button onClick={() => { setForm({ title: '', description: '' }); setModalOpen(true); }}>Upload Resource</Button>
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={resources} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Upload Resource">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <FileUpload label="Select file to upload" onFileSelect={setFile} />
          {file && <p className="text-sm text-gray-500">Selected: {file.name}</p>}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Upload</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
