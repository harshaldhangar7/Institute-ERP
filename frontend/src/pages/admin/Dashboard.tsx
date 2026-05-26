import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import api from '@/services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { UserGroupIcon, AcademicCapIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data.data);
      } catch {
        setStats({ totalStudents: 0, totalTrainers: 0, activeBatches: 0, totalRevenue: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Spinner />;

  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Attendance %',
        data: [85, 88, 82, 90, 87, 92],
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
      },
    ],
  };

  const doughnutData = {
    labels: ['Paid', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={<UserGroupIcon className="h-8 w-8" />}
        />
        <StatCard
          title="Total Trainers"
          value={stats?.totalTrainers || 0}
          icon={<AcademicCapIcon className="h-8 w-8" />}
        />
        <StatCard
          title="Active Batches"
          value={stats?.activeBatches || 0}
          icon={<CalendarIcon className="h-8 w-8" />}
        />
        <StatCard
          title="Fee Collection"
          value={`$${stats?.totalRevenue || 0}`}
          icon={<CurrencyDollarIcon className="h-8 w-8" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Attendance Overview">
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </Card>
        <Card title="Fee Collection Status">
          <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </Card>
      </div>
    </div>
  );
}
