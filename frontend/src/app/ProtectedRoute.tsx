import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../shared/auth/AuthContext';

export function ProtectedRoute() {
  const { user, ready } = useAuth();
  if (!ready) {
    return null;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
