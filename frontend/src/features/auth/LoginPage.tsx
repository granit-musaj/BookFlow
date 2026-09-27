import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { useAuth } from '../../shared/auth/AuthContext';
import { AuthResponse } from '../../shared/types/auth';
import { DemoBanner } from '../../shared/ui/DemoBanner';
import { SiteFooter } from '../../shared/ui/SiteFooter';
import { SiteHeader } from '../../shared/ui/SiteHeader';
import { Skeleton } from '../../shared/ui/Skeleton';
import { useToast } from '../../shared/ui/Toast';

export function LoginPage() {
  const { user, ready, setSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('ana@studio.com');
  const [password, setPassword] = useState('password123');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!ready) {
    return (
      <div className="container py-12">
        <Skeleton lines={4} />
      </div>
    );
  }
  if (user) {
    return <Navigate to="/app" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (!email.includes('@')) {
      setMessage('Shkruaj një email të vlefshëm.');
      return;
    }
    if (password.length < 8) {
      setMessage('Fjalëkalimi duhet të ketë të paktën 8 karaktere.');
      return;
    }
    setLoading(true);
    try {
      const result = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(result);
      toast('Hyrja u krye.');
      navigate('/app');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Hyrja dështoi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <DemoBanner />
      <SiteHeader />
      <main className="container auth-screen flex max-w-md flex-col justify-center">
        <h1 className="page-title">Mirë se u ktheve</h1>
        <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-4 p-6">
          <label className="field">
            <span className="field-label">Email</span>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span className="field-label">Fjalëkalimi</span>
            <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Duke u dërguar…' : 'Hyr'}
          </button>
          <Link to="/forgot-password" className="muted text-sm">
            Ke harruar fjalëkalimin?
          </Link>
          <p className="muted text-xs">Provë: ana@studio.com, mira@studio.com ose elira@email.com — password123</p>
        </form>
        {message && <p className="text-danger mt-4 text-sm" role="alert">{message}</p>}
        <Link to="/register" className="mt-6 text-sm">
          Hap një llogari studioje
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
