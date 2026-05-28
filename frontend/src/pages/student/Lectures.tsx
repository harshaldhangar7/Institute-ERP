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
    { key: 'topic', header: 'Topic', render: (item: any) => item.topics || '-' },
    { key: 'module', header: 'Module', render: (item: any) => item.module?.name || '-' },
    { key: 'trainer', header: 'Trainer', render: (item: any) => item.trainer?.user?.name || '-' },
    { key: 'date', header: 'Date', render: (item: any) => item.date?.split('T')[0] || '-' },
    { key: 'time', header: 'Time', render: (item: any) => item.startTime ? `${item.startTime} - ${item.endTime || '...'}` : '-' },
    { key: 'duration', header: 'Duration', render: (item: any) => {
      if (!item.duration) return '-';
      const hours = Math.floor(item.duration / 60);
      const mins = item.duration % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }},
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Lecture History</h1>
      {loading ? <Spinner /> : <Table columns={columns} data={lectures} />}
    </div>
  );
}
