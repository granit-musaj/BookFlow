import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { DemoBanner } from '../../shared/ui/DemoBanner';
import { SiteFooter } from '../../shared/ui/SiteFooter';
import { SiteHeader } from '../../shared/ui/SiteHeader';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') ?? '', [params]);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (password.length < 8) {
      setMessage('Fjalëkalimi duhet të ketë të paktën 8 karaktere.');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      navigate('/login');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Rivendosja dështoi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <DemoBanner />
      <SiteHeader />
      <main className="container flex min-h-[70vh] max-w-md flex-col justify-center py-12">
        <h1 className="page-title">Fjalëkalim i ri</h1>
        {!token ? (
          <p className="muted mt-6 text-sm">Lidhja e rivendosjes mungon ose është e pavlefshme.</p>
        ) : (
          <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-4 p-6">
            <label className="field">
              <span className="field-label">Fjalëkalimi i ri</span>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={loading} aria-busy={loading}>
              {loading ? 'Duke u dërguar…' : 'Ruaj fjalëkalimin'}
            </button>
          </form>
        )}
        {message && (
          <p className="text-danger mt-4 text-sm" role="alert">
            {message}
          </p>
        )}
        <Link to="/login" className="mt-6 text-sm">
          Kthehu te hyrja
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
