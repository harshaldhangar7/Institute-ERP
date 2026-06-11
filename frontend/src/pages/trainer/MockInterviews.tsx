import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner, Select, Card } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TrainerMockInterviews() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: '', date: '', communication: '', technical: '', confidence: '', feedback: '',
  });

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mock-interviews/all');
      setInterviews(res.data.data || []);
    } catch {
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/trainer/students');
      setStudents(res.data.data?.students || res.data.data || []);
    } catch {
      setStudents([]);
    }
  };

  useEffect(() => { fetchInterviews(); fetchStudents(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) { toast.error('Please select a student'); return; }

    const comm = Number(form.communication);
    const tech = Number(form.technical);
    const conf = Number(form.confidence);

    if ([comm, tech, conf].some(v => v < 1 || v > 10)) {
      toast.error('All scores must be between 1 and 10');
      return;
    }

    try {
      await api.post('/mock-interviews/create', {
        studentId: form.studentId,
        date: form.date || new Date().toISOString().split('T')[0],
        communication: comm,
        technical: tech,
        confidence: conf,
        feedback: form.feedback,
      });
      toast.success('Interview recorded');
      setModalOpen(false);
      fetchInterviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error recording interview');
    }
  };

  const columns = [
    { key: 'student', header: 'Student', render: (item: any) => item.student?.user?.name || '-' },
    { key: 'date', header: 'Date', render: (item: any) => item.date?.split('T')[0] || '-' },
    { key: 'communication', header: 'Communication', render: (item: any) => `${item.communication ?? '-'}/10` },
    { key: 'technical', header: 'Technical', render: (item: any) => `${item.technical ?? '-'}/10` },
    { key: 'confidence', header: 'Confidence', render: (item: any) => `${item.confidence ?? '-'}/10` },
    { key: 'overall', header: 'Overall', render: (item: any) => item.overallScore ? `${item.overallScore.toFixed(1)}/10` : '-' },
    { key: 'feedback', header: 'Feedback', render: (item: any) => item.feedback ? item.feedback.slice(0, 40) + (item.feedback.length > 40 ? '…' : '') : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mock Interviews</h1>
        <Button onClick={() => { setForm({ studentId: '', date: new Date().toISOString().split('T')[0], communication: '', technical: '', confidence: '', feedback: '' }); setModalOpen(true); }}>
          New Interview
        </Button>
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={interviews} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Mock Interview">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Student" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} options={students.map((s: any) => ({ value: s.id, label: s.user?.name || 'Student' }))} />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Input label="Communication (1-10)" type="number" value={form.communication} onChange={(e) => setForm({ ...form, communication: e.target.value })} required />
          <Input label="Technical (1-10)" type="number" value={form.technical} onChange={(e) => setForm({ ...form, technical: e.target.value })} required />
          <Input label="Confidence (1-10)" type="number" value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
            <textarea className="w-full border rounded-md px-3 py-2 text-sm" rows={3} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
