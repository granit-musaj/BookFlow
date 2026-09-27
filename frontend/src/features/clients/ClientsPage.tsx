import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import { ClientUser, shortName } from '../../shared/types/domain';
import { PageHeader } from '../../shared/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/Skeleton';

export function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setClients(await api<ClientUser[]>('/users/clients'));
  }

  useEffect(() => {
    if (user?.role === 'CLIENT') {
      return;
    }
    load()
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Nuk u ngarkua'))
      .finally(() => setReady(true));
  }, [user?.role]);

  if (user?.role === 'CLIENT') {
    return <p>Klientët menaxhohen nga studioja.</p>;
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api('/users/clients', { method: 'POST', body: JSON.stringify(form) });
      setForm({ firstName: '', lastName: '', email: '', password: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Klienti nuk u shtua');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <PageHeader title="Klientët" subtitle="Lista e njerëzve që rezervojnë te studioja." />
      {!ready && <Skeleton lines={3} />}
      {error && <ErrorState message={error} />}

      <form onSubmit={onCreate} className="card grid gap-3 p-6 sm:grid-cols-2">
        <label className="field">
          <span className="field-label">Emri</span>
          <input className="input" autoComplete="given-name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        </label>
        <label className="field">
          <span className="field-label">Mbiemri</span>
          <input className="input" autoComplete="family-name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        </label>
        <label className="field">
          <span className="field-label">Email</span>
          <input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label className="field sm:col-span-2">
          <span className="field-label">Fjalëkalim i përkohshëm</span>
          <input className="input" type="password" minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        <button className="btn btn-primary sm:col-span-2" type="submit" disabled={saving} aria-busy={saving}>
          {saving ? 'Duke u dërguar…' : 'Shto klient'}
        </button>
      </form>

      <ul className="card mt-5 divide-y divide-[var(--line)]">
        {clients.map((client) => (
          <li key={client.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="font-medium">{shortName(client.firstName, client.lastName)}</p>
              <p className="muted text-sm">{client.email}</p>
            </div>
          </li>
        ))}
        {ready && clients.length === 0 && (
          <li>
            <EmptyState title="Nuk ka klientë" body="Shto klientin e parë ose prit rezervimet nga faqja publike." />
          </li>
        )}
      </ul>
    </section>
  );
}
