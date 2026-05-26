import React, { useEffect, useState } from 'react';
import { Button, Input, Select, Table, Spinner, Card } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TrainerEvaluation() {
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
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
    if (!selectedBatch) return;
    setLoading(true);
    const batch = batches.find((b) => b.id === selectedBatch);
    const batchStudents = batch?.students || [];
    setStudents(batchStudents);
    const initialMarks: Record<string, { theoryMarks: string; practicalMarks: string; projectMarks: string }> = {};
    batchStudents.forEach((s: any) => {
      initialMarks[s.id] = { theoryMarks: '', practicalMarks: '', projectMarks: '' };
    });
    setMarks(initialMarks);
    setLoading(false);
  }, [selectedBatch, batches]);

  const handleSubmit = async () => {
    try {
      const entries = Object.entries(marks).filter(([_, v]) => v.theoryMarks || v.practicalMarks || v.projectMarks);
      for (const [studentId, m] of entries) {
        await api.post('/evaluation', {
          studentId,
          batchId: selectedBatch,
          theoryMarks: m.theoryMarks ? Number(m.theoryMarks) : undefined,
          practicalMarks: m.practicalMarks ? Number(m.practicalMarks) : undefined,
          projectMarks: m.projectMarks ? Number(m.projectMarks) : undefined,
        });
      }
      toast.success('Marks saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving marks');
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

      {loading ? <Spinner /> : selectedBatch && students.length > 0 ? (
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
            <Button onClick={handleSubmit}>Save Marks</Button>
          </div>
        </Card>
      ) : selectedBatch ? (
        <Card><p className="text-gray-500 text-center">No students in this batch</p></Card>
      ) : null}
    </div>
  );
}
