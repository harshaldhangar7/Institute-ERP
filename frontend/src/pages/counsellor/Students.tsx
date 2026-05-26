import React, { useEffect, useState } from 'react';
import { Table, Spinner, Card, Badge } from '@/components/common';
import api from '@/services/api';

export default function CounsellorStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/counsellor/students');
        setStudents(res.data.data?.students || res.data.data || []);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const columns = [
    { key: 'name', header: 'Name', render: (item: any) => item.user?.name || item.name || '-' },
    { key: 'batch', header: 'Batch', render: (item: any) => item.batch?.name || '-' },
    { key: 'attendance', header: 'Attendance', render: (item: any) => `${item.attendancePercentage || 0}%` },
    { key: 'performance', header: 'Performance', render: (item: any) => item.performance || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => {
        const pct = item.attendancePercentage || 0;
        return <Badge variant={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'}>{pct >= 75 ? 'Good' : pct >= 50 ? 'Warning' : 'At Risk'}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
      {loading ? <Spinner /> : <Table columns={columns} data={students} />}
    </div>
  );
}
