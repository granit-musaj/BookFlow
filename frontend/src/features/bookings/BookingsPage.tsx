import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import {
  Booking,
  Business,
  ClientUser,
  formatDayMonth,
  formatMoney,
  formatTime,
  isSameDay,
  Service,
  shortName,
  StaffMember,
  STATUS_LABEL,
} from '../../shared/types/domain';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Modal } from '../../shared/ui/Modal';
import { MonthCalendar } from '../../shared/ui/MonthCalendar';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/Skeleton';
import { SlotLedger } from '../../shared/ui/SlotLedger';
import { useToast } from '../../shared/ui/Toast';

function todayKey() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateHeading(value: string) {
  return formatDayMonth(new Date(`${value}T12:00:00`));
}

export function BookingsPage() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(todayKey);
  const [startAt, setStartAt] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsReady, setSlotsReady] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | Booking['status']>('ALL');
  const [pendingCancel, setPendingCancel] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  async function load() {
    const [biz, bookingRows, staffRows, serviceRows] = await Promise.all([
      api<Business>('/businesses/me'),
      api<Booking[]>('/bookings'),
      api<StaffMember[]>('/staff'),
      api<Service[]>('/services'),
    ]);
    setBusiness(biz);
    setBookings(bookingRows);
    setStaff(staffRows);
    setServices(serviceRows.filter((row) => row.isActive));
    if (user?.role !== 'CLIENT') {
      setClients(await api<ClientUser[]>('/users/clients'));
    }
  }

  useEffect(() => {
    load()
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Nuk u ngarkua'))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!serviceId && services[0]) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  const offeredStaff = useMemo(
    () => staff.filter((row) => row.isActive && row.services.some((service) => service.id === serviceId)),
    [staff, serviceId],
  );

  useEffect(() => {
    if (!offeredStaff.some((row) => row.id === staffId)) {
      setStaffId(offeredStaff[0]?.id ?? '');
    }
  }, [offeredStaff, staffId]);

  useEffect(() => {
    if (!clientId && clients[0]) {
      setClientId(clients.find((row) => row.firstName === 'Elira')?.id ?? clients[0].id);
    }
  }, [clients, clientId]);

  const todayBookings = useMemo(
    () =>
      bookings
        .filter((row) => isSameDay(row.startAt) && row.status !== 'CANCELLED')
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [bookings],
  );

  const filteredBookings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((row) => {
      if (status !== 'ALL' && row.status !== status) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return `${row.service.name} ${row.staff.displayName} ${row.client.firstName} ${row.client.lastName}`
        .toLowerCase()
        .includes(needle);
    });
  }, [bookings, query, status]);

  useEffect(() => {
    if (!business?.slug || !serviceId || !staffId || !date) {
      setSlots([]);
      setStartAt('');
      setSlotsReady(true);
      setSlotsError('');
      return;
    }

    let cancelled = false;
    setSlotsReady(false);
    setSlotsError('');
    const params = new URLSearchParams({ serviceId, staffId, date });
    api<{ slots: Array<{ startAt: string }> }>(`/public/businesses/${business.slug}/slots?${params}`)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setSlots(result.slots.map((slot) => slot.startAt));
        setStartAt('');
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSlots([]);
          setStartAt('');
          setSlotsError(err instanceof Error ? err.message : 'Oraret nuk u ngarkuan');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSlotsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [business?.slug, serviceId, staffId, date]);

  const stats = useMemo(() => {
    const hours = todayBookings.map((row) => formatTime(row.startAt));
    const hourCounts = hours.reduce<Record<string, number>>((acc, hour) => {
      acc[hour] = (acc[hour] ?? 0) + 1;
      return acc;
    }, {});
    const popular = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    const value = todayBookings.reduce((sum, row) => sum + row.service.priceCents, 0);
    return { count: todayBookings.length, popular, value };
  }, [todayBookings]);

  async function createBooking() {
    setError('');
    if (!serviceId || !staffId || !startAt) {
      setError('Zgjidh shërbimin dhe orarin.');
      return;
    }
    setCreating(true);
    try {
      await api<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          staffId,
          serviceId,
          startAt,
          ...(user?.role !== 'CLIENT' ? { clientId } : {}),
        }),
      });
      setStartAt('');
      toast('Rezervimi u krijua.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rezervimi nuk u krijua');
    } finally {
      setCreating(false);
    }
  }

  async function confirm(id: string) {
    setError('');
    try {
      await api(`/bookings/${id}/confirm`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Konfirmimi dështoi');
    }
  }

  async function cancel(id: string) {
    setError('');
    try {
      await api(`/bookings/${id}/cancel`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anulimi dështoi');
    }
  }

  return (
    <section>
      <PageHeader
        title="Rezervim i ri"
        subtitle={
          <>
            Krijo një rezervim manualisht ose shiko si e sheh klienti në{' '}
            {business && (
              <Link className="font-medium text-[var(--ink)] underline" to={`/b/${business.slug}`}>
                faqen publike
              </Link>
            )}
            .
          </>
        }
      />

      {!ready && <Skeleton lines={4} />}
      {error && <ErrorState message={error} />}

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px]">
        <label className="field">
          <span className="field-label">Kërko</span>
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Klient, shërbim, staf" />
        </label>
        <label className="field">
          <span className="field-label">Statusi</span>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="ALL">Të gjitha</option>
            <option value="PENDING">Në pritje</option>
            <option value="CONFIRMED">Konfirmuar</option>
            <option value="CANCELLED">Anuluar</option>
          </select>
        </label>
      </div>

      <div className="stat-strip mb-6 grid gap-4 md:grid-cols-3">
        {[
          [String(stats.count), 'Rezervime sot'],
          [stats.popular, 'Ora më e kërkuar'],
          [formatMoney(stats.value), 'Vlera e ditës'],
        ].map(([value, label]) => (
          <div key={label} className="card px-6 py-5">
            <p className="stat-value">{value}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <p className="text-lg font-semibold">Rezervimet e sotme</p>
        <p className="muted mt-1 text-sm">Përditësohet automatikisht kur shtohet një rezervim i ri</p>
        <ul className="mt-5 space-y-4">
          {todayBookings.map((booking) => (
            <li key={booking.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{shortName(booking.client.firstName, booking.client.lastName)}</p>
                <p className="muted text-sm">
                  {booking.service.name} · {formatTime(booking.startAt)}
                </p>
              </div>
              {user?.role !== 'CLIENT' && booking.status === 'PENDING' ? (
                <button className="btn btn-confirm" type="button" onClick={() => confirm(booking.id)}>
                  Konfirmo
                </button>
              ) : (
                <span className="status-pill" data-status={booking.status}>
                  {STATUS_LABEL[booking.status]}
                </span>
              )}
            </li>
          ))}
          {todayBookings.length === 0 && <li className="muted text-sm">Nuk ka rezervime sot.</li>}
        </ul>
      </div>

      <div className="card mt-5 p-6">
        <p className="text-lg font-semibold">1. Zgjidh shërbimin</p>
        <p className="muted mt-1 text-sm">Shërbimet e ofruara nga {business?.name ?? 'studio'}</p>
        <ul className="mt-5 divide-y divide-[var(--line)]">
          {services.map((service) => (
            <li key={service.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between py-4 text-left ${
                  serviceId === service.id ? 'opacity-100' : 'opacity-80'
                }`}
                onClick={() => setServiceId(service.id)}
              >
                <span>
                  <span className="flex items-center gap-3 font-medium">
                    <span
                      className={`h-3.5 w-3.5 rounded-sm border ${
                        serviceId === service.id ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--line)]'
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
      </div>

      <div className="card mt-5 p-6">
        <p className="text-lg font-semibold">2. Zgjidh orarin</p>
        <p className="muted mt-1 text-sm">Disponueshmëria e stafit për {dateHeading(date)}</p>
        {offeredStaff.length > 1 && (
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
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {['sot', 'nesër'].map((label, index) => {
            const value = (() => {
              const next = new Date();
              next.setDate(next.getDate() + index);
              const pad = (n: number) => String(n).padStart(2, '0');
              return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
            })();
            return (
              <button
                key={label}
                type="button"
                className={`chip ${date === value ? 'chip-on' : ''}`}
                onClick={() => setDate(value)}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <MonthCalendar value={date} onChange={setDate} />
        </div>
        <div className="mt-4">
          {!slotsReady && <Skeleton lines={3} />}
          {slotsReady && slotsError && <ErrorState message={slotsError} />}
          {slotsReady && !slotsError && slots.length === 0 && (
            <EmptyState title="Nuk ka orare të lira" body="Nuk ka orare të lira këtë ditë." />
          )}
          {slotsReady && !slotsError && slots.length > 0 && (
            <SlotLedger slots={slots} selected={startAt} onSelect={setStartAt} label={formatTime} />
          )}
        </div>
      </div>

      <div className="card mt-5 p-6">
        <p className="text-lg font-semibold">3. Të dhënat e klientit</p>
        <p className="muted mt-1 text-sm">Kush do të vijë në seancë</p>
        {user?.role === 'CLIENT' ? (
          <p className="mt-5 font-medium">
            {user.firstName} {user.lastName}
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-[var(--line)]">
            {clients.map((client) => (
              <li key={client.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-4 text-left"
                  onClick={() => setClientId(client.id)}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`h-3.5 w-3.5 rounded-sm border ${
                        clientId === client.id ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--line)]'
                      }`}
                    />
                    <span className="font-medium">{shortName(client.firstName, client.lastName)}</span>
                  </span>
                  <span className="muted">{client.phone ?? client.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mt-5 p-6">
        <p className="text-lg font-semibold">4. Konfirmo rezervimin</p>
        <p className="muted mt-1 text-sm">Kontrollo zgjedhjen para se ta dërgosh</p>
        <p className="mt-4 font-medium">
          {services.find((row) => row.id === serviceId)?.name ?? 'Zgjidh shërbimin'}
        </p>
        <p className="muted mt-1 text-sm">
          {startAt ? formatTime(startAt) : 'Zgjidh orën'} · {dateHeading(date)}
        </p>
        <button
          className="btn btn-confirm mt-5"
          type="button"
          onClick={createBooking}
          disabled={!startAt || !serviceId || creating}
          aria-busy={creating}
        >
          {creating ? 'Duke u dërguar…' : 'Krijo rezervimin'}
        </button>
      </div>

      {ready && filteredBookings.length === 0 && (
        <EmptyState title="Nuk ka rezervime" body="Ndrysho filtrin ose krijo një rezervim të ri." />
      )}
      <ul className="card mt-5 divide-y divide-[var(--line)]">
        {filteredBookings.map((booking) => (
          <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-medium">
                {booking.service.name} · {booking.staff.displayName}
              </p>
              <p className="muted text-sm">
                {formatTime(booking.startAt)} · {shortName(booking.client.firstName, booking.client.lastName)} ·{' '}
                <span className="status-pill" data-status={booking.status}>
                  {STATUS_LABEL[booking.status]}
                </span>
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              {user?.role !== 'CLIENT' && booking.status === 'PENDING' && (
                <button className="btn btn-confirm" type="button" onClick={() => confirm(booking.id)}>
                  Konfirmo
                </button>
              )}
              {booking.status !== 'CANCELLED' && (
                <button className="text-danger" type="button" onClick={() => setPendingCancel(booking.id)}>
                  Anulo
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <Modal
        open={Boolean(pendingCancel)}
        title="Anulo rezervimin"
        danger
        confirmLabel="Anulo rezervimin"
        onClose={() => setPendingCancel(null)}
        onConfirm={async () => {
          if (pendingCancel) {
            await cancel(pendingCancel);
            setPendingCancel(null);
          }
        }}
      >
        Ky veprim e liron orën. Klienti do të njoftohet.
      </Modal>
    </section>
  );
}
