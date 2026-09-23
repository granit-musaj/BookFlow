export const NOTIFICATIONS_QUEUE = 'notifications';
export const SEND_EMAIL_JOB = 'send-email';
export const BOOKING_REMINDER_JOB = 'booking-reminder';

export type SendEmailJob = {
  notificationId: string;
};

export type BookingReminderJob = {
  bookingId: string;
  offsetMinutes: number;
};
