import { useEffect, useState } from 'react';
import { api } from '../../shared/lib/api';
import { BusinessStats, formatMoney } from '../../shared/types/domain';

export function DashboardStatsSection() {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<BusinessStats>('/businesses/me/stats')
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Nuk u ngarkuan statistikat'));
  }, []);

  const items = [
    [stats ? String(stats.bookingsToday) : '—', 'Rezervime sot'],
    [stats ? String(stats.bookingsThisWeek) : '—', 'Rezervime këtë javë'],
    [stats ? formatMoney(stats.estimatedRevenueCents) : '—', 'Të ardhura të vlerësuara'],
    [stats?.mostRequestedHour ?? '—', 'Ora më e kërkuar'],
  ] as const;

  return (
    <section className="stat-strip mb-6">
      {error && <p className="text-danger mb-3 text-sm">{error}</p>}
      <div className="grid gap-4 md:grid-cols-4">
        {items.map(([value, label]) => (
          <div key={label} className="card px-6 py-5">
            <p className="stat-value">{value}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
