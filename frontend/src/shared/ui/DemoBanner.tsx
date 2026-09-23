import { disableDemo, isDemo } from '../lib/demo';

export function DemoBanner({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  if (!isDemo()) {
    return null;
  }

  const dark = tone === 'dark';

  return (
    <div className={dark ? 'mt-4 text-xs leading-relaxed text-white/35' : 'banner-demo'}>
      {dark ? 'Modalitet prove, pa Docker.' : 'Modaliteti i provës — të dhëna shembull, pa Docker.'}
      <button
        className={dark ? 'ml-1 text-white/55 underline' : 'ml-3 underline'}
        type="button"
        onClick={() => {
          disableDemo();
          window.location.href = '/';
        }}
      >
        Dil nga prova
      </button>
    </div>
  );
}
