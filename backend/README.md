# CypherLink Backend

The backend API for CypherLink — the collaborative operating system for independent music culture.

## Tech Stack

- **Runtime:** Node.js 20+ with TypeScript (strict mode)
- **Framework:** NestJS 10
- **Database:** PostgreSQL 16 with Prisma ORM
- **Cache/Queue:** Redis 7 with BullMQ
- **Real-time:** Socket.IO
- **Auth:** JWT access tokens + HTTP-only refresh cookies + bcryptjs
- **Storage:** S3-compatible object storage (MinIO for dev)
- **Docs:** OpenAPI/Swagger at `/api/docs`

## Quick Start

### Prerequisites

- Node.js 20+
- Docker Desktop

### Setup

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npm run db:migrate

# 5. Seed the database
npm run db:seed

# 6. Start development server
npm run dev
```

The API will be available at `http://localhost:3001/api` and Swagger docs at `http://localhost:3001/api/docs`.

### Environment Variables

Copy `.env.example` to `.env` and configure:

```
DATABASE_URL=postgresql://cypherlink:cypherlink@localhost:5432/cypherlink
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-secret>
COOKIE_SECRET=<your-secret>
FRONTEND_URL=http://localhost:5173
PORT=3001
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=cypherlink-uploads
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
UPLOAD_MAX_MB=250
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
QR_CHECKIN_TOKEN_TTL=10m
CYPHER_ASSET_TTL_HOURS=24
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run start:prod` | Run production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run e2e tests |

## API Architecture

### Response Format

All API responses follow a standard format:

**Success:**
```json
{
  "success": true,
  "data": {},
  "message": "optional message"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable error",
    "details": {}
  }
}
```

**Paginated:**
```json
{
  "success": true,
  "data": {
    "items": [],
    "nextCursor": null,
    "hasMore": false
  }
}
```

### Authentication

1. Register or login to receive an `accessToken` (15min TTL) and HTTP-only `refresh_token` cookie (30d TTL)
2. Include `Authorization: Bearer <accessToken>` for authenticated requests
3. The SDK automatically refreshes tokens via `POST /api/auth/refresh`

### Public Browsing

The following endpoints are accessible without authentication:
- `GET /api/public/home`
- `GET /api/public/feed`
- `GET /api/public/map`
- `GET /api/public/profiles/:id`
- `GET /api/public/projects/:id`
- `GET /api/public/cyphers/:id`
- `GET /api/search`

### WebSocket Events

Connect to `http://localhost:3001` with `socket.handshake.auth.token` (optional).

**Rooms:**
- `user:{id}` — personal notifications
- `project:{id}` — project collaboration
- `cypher:{id}` — cypher live updates
- `live:{id}` — live session chat

**Events:**
- `notification:new` — New notification
- `project:message` — New project chat message
- `project:file_uploaded` — File uploaded to project
- `cypher:rsvp_updated` — RSVP count changed
- `cypher:state_changed` — Cypher state transition
- `cypher:checkin_confirmed` — Check-in confirmed
- `live:chat_message` — Live chat
- `message:new` — New DM

## Project Structure

```
src/
├── main.ts               # Application entry point
├── app.module.ts          # Root module
├── common/                # Shared infrastructure
│   ├── enums/             # TypeScript enums
│   ├── dto/               # Shared DTOs
│   ├── prisma/            # Database service
│   ├── guards/            # Auth, roles, optional auth guards
│   ├── decorators/        # Custom decorators
│   ├── interceptors/      # Response wrapping
│   ├── filters/           # Exception handling
│   └── helpers/           # Utility functions
├── auth/                  # Authentication module
├── users/                 # User management
├── public/                # Public browsing endpoints
├── projects/              # Project management
├── cyphers/               # Cypher management
├── sessions/              # Community sessions
├── messaging/             # Intent-based messaging
├── notifications/         # Notification system
├── search/                # Search across entities
├── map/                   # Scene map data
├── feed/                  # Clips/highlights feed
├── qr/                    # QR code tokens
├── safety/                # Reports, blocks, mutes
├── upload/                # Signed upload URLs
├── websocket/             # Real-time gateway
└── jobs/                  # Background scheduled jobs
```

## Seed Data

The seed script creates 4 artists, 3 projects, 3 cyphers, 2 community sessions, 3 feed clips, 2 message requests, 1 conversation, 5 notifications, and organizer summaries.

All seed user passwords are: `password123`

## Security

- JWT access tokens (15min) + HTTP-only refresh cookies (30d) with rotation
- bcryptjs password hashing (12 rounds)
- Rate limiting on auth, messaging, uploads, and reports
- CORS restricted to frontend origin
- Helmet security headers
- Signed upload URLs with MIME validation
- RBAC for organizer/admin actions
- Audit logs for moderation actions
- Location privacy controls (city-only, approximate, followers, hidden)
- Intent-first messaging with DM privacy levels
- Block and mute enforcement

## Database

The Prisma schema includes 25 models with proper indexes, unique constraints, and cascade deletes. Key tables:

- `User` / `Profile` — User accounts and public profiles
- `Project` / `ProjectMember` / `ProjectFile` — Collaboration spaces
- `Cypher` / `CypherRSVP` / `CypherCheckIn` / `CypherHighlight` — Events
- `CommunitySession` — Free community events
- `Conversation` / `Message` — Direct messaging
- `Notification` — User notifications
- `Block` / `Mute` / `Report` — Safety and moderation
- `AuditLog` — Audit trail
- `OrganizerSummary` — Organizer statistics
