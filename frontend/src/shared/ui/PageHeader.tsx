import { ReactNode } from 'react';
import { Clock } from './Clock';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="muted mt-1 max-w-xl">{subtitle}</p>}
      </div>
      <Clock />
    </div>
  );
}
