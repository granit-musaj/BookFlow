import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import { AuthResponse } from '../../shared/types/auth';
import { BrandMark } from '../../shared/ui/BrandMark';
import { DemoBanner } from '../../shared/ui/DemoBanner';
import { ThemeToggle } from '../../shared/ui/ThemeToggle';

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
    <div className="page-shell">
      <DemoBanner />
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <div className="flex items-center justify-between">
          <BrandMark />
          <ThemeToggle />
        </div>
        <h1 className="page-title mt-6">Mirë se u ktheve</h1>
        <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-3 p-6">
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Fjalëkalimi" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <button className="btn btn-primary" type="submit">
            Hyr
          </button>
          <Link to="/forgot-password" className="muted text-sm">
            Ke harruar fjalëkalimin?
          </Link>
          <p className="muted text-xs">Provë: ana@studio.com, mira@studio.com ose elira@email.com — password123</p>
        </form>
        {message && <p className="text-danger mt-4 text-sm">{message}</p>}
        <Link to="/register" className="mt-6 text-sm">
          Hap një llogari studioje
        </Link>
      </main>
    </div>
  );
}
