import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import { AuthResponse } from '../../shared/types/auth';
import { formatDayMonth, formatMoney, formatTime } from '../../shared/types/domain';
import { DemoBanner } from '../../shared/ui/DemoBanner';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/Skeleton';
import { MonthCalendar } from '../../shared/ui/MonthCalendar';
import { SiteFooter } from '../../shared/ui/SiteFooter';
import { SiteHeader } from '../../shared/ui/SiteHeader';
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

const STEP_LABELS = ['Shërbimi', 'Orari', 'Të dhënat', 'Konfirmo'];

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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setLoading(true);
    api<PublicCatalog>(`/public/businesses/${slug}`)
      .then((data) => {
        setCatalog(data);
        setServiceId(data.services[0]?.id ?? '');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Studioja nuk u gjet'))
      .finally(() => setLoading(false));
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
  const selectedStaff = offeredStaff.find((row) => row.id === staffId);
  const canBook = user?.role === 'CLIENT' && user.businessId === catalog?.business.id;

  async function onAuth(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!authForm.email.includes('@')) {
      setError('Shkruaj një email të vlefshëm.');
      return;
    }
    if (authForm.password.length < 8) {
      setError('Fjalëkalimi duhet të ketë të paktën 8 karaktere.');
      return;
    }
    setAuthLoading(true);
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
    } finally {
      setAuthLoading(false);
    }
  }

  async function onBook() {
    setError('');
    setSubmitting(true);
    try {
      await api(`/public/businesses/${slug}/bookings`, {
        method: 'POST',
        body: JSON.stringify({ staffId, serviceId, startAt }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rezervimi nuk u krijua');
    } finally {
      setSubmitting(false);
    }
  }

  function canAdvance(from: number) {
    if (from === 1) {
      return Boolean(serviceId);
    }
    if (from === 2) {
      return Boolean(startAt && staffId);
    }
    if (from === 3) {
      return canBook;
    }
    return false;
  }

  function goNext() {
    setError('');
    if (!canAdvance(step)) {
      if (step === 1) {
        setError('Zgjidh një shërbim.');
      } else if (step === 2) {
        setError('Zgjidh datën dhe orën.');
      } else {
        setError('Hyr si klient për të vazhduar.');
      }
      return;
    }
    setStep((value) => Math.min(4, value + 1));
  }

  function goBack() {
    setError('');
    setStep((value) => Math.max(1, value - 1));
  }

  return (
    <div className="page-shell">
      <DemoBanner />
      <SiteHeader />

      <main className="container booking-page">
        {loading && <Skeleton lines={5} />}
        {!catalog && !loading && error && <EmptyState title="Studioja nuk u gjet" body={error} />}

        {catalog && (
          <>
            <p className="muted text-sm">{catalog.business.name}</p>
            <h1 className="page-title mt-1">Rezervo një seancë</h1>
            <p className="muted mt-2">Oraret janë në {catalog.business.timezone}</p>

            {error && <ErrorState message={error} />}

            <ol className="stepper mt-6" aria-label="Hapat e rezervimit">
              {STEP_LABELS.map((label, index) => {
                const value = index + 1;
                return (
                  <li key={label} className={`stepper-item ${step === value ? 'is-current' : ''} ${step > value ? 'is-done' : ''}`}>
                    <span className="stepper-index">{value}</span>
                    <span className="stepper-label">{label}</span>
                  </li>
                );
              })}
            </ol>

            <div className="booking-mode mt-5 flex flex-wrap gap-2">
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
              <div className="card mt-6 p-8 text-center">
                <p className="muted text-sm">Rezervimi u dërgua</p>
                <h2 className="mt-2 text-2xl font-semibold">Je në listë</h2>
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
              <div className="wizard-desk mt-6">
                <div className="wizard-steps">
                  {step === 1 && (
                    <section className="card p-6">
                      <h2 className="text-lg font-semibold">1. Zgjidh shërbimin</h2>
                      <p className="muted mt-1 text-sm">Shërbimet e ofruara nga {catalog.business.name}</p>
                      {catalog.services.length === 0 && (
                        <EmptyState title="Nuk ka shërbime" body="Studioja nuk ka publikuar ende orare." />
                      )}
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
                  )}

                  {step === 2 && (
                    <section className="card p-6">
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
                      <div className="mt-4">
                        <MonthCalendar value={date} onChange={setDate} />
                      </div>
                      <div className="date-chip-row mt-4 flex gap-2 overflow-x-auto pb-2">
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
                      <div className="time-grid mt-4">
                        {slots.length === 0 ? (
                          <EmptyState title="Nuk ka orare" body="Nuk ka orare të lira këtë ditë." />
                        ) : (
                          slots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              className={`chip time-chip ${startAt === slot ? 'chip-on' : ''}`}
                              onClick={() => setStartAt(slot)}
                            >
                              {formatTime(slot)}
                            </button>
                          ))
                        )}
                      </div>
                    </section>
                  )}

                  {step === 3 && (
                    <section className="card p-6">
                      <h2 className="text-lg font-semibold">3. Të dhënat e klientit</h2>
                      <p className="muted mt-1 text-sm">Hyr ose krijo llogarinë për të konfirmuar</p>
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
                              <label className="field">
                                <span className="field-label">Emri</span>
                                <input className="input" autoComplete="given-name" value={authForm.firstName} onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })} required />
                              </label>
                              <label className="field">
                                <span className="field-label">Mbiemri</span>
                                <input className="input" autoComplete="family-name" value={authForm.lastName} onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })} required />
                              </label>
                            </>
                          )}
                          <label className="field sm:col-span-2">
                            <span className="field-label">Email</span>
                            <input className="input" type="email" autoComplete="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
                          </label>
                          <label className="field sm:col-span-2">
                            <span className="field-label">Fjalëkalimi</span>
                            <input className="input" type="password" minLength={8} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
                          </label>
                          <p className="muted text-xs sm:col-span-2">Provë: elira@email.com / password123</p>
                          <button className="btn btn-ghost sm:col-span-2" type="submit" disabled={authLoading} aria-busy={authLoading}>
                            {authLoading ? 'Duke u dërguar…' : authMode === 'login' ? 'Hyr' : 'Krijo llogarinë'}
                          </button>
                        </form>
                      )}
                    </section>
                  )}

                  {step === 4 && (
                    <section className="card p-6">
                      <h2 className="text-lg font-semibold">4. Konfirmo rezervimin</h2>
                      <p className="muted mt-1 text-sm">Kontrollo detajet para se ta dërgosh</p>
                      <ul className="mt-5 space-y-2 text-sm">
                        <li>{selectedService?.name}</li>
                        <li>
                          {startAt ? formatTime(startAt) : '—'} · {dateLabel(date)}
                        </li>
                        <li>{selectedStaff?.displayName}</li>
                        <li>
                          {user?.firstName} {user?.lastName}
                        </li>
                      </ul>
                    </section>
                  )}

                  <div className="wizard-nav">
                    <button className="btn btn-ghost" type="button" onClick={goBack} disabled={step <= 1}>
                      Mbrapa
                    </button>
                    {step < 4 && (
                      <button className="btn btn-primary" type="button" onClick={goNext}>
                        Vazhdo
                      </button>
                    )}
                    {step === 4 && (
                      <button
                        className="btn btn-confirm"
                        type="button"
                        disabled={!canBook || !startAt || !serviceId || !staffId || submitting}
                        aria-busy={submitting}
                        onClick={onBook}
                      >
                        {submitting ? 'Duke u dërguar…' : 'Dërgo rezervimin'}
                      </button>
                    )}
                  </div>
                </div>

                <aside className="card booking-summary p-6" aria-live="polite">
                  <p className="text-lg font-semibold">Përmbledhje</p>
                  <p className="muted mt-3 text-sm">{selectedService?.name ?? 'Zgjidh shërbimin'}</p>
                  <p className="muted text-sm">{selectedStaff?.displayName ?? 'Zgjidh stafin'}</p>
                  <p className="muted text-sm">
                    {startAt ? formatTime(startAt) : 'Zgjidh orën'} · {dateLabel(date)}
                  </p>
                  {selectedService && <p className="mt-4 text-xl font-semibold">{formatMoney(selectedService.priceCents)}</p>}
                </aside>
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
