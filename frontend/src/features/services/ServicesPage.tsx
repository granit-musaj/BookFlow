import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import { formatMoney, Service } from '../../shared/types/domain';
import { PageHeader } from '../../shared/ui/PageHeader';

export function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', durationMinutes: 60, price: '35' });

  async function load() {
    const rows = await api<Service[]>('/services');
    setServices(rows);
  }

  useEffect(() => {
    load().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Nuk u ngarkua'));
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError('');
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
      {error && <p className="text-danger mb-4 text-sm">{error}</p>}

      {user?.role === 'OWNER' && (
        <form onSubmit={onCreate} className="card grid gap-3 p-6 sm:grid-cols-4">
          <input
            className="input sm:col-span-2"
            placeholder="Emri i shërbimit"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={2}
          />
          <input
            className="input"
            type="number"
            min={5}
            max={480}
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
          />
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <button className="btn btn-primary sm:col-span-4" type="submit">
            Shto shërbim
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
        {services.length === 0 && <li className="muted px-6 py-6 text-sm">Nuk ka shërbime ende.</li>}
      </ul>
    </section>
  );
}
