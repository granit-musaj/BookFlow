import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import { BUSINESS } from '../../shared/config/business';
import {
  Booking,
  Business,
  formatTime,
  isSameDay,
  Service,
  shortName,
  StaffMember,
  STATUS_LABEL,
} from '../../shared/types/domain';
import { PageHeader } from '../../shared/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/Skeleton';
import { DashboardStatsSection } from './DashboardStatsSection';

type SortKey = 'startAt' | 'client' | 'service' | 'status';

export function DashboardPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const query = (params.get('q') ?? '').trim().toLowerCase();
  const [business, setBusiness] = useState<Business | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('startAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

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
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Nuk u ngarkua'))
      .finally(() => setReady(true));
  }, []);

  const todayBookings = useMemo(
    () =>
      bookings
        .filter((row) => isSameDay(row.startAt) && row.status !== 'CANCELLED')
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [bookings],
  );

  const rows = useMemo(() => {
    const filtered = bookings.filter((row) => {
      if (!query) {
        return true;
      }
      return `${row.client.firstName} ${row.client.lastName} ${row.service.name} ${row.staff.displayName}`
        .toLowerCase()
        .includes(query);
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'startAt') {
        return a.startAt.localeCompare(b.startAt) * dir;
      }
      if (sortKey === 'client') {
        return `${a.client.firstName} ${a.client.lastName}`.localeCompare(`${b.client.firstName} ${b.client.lastName}`) * dir;
      }
      if (sortKey === 'service') {
        return a.service.name.localeCompare(b.service.name) * dir;
      }
      return a.status.localeCompare(b.status) * dir;
    });
  }, [bookings, query, sortDir, sortKey]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((value) => (value === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  }

  return (
    <section>
      <PageHeader
        title="Përmbledhje"
        subtitle={`Mirë se erdhe${user?.firstName ? `, ${user.firstName}` : ''}. Ja si duket dita në ${business?.name ?? BUSINESS.name}.`}
      />
      {!ready && <Skeleton lines={4} />}
      {error && <ErrorState message={error} />}
      {user?.role === 'OWNER' ? (
        <DashboardStatsSection />
      ) : (
        <div className="stat-strip mb-6 grid gap-3 lg:grid-cols-4">
          {[
            [String(todayBookings.length), 'Rezervime sot'],
            [String(bookings.length), 'Gjithsej'],
            [String(services.filter((row) => row.isActive).length), 'Shërbime aktive'],
            [String(staff.filter((row) => row.isActive).length), 'Staf aktiv'],
          ].map(([value, label]) => (
            <div key={label} className="card stat-card px-5 py-4">
              <p className="stat-value">{value}</p>
              <p className="stat-label">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="dash-split mt-6">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <p className="text-lg font-semibold">Rezervimet</p>
              <p className="muted text-sm">Tabela e plotë e ditëve</p>
            </div>
            <Link className="btn btn-primary" to="/app/bookings">
              Rezervim i ri
            </Link>
          </div>
          <div className="table-desk">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" onClick={() => toggleSort('startAt')}>
                      Ora
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => toggleSort('client')}>
                      Klienti
                    </button>
                  </th>
                  <th className="col-optional">
                    <button type="button" onClick={() => toggleSort('service')}>
                      Shërbimi
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => toggleSort('status')}>
                      Statusi
                    </button>
                  </th>
                  <th className="col-action">
                    <span className="sr-only">Veprime</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((booking) => (
                  <tr key={booking.id}>
                    <td>{formatTime(booking.startAt)}</td>
                    <td>{shortName(booking.client.firstName, booking.client.lastName)}</td>
                    <td className="col-optional">{booking.service.name}</td>
                    <td>
                      <span className="status-pill" data-status={booking.status}>
                        {STATUS_LABEL[booking.status]}
                      </span>
                    </td>
                    <td className="col-action">
                      <Link className="row-action" to="/app/bookings">
                        Hap
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="card-mobile divide-y divide-[var(--line)]">
            {rows.map((booking) => (
              <li key={booking.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium">{shortName(booking.client.firstName, booking.client.lastName)}</p>
                  <p className="muted text-sm">
                    {booking.service.name} · {formatTime(booking.startAt)}
                  </p>
                </div>
                <span className="status-pill" data-status={booking.status}>
                  {STATUS_LABEL[booking.status]}
                </span>
              </li>
            ))}
          </ul>
          {ready && rows.length === 0 && (
            <div className="p-6">
              <EmptyState title="Nuk ka rezervime" body="Ndrysho kërkimin ose krijo një rezervim të ri." />
            </div>
          )}
        </div>

        <aside className="card p-6">
          <p className="text-lg font-semibold">Orari i sotëm</p>
          <p className="muted mt-1 text-sm">Seancat që nuk janë anuluar</p>
          <ul className="mt-5 space-y-4">
            {todayBookings.map((booking) => (
              <li key={booking.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{formatTime(booking.startAt)}</p>
                  <p className="muted text-sm">
                    {shortName(booking.client.firstName, booking.client.lastName)} · {booking.service.name}
                  </p>
                </div>
                <span className="status-pill" data-status={booking.status}>
                  {STATUS_LABEL[booking.status]}
                </span>
              </li>
            ))}
            {ready && todayBookings.length === 0 && (
              <li>
                <EmptyState title="Nuk ka rezervime sot" body="Krijo një rezervim të ri ose prit kërkesat e klientëve." />
              </li>
            )}
          </ul>
        </aside>
      </div>
    </section>
  );
}
