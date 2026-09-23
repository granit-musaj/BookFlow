import { describe, expect, it } from 'vitest';
import {
  isCatchUpReminder,
  reminderDelayMs,
  reminderJobId,
  reminderLabel,
} from './reminder-schedule';

describe('reminder schedule', () => {
  const startAt = new Date('2026-09-22T17:00:00.000Z');

  it('delays a 1-hour reminder until 60 minutes before startAt', () => {
    const now = new Date('2026-09-22T14:00:00.000Z');
    expect(reminderDelayMs(startAt, 60, now)).toBe(2 * 60 * 60_000);
  });

  it('skips a reminder whose window already passed', () => {
    const now = new Date('2026-09-22T16:30:00.000Z');
    expect(reminderDelayMs(startAt, 60, now)).toBeNull();
  });

  it('catches up when the appointment is still upcoming', () => {
    const now = new Date('2026-09-22T16:30:00.000Z');
    expect(isCatchUpReminder(startAt, 60, now)).toBe(true);
    expect(isCatchUpReminder(startAt, 60, new Date('2026-09-22T17:01:00.000Z'))).toBe(false);
  });

  it('uses a stable BullMQ job id so cancel can remove it', () => {
    expect(reminderJobId('bkg-1', 60)).toBe('booking-reminder:bkg-1:60');
  });

  it('labels hour offsets in English for email copy', () => {
    expect(reminderLabel(60)).toBe('1 hour');
    expect(reminderLabel(1440)).toBe('24 hours');
  });
});
