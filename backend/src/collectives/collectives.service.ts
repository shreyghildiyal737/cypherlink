import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCollectiveDto } from './dto/create-collective.dto';

@Injectable()
export class CollectivesService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkLegitimacy(userId: string): Promise<boolean> {
    // Require at least one of:
    // - past collaboration memory (worked with someone on a project or cypher)
    // - a finished project they participated in with at least one other person
    // - at least 2 cypher check-ins (present in the local scene)
    const [collabCount, finishedProject, cypherCheckIns] = await Promise.all([
      (this.prisma as any).collaborationMemory.count({
        where: { OR: [{ userAId: userId }, { userBId: userId }] },
      }),
      this.prisma.projectMember.findFirst({
        where: {
          userId,
          project: { status: 'FINISHED', deletedAt: null },
          status: { in: ['ACTIVE', 'COMPLETED_CONTRIBUTION'] },
        },
        include: { project: { include: { _count: { select: { members: true } } } } },
      }),
      this.prisma.cypherCheckIn.count({ where: { userId } }),
    ]);

    const hasCollabHistory = collabCount >= 1;
    const hasFinishedProject = finishedProject != null && (finishedProject.project as any)._count.members >= 2;
    const hasScenePresence = cypherCheckIns >= 2;

    return hasCollabHistory || hasFinishedProject || hasScenePresence;
  }

  async create(dto: CreateCollectiveDto, userId: string) {
    const eligible = await this.checkLegitimacy(userId);
    if (!eligible) {
      throw new ForbiddenException(
        'Collectives are earned through shared creative history. Collaborate on a project, finish something together, or show up to local cyphers first.',
      );
    }

    const collective = await (this.prisma as any).collective.create({
      data: {
        name: dto.name,
        handle: dto.handle ?? null,
        description: dto.description ?? null,
        city: dto.city ?? null,
        bornFromCypherId: dto.bornFromCypherId ?? null,
        foundedById: userId,
        members: { create: { userId, role: 'founder' } },
      },
      include: {
        members: { include: { user: { include: { profile: true } } } },
        foundedBy: { include: { profile: true } },
      },
    });
    return this.mapCollective(collective);
  }

  async findAll(city?: string, limit = 20) {
    const where: any = { deletedAt: null };
    if (city) where.city = { contains: city, mode: 'insensitive' };

    const collectives = await (this.prisma as any).collective.findMany({
      where,
      take: Math.min(limit, 50),
      include: {
        members: { include: { user: { include: { profile: true } } } },
        foundedBy: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return collectives.map((c: any) => this.mapCollective(c));
  }

  async findById(id: string) {
    const c = await (this.prisma as any).collective.findUnique({
      where: { id },
      include: {
        members: { include: { user: { include: { profile: true } } } },
        foundedBy: { include: { profile: true } },
      },
    });
    if (!c || c.deletedAt) throw new NotFoundException('Collective not found');
    return this.mapCollective(c);
  }

  async join(collectiveId: string, userId: string) {
    const c = await (this.prisma as any).collective.findUnique({ where: { id: collectiveId } });
    if (!c || c.deletedAt) throw new NotFoundException('Collective not found');

    await (this.prisma as any).collectiveMember.upsert({
      where: { collectiveId_userId: { collectiveId, userId } },
      create: { collectiveId, userId, role: 'member' },
      update: {},
    });
    return { joined: true };
  }

  async leave(collectiveId: string, userId: string) {
    const c = await (this.prisma as any).collective.findUnique({ where: { id: collectiveId } });
    if (!c || c.deletedAt) throw new NotFoundException('Collective not found');
    if (c.foundedById === userId) throw new ForbiddenException('Founder cannot leave — transfer ownership first');

    await (this.prisma as any).collectiveMember.delete({
      where: { collectiveId_userId: { collectiveId, userId } },
    });
    return { left: true };
  }

  async getMyCollectives(userId: string) {
    const memberships = await (this.prisma as any).collectiveMember.findMany({
      where: { userId },
      include: {
        collective: {
          include: {
            members: { include: { user: { include: { profile: true } } } },
            foundedBy: { include: { profile: true } },
          },
        },
      },
    });
    return memberships
      .map((m: any) => (m.collective && !m.collective.deletedAt ? this.mapCollective(m.collective) : null))
      .filter(Boolean);
  }

  private mapCollective(c: any) {
    return {
      id: c.id,
      name: c.name,
      handle: c.handle ?? null,
      description: c.description ?? null,
      city: c.city ?? null,
      avatarUrl: c.avatarUrl ?? null,
      bornFromCypherId: c.bornFromCypherId ?? null,
      foundedById: c.foundedById,
      founderName: c.foundedBy?.displayName ?? null,
      founderHandle: c.foundedBy?.profile?.handle ?? null,
      memberCount: c.members?.length ?? 0,
      members: (c.members ?? []).map((m: any) => ({
        userId: m.userId,
        displayName: m.user?.displayName ?? 'Unknown',
        handle: m.user?.profile?.handle ?? null,
        avatarUrl: m.user?.profile?.avatarUrl ?? null,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      createdAt: c.createdAt,
    };
  }
}
