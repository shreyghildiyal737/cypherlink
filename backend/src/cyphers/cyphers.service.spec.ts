import { Test, TestingModule } from '@nestjs/testing';
import { CyphersService } from './cyphers.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { WsGateway } from '../websocket/websocket.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { hashToken } from '../common/helpers/crypto.helper';

describe('CyphersService', () => {
  let service: CyphersService;

  const mockTx = {
    $queryRaw: jest.fn(),
    cypher: { findUnique: jest.fn() },
    cypherRSVP: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    cypherCheckIn: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    notification: { create: jest.fn() },
  };

  const mockPrisma = {
    $transaction: jest.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
    cypher: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    cypherRSVP: {
      findFirst: jest.fn(),
    },
    cypherHighlight: { create: jest.fn() },
    organizerSummary: { upsert: jest.fn() },
    cypherAsset: { updateMany: jest.fn() },
  };

  const mockWs = {
    emitToRoom: jest.fn(),
    sendToUser: jest.fn(),
    sendToCypher: jest.fn(),
    emitToCypher: jest.fn(),
  };
  const mockNotifications = {
    push: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CyphersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WsGateway, useValue: mockWs },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<CyphersService>(CyphersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('rsvp', () => {
    it('should throw NotFoundException for non-existent cypher', async () => {
      mockTx.$queryRaw.mockResolvedValue([]);
      await expect(service.rsvp('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for cancelled cypher', async () => {
      mockTx.$queryRaw.mockResolvedValue([{ id: 'c1', deletedAt: null, state: 'CANCELLED', quota: 10 }]);
      await expect(service.rsvp('c1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should return ALREADY_RSVPED for duplicate RSVP', async () => {
      mockTx.$queryRaw.mockResolvedValue([{ id: 'c1', deletedAt: null, state: 'UPCOMING', quota: 10 }]);
      mockTx.cypherRSVP.findUnique.mockResolvedValue({ id: 'existing' });
      mockTx.cypherRSVP.count.mockResolvedValue(5);
      const result = await service.rsvp('c1', 'user-1');
      expect(result.status).toBe('ALREADY_RSVPED');
    });

    it('should throw BadRequestException when cypher is full', async () => {
      mockTx.$queryRaw.mockResolvedValue([{ id: 'c1', deletedAt: null, state: 'UPCOMING', quota: 10 }]);
      mockTx.cypherRSVP.findUnique.mockResolvedValue(null);
      mockTx.cypherRSVP.count.mockResolvedValue(10);
      await expect(service.rsvp('c1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should confirm RSVP when quota available', async () => {
      mockTx.$queryRaw.mockResolvedValue([{ id: 'c1', deletedAt: null, state: 'UPCOMING', quota: 10 }]);
      mockTx.cypherRSVP.findUnique.mockResolvedValue(null);
      mockTx.cypherRSVP.count.mockResolvedValue(5);
      mockTx.cypherRSVP.create.mockResolvedValue({ id: 'rsvp-1' });
      const result = await service.rsvp('c1', 'user-1');
      expect(result.status).toBe('RSVP_CONFIRMED');
      expect(result.spotsLeft).toBe(4);
    });

    it('should RSVP open cypher without quota', async () => {
      mockTx.$queryRaw.mockResolvedValue([{ id: 'c1', deletedAt: null, state: 'UPCOMING', quota: null }]);
      mockTx.cypherRSVP.findUnique.mockResolvedValue(null);
      mockTx.cypherRSVP.count.mockResolvedValue(5);
      mockTx.cypherRSVP.create.mockResolvedValue({ id: 'rsvp-1' });
      const result = await service.rsvp('c1', 'user-1');
      expect(result.status).toBe('RSVP_CONFIRMED');
      expect(result.spotsLeft).toBe(999);
    });
  });

  describe('scanCheckIn', () => {
    it('should reject invalid token', async () => {
      mockPrisma.cypher.findUnique.mockResolvedValue({ id: 'c1', organizerId: 'org-1', deletedAt: null, state: 'ACTIVE' });
      mockPrisma.cypherRSVP.findFirst.mockResolvedValue(null);
      await expect(service.scanCheckIn('c1', 'org-1', 'bad-token', 'USER')).rejects.toThrow(BadRequestException);
    });

    it('should return alreadyCheckedIn for duplicate scan', async () => {
      const token = 'a'.repeat(32);
      mockPrisma.cypher.findUnique.mockResolvedValue({ id: 'c1', organizerId: 'org-1', deletedAt: null, state: 'ACTIVE', title: 'Test' });
      mockPrisma.cypherRSVP.findFirst.mockResolvedValue({
        id: 'rsvp-1',
        userId: 'user-1',
        checkInTokenHash: hashToken(token),
        checkInTokenExpiresAt: new Date(Date.now() + 60_000),
        user: { id: 'user-1', displayName: 'Test User', profile: { handle: 'test' } },
      });
      mockTx.cypherCheckIn.findUnique.mockResolvedValue({ checkedInAt: new Date() });
      const result = await service.scanCheckIn('c1', 'org-1', token, 'USER');
      expect(result.alreadyCheckedIn).toBe(true);
    });

    it('should create check-in and burn token on first scan', async () => {
      const token = 'b'.repeat(32);
      mockPrisma.cypher.findUnique.mockResolvedValue({ id: 'c1', organizerId: 'org-1', deletedAt: null, state: 'ACTIVE', title: 'Test' });
      mockPrisma.cypherRSVP.findFirst.mockResolvedValue({
        id: 'rsvp-1',
        userId: 'user-1',
        checkInTokenHash: hashToken(token),
        checkInTokenExpiresAt: new Date(Date.now() + 60_000),
        user: { id: 'user-1', displayName: 'Test User', profile: { handle: 'test' } },
      });
      mockTx.cypherCheckIn.findUnique.mockResolvedValue(null);
      mockTx.cypherCheckIn.create.mockResolvedValue({ checkedInAt: new Date() });
      const result = await service.scanCheckIn('c1', 'org-1', token, 'USER');
      expect(result.alreadyCheckedIn).toBe(false);
      expect(mockTx.cypherRSVP.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { checkInTokenHash: null, checkInTokenExpiresAt: null },
        }),
      );
    });
  });

  describe('addHighlight', () => {
    it('should mark asset as highlight to survive cleanup', async () => {
      mockPrisma.cypher.findUnique.mockResolvedValue({ id: 'c1', organizerId: 'org-1', deletedAt: null });
      mockPrisma.cypherHighlight.create.mockResolvedValue({ id: 'hl-1', title: 'Best moment' });
      mockPrisma.organizerSummary.upsert.mockResolvedValue({});
      mockPrisma.cypherAsset.updateMany.mockResolvedValue({ count: 1 });
      const result = await service.addHighlight('c1', { title: 'Best moment', mediaUrl: 'https://cdn.test/clip.mp4', mediaType: 'video/mp4' }, 'org-1', 'USER');
      expect(result.title).toBe('Best moment');
      expect(mockPrisma.cypherAsset.updateMany).toHaveBeenCalledWith({
        where: { publicUrl: 'https://cdn.test/clip.mp4', cypherId: 'c1' },
        data: { isHighlight: true },
      });
    });
  });
});
