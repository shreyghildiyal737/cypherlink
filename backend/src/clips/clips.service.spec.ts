import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClipsService } from './clips.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('ClipsService', () => {
  let service: ClipsService;

  const mockPrisma = {
    cypher: { findUnique: jest.fn() },
    project: { findUnique: jest.fn() },
    communitySession: { findUnique: jest.fn() },
    clip: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClipsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ClipsService>(ClipsService);
  });

  describe('create', () => {
    it('persists a minimal clip without any linkage', async () => {
      mockPrisma.clip.create.mockResolvedValue({ id: 'clip-1' });
      const result = await service.create(
        { city: 'Delhi', reason: 'LIVE_SESSION' },
        'user-1',
      );
      expect(mockPrisma.clip.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          creatorId: 'user-1',
          city: 'Delhi',
          reason: 'LIVE_SESSION',
        }),
      });
      expect(result).toEqual({ id: 'clip-1' });
    });

    it('validates that a linked cypher exists and is not deleted', async () => {
      mockPrisma.cypher.findUnique.mockResolvedValue(null);
      await expect(
        service.create(
          { city: 'Delhi', reason: 'LIVE_SESSION', cypherId: 'missing' },
          'user-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.clip.create).not.toHaveBeenCalled();
    });

    it('rejects soft-deleted cyphers', async () => {
      mockPrisma.cypher.findUnique.mockResolvedValue({
        id: 'c1',
        title: 't',
        deletedAt: new Date(),
      });
      await expect(
        service.create(
          { city: 'Delhi', reason: 'LIVE_SESSION', cypherId: 'c1' },
          'user-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts a valid cypher + project + session combo', async () => {
      mockPrisma.cypher.findUnique.mockResolvedValue({ id: 'c1', title: 't', deletedAt: null });
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1', title: 'mt', deletedAt: null });
      mockPrisma.communitySession.findUnique.mockResolvedValue({ id: 's1', title: 'st' });
      mockPrisma.clip.create.mockResolvedValue({ id: 'clip-2' });

      await service.create(
        {
          city: 'Delhi',
          reason: 'LIVE_SESSION',
          cypherId: 'c1',
          projectId: 'p1',
          communitySessionId: 's1',
        },
        'user-1',
      );

      expect(mockPrisma.clip.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cypherId: 'c1',
          projectId: 'p1',
          communitySessionId: 's1',
        }),
      });
    });
  });

  describe('findByCypher', () => {
    it('404s when cypher missing', async () => {
      mockPrisma.cypher.findUnique.mockResolvedValue(null);
      await expect(service.findByCypher('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns clips ordered desc when cypher exists', async () => {
      mockPrisma.cypher.findUnique.mockResolvedValue({ id: 'c1', deletedAt: null });
      mockPrisma.clip.findMany.mockResolvedValue([{ id: 'clip-1' }]);
      const result = await service.findByCypher('c1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.clip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cypherId: 'c1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findByProject', () => {
    it('hides PRIVATE projects from public clip listing', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'p1',
        deletedAt: null,
        visibility: 'PRIVATE',
      });
      await expect(service.findByProject('p1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns clips for discoverable projects', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'p1',
        deletedAt: null,
        visibility: 'DISCOVERABLE',
      });
      mockPrisma.clip.findMany.mockResolvedValue([{ id: 'clip-a' }, { id: 'clip-b' }]);
      const result = await service.findByProject('p1');
      expect(result).toHaveLength(2);
    });
  });
});
