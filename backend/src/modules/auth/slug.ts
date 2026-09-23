export function slugify(value: string): string {
  const base = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return base.length > 0 ? base : 'business';
}

export function slugWithSuffix(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
