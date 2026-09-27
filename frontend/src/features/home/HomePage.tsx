import { FormEvent, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/auth/AuthContext';
import { BUSINESS } from '../../shared/config/business';
import { DEMO_SLUG, demoClientAuth, demoOwnerAuth, enableDemo } from '../../shared/lib/demo';
import { DemoBanner } from '../../shared/ui/DemoBanner';
import { SiteFooter } from '../../shared/ui/SiteFooter';
import { SiteHeader } from '../../shared/ui/SiteHeader';

const SERVICES = [
  ['Masazh terapeutik', '50 min', '45 €'],
  ['Seancë jogë (privat)', '60 min', '35 €'],
  ['Masazh + aromaterapi', '75 min', '60 €'],
];

export function HomePage() {
  const { user, setSession } = useAuth();
  const navigate = useNavigate();
  const [slug, setSlug] = useState<string>(DEMO_SLUG);

  function onFind(event: FormEvent) {
    event.preventDefault();
    const value = slug.trim().toLowerCase();
    if (value) {
      navigate(`/b/${value}`);
    }
  }

  function openOwnerPreview() {
    enableDemo();
    flushSync(() => setSession(demoOwnerAuth()));
    navigate('/app/bookings');
  }

  function openClientPreview() {
    enableDemo();
    flushSync(() => setSession(demoClientAuth()));
    navigate(`/b/${DEMO_SLUG}`);
  }

  function bookAppointment() {
    if (user?.role === 'CLIENT') {
      navigate(`/b/${DEMO_SLUG}`);
      return;
    }
    openClientPreview();
  }

  return (
    <div className="page-shell">
      <DemoBanner />
      <SiteHeader />
      <main>
        <section className="container hero-block grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
          <div>
            <p className="muted text-sm">Për studio masazhi, jogë dhe salone</p>
            <h1 className="hero-title mt-3">Rezervime të qeta, si studioja jote.</h1>
            <p className="hero-lead muted mt-4 max-w-md text-lg">
              Klienti zgjedh shërbimin dhe orën. Ti sheh ditën, stafin dhe kërkesat — pa Excel dhe pa dy
              rezervime në të njëjtën orë.
            </p>
            <div className="hero-cta mt-6 flex flex-wrap gap-3">
              <button className="btn btn-confirm" type="button" onClick={bookAppointment}>
                Book an appointment
              </button>
              <button className="btn btn-primary" type="button" onClick={openOwnerPreview}>
                Provo si pronar
              </button>
              <button className="btn btn-ghost" type="button" onClick={openClientPreview}>
                Provo si klient
              </button>
            </div>
            <form onSubmit={onFind} className="hero-slug mt-6 flex max-w-md gap-2">
              <label className="sr-only" htmlFor="studio-slug">
                Slug i studios
              </label>
              <input
                id="studio-slug"
                className="input"
                placeholder={BUSINESS.slug}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <button className="btn btn-ghost" type="submit">
                Hap
              </button>
            </form>
          </div>

          <div className="card preview-glass p-6 xl:p-8">
            <p className="muted text-sm">{BUSINESS.name}</p>
            <p className="mt-1 text-2xl font-semibold">Rezervim i ri</p>
            <p className="muted mt-2 text-sm">1. Shërbimi · 2. Orari · 3. Të dhënat · 4. Konfirmo</p>
            <div className="mt-6 space-y-4">
              {SERVICES.map(([name, meta, price]) => (
                <div key={name} className="flex items-center justify-between border-t border-[var(--line)] pt-4 first:border-0 first:pt-0">
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="muted text-sm">{meta}</p>
                  </div>
                  <span>{price}</span>
                </div>
              ))}
            </div>
            <div className="preview-times mt-6 flex flex-wrap gap-2">
              {['09:00', '11:00', '14:00', '18:00'].map((time) => (
                <span key={time} className="chip time-chip">
                  {time}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="sherbimet" className="container section-block">
          <h2 className="page-title">Shërbimet</h2>
          <div className="card-grid mt-8 grid gap-4 lg:grid-cols-3">
            {SERVICES.map(([name, meta, price]) => (
              <article key={name} className="card p-8">
                <p className="text-xl font-medium">{name}</p>
                <p className="muted mt-2 text-sm">{meta}</p>
                <p className="stat-value mt-6">{price}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="si-funksionon" className="container section-block">
          <h2 className="page-title">Si funksionon</h2>
          <ol className="card-grid mt-8 grid gap-4 lg:grid-cols-3">
            {[
              ['1. Zgjidh shërbimin', 'Masazh, jogë ose paketë e kombinuar.'],
              ['2. Zgjidh orën', 'Sheh vetëm slotet e lira, pa dyshime.'],
              ['3. Konfirmo', 'Studioja e merr kërkesën dhe të njofton.'],
            ].map(([title, body]) => (
              <li key={title} className="card p-8">
                <p className="text-xl font-medium">{title}</p>
                <p className="muted mt-3 text-sm">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="container section-block">
          <h2 className="page-title">Çfarë thonë klientët</h2>
          <div className="card-grid mt-8 grid gap-4 lg:grid-cols-3">
            {[
              ['Elira B.', 'Rezervova masazhin në dy klikime. Ora ishte e saktë.'],
              ['Genti K.', 'Më pëlqen që nuk ka dy persona në të njëjtën kohë.'],
              ['Sara L.', 'Faqja publike është e qetë, si vetë studioja.'],
            ].map(([who, quote]) => (
              <blockquote key={who} className="card p-8">
                <p className="text-lg">{quote}</p>
                <footer className="muted mt-5 text-sm">{who}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="kontakt" className="container section-block">
          <h2 className="page-title">Kontakt</h2>
          <div className="card contact-links mt-8 grid max-w-xl gap-4 p-8">
            <p className="muted text-sm">
              {BUSINESS.name} · {BUSINESS.city}. Na shkruaj drejtpërdrejt — pa formulare të rreme.
            </p>
            <a className="btn btn-confirm" href={`mailto:${BUSINESS.email}`}>
              Email: {BUSINESS.email}
            </a>
            <a className="btn btn-ghost" href={BUSINESS.phoneHref}>
              Telefon: {BUSINESS.phoneDisplay}
            </a>
            <a className="btn btn-primary" href={BUSINESS.whatsappHref} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
