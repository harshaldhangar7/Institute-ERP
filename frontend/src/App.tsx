import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Spinner } from '@/components/common/Spinner';

// Lazy-loaded pages
const Login = lazy(() => import('@/pages/Login'));

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminStudents = lazy(() => import('@/pages/admin/Students'));
const AdminTrainers = lazy(() => import('@/pages/admin/Trainers'));
const AdminCounsellors = lazy(() => import('@/pages/admin/Counsellors'));
const AdminBatches = lazy(() => import('@/pages/admin/Batches'));
const AdminModules = lazy(() => import('@/pages/admin/Modules'));

// Trainer
const TrainerDashboard = lazy(() => import('@/pages/trainer/Dashboard'));
const TrainerBatches = lazy(() => import('@/pages/trainer/Batches'));
const TrainerLectures = lazy(() => import('@/pages/trainer/Lectures'));
const TrainerStudents = lazy(() => import('@/pages/trainer/Students'));
const TrainerAttendance = lazy(() => import('@/pages/trainer/Attendance'));
const TrainerEvaluation = lazy(() => import('@/pages/trainer/Evaluation'));
const TrainerMockInterviews = lazy(() => import('@/pages/trainer/MockInterviews'));
const TrainerAssignments = lazy(() => import('@/pages/trainer/Assignments'));
const TrainerResources = lazy(() => import('@/pages/trainer/Resources'));
const TrainerReports = lazy(() => import('@/pages/trainer/Reports'));

// Counsellor
const CounsellorDashboard = lazy(() => import('@/pages/counsellor/Dashboard'));
const CounsellorStudents = lazy(() => import('@/pages/counsellor/Students'));
const CounsellorFees = lazy(() => import('@/pages/counsellor/Fees'));
const CounsellorAlerts = lazy(() => import('@/pages/counsellor/Alerts'));

// Student
const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'));
const StudentAttendance = lazy(() => import('@/pages/student/Attendance'));
const StudentPerformance = lazy(() => import('@/pages/student/Performance'));
const StudentAssignments = lazy(() => import('@/pages/student/Assignments'));
const StudentResources = lazy(() => import('@/pages/student/Resources'));
const StudentLectures = lazy(() => import('@/pages/student/Lectures'));
const StudentNotifications = lazy(() => import('@/pages/student/Notifications'));

function App() {
  return (
    <Suspense fallback={<Spinner size="lg" />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><AdminStudents /></Layout></ProtectedRoute>} />
        <Route path="/admin/trainers" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><AdminTrainers /></Layout></ProtectedRoute>} />
        <Route path="/admin/counsellors" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><AdminCounsellors /></Layout></ProtectedRoute>} />
        <Route path="/admin/batches" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><AdminBatches /></Layout></ProtectedRoute>} />
        <Route path="/admin/modules" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><AdminModules /></Layout></ProtectedRoute>} />

        {/* Trainer Routes */}
        <Route path="/trainer/dashboard" element={<ProtectedRoute allowedRoles={['TRAINER']}><Layout><TrainerDashboard /></Layout></ProtectedRoute>} />
        <Route path="/trainer/batches" element={<ProtectedRoute allowedRoles={['TRAINER']}><Layout><TrainerBatches /></Layout></ProtectedRoute>} />
        <Route path="/trainer/lectures" element={<ProtectedRoute allowedRoles={['TRAINER']}><Layout><TrainerLectures /></Layout></ProtectedRoute>} />
        <Route path="/trainer/students" element={<ProtectedRoute allowedRoles={['TRAINER']}><Layout><TrainerStudents /></Layout></ProtectedRoute>} />
        <Route path="/trainer/attendance" element={<ProtectedRoute allowedRoles={['TRAINER']}><Layout><TrainerAttendance /></Layout></ProtectedRoute>} />
        <Route path="/trainer/evaluation" element={<ProtectedRoute allowedRoles={['TRAINER']}><Layout><TrainerEvaluation /></Layout></ProtectedRoute>} />
        <Route path="/trainer/mock-interviews" element={<ProtectedRoute allowedRoles={['TRAINER']}><Layout><TrainerMockInterviews /></Layout></ProtectedRoute>} />
        <Route path="/trainer/assignments" element={<ProtectedRoute allowedRoles={['TRAINER']}><Layout><TrainerAssignments /></Layout></ProtectedRoute>} />
        <Route path="/trainer/resources" element={<ProtectedRoute allowedRoles={['TRAINER']}><Layout><TrainerResources /></Layout></ProtectedRoute>} />
        <Route path="/trainer/reports" element={<ProtectedRoute allowedRoles={['TRAINER']}><Layout><TrainerReports /></Layout></ProtectedRoute>} />

        {/* Counsellor Routes */}
        <Route path="/counsellor/dashboard" element={<ProtectedRoute allowedRoles={['COUNSELLOR']}><Layout><CounsellorDashboard /></Layout></ProtectedRoute>} />
        <Route path="/counsellor/students" element={<ProtectedRoute allowedRoles={['COUNSELLOR']}><Layout><CounsellorStudents /></Layout></ProtectedRoute>} />
        <Route path="/counsellor/fees" element={<ProtectedRoute allowedRoles={['COUNSELLOR']}><Layout><CounsellorFees /></Layout></ProtectedRoute>} />
        <Route path="/counsellor/alerts" element={<ProtectedRoute allowedRoles={['COUNSELLOR']}><Layout><CounsellorAlerts /></Layout></ProtectedRoute>} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><Layout><StudentDashboard /></Layout></ProtectedRoute>} />
        <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['STUDENT']}><Layout><StudentAttendance /></Layout></ProtectedRoute>} />
        <Route path="/student/performance" element={<ProtectedRoute allowedRoles={['STUDENT']}><Layout><StudentPerformance /></Layout></ProtectedRoute>} />
        <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={['STUDENT']}><Layout><StudentAssignments /></Layout></ProtectedRoute>} />
        <Route path="/student/resources" element={<ProtectedRoute allowedRoles={['STUDENT']}><Layout><StudentResources /></Layout></ProtectedRoute>} />
        <Route path="/student/lectures" element={<ProtectedRoute allowedRoles={['STUDENT']}><Layout><StudentLectures /></Layout></ProtectedRoute>} />
        <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={['STUDENT']}><Layout><StudentNotifications /></Layout></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
