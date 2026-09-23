import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import { AuthResponse } from '../../shared/types/auth';
import { formatDayMonth, formatMoney, formatTime } from '../../shared/types/domain';
import { BrandMark } from '../../shared/ui/BrandMark';
import { DemoBanner } from '../../shared/ui/DemoBanner';
import { SlotLedger } from '../../shared/ui/SlotLedger';
import { ThemeToggle } from '../../shared/ui/ThemeToggle';
import { AssistantChat } from './AssistantChat';

type PublicService = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
};

type PublicStaff = {
  id: string;
  displayName: string;
  serviceIds: string[];
};

type PublicCatalog = {
  business: { id: string; name: string; slug: string; timezone: string };
  services: PublicService[];
  staff: PublicStaff[];
};

function upcomingDates(days: number) {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const pad = (value: number) => String(value).padStart(2, '0');
    result.push(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
  }
  return result;
}

function dateLabel(value: string) {
  return formatDayMonth(new Date(`${value}T12:00:00`));
}

export function PublicBookingPage() {
  const { slug = '' } = useParams();
  const { user, setSession, logout } = useAuth();
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [error, setError] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState(upcomingDates(1)[0]);
  const [slots, setSlots] = useState<string[]>([]);
  const [startAt, setStartAt] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authForm, setAuthForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState<'form' | 'assistant'>('form');

  useEffect(() => {
    api<PublicCatalog>(`/public/businesses/${slug}`)
      .then((data) => {
        setCatalog(data);
        setServiceId(data.services[0]?.id ?? '');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Studioja nuk u gjet'));
  }, [slug]);

  const offeredStaff = useMemo(
    () => catalog?.staff.filter((row) => row.serviceIds.includes(serviceId)) ?? [],
    [catalog, serviceId],
  );

  useEffect(() => {
    if (!offeredStaff.some((row) => row.id === staffId)) {
      setStaffId(offeredStaff[0]?.id ?? '');
    }
  }, [offeredStaff, staffId]);

  useEffect(() => {
    if (!slug || !serviceId || !staffId || !date) {
      setSlots([]);
      return;
    }

    const params = new URLSearchParams({ serviceId, staffId, date });
    api<{ slots: Array<{ startAt: string }> }>(`/public/businesses/${slug}/slots?${params}`)
      .then((result) => {
        setSlots(result.slots.map((slot) => slot.startAt));
        setStartAt('');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Oraret nuk u ngarkuan'));
  }, [slug, serviceId, staffId, date]);

  const selectedService = catalog?.services.find((service) => service.id === serviceId);
  const canBook = user?.role === 'CLIENT' && user.businessId === catalog?.business.id;

  async function onAuth(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const body =
        authMode === 'login'
          ? { email: authForm.email, password: authForm.password }
          : { ...authForm, role: 'CLIENT', businessSlug: slug };
      const result = await api<AuthResponse>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hyrja dështoi');
    }
  }

  async function onBook() {
    setError('');
    try {
      await api(`/public/businesses/${slug}/bookings`, {
        method: 'POST',
        body: JSON.stringify({ staffId, serviceId, startAt }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rezervimi nuk u krijua');
    }
  }

  return (
    <div className="page-shell">
      <DemoBanner />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <BrandMark />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/app" className="muted text-sm">
            Hyr si staf
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        {!catalog && !error && <p className="muted">Po ngarkohet studioja…</p>}
        {!catalog && error && (
          <div className="card p-8">
            <p>{error}</p>
            <Link to="/" className="mt-4 inline-block">
              Kthehu në fillim
            </Link>
          </div>
        )}

        {catalog && (
          <>
            <p className="muted text-sm">{catalog.business.name}</p>
            <h1 className="page-title mt-1">Rezervo një seancë</h1>
            <p className="muted mt-2">Oraret janë në {catalog.business.timezone}</p>

            {error && <p className="text-danger mt-4 text-sm">{error}</p>}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className={`chip ${mode === 'form' ? 'chip-on' : ''}`}
                onClick={() => setMode('form')}
              >
                Rezervo vetë
              </button>
              <button
                type="button"
                className={`chip ${mode === 'assistant' ? 'chip-on' : ''}`}
                onClick={() => setMode('assistant')}
              >
                Pyet asistentin
              </button>
            </div>

            {done ? (
              <div className="card mt-6 p-8">
                <h2 className="text-2xl font-semibold">Je në listë</h2>
                <p className="muted mt-2">
                  {selectedService?.name} pret konfirmim. Studioja do të përgjigjet së shpejti.
                </p>
                <Link className="btn btn-primary mt-6" to="/app/bookings">
                  Shiko rezervimet e mia
                </Link>
              </div>
            ) : mode === 'assistant' ? (
              <AssistantChat slug={slug} canBook={canBook} onBooked={() => setDone(true)} />
            ) : (
              <>
                <section className="card mt-6 p-6">
                  <h2 className="text-lg font-semibold">1. Zgjidh shërbimin</h2>
                  <p className="muted mt-1 text-sm">Shërbimet e ofruara nga {catalog.business.name}</p>
                  <ul className="mt-5 divide-y divide-[var(--line)]">
                    {catalog.services.map((service) => (
                      <li key={service.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between py-4 text-left"
                          onClick={() => setServiceId(service.id)}
                        >
                          <span>
                            <span className="flex items-center gap-3 font-medium">
                              <span
                                className={`h-3.5 w-3.5 rounded-sm border ${
                                  serviceId === service.id
                                    ? 'border-[var(--accent)] bg-[var(--accent)]'
                                    : 'border-[var(--line)]'
                                }`}
                              />
                              {service.name}
                            </span>
                            <span className="muted ml-7 mt-1 block text-sm">{service.durationMinutes} minuta</span>
                          </span>
                          <span className="text-lg">{formatMoney(service.priceCents)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="card mt-5 p-6">
                  <h2 className="text-lg font-semibold">2. Zgjidh orarin</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {offeredStaff.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        className={`chip ${staffId === row.id ? 'chip-on' : ''}`}
                        onClick={() => setStaffId(row.id)}
                      >
                        {row.displayName}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {upcomingDates(10).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`chip shrink-0 ${date === value ? 'chip-on' : ''}`}
                        onClick={() => setDate(value)}
                      >
                        {dateLabel(value)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    {slots.length === 0 ? (
                      <p className="muted text-sm">Nuk ka orare të lira këtë ditë.</p>
                    ) : (
                      <SlotLedger
                        slots={slots}
                        selected={startAt}
                        onSelect={setStartAt}
                        label={formatTime}
                      />
                    )}
                  </div>
                </section>

                <section className="card mt-5 p-6">
                  <h2 className="text-lg font-semibold">3. Konfirmo rezervimin</h2>
                  <p className="muted mt-1 text-sm">Të dhënat e klientit</p>
                  {canBook ? (
                    <p className="mt-4 font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                  ) : user ? (
                    <div className="mt-3">
                      <p className="muted">Kjo llogari nuk mund të rezervojë këtu.</p>
                      <button className="mt-2 underline" type="button" onClick={logout}>
                        Dil
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={onAuth} className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="flex gap-4 text-sm sm:col-span-2">
                        <button type="button" className={authMode === 'register' ? 'font-medium' : 'muted'} onClick={() => setAuthMode('register')}>
                          Klient i ri
                        </button>
                        <button type="button" className={authMode === 'login' ? 'font-medium' : 'muted'} onClick={() => setAuthMode('login')}>
                          Kam llogari
                        </button>
                      </div>
                      {authMode === 'register' && (
                        <>
                          <input className="input" placeholder="Emri" value={authForm.firstName} onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })} required />
                          <input className="input" placeholder="Mbiemri" value={authForm.lastName} onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })} required />
                        </>
                      )}
                      <input className="input" type="email" placeholder="Email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
                      <input className="input" type="password" minLength={8} placeholder="Fjalëkalimi" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
                      <p className="muted text-xs sm:col-span-2">Provë: elira@email.com / password123</p>
                      <button className="btn btn-ghost sm:col-span-2" type="submit">
                        {authMode === 'login' ? 'Hyr' : 'Krijo llogarinë'}
                      </button>
                    </form>
                  )}
                  <button
                    className="btn btn-confirm mt-5 w-full"
                    type="button"
                    disabled={!canBook || !startAt || !serviceId || !staffId}
                    onClick={onBook}
                  >
                    Dërgo rezervimin
                  </button>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
