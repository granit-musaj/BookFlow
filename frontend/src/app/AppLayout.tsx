import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { NotificationBell } from '../features/notifications/NotificationBell';
import { api } from '../shared/lib/api';
import { useAuth } from '../shared/auth/AuthContext';
import { Business } from '../shared/types/domain';
import { BrandMark } from '../shared/ui/BrandMark';
import { DemoBanner } from '../shared/ui/DemoBanner';
import { ThemeToggle } from '../shared/ui/ThemeToggle';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `side-link ${isActive ? 'side-link-on' : ''}`;

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    api<Business>('/businesses/me')
      .then(setBusiness)
      .catch(() => setBusiness(null));
  }, []);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <BrandMark to="/app" light />
        <div className="mt-8">
          <p className="sidebar-studio">{business?.name ?? 'Studio'}</p>
          <p className="sidebar-kicker mt-1 text-sm">Masazh & Jogë · Tiranë</p>
        </div>
        <nav className="app-nav">
          <NavLink to="/app" end className={linkClass}>
            Përmbledhje
          </NavLink>
          <NavLink to="/app/bookings" className={linkClass}>
            Rezervim i ri
          </NavLink>
          {user?.role !== 'CLIENT' && (
            <NavLink to="/app/clients" className={linkClass}>
              Klientët
            </NavLink>
          )}
          <NavLink to="/app/staff" className={linkClass}>
            Stafi
          </NavLink>
          {user?.role === 'OWNER' && (
            <NavLink to="/app/services" className={linkClass}>
              Shërbimet
            </NavLink>
          )}
          <NotificationBell />
        </nav>
        <div className="sidebar-foot sidebar-meta mt-8 text-sm">
          <p>
            {user?.firstName} {user?.lastName}
          </p>
          <button
            className="sidebar-action mt-2"
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Dil
          </button>
          <div className="mt-3">
            <ThemeToggle />
          </div>
          <DemoBanner tone="dark" />
        </div>
      </aside>

      <div className="app-main">
        <main className="px-5 py-6 md:px-8 md:py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
