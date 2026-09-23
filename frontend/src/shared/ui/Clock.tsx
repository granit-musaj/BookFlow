import { useEffect, useState } from 'react';
import { formatClockDate, formatClockTime } from '../types/domain';

export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="text-right leading-tight">
      <p className="muted text-sm">{formatClockDate(now)}</p>
      <p className="stat-value mt-1 text-lg tabular-nums">{formatClockTime(now)}</p>
    </div>
  );
}
