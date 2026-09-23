import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import { AuthResponse } from '../../shared/types/auth';
import { DemoBanner } from '../../shared/ui/DemoBanner';

export function LoginPage() {
  const { user, ready, setSession } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('ana@studio.com');
  const [password, setPassword] = useState('password123');
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
      const result = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(result);
      navigate('/app');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Hyrja dështoi');
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
        <h1 className="page-title mt-6">Mirë se u ktheve</h1>
        <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-3 p-6">
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Fjalëkalimi" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <button className="btn btn-primary" type="submit">
            Hyr
          </button>
          <p className="muted text-xs">Provë: ana@studio.com, mira@studio.com ose elira@email.com — password123</p>
        </form>
        {message && <p className="mt-4 text-sm text-red-700">{message}</p>}
        <Link to="/register" className="mt-6 text-sm">
          Hap një llogari studioje
        </Link>
      </main>
    </div>
  );
}
