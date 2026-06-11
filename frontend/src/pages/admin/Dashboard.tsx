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
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Spinner />;

  const attendanceOverview = stats?.attendanceOverview || { present: 0, absent: 0, late: 0 };
  const totalAttendance = attendanceOverview.present + attendanceOverview.absent + attendanceOverview.late;

  const feeStatus = stats?.feeCollectionStatus || { totalAmount: 0, paidAmount: 0, pendingAmount: 0 };

  const barData = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [
      {
        label: 'Attendance Records',
        data: [attendanceOverview.present, attendanceOverview.absent, attendanceOverview.late],
        backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(245, 158, 11, 0.7)'],
      },
    ],
  };

  const doughnutData = {
    labels: ['Collected', 'Pending'],
    datasets: [
      {
        data: [feeStatus.paidAmount, feeStatus.pendingAmount],
        backgroundColor: ['#10B981', '#F59E0B'],
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
          title="Fee Collected"
          value={`₹${feeStatus.paidAmount.toLocaleString()}`}
          icon={<CurrencyDollarIcon className="h-8 w-8" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Attendance Overview">
          {totalAttendance > 0 ? (
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          ) : (
            <p className="text-gray-500 text-center py-8">No attendance data yet</p>
          )}
        </Card>
        <Card title="Fee Collection Status">
          {feeStatus.totalAmount > 0 ? (
            <>
              <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
              <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm">
                <div>
                  <p className="text-gray-500">Total Fees</p>
                  <p className="font-semibold">₹{feeStatus.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pending</p>
                  <p className="font-semibold text-amber-600">₹{feeStatus.pendingAmount.toLocaleString()}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">No fee data yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}
