export type Theme = 'light' | 'dark' | 'system';

const KEY = 'bookflow-theme';

export function readTheme(): Theme {
  const value = localStorage.getItem(KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function applyTheme(theme: Theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem(KEY);
    return;
  }
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(KEY, theme);
}

export function cycleTheme(current: Theme): Theme {
  const next = current === 'system' ? 'dark' : current === 'dark' ? 'light' : 'system';
  applyTheme(next);
  return next;
}
