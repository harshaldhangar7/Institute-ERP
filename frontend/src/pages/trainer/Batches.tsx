import React, { useEffect, useState } from 'react';
import { Card, Spinner, Badge, Table } from '@/components/common';
import api from '@/services/api';

export default function TrainerBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get('/trainer/batches');
        setBatches(res.data.data?.batches || res.data.data || []);
      } catch {
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      const fetchModules = async () => {
        try {
          const res = await api.get(`/trainer/batches/${selectedBatch.id}/modules`);
          setModules(res.data.data || []);
        } catch {
          setModules([]);
        }
      };
      fetchModules();
    } else {
      setModules([]);
    }
  }, [selectedBatch]);

  if (loading) return <Spinner />;

  const studentColumns = [
    { key: 'name', header: 'Name', render: (item: any) => item.user?.name || item.name || '-' },
    { key: 'email', header: 'Email', render: (item: any) => item.user?.email || '-' },
    { key: 'mode', header: 'Mode', render: (item: any) => item.mode || '-' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Batches</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map((batch) => (
          <Card
            key={batch.id}
            className={`cursor-pointer hover:ring-2 hover:ring-indigo-500 ${selectedBatch?.id === batch.id ? 'ring-2 ring-indigo-500' : ''}`}
          >
            <div onClick={() => setSelectedBatch(batch)}>
              <h3 className="font-semibold text-lg">{batch.name}</h3>
              <div className="mt-2 space-y-1">
                <Badge variant={batch.status === 'ACTIVE' ? 'success' : 'default'}>{batch.status}</Badge>
                <p className="text-sm text-gray-500">{batch.studentCount || 0} students</p>
              </div>
            </div>
          </Card>
        ))}
        {batches.length === 0 && <p className="text-gray-500">No batches assigned</p>}
      </div>

      {selectedBatch && modules.length > 0 && (
        <Card title={`Modules in ${selectedBatch.name}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modules.map((mod: any) => (
              <div key={mod.id} className="p-3 border rounded-lg">
                <p className="font-medium">{mod.module?.name || mod.name || '-'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={mod.status === 'COMPLETED' ? 'success' : 'default'}>{mod.status}</Badge>
                  <span className="text-sm text-gray-500">{mod.completionPercent || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedBatch && (
        <Card title={`Students in ${selectedBatch.name}`}>
          <Table columns={studentColumns} data={selectedBatch.students || []} />
        </Card>
      )}
    </div>
  );
}
