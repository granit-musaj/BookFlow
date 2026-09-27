import { useState } from 'react';
import { cycleTheme, readTheme, Theme } from '../lib/theme';

const LABEL: Record<Theme, string> = {
  system: 'Tema: sistemi',
  dark: 'Tema: e errët',
  light: 'Tema: e ndritur',
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={LABEL[theme]}
      onClick={() => setTheme(cycleTheme(theme))}
    >
      {LABEL[theme]}
    </button>
  );
}
