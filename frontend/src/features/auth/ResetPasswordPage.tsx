import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { BrandMark } from '../../shared/ui/BrandMark';
import { DemoBanner } from '../../shared/ui/DemoBanner';
import { ThemeToggle } from '../../shared/ui/ThemeToggle';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') ?? '', [params]);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      navigate('/login');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Rivendosja dështoi');
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
        <h1 className="page-title mt-6">Fjalëkalim i ri</h1>
        {!token ? (
          <p className="muted mt-6 text-sm">Lidhja e rivendosjes mungon ose është e pavlefshme.</p>
        ) : (
          <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-3 p-6">
            <input
              className="input"
              type="password"
              placeholder="Fjalëkalimi i ri (min. 8)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <button className="btn btn-primary" type="submit">
              Ruaj fjalëkalimin
            </button>
          </form>
        )}
        {message && <p className="text-danger mt-4 text-sm">{message}</p>}
        <Link to="/login" className="mt-6 text-sm">
          Kthehu te hyrja
        </Link>
      </main>
    </div>
  );
}
