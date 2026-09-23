import {
  parseMinutes,
  rangesOverlap,
  zonedDateParts,
  zonedLocalToUtc,
} from '../../common/time/schedule';

export const SLOT_STEP_MINUTES = 15;

export type AvailabilityWindow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export function parseIsoDate(value: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error('INVALID_DATE');
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function generateOpenSlots(input: {
  date: string;
  timeZone: string;
  durationMinutes: number;
  stepMinutes?: number;
  windows: AvailabilityWindow[];
  bookings: Array<{ startAt: Date; endAt: Date }>;
  now: Date;
}): Date[] {
  const { year, month, day } = parseIsoDate(input.date);
  const step = input.stepMinutes ?? SLOT_STEP_MINUTES;
  const noon = zonedLocalToUtc(year, month, day, 12 * 60, input.timeZone);
  const { dayOfWeek } = zonedDateParts(noon, input.timeZone);

  const slots: Date[] = [];

  for (const window of input.windows) {
    if (window.dayOfWeek !== dayOfWeek) {
      continue;
    }

    const windowStart = parseMinutes(window.startTime);
    const windowEnd = parseMinutes(window.endTime);

    for (let start = windowStart; start + input.durationMinutes <= windowEnd; start += step) {
      const startAt = zonedLocalToUtc(year, month, day, start, input.timeZone);
      const endAt = new Date(startAt.getTime() + input.durationMinutes * 60_000);

      if (startAt.getTime() <= input.now.getTime()) {
        continue;
      }

      const taken = input.bookings.some((booking) =>
        rangesOverlap(startAt, endAt, booking.startAt, booking.endAt),
      );

      if (!taken) {
        slots.push(startAt);
      }
    }
  }

  return slots;
}
