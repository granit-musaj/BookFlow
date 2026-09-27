import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../shared/lib/api';
import { DemoBanner } from '../../shared/ui/DemoBanner';
import { SiteFooter } from '../../shared/ui/SiteFooter';
import { SiteHeader } from '../../shared/ui/SiteHeader';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('ana@studio.com');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (!email.includes('@')) {
      setMessage('Shkruaj një email të vlefshëm.');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kërkesa dështoi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <DemoBanner />
      <SiteHeader />
      <main className="container flex min-h-[70vh] max-w-md flex-col justify-center py-12">
        <h1 className="page-title">Rivendos fjalëkalimin</h1>
        {sent ? (
          <p className="muted mt-6 text-sm">
            Nëse ky email ka një llogari, do të dërgohet një lidhje rivendosjeje. Në demo, shiko
            konsolën e shfletuesit.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-4 p-6">
            <label className="field">
              <span className="field-label">Email</span>
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={loading} aria-busy={loading}>
              {loading ? 'Duke u dërguar…' : 'Dërgo lidhjen'}
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
