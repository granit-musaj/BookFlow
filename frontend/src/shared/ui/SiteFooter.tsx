import { Link } from 'react-router-dom';
import { BUSINESS } from '../config/business';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container flex flex-wrap items-center justify-between gap-3">
        <p>BookFlow · rezervime për studio të qeta</p>
        <nav className="flex flex-wrap gap-4">
          <Link to="/login">Hyr</Link>
          <Link to={`/b/${BUSINESS.slug}`}>Rezervo</Link>
          <a href={`mailto:${BUSINESS.email}`}>Email</a>
          <Link to="/#kontakt">Kontakt</Link>
        </nav>
      </div>
    </footer>
  );
}
