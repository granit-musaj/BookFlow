import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { NotificationBell } from '../features/notifications/NotificationBell';
import { api } from '../shared/lib/api';
import { useAuth } from '../shared/auth/AuthContext';
import { Business } from '../shared/types/domain';
import { DemoBanner } from '../shared/ui/DemoBanner';

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
    <div className="min-h-screen bg-[var(--cream)] md:flex">
      <aside className="bg-[var(--navy)] px-5 py-6 text-white md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
          <span className="text-lg font-semibold">BookFlow</span>
        </div>
        <div className="mt-8">
          <p className="text-lg font-medium">{business?.name ?? 'Studio'}</p>
          <p className="mt-1 text-sm text-white/45">Masazh & Jogë · Tiranë</p>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
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
        <div className="mt-8 text-sm text-white/50 md:mt-auto">
          <p>
            {user?.firstName} {user?.lastName}
          </p>
          <button
            className="mt-2 text-white/80"
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Dil
          </button>
          <DemoBanner tone="dark" />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <main className="px-5 py-6 md:px-8 md:py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
