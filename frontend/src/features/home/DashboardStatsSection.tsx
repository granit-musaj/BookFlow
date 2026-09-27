import { useEffect, useState } from 'react';
import { api } from '../../shared/lib/api';
import { BusinessStats, formatMoney } from '../../shared/types/domain';
import { ErrorState, Skeleton } from '../../shared/ui/Skeleton';

export function DashboardStatsSection() {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<BusinessStats>('/businesses/me/stats')
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Nuk u ngarkuan statistikat'))
      .finally(() => setReady(true));
  }, []);

  const items = [
    [stats ? String(stats.bookingsToday) : '—', 'Rezervime sot'],
    [stats ? String(stats.bookingsThisWeek) : '—', 'Rezervime këtë javë'],
    [stats ? formatMoney(stats.estimatedRevenueCents) : '—', 'Të ardhura të vlerësuara'],
    [stats?.mostRequestedHour ?? '—', 'Ora më e kërkuar'],
  ] as const;

  return (
    <section className="stat-strip mb-6">
      {!ready && <Skeleton lines={2} />}
      {error && <ErrorState message={error} />}
      <div className="grid gap-3 lg:grid-cols-4">
        {items.map(([value, label]) => (
          <div key={label} className="card stat-card px-5 py-4">
            <p className="stat-value">{value}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
