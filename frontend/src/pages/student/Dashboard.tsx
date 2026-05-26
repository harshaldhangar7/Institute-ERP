import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import api from '@/services/api';
import { AcademicCapIcon, ClipboardDocumentListIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/student/dashboard');
        setData(res.data.data);
      } catch {
        setData({ batch: null, attendance: 0, modules: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Batch" value={data?.batch?.name || 'Not Assigned'} icon={<AcademicCapIcon className="h-8 w-8" />} />
        <StatCard title="Attendance" value={`${data?.attendance || 0}%`} icon={<ClipboardDocumentListIcon className="h-8 w-8" />} />
        <StatCard title="Overall Score" value={data?.overallScore || '-'} icon={<ChartBarIcon className="h-8 w-8" />} />
      </div>

      <Card title="Module Progress">
        {data?.modules?.length > 0 ? (
          <div className="space-y-3">
            {data.modules.map((mod: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{mod.name}</span>
                  <span className="text-gray-500">{mod.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${mod.progress || 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No modules assigned</p>
        )}
      </Card>

      {data?.batch && (
        <Card title="Batch Information">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Batch Name</p>
              <p className="font-medium">{data.batch.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Trainer</p>
              <p className="font-medium">{data.batch.trainer || '-'}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
