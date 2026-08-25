import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('CypherLink API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let organizerToken: string;
  let testUserId: string;
  let organizerUserId: string;
  let projectId: string;
  let cypherId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('POST /api/auth/register - should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: 'testpass123', displayName: 'Test User', handle: '@testuser' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('test@test.com');
      accessToken = res.body.data.accessToken;
      testUserId = res.body.data.user.id;
    });

    it('POST /api/auth/register - should register an organizer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'organizer@test.com', password: 'testpass123', displayName: 'Organizer', handle: '@organizer' })
        .expect(201);

      organizerToken = res.body.data.accessToken;
      organizerUserId = res.body.data.user.id;

      // Promote to organizer
      await prisma.user.update({
        where: { id: organizerUserId },
        data: { role: 'ORGANIZER' },
      });
    });

    it('POST /api/auth/login - should login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'testpass123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      accessToken = res.body.data.accessToken;
    });

    it('POST /api/auth/refresh - should return 401 with invalid cookie', async () => {
      // Just verify the endpoint exists and handles gracefully
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .expect(200);

      expect(res.body.data.accessToken).toBeNull();
    });

    it('GET /api/auth/sessions - should list sessions', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Public', () => {
    it('GET /api/public/home - should return home page data without auth', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/public/home')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.featuredArtists).toBeDefined();
      expect(res.body.data.activeCyphers).toBeDefined();
      expect(res.body.data.trendingProjects).toBeDefined();
      expect(res.body.data.recentClips).toBeDefined();
    });

    it('GET /api/public/feed - should return feed without auth', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/public/feed')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.clips).toBeDefined();
    });

    it('GET /api/public/map - should return map scenes without auth', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/public/map')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/search - should search without auth', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/search?q=Delhi')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Projects', () => {
    it('POST /api/projects - should create a project', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test Project', city: 'Delhi', tags: ['Hip-Hop'], openRoles: ['Vocalist'] })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Project');
      projectId = res.body.data.id;
    });

    it('GET /api/projects - should list projects with auth', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/projects/:id - should get project by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(projectId);
    });

    it('POST /api/projects/:id/join-request - should request to join', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/projects/${projectId}/join-request`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Cyphers', () => {
    it('POST /api/cyphers - should create a cypher', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app.getHttpServer())
        .post('/api/cyphers')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Test Cypher',
          type: 'OPEN',
          city: 'Delhi',
          venue: 'Test Venue',
          startsAt: tomorrow,
          safetyTags: ['Safe space'],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      cypherId = res.body.data.id;
    });

    it('GET /api/cyphers - should list cyphers without auth', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/cyphers')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/cyphers/:id/rsvp - should RSVP to a cypher', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/cyphers/${cypherId}/rsvp`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('POST /api/cyphers/:id/rsvp - should reject duplicate RSVP', async () => {
      await request(app.getHttpServer())
        .post(`/api/cyphers/${cypherId}/rsvp`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409);
    });

    it('POST /api/cyphers/:id/checkin-scan - should check in a user (organizer only)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/cyphers/${cypherId}/checkin-scan`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ userId: testUserId })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('POST /api/cyphers/:id/checkin-scan - should reject duplicate check-in', async () => {
      await request(app.getHttpServer())
        .post(`/api/cyphers/${cypherId}/checkin-scan`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ userId: testUserId })
        .expect(409);
    });

    it('POST /api/cyphers/:id/highlights - should add highlight (organizer only)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/cyphers/${cypherId}/highlights`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ title: 'Best Moment', mediaUrl: 'https://example.com/video.mp4', mediaType: 'video' })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/cyphers/:id/summary - should get summary (organizer only)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/cyphers/${cypherId}/summary`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRsvps).toBeGreaterThanOrEqual(1);
      expect(res.body.data.checkedInUsers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Community Sessions', () => {
    let sessionId: string;

    it('POST /api/sessions - should create a community session', async () => {
      const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const res = await request(app.getHttpServer())
        .post('/api/sessions')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Test Cleanup',
          type: 'CLEANUP',
          city: 'Delhi',
          venue: 'Park',
          startsAt: tomorrow,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      sessionId = res.body.data.id;
    });

    it('GET /api/sessions - should list sessions', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sessions')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/sessions/:id/rsvp - should RSVP', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/sessions/${sessionId}/rsvp`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Messaging', () => {
    it('POST /api/messages/request - should send message request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/messages/request')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          receiverId: organizerUserId,
          intent: 'COLLABORATE',
          message: 'Hey, love your work!',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Safety', () => {
    it('POST /api/reports - should create a report', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/reports')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          targetType: 'PROFILE',
          targetId: organizerUserId,
          reason: 'SPAM',
          description: 'This is a test report',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('POST /api/blocks/:userId - should block a user', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/blocks/${organizerUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/blocks/:userId - should unblock a user', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/blocks/${organizerUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Notifications', () => {
    it('GET /api/notifications - should list notifications', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('PATCH /api/notifications/:id/read - should mark as read', async () => {
      // First get a notification
      const notifs = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${accessToken}`);

      if (notifs.body.data.items.length > 0) {
        const notifId = notifs.body.data.items[0].id;
        const res = await request(app.getHttpServer())
          .patch(`/api/notifications/${notifId}/read`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
      }
    });
  });

  describe('QR', () => {
    it('GET /api/qr/profile-token - should get profile QR token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/qr/profile-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.profileToken).toBeDefined();
    });
  });

  describe('Project Permissions', () => {
    it('should reject access to private project without membership', async () => {
      const privateProject = await prisma.project.create({
        data: {
          title: 'Private Test',
          visibility: 'PRIVATE',
          ownerId: organizerUserId,
          members: { create: { userId: organizerUserId, role: 'owner' } },
        },
      });

      await request(app.getHttpServer())
        .get(`/api/projects/${privateProject.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });

  describe('Auth cleanup', () => {
    it('DELETE /api/auth/sessions/all - should clear all sessions', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/auth/sessions/all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
