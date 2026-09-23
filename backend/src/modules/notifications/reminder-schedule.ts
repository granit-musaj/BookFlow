export const DEFAULT_REMINDER_OFFSETS_MINUTES = [24 * 60, 60] as const;

export type ReminderOffsetMinutes = (typeof DEFAULT_REMINDER_OFFSETS_MINUTES)[number];

export function reminderJobId(bookingId: string, offsetMinutes: number) {
  return `booking-reminder:${bookingId}:${offsetMinutes}`;
}

export function reminderLabel(offsetMinutes: number) {
  if (offsetMinutes >= 60 && offsetMinutes % 60 === 0) {
    const hours = offsetMinutes / 60;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  return `${offsetMinutes} minutes`;
}

/** Delay until the reminder should fire, or null if that window has already passed. */
export function reminderDelayMs(startAt: Date, offsetMinutes: number, now = new Date()): number | null {
  const delay = startAt.getTime() - offsetMinutes * 60_000 - now.getTime();
  return delay > 0 ? delay : null;
}

/** True when startAt is still in the future but the reminder window is already due. */
export function isCatchUpReminder(startAt: Date, offsetMinutes: number, now = new Date()) {
  return startAt.getTime() > now.getTime() && reminderDelayMs(startAt, offsetMinutes, now) === null;
}
