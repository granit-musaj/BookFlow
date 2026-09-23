import { BookingNotificationEvent } from './notification-recipients';
import { reminderLabel } from './reminder-schedule';

export type BookingNoticeSnapshot = {
  serviceName: string;
  staffName: string;
  clientName: string;
  startAt: Date;
  offsetMinutes?: number;
};

export function buildNotificationCopy(
  event: BookingNotificationEvent,
  snapshot: BookingNoticeSnapshot,
  recipientRole: 'OWNER' | 'STAFF' | 'CLIENT',
): { title: string; body: string } {
  const when = snapshot.startAt.toISOString();

  if (event === 'BOOKING_REMINDER') {
    const window = reminderLabel(snapshot.offsetMinutes ?? 60);
    if (recipientRole === 'CLIENT') {
      return {
        title: 'Upcoming booking',
        body: `Your ${snapshot.serviceName} with ${snapshot.staffName} starts in ${window} (${when}).`,
      };
    }
    return {
      title: 'Upcoming booking',
      body: `${snapshot.clientName} has ${snapshot.serviceName} with ${snapshot.staffName} in ${window} (${when}).`,
    };
  }

  if (event === 'BOOKING_CREATED') {
    if (recipientRole === 'CLIENT') {
      return {
        title: 'Booking requested',
        body: `Your ${snapshot.serviceName} with ${snapshot.staffName} on ${when} is pending confirmation.`,
      };
    }
    return {
      title: 'New booking request',
      body: `${snapshot.clientName} requested ${snapshot.serviceName} with ${snapshot.staffName} on ${when}.`,
    };
  }

  if (event === 'BOOKING_CONFIRMED') {
    return {
      title: 'Booking confirmed',
      body: `${snapshot.serviceName} with ${snapshot.staffName} on ${when} is confirmed.`,
    };
  }

  return {
    title: 'Booking cancelled',
    body: `${snapshot.serviceName} with ${snapshot.staffName} on ${when} was cancelled.`,
  };
}
