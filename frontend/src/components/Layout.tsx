import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BellIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { Role } from '@/types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: Record<Role, NavItem[]> = {
  ADMIN: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
    { name: 'Students', path: '/admin/students', icon: UserGroupIcon },
    { name: 'Trainers', path: '/admin/trainers', icon: AcademicCapIcon },
    { name: 'Counsellors', path: '/admin/counsellors', icon: UserGroupIcon },
    { name: 'Batches', path: '/admin/batches', icon: CalendarIcon },
    { name: 'Modules', path: '/admin/modules', icon: BookOpenIcon },
  ],
  TRAINER: [
    { name: 'Dashboard', path: '/trainer/dashboard', icon: HomeIcon },
    { name: 'Batches', path: '/trainer/batches', icon: CalendarIcon },
    { name: 'Lectures', path: '/trainer/lectures', icon: VideoCameraIcon },
    { name: 'Students', path: '/trainer/students', icon: UserGroupIcon },
    { name: 'Attendance', path: '/trainer/attendance', icon: ClipboardDocumentListIcon },
    { name: 'Evaluation', path: '/trainer/evaluation', icon: ChartBarIcon },
    { name: 'Mock Interviews', path: '/trainer/mock-interviews', icon: AcademicCapIcon },
    { name: 'Assignments', path: '/trainer/assignments', icon: DocumentTextIcon },
    { name: 'Resources', path: '/trainer/resources', icon: BookOpenIcon },
    { name: 'Reports', path: '/trainer/reports', icon: ChartBarIcon },
  ],
  COUNSELLOR: [
    { name: 'Dashboard', path: '/counsellor/dashboard', icon: HomeIcon },
    { name: 'Students', path: '/counsellor/students', icon: UserGroupIcon },
    { name: 'Fees', path: '/counsellor/fees', icon: CurrencyDollarIcon },
    { name: 'Alerts', path: '/counsellor/alerts', icon: ExclamationTriangleIcon },
  ],
  STUDENT: [
    { name: 'Dashboard', path: '/student/dashboard', icon: HomeIcon },
    { name: 'Attendance', path: '/student/attendance', icon: ClipboardDocumentListIcon },
    { name: 'Performance', path: '/student/performance', icon: ChartBarIcon },
    { name: 'Assignments', path: '/student/assignments', icon: DocumentTextIcon },
    { name: 'Resources', path: '/student/resources', icon: BookOpenIcon },
    { name: 'Lectures', path: '/student/lectures', icon: VideoCameraIcon },
    { name: 'Notifications', path: '/student/notifications', icon: BellIcon },
  ],
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = user ? navItems[user.role] : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-indigo-600">Institute ERP</h1>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-4 px-3 space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-700' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{user?.name}</span>
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{user?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
