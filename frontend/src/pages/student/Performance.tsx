import React, { useEffect, useState } from 'react';
import { Card, Spinner, Table } from '@/components/common';
import api from '@/services/api';

export default function StudentPerformance() {
  const [performance, setPerformance] = useState<any[]>([]);
  const [mocks, setMocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [perfRes, mockRes] = await Promise.all([
          api.get('/student/performance'),
          api.get('/student/mock-interviews'),
        ]);
        setPerformance(perfRes.data.data?.evaluations || perfRes.data.data || []);
        setMocks(mockRes.data.data?.interviews || mockRes.data.data || []);
      } catch {
        setPerformance([]);
        setMocks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spinner />;

  const perfColumns = [
    { key: 'module', header: 'Module', render: (item: any) => item.module?.name || '-' },
    { key: 'theory', header: 'Theory', render: (item: any) => item.theoryMarks ?? '-' },
    { key: 'practical', header: 'Practical', render: (item: any) => item.practicalMarks ?? '-' },
    { key: 'project', header: 'Project', render: (item: any) => item.projectMarks ?? '-' },
  ];

  const mockColumns = [
    { key: 'date', header: 'Date', render: (item: any) => item.date?.split('T')[0] || item.createdAt?.split('T')[0] || '-' },
    { key: 'communication', header: 'Communication', render: (item: any) => item.communication ?? '-' },
    { key: 'technical', header: 'Technical', render: (item: any) => item.technical ?? '-' },
    { key: 'confidence', header: 'Confidence', render: (item: any) => item.confidence ?? '-' },
    { key: 'feedback', header: 'Feedback', render: (item: any) => item.feedback || '-' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
      <Card title="Marks by Module">
        <Table columns={perfColumns} data={performance} />
      </Card>
      <Card title="Mock Interview Scores">
        <Table columns={mockColumns} data={mocks} />
      </Card>
    </div>
  );
}
