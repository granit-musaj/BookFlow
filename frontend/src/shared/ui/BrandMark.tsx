import { Link } from 'react-router-dom';

export function BrandMark({ to = '/', light = false }: { to?: string; light?: boolean }) {
  return (
    <Link to={to} className={`brand${light ? ' brand-light' : ''}`}>
      <span className="brand-mark" aria-hidden />
      <span className="brand-name">BookFlow</span>
    </Link>
  );
}
