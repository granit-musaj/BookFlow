import { AuthResponse, PublicUser, Role } from '../types/auth';
import {
  AppNotification,
  Booking,
  Business,
  BusinessStats,
  ClientUser,
  isSameDay,
  Service,
  StaffMember,
} from '../types/domain';

export const DEMO_FLAG = 'bookflow-demo';
export const DEMO_SLUG = 'studio-aureel';

export function isDemo() {
  return localStorage.getItem(DEMO_FLAG) === '1';
}

export function enableDemo() {
  localStorage.setItem(DEMO_FLAG, '1');
}

export function disableDemo() {
  localStorage.removeItem(DEMO_FLAG);
  localStorage.removeItem(STORE_KEY);
}

const STORE_KEY = 'bookflow-aureel-v1';

type DemoUser = PublicUser & { password: string };

type Store = {
  business: Business;
  users: DemoUser[];
  services: Service[];
  staff: StaffMember[];
  clients: ClientUser[];
  bookings: Booking[];
  notifications: Array<AppNotification & { userId: string }>;
  passwordResets: Array<{ token: string; userId: string; expiresAt: number }>;
};

function atHour(hours: number, minutes = 0, dayOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function seed(): Store {
  const massage: Service = {
    id: 'svc-massage',
    name: 'Masazh terapeutik',
    durationMinutes: 50,
    priceCents: 4500,
    isActive: true,
  };
  const yoga: Service = {
    id: 'svc-yoga',
    name: 'Seancë jogë (privat)',
    durationMinutes: 60,
    priceCents: 3500,
    isActive: true,
  };
  const aroma: Service = {
    id: 'svc-aroma',
    name: 'Masazh + aromaterapi',
    durationMinutes: 75,
    priceCents: 6000,
    isActive: true,
  };

  const weekdays = [1, 2, 3, 4, 5, 6].map((day, index) => ({
    id: `av-${index + 1}`,
    dayOfWeek: day,
    startTime: '09:00',
    endTime: day === 6 ? '15:00' : '18:00',
  }));

  const clients: ClientUser[] = [
    { id: 'user-genti', email: 'genti@email.com', firstName: 'Genti', lastName: 'Kola', isActive: true, phone: '+355 69 111 1111' },
    { id: 'user-mira-c', email: 'mira.d@email.com', firstName: 'Mira', lastName: 'Dervishi', isActive: true, phone: '+355 69 222 2222' },
    { id: 'user-sara', email: 'sara@email.com', firstName: 'Sara', lastName: 'Leka', isActive: true, phone: '+355 69 333 3333' },
    { id: 'user-elira', email: 'elira@email.com', firstName: 'Elira', lastName: 'Berisha', isActive: true, phone: '+355 69 000 0000' },
    { id: 'user-ardi', email: 'ardi@email.com', firstName: 'Ardi', lastName: 'Peci', isActive: true, phone: '+355 69 444 4444' },
    { id: 'user-lora', email: 'lora@email.com', firstName: 'Lora', lastName: 'Hysa', isActive: true, phone: '+355 69 555 5555' },
    { id: 'user-besa', email: 'besa@email.com', firstName: 'Besa', lastName: 'Meta', isActive: true, phone: '+355 69 666 6666' },
  ];

  const staffRef = { id: 'staff-ana', displayName: 'Ana Hoxha', userId: 'user-owner' };

  function booking(
    id: string,
    client: ClientUser,
    service: Service,
    start: Date,
    status: Booking['status'],
  ): Booking {
    return {
      id,
      startAt: start.toISOString(),
      endAt: new Date(start.getTime() + service.durationMinutes * 60_000).toISOString(),
      status,
      notes: null,
      staff: staffRef,
      service: {
        id: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
      },
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
      },
    };
  }

  return {
    business: {
      id: 'biz-1',
      name: 'Studio Aureel',
      slug: DEMO_SLUG,
      timezone: 'Europe/Tirane',
    },
    users: [
      {
        id: 'user-owner',
        email: 'ana@studio.com',
        password: 'password123',
        firstName: 'Ana',
        lastName: 'Hoxha',
        role: 'OWNER',
        businessId: 'biz-1',
      },
      {
        id: 'user-staff',
        email: 'mira@studio.com',
        password: 'password123',
        firstName: 'Mira',
        lastName: 'Leka',
        role: 'STAFF',
        businessId: 'biz-1',
      },
      {
        id: 'user-elira',
        email: 'elira@email.com',
        password: 'password123',
        firstName: 'Elira',
        lastName: 'Berisha',
        role: 'CLIENT',
        businessId: 'biz-1',
      },
    ],
    services: [massage, yoga, aroma],
    staff: [
      {
        id: 'staff-ana',
        displayName: 'Ana Hoxha',
        isActive: true,
        user: {
          id: 'user-owner',
          email: 'ana@studio.com',
          firstName: 'Ana',
          lastName: 'Hoxha',
          isActive: true,
        },
        services: [massage, yoga, aroma],
        availabilities: weekdays,
      },
      {
        id: 'staff-mira',
        displayName: 'Mira Leka',
        isActive: true,
        user: {
          id: 'user-staff',
          email: 'mira@studio.com',
          firstName: 'Mira',
          lastName: 'Leka',
          isActive: true,
        },
        services: [yoga, massage],
        availabilities: weekdays,
      },
    ],
    clients,
    bookings: [
      booking('bkg-1', clients[0], massage, atHour(9), 'CONFIRMED'),
      booking('bkg-2', clients[1], yoga, atHour(11), 'CONFIRMED'),
      booking('bkg-3', clients[2], aroma, atHour(15, 30), 'CONFIRMED'),
      booking('bkg-4', clients[4], yoga, atHour(14), 'PENDING'),
      booking('bkg-5', clients[5], massage, atHour(10), 'PENDING'),
      booking('bkg-6', clients[6], yoga, atHour(14), 'PENDING'),
      booking('bkg-7', clients[3], massage, atHour(17), 'PENDING'),
    ],
    notifications: [
      {
        id: 'ntf-1',
        userId: 'user-owner',
        type: 'BOOKING_CREATED',
        title: 'Rezervim i ri',
        body: 'Ardi Peci kërkoi Seancë jogë (privat) në 14:00.',
        readAt: null,
        bookingId: 'bkg-4',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ntf-2',
        userId: 'user-elira',
        type: 'BOOKING_CREATED',
        title: 'Rezervimi u dërgua',
        body: 'Masazh terapeutik në 17:00 pret konfirmim.',
        readAt: null,
        bookingId: 'bkg-7',
        createdAt: new Date().toISOString(),
      },
    ],
    passwordResets: [],
  };
}

function loadStore(): Store {
  const raw = sessionStorage.getItem(STORE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Store;
      return { ...parsed, passwordResets: parsed.passwordResets ?? [] };
    } catch {
      // fall through
    }
  }
  const created = seed();
  sessionStorage.setItem(STORE_KEY, JSON.stringify(created));
  return created;
}

function saveStore(store: Store) {
  sessionStorage.setItem(STORE_KEY, JSON.stringify(store));
}

let demoUser: PublicUser | null = null;

export function setDemoUser(user: PublicUser | null) {
  demoUser = user;
}

function currentUser(): PublicUser | null {
  return demoUser;
}

function toAuth(user: DemoUser): AuthResponse {
  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      businessId: user.businessId,
    },
    tokens: { accessToken: 'demo-access', refreshToken: 'demo-refresh' },
  };
}

export const demoOwnerAuth = () => toAuth(seed().users[0]);
export const demoClientAuth = () => toAuth(seed().users[2]);

function json<T>(data: T) {
  return data;
}

export function handleDemo<T>(path: string, options: RequestInit = {}): T {
  enableDemo();
  const store = loadStore();
  const method = (options.method ?? 'GET').toUpperCase();
  const body = options.body ? (JSON.parse(String(options.body)) as Record<string, unknown>) : {};
  const user = currentUser();

  if (path === '/auth/login' && method === 'POST') {
    const found = store.users.find((row) => row.email === String(body.email).toLowerCase());
    if (!found || found.password !== String(body.password)) {
      throw new Error('Email ose fjalëkalim i pasaktë');
    }
    return json(toAuth(found) as T);
  }

  if (path === '/auth/forgot-password' && method === 'POST') {
    const found = store.users.find((row) => row.email === String(body.email).toLowerCase());
    if (found) {
      const token = `demo-reset-${found.id}-${Date.now()}`;
      store.passwordResets.push({
        token,
        userId: found.id,
        expiresAt: Date.now() + 60 * 60 * 1000,
      });
      saveStore(store);
      console.info(`[demo] reset-password link: /reset-password?token=${token}`);
    }
    return json({ ok: true } as T);
  }

  if (path === '/auth/reset-password' && method === 'POST') {
    const row = store.passwordResets.find(
      (item) => item.token === String(body.token) && item.expiresAt > Date.now(),
    );
    if (!row) {
      throw new Error('Token i pavlefshëm ose i skaduar');
    }
    const account = store.users.find((item) => item.id === row.userId);
    if (!account) {
      throw new Error('Token i pavlefshëm ose i skaduar');
    }
    account.password = String(body.password);
    store.passwordResets = store.passwordResets.filter((item) => item.token !== row.token);
    saveStore(store);
    return json({ ok: true } as T);
  }

  if (path === '/auth/register' && method === 'POST') {
    const role = (body.role as Role) ?? 'OWNER';
    const created: DemoUser = {
      id: `user-${Date.now()}`,
      email: String(body.email).toLowerCase(),
      password: String(body.password),
      firstName: String(body.firstName),
      lastName: String(body.lastName),
      role,
      businessId: 'biz-1',
    };
    store.users.push(created);
    if (role === 'CLIENT') {
      store.clients.push({
        id: created.id,
        email: created.email,
        firstName: created.firstName,
        lastName: created.lastName,
        isActive: true,
      });
    }
    saveStore(store);
    return json(toAuth(created) as T);
  }

  if (path === '/businesses/me') {
    return json(store.business as T);
  }

  if (path === '/businesses/me/stats') {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfToday);
    const weekday = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (weekday === 0 ? 6 : weekday - 1));
    const startOfNextWeek = new Date(startOfWeek);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

    const active = store.bookings.filter((row) => row.status !== 'CANCELLED');
    const today = active.filter((row) => isSameDay(row.startAt));
    const week = active.filter((row) => {
      const start = new Date(row.startAt);
      return start >= startOfWeek && start < startOfNextWeek;
    });
    const hourCounts = week.reduce<Record<string, number>>((acc, row) => {
      const hour = `${String(new Date(row.startAt).getHours()).padStart(2, '0')}:00`;
      acc[hour] = (acc[hour] ?? 0) + 1;
      return acc;
    }, {});
    const stats: BusinessStats = {
      bookingsToday: today.length,
      bookingsThisWeek: week.length,
      estimatedRevenueCents: week.reduce((sum, row) => sum + row.service.priceCents, 0),
      mostRequestedHour: Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    };
    return json(stats as T);
  }

  if (path === '/services' && method === 'GET') {
    return json(store.services as T);
  }

  if (path === '/services' && method === 'POST') {
    const service: Service = {
      id: `svc-${Date.now()}`,
      name: String(body.name),
      durationMinutes: Number(body.durationMinutes),
      priceCents: Number(body.priceCents),
      isActive: true,
    };
    store.services.push(service);
    saveStore(store);
    return json(service as T);
  }

  const servicePatch = path.match(/^\/services\/([^/]+)$/);
  if (servicePatch && method === 'PATCH') {
    const service = store.services.find((row) => row.id === servicePatch[1]);
    if (!service) {
      throw new Error('Nuk u gjet');
    }
    Object.assign(service, body);
    saveStore(store);
    return json(service as T);
  }

  if (path === '/staff' && method === 'GET') {
    return json(store.staff as T);
  }

  if (path === '/staff' && method === 'POST') {
    const member: StaffMember = {
      id: `staff-${Date.now()}`,
      displayName: String(body.displayName),
      isActive: true,
      user: {
        id: `user-${Date.now()}`,
        email: String(body.email),
        firstName: String(body.firstName),
        lastName: String(body.lastName),
        isActive: true,
      },
      services: store.services.filter((service) => (body.serviceIds as string[] | undefined)?.includes(service.id)),
      availabilities: [],
    };
    store.staff.push(member);
    saveStore(store);
    return json(member as T);
  }

  const staffPatch = path.match(/^\/staff\/([^/]+)$/);
  if (staffPatch && method === 'PATCH') {
    const member = store.staff.find((row) => row.id === staffPatch[1]);
    if (!member) {
      throw new Error('Nuk u gjet');
    }
    if (Array.isArray(body.serviceIds)) {
      member.services = store.services.filter((service) => (body.serviceIds as string[]).includes(service.id));
    }
    if (typeof body.displayName === 'string') {
      member.displayName = body.displayName;
    }
    saveStore(store);
    return json(member as T);
  }

  const addAvail = path.match(/^\/staff\/([^/]+)\/availability$/);
  if (addAvail && method === 'POST') {
    const member = store.staff.find((row) => row.id === addAvail[1]);
    if (!member) {
      throw new Error('Nuk u gjet');
    }
    member.availabilities.push({
      id: `av-${Date.now()}`,
      dayOfWeek: Number(body.dayOfWeek),
      startTime: String(body.startTime),
      endTime: String(body.endTime),
    });
    saveStore(store);
    return json(member.availabilities.at(-1) as T);
  }

  const delAvail = path.match(/^\/staff\/([^/]+)\/availability\/([^/]+)$/);
  if (delAvail && method === 'DELETE') {
    const member = store.staff.find((row) => row.id === delAvail[1]);
    if (member) {
      member.availabilities = member.availabilities.filter((row) => row.id !== delAvail[2]);
      saveStore(store);
    }
    return json({ success: true } as T);
  }

  if (path === '/users/clients' && method === 'GET') {
    return json(store.clients as T);
  }

  if (path === '/users/clients' && method === 'POST') {
    const client: ClientUser = {
      id: `user-${Date.now()}`,
      email: String(body.email),
      firstName: String(body.firstName),
      lastName: String(body.lastName),
      isActive: true,
      phone: body.phone ? String(body.phone) : undefined,
    };
    store.clients.push(client);
    store.users.push({
      id: client.id,
      email: client.email,
      password: String(body.password ?? 'password123'),
      firstName: client.firstName,
      lastName: client.lastName,
      role: 'CLIENT',
      businessId: 'biz-1',
    });
    saveStore(store);
    return json(client as T);
  }

  if (path === '/bookings' && method === 'GET') {
    const rows =
      user?.role === 'CLIENT'
        ? store.bookings.filter((row) => row.client.id === user.id)
        : user?.role === 'STAFF'
          ? store.bookings.filter((row) => row.staff.userId === user.id)
          : store.bookings;
    return json(rows as T);
  }

  if (path === '/bookings' && method === 'POST') {
    return json(createBooking(store, body, user) as T);
  }

  const confirm = path.match(/^\/bookings\/([^/]+)\/confirm$/);
  if (confirm && method === 'POST') {
    const booking = store.bookings.find((row) => row.id === confirm[1]);
    if (booking) {
      booking.status = 'CONFIRMED';
      pushCatchUpReminders(store, booking);
      saveStore(store);
    }
    return json(booking as T);
  }

  const cancel = path.match(/^\/bookings\/([^/]+)\/cancel$/);
  if (cancel && method === 'POST') {
    const booking = store.bookings.find((row) => row.id === cancel[1]);
    if (booking) {
      booking.status = 'CANCELLED';
      saveStore(store);
    }
    return json(booking as T);
  }

  if (path === '/notifications' && method === 'GET') {
    return json(store.notifications.filter((row) => row.userId === user?.id) as T);
  }

  if (path === '/notifications/unread-count') {
    const count = store.notifications.filter((row) => row.userId === user?.id && !row.readAt).length;
    return json({ count } as T);
  }

  const readOne = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (readOne && method === 'PATCH') {
    const row = store.notifications.find((item) => item.id === readOne[1] && item.userId === user?.id);
    if (row) {
      row.readAt = new Date().toISOString();
      saveStore(store);
    }
    return json({ success: true } as T);
  }

  if (path === '/notifications/read-all' && method === 'POST') {
    store.notifications.forEach((row) => {
      if (row.userId === user?.id) {
        row.readAt = row.readAt ?? new Date().toISOString();
      }
    });
    saveStore(store);
    return json({ success: true } as T);
  }

  const publicCatalog = path.match(/^\/public\/businesses\/([^/?]+)$/);
  if (publicCatalog && method === 'GET') {
    if (publicCatalog[1] !== store.business.slug) {
      throw new Error('Studios nuk u gjet');
    }
    return json({
      business: store.business,
      services: store.services.filter((row) => row.isActive).map(({ id, name, durationMinutes, priceCents }) => ({
        id,
        name,
        durationMinutes,
        priceCents,
      })),
      staff: store.staff.map((row) => ({
        id: row.id,
        displayName: row.displayName,
        serviceIds: row.services.map((service) => service.id),
      })),
    } as T);
  }

  const slots = path.match(/^\/public\/businesses\/([^/]+)\/slots\?(.+)$/);
  if (slots && method === 'GET') {
    const query = new URLSearchParams(slots[2]);
    const date = query.get('date') ?? '';
    const hours = ['09:00', '10:00', '11:00', '12:30', '14:00', '15:30', '17:00', '18:00'];
    return json({
      date,
      timezone: store.business.timezone,
      slots: hours.map((hour) => ({ startAt: `${date}T${hour}:00.000+02:00` })),
    } as T);
  }

  const publicBook = path.match(/^\/public\/businesses\/([^/]+)\/bookings$/);
  if (publicBook && method === 'POST') {
    return json(createBooking(store, body, user) as T);
  }

  throw new Error(`Demo handler missing for ${method} ${path}`);
}

function reminderLabelSq(offsetMinutes: number) {
  if (offsetMinutes === 60) {
    return '1 ore';
  }
  if (offsetMinutes === 1440) {
    return '24 orë';
  }
  return `${offsetMinutes} minuta`;
}

function pushCatchUpReminders(store: Store, booking: Booking) {
  const start = new Date(booking.startAt).getTime();
  const now = Date.now();
  if (start <= now) {
    return;
  }

  const recipients = [...new Set(['user-owner', booking.staff.userId, booking.client.id])];

  for (const offsetMinutes of [1440, 60]) {
    if (start - offsetMinutes * 60_000 > now) {
      continue;
    }
    for (const userId of recipients) {
      const id = `ntf-rem-${booking.id}-${offsetMinutes}-${userId}`;
      if (store.notifications.some((row) => row.id === id)) {
        continue;
      }
      store.notifications.unshift({
        id,
        userId,
        type: 'BOOKING_REMINDER',
        title: 'Kujtesë rezervimi',
        body: `${booking.service.name} me ${booking.staff.displayName} fillon pas ${reminderLabelSq(offsetMinutes)}.`,
        readAt: null,
        bookingId: booking.id,
        createdAt: new Date().toISOString(),
      });
    }
  }
}

function createBooking(store: Store, body: Record<string, unknown>, user: PublicUser | null): Booking {
  const staff = store.staff.find((row) => row.id === body.staffId) ?? store.staff[0];
  const service = store.services.find((row) => row.id === body.serviceId) ?? store.services[0];
  const client =
    store.clients.find((row) => row.id === (body.clientId ?? user?.id)) ?? store.clients[0];
  const start = new Date(String(body.startAt));
  const booking: Booking = {
    id: `bkg-${Date.now()}`,
    startAt: start.toISOString(),
    endAt: new Date(start.getTime() + service.durationMinutes * 60_000).toISOString(),
    status: 'PENDING',
    notes: body.notes ? String(body.notes) : null,
    staff: { id: staff.id, displayName: staff.displayName, userId: staff.user.id },
    service: {
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
    },
    client: {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
    },
  };
  store.bookings.push(booking);
  store.notifications.unshift({
    id: `ntf-${Date.now()}`,
    userId: 'user-owner',
    type: 'BOOKING_CREATED',
    title: 'Rezervim i ri',
    body: `${client.firstName} ${client.lastName} kërkoi ${service.name}.`,
    readAt: null,
    bookingId: booking.id,
    createdAt: new Date().toISOString(),
  });
  saveStore(store);
  return booking;
}
