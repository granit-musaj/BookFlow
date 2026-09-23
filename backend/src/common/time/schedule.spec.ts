import { describe, expect, it } from 'vitest';
import {
  localSlotMinutes,
  parseMinutes,
  rangesOverlap,
  slotFitsWindow,
  zonedLocalToUtc,
} from './schedule';

describe('schedule helpers', () => {
  it('parses HH:mm into minutes from midnight', () => {
    expect(parseMinutes('09:30')).toBe(570);
    expect(parseMinutes('00:00')).toBe(0);
    expect(parseMinutes('23:59')).toBe(23 * 60 + 59);
  });

  it('treats booking ranges as half-open [start, end)', () => {
    const ten = new Date('2026-09-22T10:00:00.000Z');
    const eleven = new Date('2026-09-22T11:00:00.000Z');
    const noon = new Date('2026-09-22T12:00:00.000Z');

    expect(rangesOverlap(ten, eleven, eleven, noon)).toBe(false);
    expect(rangesOverlap(ten, noon, eleven, noon)).toBe(true);
  });

  it('requires the slot to sit fully inside a work window', () => {
    expect(slotFitsWindow(10 * 60, 11 * 60, '09:00', '17:00')).toBe(true);
    expect(slotFitsWindow(16 * 60, 17 * 60 + 30, '09:00', '17:00')).toBe(false);
  });

  it('converts Tirane wall time to UTC in summer and winter', () => {
    expect(zonedLocalToUtc(2026, 9, 22, 10 * 60, 'Europe/Tirane').toISOString()).toBe(
      '2026-09-22T08:00:00.000Z',
    );
    expect(zonedLocalToUtc(2026, 1, 15, 10 * 60, 'Europe/Tirane').toISOString()).toBe(
      '2026-01-15T09:00:00.000Z',
    );
  });

  it('maps a UTC instant onto Europe/Tirane wall time', () => {
    const start = new Date('2026-09-22T08:00:00.000Z');
    const end = new Date('2026-09-22T09:00:00.000Z');
    const slot = localSlotMinutes(start, end, 'Europe/Tirane');

    expect(slot.dayOfWeek).toBe(2);
    expect(slot.startMinutes).toBe(10 * 60);
    expect(slot.endMinutes).toBe(11 * 60);
  });
});
