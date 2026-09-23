# BookFlow

Multi-tenant SaaS for small businesses to manage bookings, staff, and clients.

**Stack:** NestJS · React · PostgreSQL · Prisma · Redis · Docker

## Quick start

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), then:

```bash
cp .env.example .env
docker compose up --build
```

- API: http://localhost:3000/api
- Health: http://localhost:3000/api/health
- Swagger: http://localhost:3000/api/docs
- Frontend: http://localhost:5173

Local backend (Postgres + Redis still in Docker):

```bash
docker compose up postgres redis -d
cd backend
# DATABASE_URL host must be localhost
npx prisma migrate deploy
npm run start:dev
```

## Public booking

Clients open `/b/:slug` (also linked from the owner dashboard).

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/public/businesses/:slug` | Public catalog (no emails) |
| GET | `/api/public/businesses/:slug/slots` | Public — `serviceId`, `staffId`, `date=YYYY-MM-DD` |
| POST | `/api/public/businesses/:slug/bookings` | Client of that tenant only |

## Domain API

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/businesses/me` | Authenticated |
| GET/POST/PATCH | `/api/services` | Read: all roles · Write: Owner |
| GET/POST/PATCH | `/api/staff` | Read: all roles · Create/update: Owner |
| GET/POST/DELETE | `/api/staff/:id/availability` | Staff can edit their own hours |
| GET/POST | `/api/users/clients` | Owner, Staff |
| GET/POST | `/api/bookings` | All roles (scoped) |
| POST | `/api/bookings/:id/confirm` | Owner, assigned Staff — schedules 24h + 1h reminders before `startAt` |
| POST | `/api/bookings/:id/cancel` | Owner, assigned Staff, or the Client — drops pending reminder jobs |
| GET | `/api/notifications` | Authenticated — own inbox |
| GET | `/api/notifications/unread-count` | Authenticated |
| PATCH | `/api/notifications/:id/read` | Authenticated |
| POST | `/api/notifications/read-all` | Authenticated |

## Auth API

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/auth/register` | Public — Owner creates a tenant, Client joins by `businessSlug` |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/refresh` | Public — body: `{ "refreshToken" }` |
| POST | `/api/auth/logout` | Bearer access token |
| GET | `/api/auth/me` | Bearer access token |

Staff accounts are not self-registered. An Owner will create them later.

## Folder structure

### Backend (`backend/src`)

| Path | Why it exists |
| --- | --- |
| `main.ts` | Bootstraps Nest: CORS, validation pipe, Swagger, `/api` prefix |
| `app.module.ts` | Root module + global JWT/RBAC guards |
| `config/` | Fail-fast env validation so the app does not start half-configured |
| `prisma/` | One Prisma client for the process; injected everywhere |
| `common/decorators` | `@Public()`, `@Roles()`, `@CurrentUser()` — cross-cutting HTTP metadata |
| `common/guards` | Authentication (JWT) and authorization (role) |
| `common/filters` | Consistent error JSON for the frontend |
| `modules/auth` | Register, login, refresh, logout, `/me` |
| `modules/users` | User persistence (repository only in this step) |
| `modules/businesses` | Tenant persistence used during Owner onboarding |
| `modules/services` | Stub — service catalog |
| `modules/staff` | Stub — staff + skills |
| `modules/bookings` | Stub — bookings (DB already blocks overlaps) |
| `modules/notifications` | In-app rows first, then BullMQ email + delayed reminders |

Reminders: on confirm, BookFlow enqueues BullMQ jobs `24h` and `1h` before `startAt`. If that window already passed but the appointment is still upcoming, the reminder is sent immediately. Cancel removes the delayed jobs. If Redis is down, the HTTP request still succeeds.

## Playwright

From `frontend/` (uses preview/demo mode, no Docker):

```bash
npx playwright install chromium
npm run test:e2e
```


Layering inside a module: **controller → service → repository**. Controllers stay thin; services own rules; repositories own SQL/Prisma.

### Frontend (`frontend/src`)

| Path | Why it exists |
| --- | --- |
| `app/` | Router and app shell |
| `features/auth` | Login/register screens next to their API calls |
| `features/bookings` | Reserved for the booking UI |
| `shared/lib` | HTTP client (`api.ts`) |
| `shared/types` | Shared TypeScript types |
| `shared/components` | UI reused across features |
| `shared/hooks` | Reusable React hooks |

Feature folders keep domain code together so the app does not become a dump of unrelated components.

## Database notes

- Shared schema, shared database: every business row carries `business_id`.
- Double-booking is blocked in PostgreSQL:
  - unique partial index on `(staff_id, start_at)` for non-cancelled rows
  - `EXCLUDE` constraint with `tstzrange` so overlapping intervals cannot be inserted
- Prisma cannot express `EXCLUDE`; that constraint lives in `prisma/migrations`.
