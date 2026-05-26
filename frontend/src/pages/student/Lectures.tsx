import React, { useEffect, useState } from 'react';
import { Table, Spinner } from '@/components/common';
import api from '@/services/api';

export default function StudentLectures() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const res = await api.get('/student/lectures');
        setLectures(res.data.data?.lectures || res.data.data || []);
      } catch {
        setLectures([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLectures();
  }, []);

  const columns = [
    { key: 'topic', header: 'Topic', render: (item: any) => item.topic },
    { key: 'date', header: 'Date', render: (item: any) => item.date?.split('T')[0] || '-' },
    { key: 'batch', header: 'Batch', render: (item: any) => item.batch?.name || '-' },
    { key: 'duration', header: 'Duration', render: (item: any) => item.duration ? `${item.duration} min` : '-' },
    { key: 'status', header: 'Status', render: (item: any) => item.status || '-' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Lecture History</h1>
      {loading ? <Spinner /> : <Table columns={columns} data={lectures} />}
    </div>
  );
}
