import { describe, expect, it } from 'vitest';
import { generateOpenSlots } from './slots';

describe('generateOpenSlots', () => {
  const tuesday = '2026-09-22';
  const windows = [{ dayOfWeek: 2, startTime: '09:00', endTime: '12:00' }];

  it('builds duration-aligned slots inside the work window', () => {
    const slots = generateOpenSlots({
      date: tuesday,
      timeZone: 'Europe/Tirane',
      durationMinutes: 60,
      stepMinutes: 60,
      windows,
      bookings: [],
      now: new Date('2026-09-21T10:00:00.000Z'),
    });

    expect(slots.map((slot) => slot.toISOString())).toEqual([
      '2026-09-22T07:00:00.000Z',
      '2026-09-22T08:00:00.000Z',
      '2026-09-22T09:00:00.000Z',
    ]);
  });

  it('removes slots that overlap an existing booking', () => {
    const slots = generateOpenSlots({
      date: tuesday,
      timeZone: 'Europe/Tirane',
      durationMinutes: 60,
      stepMinutes: 60,
      windows,
      bookings: [
        {
          startAt: new Date('2026-09-22T08:00:00.000Z'),
          endAt: new Date('2026-09-22T09:00:00.000Z'),
        },
      ],
      now: new Date('2026-09-21T10:00:00.000Z'),
    });

    expect(slots.map((slot) => slot.toISOString())).toEqual([
      '2026-09-22T07:00:00.000Z',
      '2026-09-22T09:00:00.000Z',
    ]);
  });

  it('hides slots that have already started', () => {
    const slots = generateOpenSlots({
      date: tuesday,
      timeZone: 'Europe/Tirane',
      durationMinutes: 60,
      stepMinutes: 60,
      windows,
      bookings: [],
      now: new Date('2026-09-22T08:05:00.000Z'),
    });

    expect(slots.map((slot) => slot.toISOString())).toEqual(['2026-09-22T09:00:00.000Z']);
  });
});
