import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import api from '@/services/api';
import { CalendarIcon, UserGroupIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export default function TrainerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/trainer/dashboard');
        setStats(res.data.data);
      } catch {
        setStats({ batches: 0, students: 0, lectures: 0, upcomingLectures: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Trainer Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Assigned Batches"
          value={stats?.batches || 0}
          icon={<CalendarIcon className="h-8 w-8" />}
        />
        <StatCard
          title="Total Students"
          value={stats?.students || 0}
          icon={<UserGroupIcon className="h-8 w-8" />}
        />
        <StatCard
          title="Lectures Conducted"
          value={stats?.lectures || 0}
          icon={<ClipboardDocumentListIcon className="h-8 w-8" />}
        />
      </div>

      <Card title="Upcoming Lectures">
        {stats?.upcomingLectures?.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {stats.upcomingLectures.map((lecture: any, idx: number) => (
              <li key={idx} className="py-3 flex justify-between">
                <span className="font-medium">{lecture.topic}</span>
                <span className="text-sm text-gray-500">{lecture.date}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No upcoming lectures</p>
        )}
      </Card>
    </div>
  );
}
