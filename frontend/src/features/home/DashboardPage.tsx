import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import {
  Booking,
  Business,
  formatMoney,
  formatTime,
  isSameDay,
  Service,
  shortName,
  StaffMember,
  STATUS_LABEL,
} from '../../shared/types/domain';
import { PageHeader } from '../../shared/ui/PageHeader';

export function DashboardPage() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<Business>('/businesses/me'),
      api<Service[]>('/services'),
      api<StaffMember[]>('/staff'),
      api<Booking[]>('/bookings'),
    ])
      .then(([biz, serviceRows, staffRows, bookingRows]) => {
        setBusiness(biz);
        setServices(serviceRows);
        setStaff(staffRows);
        setBookings(bookingRows);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Nuk u ngarkua'));
  }, []);

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

  return (
    <section>
      <PageHeader
        title="Përmbledhje"
        subtitle={`Mirë se erdhe${user?.firstName ? `, ${user.firstName}` : ''}. Ja si duket dita në ${business?.name ?? 'studio'}.`}
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
          <p className="text-lg font-semibold">Rezervimet e sotme</p>
          <p className="muted mt-1 text-sm">Përditësohet kur shtohet ose konfirmohet një rezervim</p>
          <ul className="mt-5 divide-y divide-[var(--line)]">
            {todayBookings.map((booking) => (
              <li key={booking.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{shortName(booking.client.firstName, booking.client.lastName)}</p>
                  <p className="muted text-sm">
                    {booking.service.name} · {formatTime(booking.startAt)}
                  </p>
                </div>
                <span className="status-pill">{STATUS_LABEL[booking.status]}</span>
              </li>
            ))}
            {todayBookings.length === 0 && <li className="muted py-4 text-sm">Nuk ka rezervime sot.</li>}
          </ul>
          <Link className="btn btn-primary mt-4" to="/app/bookings">
            Rezervim i ri
          </Link>
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <p className="text-lg font-semibold">Faqja publike</p>
            <p className="muted mt-1 text-sm">Klientët rezervojnë pa hyrë në panel</p>
            {business && (
              <Link className="btn btn-ghost mt-5" to={`/b/${business.slug}`}>
                /b/{business.slug}
              </Link>
            )}
          </div>
          <div className="card p-6">
            <p className="muted text-sm">Shërbime aktive</p>
            <p className="mt-2 text-3xl font-semibold">{services.filter((row) => row.isActive).length}</p>
            <p className="muted mt-4 text-sm">Staf aktiv</p>
            <p className="mt-2 text-3xl font-semibold">{staff.filter((row) => row.isActive).length}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
