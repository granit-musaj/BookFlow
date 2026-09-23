import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import { ClientUser, shortName } from '../../shared/types/domain';
import { PageHeader } from '../../shared/ui/PageHeader';

export function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });

  async function load() {
    setClients(await api<ClientUser[]>('/users/clients'));
  }

  useEffect(() => {
    if (user?.role === 'CLIENT') {
      return;
    }
    load().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Nuk u ngarkua'));
  }, [user?.role]);

  if (user?.role === 'CLIENT') {
    return <p>Klientët menaxhohen nga studioja.</p>;
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api('/users/clients', { method: 'POST', body: JSON.stringify(form) });
      setForm({ firstName: '', lastName: '', email: '', password: '', phone: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Klienti nuk u shtua');
    }
  }

  return (
    <section>
      <PageHeader title="Klientët" subtitle="Lista e njerëzve që rezervojnë te studioja." />
      {error && <p className="text-danger mb-4 text-sm">{error}</p>}

      <form onSubmit={onCreate} className="card grid gap-3 p-6 sm:grid-cols-2">
        <input className="input" placeholder="Emri" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        <input className="input" placeholder="Mbiemri" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" placeholder="Telefoni" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input sm:col-span-2" type="password" minLength={8} placeholder="Fjalëkalim i përkohshëm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button className="btn btn-primary sm:col-span-2" type="submit">
          Shto klient
        </button>
      </form>

      <ul className="card mt-5 divide-y divide-[var(--line)]">
        {clients.map((client) => (
          <li key={client.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="font-medium">{shortName(client.firstName, client.lastName)}</p>
              <p className="muted text-sm">{client.email}</p>
            </div>
            <p className="muted">{client.phone ?? '—'}</p>
          </li>
        ))}
        {clients.length === 0 && <li className="muted px-6 py-6 text-sm">Nuk ka klientë ende.</li>}
      </ul>
    </section>
  );
}
