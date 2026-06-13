import React, { useEffect, useState } from 'react';
import { Button, Input, Select, Table, Spinner, Card } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TrainerEvaluation() {
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [marks, setMarks] = useState<Record<string, { theoryMarks: string; practicalMarks: string; projectMarks: string }>>({});

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get('/trainer/batches');
        setBatches(res.data.data?.batches || res.data.data || []);
      } catch {
        setBatches([]);
      }
    };
    fetchBatches();
  }, []);

  useEffect(() => {
    if (!selectedBatch) { setStudents([]); setModules([]); setSelectedModule(''); return; }
    setLoading(true);
    setSelectedModule('');
    const fetchData = async () => {
      try {
        const [studentsRes, modulesRes] = await Promise.all([
          api.get(`/trainer/batches/${selectedBatch}/students`),
          api.get(`/trainer/batches/${selectedBatch}/modules`),
        ]);
        const batchStudents = studentsRes.data.data?.students || studentsRes.data.data || [];
        setStudents(batchStudents);
        setModules(modulesRes.data.data?.modules || modulesRes.data.data || []);
        const initialMarks: Record<string, { theoryMarks: string; practicalMarks: string; projectMarks: string }> = {};
        batchStudents.forEach((s: any) => {
          initialMarks[s.id] = { theoryMarks: '', practicalMarks: '', projectMarks: '' };
        });
        setMarks(initialMarks);
      } catch {
        setStudents([]);
        setModules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedBatch]);

  const MARK_FIELDS: { field: 'theoryMarks' | 'practicalMarks' | 'projectMarks'; type: string }[] = [
    { field: 'theoryMarks', type: 'THEORY' },
    { field: 'practicalMarks', type: 'PRACTICAL' },
    { field: 'projectMarks', type: 'PROJECT' },
  ];

  const handleSubmit = async () => {
    if (!selectedModule) {
      toast.error('Please select a module first');
      return;
    }
    setSaving(true);
    try {
      const requests: Promise<any>[] = [];
      for (const [studentId, m] of Object.entries(marks)) {
        for (const { field, type } of MARK_FIELDS) {
          const value = m[field];
          if (value !== '' && value !== undefined && value !== null) {
            requests.push(api.post('/evaluation/marks', {
              studentId,
              moduleId: selectedModule,
              type,
              score: Number(value),
              maxScore: 100,
            }));
          }
        }
      }
      if (requests.length === 0) {
        toast.error('Enter at least one mark before saving');
        return;
      }
      await Promise.all(requests);
      toast.success('Marks saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Error saving marks');
    } finally {
      setSaving(false);
    }
  };

  const updateMark = (studentId: string, field: string, value: string) => {
    setMarks((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Evaluation</h1>

      <Select
        label="Select Batch"
        value={selectedBatch}
        onChange={(e) => setSelectedBatch(e.target.value)}
        options={batches.map((b: any) => ({ value: b.id, label: b.name }))}
      />

      {selectedBatch && (
        <Select
          label="Select Module"
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          options={[
            { value: '', label: 'Select a module...' },
            ...modules.map((bm: any) => ({ value: bm.module?.id || bm.moduleId, label: bm.module?.name || 'Module' })),
          ]}
        />
      )}

      {loading ? <Spinner /> : selectedBatch && !selectedModule ? (
        <Card><p className="text-gray-500 text-center">{modules.length === 0 ? 'No modules assigned to this batch' : 'Select a module to enter marks'}</p></Card>
      ) : selectedBatch && selectedModule && students.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Theory</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Practical</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student: any) => (
                  <tr key={student.id}>
                    <td className="px-4 py-3 text-sm">{student.user?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <input type="number" className="w-20 border rounded px-2 py-1 text-sm" value={marks[student.id]?.theoryMarks || ''} onChange={(e) => updateMark(student.id, 'theoryMarks', e.target.value)} />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" className="w-20 border rounded px-2 py-1 text-sm" value={marks[student.id]?.practicalMarks || ''} onChange={(e) => updateMark(student.id, 'practicalMarks', e.target.value)} />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" className="w-20 border rounded px-2 py-1 text-sm" value={marks[student.id]?.projectMarks || ''} onChange={(e) => updateMark(student.id, 'projectMarks', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSubmit} loading={saving}>Save Marks</Button>
          </div>
        </Card>
      ) : selectedBatch && selectedModule ? (
        <Card><p className="text-gray-500 text-center">No students in this batch</p></Card>
      ) : null}
    </div>
  );
}
