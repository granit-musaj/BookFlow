import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { DemoBanner } from '../../shared/ui/DemoBanner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('ana@studio.com');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kërkesa dështoi');
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
        <h1 className="page-title mt-6">Rivendos fjalëkalimin</h1>
        {sent ? (
          <p className="muted mt-6 text-sm">
            Nëse ky email ka një llogari, do të dërgohet një lidhje rivendosjeje. Në demo, shiko
            konsolën e shfletuesit.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-3 p-6">
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn btn-primary" type="submit">
              Dërgo lidhjen
            </button>
          </form>
        )}
        {message && <p className="mt-4 text-sm text-red-700">{message}</p>}
        <Link to="/login" className="mt-6 text-sm">
          Kthehu te hyrja
        </Link>
      </main>
    </div>
  );
}
