import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';

function renderProtectedRoute(allowedRoles?: ('ADMIN' | 'TRAINER' | 'COUNSELLOR' | 'STUDENT')[]) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ProtectedRoute allowedRoles={allowedRoles}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to login when not authenticated', () => {
    renderProtectedRoute();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated with correct role', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN' }));
    renderProtectedRoute(['ADMIN']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects when authenticated with wrong role', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'student@test.com', name: 'Student', role: 'STUDENT' }));
    renderProtectedRoute(['ADMIN']);
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
