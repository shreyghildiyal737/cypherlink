# DeepSeek Backend Instructions for CypherLink

Build a backend matching the frontend and product philosophy.

## Core rules
- Public browsing works without login.
- Login only for participation: create, RSVP, check-in, message, follow, comment, upload, join, host.
- Attendance/check-in is optional and never penalizes users if skipped.
- Internally store event logs for safety/legal purposes.
- Cypher pages are ephemeral: raw assets/chats/live activity expire 24h after event end; selected highlights survive.
- Profiles only expose modules that have data.
- No public numeric social-credit score. Use soft momentum labels.
- Safety/privacy by design.
- No paid learning marketplace. Free learning/community collabs only.

## MVP architecture
Modular monolith first. Node.js + NestJS/Fastify, PostgreSQL, Prisma, Redis, Socket.IO, S3-compatible uploads, JWT access token + HTTP-only refresh cookie, BullMQ jobs, OpenAPI docs.

## Modules
Auth, Profiles, Projects, Cyphers, Community Sessions, Feed, Messaging, Notifications, Map, Moderation, Uploads, QR, Admin.

## Key API contracts
POST /api/auth/register
POST /api/auth/login -> { accessToken, user }
POST /api/auth/refresh -> { accessToken }
POST /api/auth/logout
GET /api/public/home
GET /api/public/feed
GET /api/public/map
GET /api/public/profiles/:id
GET /api/search?q=&filters=
GET/POST /api/projects
GET /api/projects/:id
POST /api/projects/:id/invite
POST /api/projects/:id/join-request
POST /api/projects/:id/files/sign
POST /api/projects/:id/files/confirm
GET/POST /api/cyphers
GET /api/cyphers/:id
POST /api/cyphers/:id/rsvp
POST /api/cyphers/:id/waitlist
GET /api/cyphers/:id/checkin-token
POST /api/cyphers/:id/checkin-scan
POST /api/cyphers/:id/highlights
GET /api/cyphers/:id/summary
GET/POST /api/sessions
POST /api/sessions/:id/checkin-scan
GET /api/messages/conversations
POST /api/messages/request
GET/POST /api/messages/:conversationId
GET /api/notifications
PATCH /api/notifications/:id/read
GET /api/qr/profile-token
POST /api/qr/scan-profile
POST /api/reports
POST/DELETE /api/blocks/:userId

## WebSocket events
Rooms: user:{id}, project:{id}, cypher:{id}, live:{id}
Events: notification:new, project:message, project:file_uploaded, cypher:rsvp_updated, cypher:state_changed, cypher:checkin_confirmed, live:chat_message, message:new.

## Database tables
users, sessions, profiles, profile_modules, follows, projects, project_members, project_invites, project_messages, project_files, project_credits, cyphers, cypher_rsvps, cypher_checkins, cypher_assets, cypher_highlights, community_sessions, community_session_rsvps, clips, messages, message_requests, notifications, reports, blocks, audit_logs, reputation_events, organizer_summaries.

## Jobs
Delete cypher raw assets after 24h, preserve highlights, send reminders, process media, expire QR tokens, send digests.

## Security
HTTP-only refresh cookie, refresh rotation, short-lived access token, CSRF protection if cookie auth used, rate limits, signed upload URLs only, server-side MIME/size validation, RBAC for organizer/admin, encrypted sensitive logs, strict location privacy, audit logs.
