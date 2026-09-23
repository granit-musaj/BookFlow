import { useEffect, useState } from 'react';
import { api } from '../../shared/lib/api';
import { AppNotification, formatDateTime } from '../../shared/types/domain';
import { PageHeader } from '../../shared/ui/PageHeader';

export function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState('');

  async function load() {
    setItems(await api<AppNotification[]>('/notifications'));
  }

  useEffect(() => {
    load().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Nuk u ngarkua'));
  }, []);

  async function markRead(id: string) {
    setError('');
    try {
      await api(`/notifications/${id}/read`, { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Përditësimi dështoi');
    }
  }

  async function markAll() {
    setError('');
    try {
      await api('/notifications/read-all', { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Përditësimi dështoi');
    }
  }

  return (
    <section>
      <PageHeader
        title="Njoftime"
        subtitle={
          items.some((item) => !item.readAt) ? (
            <button className="underline" type="button" onClick={markAll}>
              Shënoji të gjitha si të lexuara
            </button>
          ) : (
            'Kërkesat e reja të rezervimit shfaqen këtu.'
          )
        }
      />
      {error && <p className="text-danger mb-4 text-sm">{error}</p>}
      <ul className="card divide-y divide-[var(--line)]">
        {items.map((item) => (
          <li key={item.id} className={`px-6 py-4 ${item.readAt ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="muted mt-1 text-sm">{item.body}</p>
                <p className="muted mt-1 text-xs">{formatDateTime(item.createdAt)}</p>
              </div>
              {!item.readAt && (
                <button className="status-pill" type="button" onClick={() => markRead(item.id)}>
                  Lexuar
                </button>
              )}
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="muted px-6 py-6 text-sm">Nuk ka njoftime ende.</li>}
      </ul>
    </section>
  );
}
