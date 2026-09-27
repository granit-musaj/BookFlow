import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BrandMark } from './BrandMark';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <BrandMark />
        <button
          className="btn btn-ghost menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? 'Mbyll menunë' : 'Hap menunë'}
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
        <nav id="site-nav" className={`site-nav ${open ? 'is-open' : ''}`}>
          <ThemeToggle />
          <Link className="muted text-sm" to="/#si-funksionon">
            Si funksionon
          </Link>
          {user ? (
            <Link className="btn btn-primary" to="/app">
              Paneli
            </Link>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">
                Hyr
              </Link>
              <Link className="btn btn-primary" to="/register">
                Hap studio
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
