import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import { formatMoney, Service } from '../../shared/types/domain';
import { PageHeader } from '../../shared/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/Skeleton';

export function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', durationMinutes: 60, price: '35' });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const rows = await api<Service[]>('/services');
    setServices(rows);
  }

  useEffect(() => {
    load()
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Nuk u ngarkua'))
      .finally(() => setReady(true));
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api<Service>('/services', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          durationMinutes: Number(form.durationMinutes),
          priceCents: Math.round(Number(form.price) * 100),
        }),
      });
      setForm({ name: '', durationMinutes: 60, price: '35' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Shërbimi nuk u krijua');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(service: Service) {
    setError('');
    try {
      await api(`/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Përditësimi dështoi');
    }
  }

  return (
    <section>
      <PageHeader title="Shërbimet" subtitle="Çfarë ofron studioja dhe sa kushton." />
      {!ready && <Skeleton lines={3} />}
      {error && <ErrorState message={error} />}

      {user?.role === 'OWNER' && (
        <form onSubmit={onCreate} className="card grid gap-3 p-6 sm:grid-cols-4">
          <label className="field sm:col-span-2">
            <span className="field-label">Emri i shërbimit</span>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={2}
            />
          </label>
          <label className="field">
            <span className="field-label">Minuta</span>
            <input
              className="input"
              type="number"
              min={5}
              max={480}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
            />
          </label>
          <label className="field">
            <span className="field-label">Çmimi (€)</span>
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>
          <button className="btn btn-primary sm:col-span-4" type="submit" disabled={saving} aria-busy={saving}>
            {saving ? 'Duke u dërguar…' : 'Shto shërbim'}
          </button>
        </form>
      )}

      <ul className="card mt-5 divide-y divide-[var(--line)]">
        {services.map((service) => (
          <li key={service.id} className="flex items-center justify-between gap-3 px-6 py-4">
            <div>
              <p className="font-medium">{service.name}</p>
              <p className="muted text-sm">
                {service.durationMinutes} minuta · {formatMoney(service.priceCents)}
                {!service.isActive && ' · jo aktiv'}
              </p>
            </div>
            {user?.role === 'OWNER' && (
              <button className="status-pill" type="button" onClick={() => toggleActive(service)}>
                {service.isActive ? 'Çaktivizo' : 'Aktivizo'}
              </button>
            )}
          </li>
        ))}
        {ready && services.length === 0 && (
          <li>
            <EmptyState title="Nuk ka shërbime" body="Shto shërbimin e parë që klientët të mund të rezervojnë." />
          </li>
        )}
      </ul>
    </section>
  );
}
