import React, { useEffect, useState } from 'react';
import { Card, Spinner, Badge, Table } from '@/components/common';
import api from '@/services/api';

export default function TrainerStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/trainer/students');
        setStudents(res.data.data?.students || res.data.data || []);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  if (loading) return <Spinner />;

  const columns = [
    { key: 'name', header: 'Name', render: (item: any) => item.user?.name || item.name || '-' },
    { key: 'email', header: 'Email', render: (item: any) => item.user?.email || '-' },
    { key: 'batch', header: 'Batch', render: (item: any) => item.batch?.name || '-' },
    { key: 'mode', header: 'Mode', render: (item: any) => <Badge variant={item.mode === 'ONLINE' ? 'info' : 'default'}>{item.mode}</Badge> },
    { key: 'attendance', header: 'Attendance', render: (item: any) => `${item.attendancePercentage || 0}%` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Students</h1>

      <Table columns={columns} data={students} onRowClick={setSelectedStudent} />

      {selectedStudent && (
        <Card title={`Student Details: ${selectedStudent.user?.name || selectedStudent.name}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{selectedStudent.user?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Batch</p>
              <p className="font-medium">{selectedStudent.batch?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mode</p>
              <p className="font-medium">{selectedStudent.mode || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Attendance</p>
              <p className="font-medium">{selectedStudent.attendancePercentage || 0}%</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
