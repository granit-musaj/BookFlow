import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../shared/auth/AuthContext';
import { Role } from '../shared/types/auth';
import { Skeleton } from '../shared/ui/Skeleton';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="container py-10">
        <Skeleton lines={4} />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}
