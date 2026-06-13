import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, Table, Spinner, Select } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

const NO_COURSE = '__none__';

export default function TrainerMockInterviews() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sel, setSel] = useState({ courseId: '', batchId: '', moduleId: '' });
  const [form, setForm] = useState({
    studentId: '', communication: '', technical: '', confidence: '', feedback: '',
  });

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mock-interviews');
      setInterviews(res.data.data?.interviews || res.data.data || []);
    } catch {
      setInterviews([]);
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

  useEffect(() => { fetchInterviews(); fetchBatches(); }, []);

  // Distinct courses across the trainer's batches (plus a bucket for uncategorized batches).
  const courseOptions = (() => {
    const map = new Map<string, string>();
    let hasUncategorized = false;
    batches.forEach((b: any) => {
      if (b.course?.id) map.set(b.course.id, b.course.name);
      else hasUncategorized = true;
    });
    const opts = Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }));
    if (hasUncategorized) opts.push({ value: NO_COURSE, label: 'No Course' });
    return opts;
  })();

  const batchOptions = batches
    .filter((b: any) => {
      if (!sel.courseId) return false;
      if (sel.courseId === NO_COURSE) return !b.course?.id;
      return b.course?.id === sel.courseId;
    })
    .map((b: any) => ({ value: b.id, label: b.name }));

  const openModal = () => {
    setSel({ courseId: '', batchId: '', moduleId: '' });
    setModules([]);
    setStudents([]);
    setForm({ studentId: '', communication: '', technical: '', confidence: '', feedback: '' });
    setModalOpen(true);
  };

  const onCourseChange = (courseId: string) => {
    setSel({ courseId, batchId: '', moduleId: '' });
    setModules([]);
    setStudents([]);
    setForm((f) => ({ ...f, studentId: '' }));
  };

  const onBatchChange = async (batchId: string) => {
    setSel((s) => ({ ...s, batchId, moduleId: '' }));
    setForm((f) => ({ ...f, studentId: '' }));
    setModules([]);
    setStudents([]);
    if (!batchId) return;
    try {
      const [modRes, stuRes] = await Promise.all([
        api.get(`/trainer/batches/${batchId}/modules`),
        api.get(`/trainer/batches/${batchId}/students`),
      ]);
      setModules(modRes.data.data?.modules || modRes.data.data || []);
      setStudents(stuRes.data.data?.students || stuRes.data.data || []);
    } catch {
      setModules([]);
      setStudents([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) {
      toast.error('Please select a student');
      return;
    }
    setSaving(true);
    try {
      await api.post('/mock-interviews', {
        studentId: form.studentId,
        communication: Number(form.communication),
        technical: Number(form.technical),
        confidence: Number(form.confidence),
        feedback: form.feedback,
      });
      toast.success('Interview recorded');
      setModalOpen(false);
      fetchInterviews();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Error recording interview');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'student', header: 'Student', render: (item: any) => item.student?.user?.name || '-' },
    { key: 'communication', header: 'Communication', render: (item: any) => item.communication || 0 },
    { key: 'technical', header: 'Technical', render: (item: any) => item.technical || 0 },
    { key: 'confidence', header: 'Confidence', render: (item: any) => item.confidence || 0 },
    { key: 'date', header: 'Date', render: (item: any) => item.date?.split('T')[0] || item.createdAt?.split('T')[0] || '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mock Interviews</h1>
        <Button onClick={openModal}>New Interview</Button>
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={interviews} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Mock Interview">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Course"
            value={sel.courseId}
            onChange={(e) => onCourseChange(e.target.value)}
            options={[{ value: '', label: 'Select a course...' }, ...courseOptions]}
          />
          <Select
            label="Batch"
            value={sel.batchId}
            onChange={(e) => onBatchChange(e.target.value)}
            options={[{ value: '', label: 'Select a batch...' }, ...batchOptions]}
          />
          <Select
            label="Module"
            value={sel.moduleId}
            onChange={(e) => setSel((s) => ({ ...s, moduleId: e.target.value }))}
            options={[
              { value: '', label: 'Select a module...' },
              ...modules.map((bm: any) => ({ value: bm.module?.id || bm.moduleId, label: bm.module?.name || 'Module' })),
            ]}
          />
          <Select
            label="Student"
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            options={[
              { value: '', label: 'Select a student...' },
              ...students.map((s: any) => ({ value: s.id, label: s.user?.name || 'Student' })),
            ]}
          />
          <Input label="Communication (1-10)" type="number" value={form.communication} onChange={(e) => setForm({ ...form, communication: e.target.value })} required />
          <Input label="Technical (1-10)" type="number" value={form.technical} onChange={(e) => setForm({ ...form, technical: e.target.value })} required />
          <Input label="Confidence (1-10)" type="number" value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
            <textarea className="w-full border rounded-md px-3 py-2 text-sm" rows={3} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
