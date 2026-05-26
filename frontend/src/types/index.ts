export type Role = 'ADMIN' | 'TRAINER' | 'COUNSELLOR' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Student {
  id: string;
  userId: string;
  user: User;
  batchId?: string;
  batch?: Batch;
  counsellorId?: string;
  enrollmentDate?: string;
  mode: 'ONLINE' | 'OFFLINE';
  createdAt: string;
}

export interface Trainer {
  id: string;
  userId: string;
  user: User;
  specialization?: string;
  batches?: Batch[];
  createdAt: string;
}

export interface Counsellor {
  id: string;
  userId: string;
  user: User;
  students?: Student[];
  createdAt: string;
}

export interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  trainerId?: string;
  trainer?: Trainer;
  students?: Student[];
  modules?: Module[];
  status: string;
  createdAt: string;
}

export interface Module {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  batches?: Batch[];
  createdAt: string;
}

export interface Lecture {
  id: string;
  batchId: string;
  batch?: Batch;
  trainerId: string;
  topic: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: string;
  qrCode?: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  student?: Student;
  lectureId: string;
  lecture?: Lecture;
  status: string;
  markedAt: string;
}

export interface Evaluation {
  id: string;
  studentId: string;
  student?: Student;
  moduleId: string;
  module?: Module;
  theoryMarks?: number;
  practicalMarks?: number;
  projectMarks?: number;
  createdAt: string;
}

export interface MockInterview {
  id: string;
  studentId: string;
  student?: Student;
  trainerId: string;
  communication?: number;
  technical?: number;
  confidence?: number;
  feedback?: string;
  date: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  batchId: string;
  batch?: Batch;
  trainerId: string;
  dueDate?: string;
  fileUrl?: string;
  submissions?: Submission[];
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  student?: Student;
  fileUrl?: string;
  grade?: string;
  feedback?: string;
  submittedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  moduleId?: string;
  module?: Module;
  fileUrl: string;
  trainerId: string;
  createdAt: string;
}

export interface Fee {
  id: string;
  studentId: string;
  student?: Student;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  studentId: string;
  student?: Student;
  type: string;
  message: string;
  remarks?: string;
  resolved: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
