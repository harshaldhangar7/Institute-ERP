import React, { useEffect, useState } from 'react';
import { Button, Select, Spinner, Card, Badge } from '@/components/common';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function TrainerAttendance() {
  const [batches, setBatches] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
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
    if (!selectedBatch) { setLectures([]); return; }
    const fetchLectures = async () => {
      try {
        const res = await api.get('/trainer/lectures');
        const all = res.data.data?.lectures || res.data.data || [];
        // Filter lectures for selected batch
        setLectures(all.filter((l: any) => l.batchId === selectedBatch));
      } catch {
        setLectures([]);
      }
    };
    fetchLectures();
  }, [selectedBatch]);

  useEffect(() => {
    if (!selectedLecture) { setAttendanceData(null); return; }
    fetchAttendance();
  }, [selectedLecture]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/lecture/${selectedLecture}/full`);
      setAttendanceData(res.data.data);
    } catch {
      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string, status: string) => {
    try {
      await api.post('/attendance/mark-manual', {
        lectureId: selectedLecture,
        studentId,
        status,
      });
      toast.success(`Marked as ${status}`);
      fetchAttendance();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error marking attendance');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Select Batch"
          value={selectedBatch}
          onChange={(e) => { setSelectedBatch(e.target.value); setSelectedLecture(''); setAttendanceData(null); }}
          options={batches.map((b: any) => ({ value: b.id, label: b.name }))}
        />
        <Select
          label="Select Lecture"
          value={selectedLecture}
          onChange={(e) => setSelectedLecture(e.target.value)}
          options={lectures.map((l: any) => ({ value: l.id, label: `${l.topics || 'Untitled'} (${l.date?.split('T')[0] || ''})` }))}
        />
      </div>

      {loading && <Spinner />}

      {!loading && !selectedLecture && (
        <Card><p className="text-gray-500 text-center">Select a batch and lecture to manage attendance</p></Card>
      )}

      {!loading && attendanceData && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold">{attendanceData.summary?.total || 0}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-2xl font-bold text-green-600">{attendanceData.summary?.present || 0}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-2xl font-bold text-red-600">{attendanceData.summary?.absent || 0}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Not Marked</p>
              <p className="text-2xl font-bold text-amber-600">{attendanceData.summary?.notMarked || 0}</p>
            </Card>
          </div>

          {/* Student List */}
          <Card title="Student Attendance">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Student</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Method</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.students?.map((s: any) => (
                    <tr key={s.studentId} className="border-b border-gray-100">
                      <td className="py-2 px-3">
                        <p className="font-medium">{s.studentName}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={
                          s.status === 'PRESENT' ? 'success' :
                          s.status === 'LATE' ? 'warning' :
                          s.status === 'ABSENT' ? 'danger' : 'default'
                        }>
                          {s.status === 'NOT_MARKED' ? 'Not Marked' : s.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-gray-500">{s.method || '—'}</td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={s.status === 'PRESENT' ? 'primary' : 'ghost'}
                            onClick={() => markAttendance(s.studentId, 'PRESENT')}
                          >
                            P
                          </Button>
                          <Button
                            size="sm"
                            variant={s.status === 'LATE' ? 'primary' : 'ghost'}
                            onClick={() => markAttendance(s.studentId, 'LATE')}
                          >
                            L
                          </Button>
                          <Button
                            size="sm"
                            variant={s.status === 'ABSENT' ? 'danger' : 'ghost'}
                            onClick={() => markAttendance(s.studentId, 'ABSENT')}
                          >
                            A
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
