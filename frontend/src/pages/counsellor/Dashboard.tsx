import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import api from '@/services/api';
import { UserGroupIcon, CurrencyDollarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function CounsellorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/counsellor/dashboard');
        setStats(res.data.data);
      } catch {
        setStats({ activeStudents: 0, pendingFees: 0, atRiskStudents: 0, recentAlerts: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Counsellor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Students" value={stats?.activeStudents || 0} icon={<UserGroupIcon className="h-8 w-8" />} />
        <StatCard title="Pending Fees" value={`$${stats?.pendingFees || 0}`} icon={<CurrencyDollarIcon className="h-8 w-8" />} />
        <StatCard title="At-Risk Students" value={stats?.atRiskStudents || 0} icon={<ExclamationTriangleIcon className="h-8 w-8" />} changeType="negative" />
      </div>

      <Card title="Recent Alerts">
        {stats?.recentAlerts?.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {stats.recentAlerts.map((alert: any, idx: number) => (
              <li key={idx} className="py-3">
                <p className="font-medium text-sm">{alert.message}</p>
                <p className="text-xs text-gray-500">{alert.studentName} - {alert.type}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No recent alerts</p>
        )}
      </Card>
    </div>
  );
}
