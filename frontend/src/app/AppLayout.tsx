import { FormEvent, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { NotificationBell } from '../features/notifications/NotificationBell';
import { api } from '../shared/lib/api';
import { useAuth } from '../shared/auth/AuthContext';
import { BUSINESS } from '../shared/config/business';
import { Business } from '../shared/types/domain';
import { BrandMark } from '../shared/ui/BrandMark';
import { DemoBanner } from '../shared/ui/DemoBanner';
import { SiteFooter } from '../shared/ui/SiteFooter';
import { ThemeToggle } from '../shared/ui/ThemeToggle';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `side-link ${isActive ? 'side-link-on' : ''}`;

function RailIcon({ path }: { path: string }) {
  return (
    <svg className="side-icon" viewBox="0 0 24 24" aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [search, setSearch] = useState(params.get('q') ?? '');

  useEffect(() => {
    api<Business>('/businesses/me')
      .then(setBusiness)
      .catch(() => setBusiness(null));
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams(search ? { q: search } : {});
    navigate({ pathname: '/app', search: next.toString() });
  }

  return (
    <div className="app-shell">
      <div className="app-topbar">
        <BrandMark to="/app" />
        <button
          className="btn btn-ghost"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
          aria-label={menuOpen ? 'Mbyll menunë' : 'Hap menunë'}
          onClick={() => setMenuOpen((value) => !value)}
        >
          Menu
        </button>
      </div>
      <button
        type="button"
        className={`app-sidebar-scrim ${menuOpen ? 'is-open' : ''}`}
        aria-label="Mbyll menunë"
        tabIndex={menuOpen ? 0 : -1}
        onClick={closeMenu}
      />
      <aside id="app-sidebar" className={`app-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <BrandMark to="/app" light />
        <div className="sidebar-copy mt-8">
          <p className="sidebar-studio">{business?.name ?? BUSINESS.name}</p>
          <p className="sidebar-kicker mt-1 text-sm">{BUSINESS.tagline}</p>
        </div>
        <nav className="app-nav" aria-label="Navigimi i panelit" onClick={closeMenu}>
          <NavLink to="/app" end className={linkClass} data-tooltip="Përmbledhje" title="Përmbledhje">
            <RailIcon path="M4 10.5 12 4l8 6.5V20H4z" />
            <span className="side-text">Përmbledhje</span>
          </NavLink>
          <NavLink to="/app/bookings" className={linkClass} data-tooltip="Rezervim i ri" title="Rezervim i ri">
            <RailIcon path="M7 4v3M17 4v3M5 9h14M6 6h12a1 1 0 0 1 1 1v13H5V7a1 1 0 0 1 1-1z" />
            <span className="side-text">Rezervim i ri</span>
          </NavLink>
          {user?.role !== 'CLIENT' && (
            <NavLink to="/app/clients" className={linkClass} data-tooltip="Klientët" title="Klientët">
              <RailIcon path="M8 13a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 8 13zm8 0a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 16 13zM3 19a5 5 0 0 1 10 0M13 19a5 5 0 0 1 8 0" />
              <span className="side-text">Klientët</span>
            </NavLink>
          )}
          {user?.role !== 'CLIENT' && (
            <NavLink to="/app/staff" className={linkClass} data-tooltip="Stafi" title="Stafi">
              <RailIcon path="M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12zM5 20a7 7 0 0 1 14 0" />
              <span className="side-text">Stafi</span>
            </NavLink>
          )}
          {user?.role === 'OWNER' && (
            <NavLink to="/app/services" className={linkClass} data-tooltip="Shërbimet" title="Shërbimet">
              <RailIcon path="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
              <span className="side-text">Shërbimet</span>
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
              void logout().then(() => navigate('/login'));
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
        <div className="desk-chrome">
          <form className="desk-search" onSubmit={onSearch} role="search">
            <label className="sr-only" htmlFor="desk-search">
              Kërko rezervime
            </label>
            <input
              id="desk-search"
              className="input"
              placeholder="Kërko klient, shërbim ose staf"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <div className="user-menu">
            <button
              className="btn btn-ghost user-menu-trigger"
              type="button"
              aria-expanded={userOpen}
              aria-haspopup="menu"
              onClick={() => setUserOpen((value) => !value)}
            >
              {user?.firstName} {user?.lastName}
            </button>
            {userOpen && (
              <div className="card user-menu-panel p-4" role="menu">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="muted text-xs">{user?.email}</p>
                <div className="mt-3">
                  <ThemeToggle />
                </div>
                <button
                  className="btn btn-ghost mt-3 w-full"
                  type="button"
                  onClick={() => {
                    void logout().then(() => navigate('/login'));
                  }}
                >
                  Dil
                </button>
              </div>
            )}
          </div>
        </div>
        <main className="container py-6 md:py-8">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
