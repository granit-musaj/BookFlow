import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';

const canRun = Boolean(process.env.DATABASE_URL && process.env.JWT_ACCESS_SECRET);

describe.skipIf(!canRun)('auth and bookings (e2e)', () => {
  let app: INestApplication;
  let accessToken = '';
  let staffId = '';
  let serviceId = '';
  let clientId = '';
  let startAt = '';

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers an owner', async () => {
    const suffix = Date.now();
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        firstName: 'Ana',
        lastName: 'Hoxha',
        email: `owner-${suffix}@studio.test`,
        password: 'password123',
        role: 'OWNER',
        businessName: `Studio ${suffix}`,
      })
      .expect(201);

    expect(response.body.user.role).toBe('OWNER');
    expect(response.body.tokens.accessToken).toBeTruthy();
    expect(response.body.tokens.refreshToken).toBeUndefined();
    const cookies = response.headers['set-cookie'];
    const cookieHeader = Array.isArray(cookies) ? cookies.join(' ') : String(cookies ?? '');
    expect(cookieHeader).toMatch(/refreshToken=/);
    accessToken = response.body.tokens.accessToken;
  });

  it('logs in the owner', async () => {
    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: me.body.email, password: 'password123' })
      .expect(200);

    expect(response.body.tokens.accessToken).toBeTruthy();
    accessToken = response.body.tokens.accessToken;
  });

  it('creates a booking and rejects the overlapping slot with 409', async () => {
    const auth = { Authorization: `Bearer ${accessToken}` };
    const suffix = Date.now();

    const service = await request(app.getHttpServer())
      .post('/api/services')
      .set(auth)
      .send({ name: 'Masazh', durationMinutes: 60, priceCents: 4500 })
      .expect(201);
    serviceId = service.body.id;

    const staff = await request(app.getHttpServer())
      .post('/api/staff')
      .set(auth)
      .send({
        email: `staff-${suffix}@studio.test`,
        password: 'password123',
        firstName: 'Mira',
        lastName: 'Leka',
        displayName: 'Mira Leka',
        serviceIds: [serviceId],
      })
      .expect(201);
    staffId = staff.body.id;

    for (const dayOfWeek of [1, 2, 3, 4, 5]) {
      await request(app.getHttpServer())
        .post(`/api/staff/${staffId}/availability`)
        .set(auth)
        .send({ dayOfWeek, startTime: '09:00', endTime: '18:00' })
        .expect(201);
    }

    const client = await request(app.getHttpServer())
      .post('/api/users/clients')
      .set(auth)
      .send({
        email: `client-${suffix}@studio.test`,
        password: 'password123',
        firstName: 'Elira',
        lastName: 'Berisha',
      })
      .expect(201);
    clientId = client.body.id;

    startAt = nextWeekdayIso(1, 10);
    await request(app.getHttpServer())
      .post('/api/bookings')
      .set(auth)
      .send({ staffId, serviceId, clientId, startAt })
      .expect(201);

    const conflict = await request(app.getHttpServer())
      .post('/api/bookings')
      .set(auth)
      .send({ staffId, serviceId, clientId, startAt });

    expect(conflict.status).toBe(409);
  });
});

function nextWeekdayIso(dayOfWeek: number, hour: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 8);
  while (date.getUTCDay() !== dayOfWeek) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  date.setUTCHours(hour - 2, 0, 0, 0);
  return date.toISOString();
}
