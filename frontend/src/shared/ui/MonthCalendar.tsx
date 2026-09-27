const WEEKDAYS = ['Hë', 'Ma', 'Më', 'En', 'Pr', 'Sh', 'Di'];
const MONTHS = [
  'janar',
  'shkurt',
  'mars',
  'prill',
  'maj',
  'qershor',
  'korrik',
  'gusht',
  'shtator',
  'tetor',
  'nëntor',
  'dhjetor',
];

function keyOf(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function MonthCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const selected = new Date(`${value}T12:00:00`);
  const month = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const today = startOfDay(new Date());
  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => {
    if (index < firstWeekday) {
      return null;
    }
    return new Date(month.getFullYear(), month.getMonth(), index - firstWeekday + 1);
  });

  function shift(delta: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    const day = Math.min(selected.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate());
    onChange(keyOf(new Date(next.getFullYear(), next.getMonth(), day)));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button className="btn btn-ghost" type="button" onClick={() => shift(-1)} aria-label="Muaji i kaluar">
          Mbrapa
        </button>
        <p className="font-medium">
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </p>
        <button className="btn btn-ghost" type="button" onClick={() => shift(1)} aria-label="Muaji i ardhshëm">
          Para
        </button>
      </div>
      <div className="calendar">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`} className="muted text-center text-xs">
            {day}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) {
            return <span key={`e-${index}`} />;
          }
          const key = keyOf(date);
          const past = startOfDay(date) < today;
          return (
            <button
              key={key}
              type="button"
              className={`calendar-day ${key === value ? 'is-on' : ''}`}
              disabled={past}
              aria-label={`${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}${past ? ', e padisponueshme' : ''}`}
              aria-pressed={key === value}
              onClick={() => onChange(key)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
