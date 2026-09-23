import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { LLM_CLIENT, LlmClient, LlmMessage } from '../src/modules/ai-assistant/assistant.types';

const canRun = Boolean(process.env.DATABASE_URL && process.env.JWT_ACCESS_SECRET);

function nextWeekdayDate(dayOfWeek: number) {
  const date = new Date();
  date.setDate(date.getDate() + 8);
  while (date.getDay() !== dayOfWeek) {
    date.setDate(date.getDate() + 1);
  }
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function scriptedLlm(): LlmClient {
  return {
    async complete({ messages }) {
      const lastTool = [...messages].reverse().find((row): row is Extract<LlmMessage, { role: 'tool' }> => row.role === 'tool');
      if (!lastTool) {
        return { text: '', toolCalls: [{ id: 't1', name: 'get_services', input: {} }] };
      }

      const payload = JSON.parse(lastTool.content) as {
        services?: Array<{ id: string }>;
        staff?: Array<{ id: string }>;
        slots?: Array<{ startAt: string }>;
        proposed?: boolean;
        serviceId?: string;
        staffId?: string;
      };

      if (payload.services?.[0] && payload.staff?.[0]) {
        return {
          text: '',
          toolCalls: [
            {
              id: 't2',
              name: 'get_available_slots',
              input: {
                serviceId: payload.services[0].id,
                staffId: payload.staff[0].id,
                date: nextWeekdayDate(1),
              },
            },
          ],
        };
      }

      if (payload.slots?.[0]) {
        const services = messages
          .filter((row): row is Extract<LlmMessage, { role: 'tool' }> => row.role === 'tool')
          .map((row) => JSON.parse(row.content) as { services?: Array<{ id: string }>; staff?: Array<{ id: string }> })
          .find((row) => row.services?.[0]);
        return {
          text: '',
          toolCalls: [
            {
              id: 't3',
              name: 'propose_booking',
              input: {
                serviceId: services?.services?.[0].id,
                staffId: services?.staff?.[0].id,
                startAt: payload.slots[0].startAt,
              },
            },
          ],
        };
      }

      if (payload.proposed) {
        return { text: 'Ja një orë e lirë. Konfirmo nëse të shkon.', toolCalls: [] };
      }

      return { text: 'Nuk gjeta orare.', toolCalls: [] };
    },
  };
}

describe.skipIf(!canRun)('public AI assistant (e2e)', () => {
  let app: INestApplication;
  let slug = '';
  let clientToken = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LLM_CLIENT)
      .useValue(scriptedLlm())
      .compile();

    app = moduleRef.createNestApplication();
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

  it('walks tools then books the proposed slot through the public API', async () => {
    const suffix = Date.now();
    const owner = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        firstName: 'Ana',
        lastName: 'Hoxha',
        email: `owner-ai-${suffix}@studio.test`,
        password: 'password123',
        role: 'OWNER',
        businessName: `Studio AI ${suffix}`,
      })
      .expect(201);

    const auth = { Authorization: `Bearer ${owner.body.tokens.accessToken}` };
    const business = await request(app.getHttpServer()).get('/api/businesses/me').set(auth).expect(200);
    slug = business.body.slug;

    const service = await request(app.getHttpServer())
      .post('/api/services')
      .set(auth)
      .send({ name: 'Masazh', durationMinutes: 60, priceCents: 4500 })
      .expect(201);

    const staff = await request(app.getHttpServer())
      .post('/api/staff')
      .set(auth)
      .send({
        email: `staff-ai-${suffix}@studio.test`,
        password: 'password123',
        firstName: 'Mira',
        lastName: 'Leka',
        displayName: 'Mira Leka',
        serviceIds: [service.body.id],
      })
      .expect(201);

    for (const dayOfWeek of [1, 2, 3, 4, 5]) {
      await request(app.getHttpServer())
        .post(`/api/staff/${staff.body.id}/availability`)
        .set(auth)
        .send({ dayOfWeek, startTime: '09:00', endTime: '18:00' })
        .expect(201);
    }

    const chat = await request(app.getHttpServer())
      .post(`/api/public/businesses/${slug}/assistant`)
      .send({ message: 'dua masazh të hënën në mëngjes' })
      .expect(200);

    expect(chat.body.draft).toBeTruthy();
    expect(chat.body.draft.serviceId).toBe(service.body.id);
    expect(chat.body.draft.staffId).toBe(staff.body.id);

    const client = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        firstName: 'Elira',
        lastName: 'Berisha',
        email: `client-ai-${suffix}@studio.test`,
        password: 'password123',
        role: 'CLIENT',
        businessSlug: slug,
      })
      .expect(201);
    clientToken = client.body.tokens.accessToken;

    const booking = await request(app.getHttpServer())
      .post(`/api/public/businesses/${slug}/bookings`)
      .set({ Authorization: `Bearer ${clientToken}` })
      .send({
        serviceId: chat.body.draft.serviceId,
        staffId: chat.body.draft.staffId,
        startAt: chat.body.draft.startAt,
      });

    expect(booking.status).toBe(201);
  });
});
