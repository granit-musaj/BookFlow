export const TIME_HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function parseMinutes(hhmm: string): number {
  const match = TIME_HHMM.exec(hhmm);
  if (!match) {
    throw new Error(`Invalid time: ${hhmm}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function slotFitsWindow(
  slotStartMinutes: number,
  slotEndMinutes: number,
  windowStart: string,
  windowEnd: string,
): boolean {
  return (
    slotStartMinutes >= parseMinutes(windowStart) &&
    slotEndMinutes <= parseMinutes(windowEnd)
  );
}

export function zonedDateParts(
  date: Date,
  timeZone: string,
): { dayOfWeek: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Sun';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  const dayOfWeek = WEEKDAYS.indexOf(weekday as (typeof WEEKDAYS)[number]);

  return {
    dayOfWeek: dayOfWeek === -1 ? 0 : dayOfWeek,
    minutes: hour * 60 + minute,
  };
}

function zonedCivilUtcMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  return Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'), 0, 0);
}

export function shiftCalendarDate(
  year: number,
  month: number,
  day: number,
  days: number,
): { year: number; month: number; day: number } {
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

/** Orari muri (p.sh. 10:00 në Europe/Tirane) → instant UTC. */
export function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  minutesFromMidnight: number,
  timeZone: string,
): Date {
  const extraDays = Math.floor(minutesFromMidnight / (24 * 60));
  const minutes = minutesFromMidnight - extraDays * 24 * 60;
  const shifted = shiftCalendarDate(year, month, day, extraDays);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const wanted = Date.UTC(shifted.year, shifted.month - 1, shifted.day, hour, minute, 0, 0);

  let utcMs = wanted;
  for (let i = 0; i < 4; i += 1) {
    const seen = zonedCivilUtcMs(new Date(utcMs), timeZone);
    utcMs += wanted - seen;
  }

  return new Date(utcMs);
}

/** [start, end) në minuta lokale. Nëse mbaron në mesnatë, end = 1440. */
export function localSlotMinutes(
  startAt: Date,
  endAt: Date,
  timeZone: string,
): { dayOfWeek: number; startMinutes: number; endMinutes: number } {
  const start = zonedDateParts(startAt, timeZone);
  const end = zonedDateParts(endAt, timeZone);

  const crossesMidnight = end.dayOfWeek !== start.dayOfWeek;
  const endMinutes = crossesMidnight && end.minutes === 0 ? 24 * 60 : end.minutes;

  if (crossesMidnight && end.minutes !== 0) {
    throw new Error('CROSSES_MIDNIGHT');
  }

  return {
    dayOfWeek: start.dayOfWeek,
    startMinutes: start.minutes,
    endMinutes,
  };
}
