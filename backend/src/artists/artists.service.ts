import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface ArtistQuery {
  q?: string;
  city?: string;
  genre?: string;
  language?: string;
  role?: string;
  verified?: string;
  openToCollab?: string;
  beginnerFriendly?: string;
  momentum?: string;
  localRemote?: string;
  availability?: string;
  lookingFor?: string;
  sort?: 'rising' | 'recent' | 'trusted';
  cursor?: string;
  limit?: number;
}

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ArtistQuery) {
    const limit = Math.min(query.limit ?? 20, 50);
    const q = query.q?.trim();

    const where: Record<string, unknown> = {
      deletedAt: null,
      profile: { isNot: null },
    };

    const profileWhere: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { profile: { handle: { contains: q, mode: 'insensitive' } } },
        { profile: { city: { contains: q, mode: 'insensitive' } } },
        { profile: { primaryRole: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (query.city) profileWhere.city = { contains: query.city, mode: 'insensitive' };
    if (query.genre) profileWhere.genres = { has: query.genre };
    if (query.language) profileWhere.languages = { has: query.language };
    if (query.role) profileWhere.primaryRole = { contains: query.role, mode: 'insensitive' };
    if (query.momentum) profileWhere.momentum = query.momentum;
    if (query.openToCollab === 'true') profileWhere.openToCollab = true;
    if (query.beginnerFriendly === 'true') profileWhere.beginnerFriendly = true;
    if (query.verified === 'true') where.isVerified = true;
    if (query.localRemote) profileWhere.localRemotePreference = query.localRemote;
    if (query.availability) profileWhere.availabilityStatus = query.availability;
    if (query.lookingFor) profileWhere.lookingFor = { has: query.lookingFor };

    if (Object.keys(profileWhere).length > 0) {
      where.profile = { ...((where.profile as object) ?? {}), ...profileWhere };
    }

    const orderBy =
      query.sort === 'recent'
        ? { profile: { lastActiveAt: 'desc' as const } }
        : query.sort === 'trusted'
        ? { profile: { createdAt: 'asc' as const } }
        : { profile: { createdAt: 'desc' as const } };

    const users = await this.prisma.user.findMany({
      where,
      orderBy,
      take: limit + 1,
      skip: query.cursor ? 1 : 0,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      include: { profile: true },
    });

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map((u) => this.mapArtistCard(u)),
      nextCursor,
      hasMore,
    };
  }

  async findById(id: string) {
    const [user, projectCount, cypherCount, sessionCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id, deletedAt: null },
        include: {
          profile: true,
          ownedProjects: {
            where: { deletedAt: null, visibility: { in: ['DISCOVERABLE', 'OPEN'] } },
            take: 5,
            orderBy: { updatedAt: 'desc' },
          },
          organizedCyphers: {
            where: { deletedAt: null, state: { in: ['UPCOMING', 'ACTIVE', 'AFTERGLOW'] } },
            take: 3,
            orderBy: { startsAt: 'desc' },
            include: { _count: { select: { rsvps: true } } },
          },
          organizedSessions: {
            where: { type: 'TEACHING', freeLearning: true },
            take: 3,
            orderBy: { startsAt: 'desc' },
          },
        },
      }),
      this.prisma.projectMember.count({ where: { userId: id } }),
      this.prisma.cypherCheckIn.count({ where: { userId: id } }),
      this.prisma.communitySessionRSVP.count({ where: { userId: id, checkedInAt: { not: null } } }),
    ]);

    if (!user) throw new NotFoundException('Artist not found');

    const modules: { title: string; data: unknown }[] = [];

    const openProjects = user.ownedProjects.filter((p) => p.visibility === 'OPEN');
    if (openProjects.length > 0) {
      modules.push({
        title: 'Open projects',
        data: openProjects.map((p) => ({ id: p.id, title: p.title, openRoles: (p as any).openRoles, tags: p.tags })),
      });
    }

    if (user.organizedCyphers.length > 0) {
      modules.push({
        title: 'Cypher history',
        data: user.organizedCyphers.map((c) => ({ id: c.id, title: c.title, state: c.state, city: c.city })),
      });
    }

    if (user.profile?.beginnerFriendly && user.organizedSessions.length > 0) {
      modules.push({
        title: 'Free learning',
        data: user.organizedSessions.map((s) => ({ id: s.id, title: s.title, topic: s.topic })),
      });
    }

    return {
      id: user.id,
      displayName: user.displayName,
      isVerified: user.isVerified,
      handle: user.profile?.handle,
      bio: user.profile?.bio,
      city: user.profile?.city,
      avatarUrl: user.profile?.avatarUrl,
      genres: user.profile?.genres ?? [],
      primaryRole: user.profile?.primaryRole,
      secondaryRoles: user.profile?.secondaryRoles ?? [],
      languages: user.profile?.languages ?? [],
      openToCollab: user.profile?.openToCollab ?? false,
      beginnerFriendly: user.profile?.beginnerFriendly ?? false,
      availabilityStatus: user.profile?.availabilityStatus ?? 'OPEN',
      collaborationCapacity: user.profile?.collaborationCapacity ?? null,
      lookingFor: user.profile?.lookingFor ?? [],
      localRemotePreference: user.profile?.localRemotePreference ?? 'BOTH',
      collaborationIntent: user.profile?.collaborationIntent ?? null,
      trustSignals: user.profile?.trustSignals ?? [],
      momentum: user.profile?.momentum,
      lastActiveAt: user.profile?.lastActiveAt,
      contributions: { projectCount, cypherCount, sessionCount },
      modules,
    };
  }

  private mapArtistCard(u: { id: string; displayName: string; isVerified: boolean; profile?: Record<string, any> | null }) {
    return {
      id: u.id,
      displayName: u.displayName,
      isVerified: u.isVerified,
      handle: u.profile?.handle,
      city: u.profile?.city,
      avatarUrl: u.profile?.avatarUrl,
      genres: u.profile?.genres ?? [],
      primaryRole: u.profile?.primaryRole,
      secondaryRoles: u.profile?.secondaryRoles ?? [],
      languages: u.profile?.languages ?? [],
      openToCollab: u.profile?.openToCollab ?? false,
      beginnerFriendly: u.profile?.beginnerFriendly ?? false,
      availabilityStatus: u.profile?.availabilityStatus ?? 'OPEN',
      lookingFor: u.profile?.lookingFor ?? [],
      localRemotePreference: u.profile?.localRemotePreference ?? 'BOTH',
      trustSignals: u.profile?.trustSignals ?? [],
      momentum: u.profile?.momentum,
      lastActiveAt: u.profile?.lastActiveAt,
    };
  }
}
