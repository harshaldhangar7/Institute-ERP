import React, { useEffect, useState } from 'react';
import { Button, Modal, Table, Spinner, Card, Badge, FileUpload } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
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

  useEffect(() => { fetchAssignments(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedAssignment) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/assignments/${selectedAssignment.id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Assignment submitted');
      setModalOpen(false);
      setFile(null);
      fetchAssignments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error submitting assignment');
    }
  };

  const columns = [
    { key: 'title', header: 'Title', render: (item: any) => item.title },
    { key: 'dueDate', header: 'Due Date', render: (item: any) => item.dueDate?.split('T')[0] || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => {
        const submitted = item.submissions?.length > 0;
        return <Badge variant={submitted ? 'success' : 'warning'}>{submitted ? 'Submitted' : 'Pending'}</Badge>;
      },
    },
    { key: 'grade', header: 'Grade', render: (item: any) => item.submissions?.[0]?.grade || '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <Button size="sm" onClick={() => { setSelectedAssignment(item); setFile(null); setModalOpen(true); }}>Submit</Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
      {loading ? <Spinner /> : <Table columns={columns} data={assignments} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Submit: ${selectedAssignment?.title || ''}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUpload label="Upload your submission" onFileSelect={setFile} />
          {file && <p className="text-sm text-gray-500">Selected: {file.name}</p>}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" disabled={!file}>Submit</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
