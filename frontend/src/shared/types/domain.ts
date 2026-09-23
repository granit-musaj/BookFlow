export type Business = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
};

export type BusinessStats = {
  bookingsToday: number;
  bookingsThisWeek: number;
  estimatedRevenueCents: number;
  mostRequestedHour: string | null;
};

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
};

export type Availability = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type StaffMember = {
  id: string;
  displayName: string;
  isActive: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
  services: Service[];
  availabilities: Availability[];
};

export type ClientUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  phone?: string;
};

export type AppNotification = {
  id: string;
  type: 'BOOKING_CREATED' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'BOOKING_REMINDER';
  title: string;
  body: string;
  readAt: string | null;
  bookingId: string | null;
  createdAt: string;
};

export type Booking = {
  id: string;
  startAt: string;
  endAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  notes: string | null;
  staff: { id: string; displayName: string; userId: string };
  service: { id: string; name: string; durationMinutes: number; priceCents: number };
  client: { id: string; firstName: string; lastName: string; email: string };
};

export const WEEKDAYS = ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'] as const;

export const STATUS_LABEL: Record<Booking['status'], string> = {
  PENDING: 'Në pritje',
  CONFIRMED: 'Konfirmuar',
  CANCELLED: 'Anuluar',
};

const WEEKDAY_LONG = ['e diel', 'e hënë', 'e martë', 'e mërkurë', 'e enjte', 'e premte', 'e shtunë'];
const MONTH_LONG = [
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

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function formatMoney(cents: number) {
  return `${Math.round(cents / 100)} €`;
}

export function formatClockDate(date: Date) {
  return `${WEEKDAY_LONG[date.getDay()]}, ${date.getDate()} ${MONTH_LONG[date.getMonth()]}`;
}

export function formatClockTime(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export function formatDayMonth(date: Date) {
  return `${date.getDate()} ${MONTH_LONG[date.getMonth()]}`;
}

export function formatTime(iso: string) {
  const value = new Date(iso);
  return `${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
}

export function formatDateTime(iso: string) {
  const value = new Date(iso);
  return `${formatDayMonth(value)} · ${formatTime(iso)}`;
}

export function shortName(firstName: string, lastName: string) {
  return `${firstName} ${lastName.charAt(0)}.`;
}

export function isSameDay(iso: string, day = new Date()) {
  const value = new Date(iso);
  return (
    value.getFullYear() === day.getFullYear() &&
    value.getMonth() === day.getMonth() &&
    value.getDate() === day.getDate()
  );
}
