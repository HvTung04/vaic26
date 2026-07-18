import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageSkeleton } from '@/components/PageSkeleton';
import { useAuth } from './AuthContext';
import type { UserRole } from './types';

/**
 * Route boundary: blocks unauthenticated users (→ /login) and, when `role` is
 * given, users whose role doesn't match (→ their own home).
 */
export function RequireAuth({ role }: { role?: UserRole }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageSkeleton />;
  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? '/dashboard' : '/student'} replace />;
  }
  return <Outlet />;
}
