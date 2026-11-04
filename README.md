# CypherLink

A collaborative backend for independent music culture — artists, collectives, scenes, and the
projects they build together.

Independent music scenes coordinate across scattered tools: a group chat for the conversation, a
drive folder for the stems, a spreadsheet for who is actually turning up. CypherLink is an attempt at
one home for that — profiles and collectives, shared projects with members and milestones, real-time
messaging, and file uploads that go straight to object storage instead of through the API.

**Status: the backend is built and the frontend runs against it. It is not deployed and has no
users.** It is in the pitch stage. See [What this isn't](#what-this-isnt) before reading anything
into the feature list.

---

## What's actually here

**Backend** — NestJS + TypeScript, organised into 25 feature modules (auth, users, artists,
collectives, scenes, projects, cyphers, clips, messaging, notifications, discovery, search, upload,
qr, safety, sessions, push, websocket, and separate admin / organizer / developer ops surfaces).

- **Auth** — JWT access tokens with HTTP-only refresh-cookie rotation. The refresh token is rotated
  on every `/auth/refresh` call, so a stolen refresh token stops working as soon as the real client
  refreshes.
- **Data** — PostgreSQL via Prisma. The schema is the substantial part of this project: a wide domain
  model covering users, profiles, follows, projects, members, invites, messages, files, milestones,
  contributor status, rights tags, and moderation reports.
- **Uploads** — real presigned S3 / MinIO URLs, so media never passes through the API process.
  Expired assets are deleted from the bucket rather than just dereferenced.
- **Real-time** — Socket.IO. Room joins and message sends require authentication.
- **Scheduled work** — `@nestjs/schedule` cron jobs for expiry and notification sweeps.
- **Hardening** — `helmet`, rate limiting via `@nestjs/throttler` (100 requests / 60s), `zod` and
  `class-validator` on inputs, `bcryptjs` for password hashing.
- **API docs** — Swagger/OpenAPI, served at `/api/docs` when the app is running.

**Frontend** — React + Vite + TypeScript. TanStack Query for server state, Zustand for client state,
React Router, `socket.io-client` for live features, Leaflet for maps, `react-hook-form` + `zod` for
forms, Vitest for tests.

## What this isn't

Stated plainly, because the dependency list is misleading if you don't read the code:

- **There is no job queue.** `bullmq` and `ioredis` are listed in `backend/package.json` but are not
  imported anywhere. Background work runs on `@nestjs/schedule` cron, in-process. Moving it behind a
  real queue is on the list; it hasn't happened.
- **Redis is not wired.** Its presence only enables a health-check stub. See `backend/.env.example`.
- **Not deployed, no users, no production traffic.** Nothing here has been load-tested.
- **Test coverage is thin.** The frontend has Vitest configured and the backend has Jest wired; there
  is nothing like full coverage of 25 modules.
- The frontend does not yet cover every backend surface.

## Running it

You need Node, a PostgreSQL database, and — for uploads — an S3-compatible store. MinIO locally is
the easiest.

**Quickest path**, once both `.env` files exist and the schema is migrated — brings up the Docker
services and runs the API and the client together:

```bash
npm install
npm run dev
```

**Or run the two halves yourself:**

```bash
# backend
cd backend
cp .env.example .env          # then fill in DATABASE_URL and the JWT/cookie secrets
npm install
npm run db:migrate            # create the schema
npm run db:seed               # optional sample data
npm run dev                   # http://localhost:3001, docs at /api/docs

# frontend, in a second terminal
cd cypherlink-frontend
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

The JWT and cookie secrets in `.env.example` are placeholders and must be replaced — the access and
refresh secrets need to be at least 32 characters. Uploads stay disabled until the `S3_*` values point
at a real bucket.

```bash
npm test        # backend: jest       frontend: vitest
npm run lint
```

`e2e.mjs` at the root runs 19 API checks and 21 browser flows (Playwright) against a running API
on :3001 and client on :5173, with the seed data loaded: `node e2e.mjs`.

Build the schema with `npm run db:migrate` (or `npx prisma migrate deploy`), never `prisma db push`:
push changes the database without writing a migration, which is how migration 0007 came to be
needed.

## Layout

```
backend/               NestJS API — 25 feature modules under src/
  prisma/schema.prisma the domain model; the most substantial single file here
cypherlink-frontend/   React + Vite client
docs/                  architecture, product and roadmap notes (PDF)
```

## Licence

No licence file yet, so default copyright applies — all rights reserved. Ask if you want to use any
of it.
