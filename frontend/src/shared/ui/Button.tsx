import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'confirm' | 'danger';

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      className={`btn btn-${variant} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? 'Duke u dërguar…' : children}
    </button>
  );
}
