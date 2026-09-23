import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/auth/AuthContext';
import { DEMO_SLUG, demoClientAuth, demoOwnerAuth, enableDemo } from '../../shared/lib/demo';
import { DemoBanner } from '../../shared/ui/DemoBanner';

export function HomePage() {
  const { user, setSession } = useAuth();
  const navigate = useNavigate();
  const [slug, setSlug] = useState(DEMO_SLUG);

  function onFind(event: FormEvent) {
    event.preventDefault();
    const value = slug.trim().toLowerCase();
    if (value) {
      navigate(`/b/${value}`);
    }
  }

  function openOwnerPreview() {
    enableDemo();
    setSession(demoOwnerAuth());
    navigate('/app/bookings');
  }

  function openClientPreview() {
    enableDemo();
    setSession(demoClientAuth());
    navigate(`/b/${DEMO_SLUG}`);
  }

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <DemoBanner />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
          BookFlow
        </span>
        <nav className="flex gap-3 text-sm">
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
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-6 lg:grid-cols-2">
        <div>
          <p className="muted text-sm">Për studio masazhi, jogë dhe salone</p>
          <h1 className="page-title mt-3 text-5xl">Rezervime të qeta, si studioja jote.</h1>
          <p className="muted mt-4 max-w-md text-lg">
            Klienti zgjedh shërbimin dhe orën. Ti sheh ditën, stafin dhe kërkesat — pa Excel dhe pa dy
            rezervime në të njëjtën orë.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="btn btn-primary" type="button" onClick={openOwnerPreview}>
              Provo si pronar
            </button>
            <button className="btn btn-ghost" type="button" onClick={openClientPreview}>
              Provo si klient
            </button>
          </div>
          <form onSubmit={onFind} className="mt-8 flex max-w-md gap-2">
            <input
              className="input"
              placeholder="studio-aureel"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <button className="btn btn-ghost" type="submit">
              Hap
            </button>
          </form>
        </div>

        <div className="card p-6">
          <p className="muted text-sm">Studio Aureel</p>
          <p className="mt-1 text-2xl font-semibold">Rezervim i ri</p>
          <div className="mt-6 space-y-4">
            {[
              ['Masazh terapeutik', '50 min', '45 €'],
              ['Seancë jogë (privat)', '60 min', '35 €'],
              ['Masazh + aromaterapi', '75 min', '60 €'],
            ].map(([name, meta, price]) => (
              <div key={name} className="flex items-center justify-between border-t border-[var(--line)] pt-4 first:border-0 first:pt-0">
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="muted text-sm">{meta}</p>
                </div>
                <span>{price}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {['09:00', '11:00', '14:00', '15:30'].map((time) => (
              <span key={time} className="chip">
                {time}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
