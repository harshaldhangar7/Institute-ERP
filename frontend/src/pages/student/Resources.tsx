import React, { useEffect, useState } from 'react';
import { Table, Spinner, Card } from '@/components/common';
import api from '@/services/api';

export default function StudentResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await api.get('/resources');
        setResources(res.data.data?.resources || res.data.data || []);
      } catch {
        setResources([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const columns = [
    { key: 'title', header: 'Title', render: (item: any) => item.title },
    { key: 'description', header: 'Description', render: (item: any) => item.description || '-' },
    { key: 'module', header: 'Module', render: (item: any) => item.module?.name || '-' },
    { key: 'createdAt', header: 'Uploaded', render: (item: any) => item.createdAt?.split('T')[0] || '-' },
    {
      key: 'actions',
      header: 'Download',
      render: (item: any) => item.fileUrl ? (
        <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">Download</a>
      ) : '-',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
      {loading ? <Spinner /> : <Table columns={columns} data={resources} />}
    </div>
  );
}
