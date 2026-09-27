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
      aria-label={count > 0 ? `Njoftime, ${count} të palexuara` : 'Njoftime'}
      className={({ isActive }) => `side-link ${isActive ? 'side-link-on' : ''}`}
      data-tooltip="Njoftime"
      title="Njoftime"
    >
      <svg className="side-icon" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M6 17h12l-1.2-2.1V11a4.8 4.8 0 0 0-9.6 0v3.9L6 17zm4.2 2.2a1.8 1.8 0 0 0 3.6 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="side-text">Njoftime</span>
      {count > 0 && <span className="sidebar-count">{count > 9 ? '9+' : count}</span>}
    </NavLink>
  );
}
