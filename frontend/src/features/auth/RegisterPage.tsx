import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import { AuthResponse } from '../../shared/types/auth';
import { DemoBanner } from '../../shared/ui/DemoBanner';

export function RegisterPage() {
  const { user, ready, setSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: 'Ana',
    lastName: 'Hoxha',
    email: 'owner@studio.com',
    password: 'password123',
    businessName: 'Studio Aureel',
  });
  const [message, setMessage] = useState('');

  if (!ready) {
    return null;
  }
  if (user) {
    return <Navigate to="/app" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    try {
      const result = await api<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          role: 'OWNER',
        }),
      });
      setSession(result);
      navigate('/app');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Regjistrimi dështoi');
    }
  }

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <DemoBanner />
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
          BookFlow
        </Link>
        <h1 className="page-title mt-6">Hap studion tënde</h1>
        <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-3 p-6">
          <input className="input" placeholder="Emri i studios" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} required minLength={2} />
          <input className="input" placeholder="Emri" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <input className="input" placeholder="Mbiemri" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" type="password" placeholder="Fjalëkalimi (min. 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          <button className="btn btn-primary" type="submit">
            Krijo studion
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-red-700">{message}</p>}
        <Link to="/login" className="mt-6 text-sm">
          Kam tashmë një llogari
        </Link>
      </main>
    </div>
  );
}
