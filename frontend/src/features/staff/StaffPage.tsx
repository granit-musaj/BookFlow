import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import { Availability, Service, StaffMember, WEEKDAYS } from '../../shared/types/domain';
import { PageHeader } from '../../shared/ui/PageHeader';

export function StaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    displayName: '',
    serviceIds: [] as string[],
  });
  const [windowForm, setWindowForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });

  async function load() {
    const [staffRows, serviceRows] = await Promise.all([
      api<StaffMember[]>('/staff'),
      api<Service[]>('/services'),
    ]);
    setStaff(staffRows);
    setServices(serviceRows);
    if (!selectedId && staffRows[0]) {
      setSelectedId(staffRows[0].id);
    }
  }

  useEffect(() => {
    load().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Nuk u ngarkua'));
  }, []);

  const selected = staff.find((row) => row.id === selectedId);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const created = await api<StaffMember>('/staff', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        displayName: '',
        serviceIds: [],
      });
      await load();
      setSelectedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stafi nuk u shtua');
    }
  }

  async function addWindow(event: FormEvent) {
    event.preventDefault();
    if (!selected) {
      return;
    }
    setError('');
    try {
      await api<Availability>(`/staff/${selected.id}/availability`, {
        method: 'POST',
        body: JSON.stringify({
          ...windowForm,
          startTime: windowForm.startTime.slice(0, 5),
          endTime: windowForm.endTime.slice(0, 5),
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Orari nuk u shtua');
    }
  }

  async function removeWindow(availabilityId: string) {
    if (!selected) {
      return;
    }
    setError('');
    try {
      await api(`/staff/${selected.id}/availability/${availabilityId}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Orari nuk u hoq');
    }
  }

  const canEditHours = user?.role === 'OWNER' || (user?.role === 'STAFF' && selected?.user.id === user.id);

  return (
    <section>
      <PageHeader title="Stafi" subtitle="Kush ofron shërbimet dhe kur janë të lirë." />
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      {user?.role === 'OWNER' && (
        <form onSubmit={onCreate} className="card mb-5 grid gap-3 p-6 sm:grid-cols-2">
          <input className="input" placeholder="Emri në kalendar" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
          <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" placeholder="Emri" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <input className="input" placeholder="Mbiemri" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          <input className="input sm:col-span-2" placeholder="Fjalëkalim i përkohshëm" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <fieldset className="sm:col-span-2">
            <legend className="muted mb-2 text-sm">Shërbimet që ofrojnë</legend>
            <div className="flex flex-wrap gap-3">
              {services.filter((service) => service.isActive).map((service) => (
                <label key={service.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.serviceIds.includes(service.id)}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        serviceIds: e.target.checked
                          ? [...form.serviceIds, service.id]
                          : form.serviceIds.filter((id) => id !== service.id),
                      });
                    }}
                  />
                  {service.name}
                </label>
              ))}
            </div>
          </fieldset>
          <button className="btn btn-primary sm:col-span-2" type="submit">
            Shto në staf
          </button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <ul className="card overflow-hidden">
          {staff.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className={`w-full px-5 py-4 text-left text-sm ${selectedId === row.id ? 'bg-[var(--cream)]' : ''}`}
                onClick={() => setSelectedId(row.id)}
              >
                {row.displayName}
              </button>
            </li>
          ))}
          {staff.length === 0 && <li className="muted px-5 py-6 text-sm">Nuk ka staf ende.</li>}
        </ul>

        {selected && (
          <div className="card p-6">
            <p className="text-2xl font-semibold">{selected.displayName}</p>
            <p className="muted text-sm">{selected.user.email}</p>
            <p className="muted mt-3 text-sm">
              Shërbime: {selected.services.map((service) => service.name).join(', ') || 'asnjë'}
            </p>
            {user?.role === 'OWNER' && (
              <div className="mt-3 flex flex-wrap gap-3">
                {services.filter((service) => service.isActive).map((service) => {
                  const checked = selected.services.some((item) => item.id === service.id);
                  return (
                    <label key={service.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const serviceIds = checked
                            ? selected.services.filter((item) => item.id !== service.id).map((item) => item.id)
                            : [...selected.services.map((item) => item.id), service.id];
                          api(`/staff/${selected.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ serviceIds }),
                          })
                            .then(() => load())
                            .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Përditësimi dështoi'));
                        }}
                      />
                      {service.name}
                    </label>
                  );
                })}
              </div>
            )}
            <ul className="mt-4 space-y-2">
              {selected.availabilities.map((window) => (
                <li key={window.id} className="flex items-center justify-between text-sm">
                  <span>
                    {WEEKDAYS[window.dayOfWeek]} {window.startTime}–{window.endTime}
                  </span>
                  {canEditHours && (
                    <button className="text-red-700" type="button" onClick={() => removeWindow(window.id)}>
                      Hiq
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {canEditHours && (
              <form onSubmit={addWindow} className="mt-4 flex flex-wrap gap-2">
                <select
                  className="input"
                  value={windowForm.dayOfWeek}
                  onChange={(e) => setWindowForm({ ...windowForm, dayOfWeek: Number(e.target.value) })}
                >
                  {WEEKDAYS.map((label, index) => (
                    <option key={label} value={index}>
                      {label}
                    </option>
                  ))}
                </select>
                <input className="input" type="time" value={windowForm.startTime} onChange={(e) => setWindowForm({ ...windowForm, startTime: e.target.value })} />
                <input className="input" type="time" value={windowForm.endTime} onChange={(e) => setWindowForm({ ...windowForm, endTime: e.target.value })} />
                <button className="btn btn-primary py-2" type="submit">
                  Shto orar
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
