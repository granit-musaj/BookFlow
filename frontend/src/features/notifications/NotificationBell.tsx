import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../../shared/lib/api';

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const result = await api<{ count: number }>('/notifications/unread-count');
        if (!cancelled) {
          setCount(result.count);
        }
      } catch {
        if (!cancelled) {
          setCount(0);
        }
      }
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 20000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <NavLink
      to="/app/notifications"
      className={({ isActive }) => `side-link ${isActive ? 'side-link-on' : ''}`}
    >
      <span className="flex items-center justify-between">
        Njoftime
        {count > 0 && (
          <span className="rounded-full bg-white/15 px-2 text-[11px] text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </span>
    </NavLink>
  );
}
