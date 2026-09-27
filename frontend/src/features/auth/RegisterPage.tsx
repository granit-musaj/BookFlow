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

export function RegisterPage() {
  const { user, ready, setSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    firstName: 'Ana',
    lastName: 'Hoxha',
    email: 'owner@studio.com',
    password: 'password123',
    businessName: 'Studio Aureel',
  });
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
    if (!form.email.includes('@')) {
      setMessage('Shkruaj një email të vlefshëm.');
      return;
    }
    if (form.password.length < 8) {
      setMessage('Fjalëkalimi duhet të ketë të paktën 8 karaktere.');
      return;
    }
    setLoading(true);
    try {
      const result = await api<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          role: 'OWNER',
        }),
      });
      setSession(result);
      toast('Studioja u krijua.');
      navigate('/app');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Regjistrimi dështoi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <DemoBanner />
      <SiteHeader />
      <main className="container flex min-h-[70vh] max-w-md flex-col justify-center py-12">
        <h1 className="page-title">Hap studion tënde</h1>
        <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-4 p-6">
          <label className="field">
            <span className="field-label">Emri i studios</span>
            <input
              className="input"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              required
              minLength={2}
            />
          </label>
          <label className="field">
            <span className="field-label">Emri</span>
            <input
              className="input"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Mbiemri</span>
            <input
              className="input"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Fjalëkalimi</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? 'Duke u dërguar…' : 'Krijo studion'}
          </button>
        </form>
        {message && (
          <p className="text-danger mt-4 text-sm" role="alert">
            {message}
          </p>
        )}
        <Link to="/login" className="mt-6 text-sm">
          Kam tashmë një llogari
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
