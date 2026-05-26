import React, { useEffect, useState } from 'react';
import { Button, Select, Table, Spinner, Card, Badge } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TrainerAttendance() {
  const [batches, setBatches] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedLecture, setSelectedLecture] = useState('');
  const [loading, setLoading] = useState(false);

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
    const fetchLectures = async () => {
      try {
        const res = await api.get('/trainer/lectures', { params: { batchId: selectedBatch } });
        setLectures(res.data.data?.lectures || res.data.data || []);
      } catch {
        setLectures([]);
      }
    };
    fetchLectures();
  }, [selectedBatch]);

  useEffect(() => {
    if (!selectedLecture) return;
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/attendance/lecture/${selectedLecture}`);
        setAttendance(res.data.data?.attendance || res.data.data || []);
      } catch {
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedLecture]);

  const markAttendance = async (studentId: string) => {
    try {
      await api.post('/attendance/mark', { lectureId: selectedLecture, studentId, status: 'PRESENT' });
      toast.success('Attendance marked');
      const res = await api.get(`/attendance/lecture/${selectedLecture}`);
      setAttendance(res.data.data?.attendance || res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error marking attendance');
    }
  };

  const columns = [
    { key: 'name', header: 'Student', render: (item: any) => item.student?.user?.name || item.studentName || '-' },
    { key: 'status', header: 'Status', render: (item: any) => <Badge variant={item.status === 'PRESENT' ? 'success' : 'danger'}>{item.status}</Badge> },
    { key: 'markedAt', header: 'Marked At', render: (item: any) => item.markedAt ? new Date(item.markedAt).toLocaleTimeString() : '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => item.status !== 'PRESENT' ? (
        <Button size="sm" onClick={() => markAttendance(item.studentId)}>Mark Present</Button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Select Batch"
          value={selectedBatch}
          onChange={(e) => { setSelectedBatch(e.target.value); setSelectedLecture(''); }}
          options={batches.map((b: any) => ({ value: b.id, label: b.name }))}
        />
        <Select
          label="Select Lecture"
          value={selectedLecture}
          onChange={(e) => setSelectedLecture(e.target.value)}
          options={lectures.map((l: any) => ({ value: l.id, label: `${l.topic} (${l.date?.split('T')[0]})` }))}
        />
      </div>

      {loading ? <Spinner /> : selectedLecture ? <Table columns={columns} data={attendance} /> : (
        <Card><p className="text-gray-500 text-center">Select a batch and lecture to view attendance</p></Card>
      )}
    </div>
  );
}
