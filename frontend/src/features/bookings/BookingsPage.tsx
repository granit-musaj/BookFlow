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

const SLOT_TIMES = ['09:00', '10:00', '11:00', '12:30', '14:00', '15:30', '17:00', '18:00'];

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
  const [time, setTime] = useState('');

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
    load().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Nuk u ngarkua'));
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
    if (!serviceId || !staffId || !time) {
      setError('Zgjidh shërbimin dhe orarin.');
      return;
    }
    try {
      await api<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          staffId,
          serviceId,
          startAt: new Date(`${date}T${time}:00`).toISOString(),
          ...(user?.role !== 'CLIENT' ? { clientId } : {}),
        }),
      });
      setTime('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rezervimi nuk u krijua');
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

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          [String(stats.count), 'Rezervime sot'],
          [stats.popular, 'Ora më e kërkuar'],
          [formatMoney(stats.value), 'Vlera e ditës'],
        ].map(([value, label]) => (
          <div key={label} className="card px-6 py-5">
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            <p className="muted mt-1 text-sm">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="card p-6">
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
                        className={`h-4 w-4 rounded-full border ${
                          serviceId === service.id ? 'border-[var(--navy)] bg-[var(--navy)]' : 'border-[#cfc8bb]'
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

        <div className="card p-6">
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
                  <button className="status-pill" type="button" onClick={() => confirm(booking.id)}>
                    Konfirmo
                  </button>
                ) : (
                  <span className="status-pill">{STATUS_LABEL[booking.status]}</span>
                )}
              </li>
            ))}
            {todayBookings.length === 0 && <li className="muted text-sm">Nuk ka rezervime sot.</li>}
          </ul>
        </div>
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
        <div className="mt-4 flex flex-wrap gap-3">
          {SLOT_TIMES.map((slot) => (
            <button
              key={slot}
              type="button"
              className={`chip ${time === slot ? 'chip-on' : ''}`}
              onClick={() => setTime(slot)}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      <div className="card mt-5 p-6">
        <p className="text-lg font-semibold">3. Konfirmo rezervimin</p>
        <p className="muted mt-1 text-sm">Të dhënat e klientit</p>
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
                      className={`h-4 w-4 rounded-full border ${
                        clientId === client.id ? 'border-[var(--navy)] bg-[var(--navy)]' : 'border-[#cfc8bb]'
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
        <button className="btn btn-primary mt-5" type="button" onClick={createBooking} disabled={!time || !serviceId}>
          Krijo rezervimin
        </button>
      </div>

      <ul className="card mt-5 divide-y divide-[var(--line)]">
        {bookings.map((booking) => (
          <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-medium">
                {booking.service.name} · {booking.staff.displayName}
              </p>
              <p className="muted text-sm">
                {formatTime(booking.startAt)} · {shortName(booking.client.firstName, booking.client.lastName)} ·{' '}
                {STATUS_LABEL[booking.status]}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              {user?.role !== 'CLIENT' && booking.status === 'PENDING' && (
                <button className="status-pill" type="button" onClick={() => confirm(booking.id)}>
                  Konfirmo
                </button>
              )}
              {booking.status !== 'CANCELLED' && (
                <button className="text-red-700" type="button" onClick={() => cancel(booking.id)}>
                  Anulo
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
