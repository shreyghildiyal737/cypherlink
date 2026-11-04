import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

type SearchTab = 'artists' | 'projects' | 'cyphers' | 'clips' | 'community' | 'scenes' | 'all';

interface SearchFilters {
  city?: string;
  genre?: string;
  language?: string;
  verified?: string;
  openToCollab?: string;
  beginnerFriendly?: string;
  cypherType?: string;
  type?: SearchTab;
  // project-specific filters
  openRole?: string;
  projectType?: string;
  commitmentStyle?: string;
  localRemote?: string;
  // artist-specific
  availability?: string;
  role?: string;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, filters?: SearchFilters) {
    const q = query?.trim() || '';
    const tab = filters?.type ?? 'all';

    const shouldFetch = (t: SearchTab) => tab === 'all' || tab === t;


    const [users, projects, cyphers, clips, community] = await Promise.all([
      shouldFetch('artists')
        ? this.prisma.user.findMany({
            where: {
              deletedAt: null,
              profile: { isNot: null },
              ...(filters?.verified === 'true' ? { isVerified: true } : {}),
              ...(q
                ? {
                    OR: [
                      { displayName: { contains: q, mode: 'insensitive' } },
                      { profile: { handle: { contains: q, mode: 'insensitive' } } },
                      { profile: { city: { contains: q, mode: 'insensitive' } } },
                      { profile: { primaryRole: { contains: q, mode: 'insensitive' } } },
                    ],
                  }
                : {}),
              ...(filters?.city ? { profile: { city: { contains: filters.city, mode: 'insensitive' } } } : {}),
              ...(filters?.openToCollab === 'true' ? { profile: { openToCollab: true } } : {}),
              ...(filters?.beginnerFriendly === 'true' ? { profile: { beginnerFriendly: true } } : {}),
            },
            take: 15,
            include: { profile: true },
          })
        : Promise.resolve([]),

      shouldFetch('projects')
        ? this.prisma.project.findMany({
            where: {
              deletedAt: null,
              visibility: { in: ['DISCOVERABLE', 'OPEN'] },
              ...(filters?.city ? { city: { contains: filters.city, mode: 'insensitive' } } : {}),
              ...(filters?.openRole ? { openRoles: { has: filters.openRole } } : {}),
              ...(filters?.projectType ? { projectType: filters.projectType as any } : {}),
              ...(filters?.commitmentStyle ? { commitmentStyle: filters.commitmentStyle as any } : {}),
              ...(filters?.localRemote ? { localRemote: filters.localRemote as any } : {}),
              ...(q
                ? {
                    OR: [
                      { title: { contains: q, mode: 'insensitive' } },
                      { city: { contains: q, mode: 'insensitive' } },
                      { tags: { has: q } },
                      { openRoles: { has: q } },
                    ],
                  }
                : {}),
            },
            take: 15,
            include: {
              _count: { select: { members: true } },
            },
          })
        : Promise.resolve([]),

      shouldFetch('cyphers')
        ? this.prisma.cypher.findMany({
            where: {
              deletedAt: null,
              ...(filters?.cypherType ? { type: filters.cypherType.toUpperCase() as 'OPEN' | 'VENUE' } : {}),
              ...(filters?.city ? { city: { contains: filters.city, mode: 'insensitive' } } : {}),
              ...(q
                ? {
                    OR: [
                      { title: { contains: q, mode: 'insensitive' } },
                      { city: { contains: q, mode: 'insensitive' } },
                      { venue: { contains: q, mode: 'insensitive' } },
                    ],
                  }
                : {}),
            },
            take: 15,
            include: { _count: { select: { rsvps: true } } },
          })
        : Promise.resolve([]),

      shouldFetch('clips')
        ? this.prisma.clip.findMany({
            where: {
              ...(filters?.city ? { city: { contains: filters.city, mode: 'insensitive' } } : {}),
              ...(q
                ? {
                    OR: [
                      { caption: { contains: q, mode: 'insensitive' } },
                      { reason: { contains: q, mode: 'insensitive' } },
                      { city: { contains: q, mode: 'insensitive' } },
                    ],
                  }
                : {}),
            },
            take: 15,
            include: { creator: { include: { profile: true } } },
            orderBy: { likes: 'desc' },
          })
        : Promise.resolve([]),

      shouldFetch('community')
        ? this.prisma.communitySession.findMany({
            where: {
              ...(filters?.city ? { city: { contains: filters.city, mode: 'insensitive' } } : {}),
              ...(q
                ? {
                    OR: [
                      { title: { contains: q, mode: 'insensitive' } },
                      { city: { contains: q, mode: 'insensitive' } },
                      { topic: { contains: q, mode: 'insensitive' } },
                    ],
                  }
                : {}),
            },
            take: 15,
            include: { _count: { select: { rsvps: true } } },
            orderBy: { startsAt: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    return {
      artists: (users as typeof users).map((u) => ({
        id: u.id,
        displayName: u.displayName,
        isVerified: u.isVerified,
        handle: u.profile?.handle,
        city: u.profile?.city,
        genres: u.profile?.genres,
        avatarUrl: u.profile?.avatarUrl,
        momentum: u.profile?.momentum,
        primaryRole: u.profile?.primaryRole,
        openToCollab: u.profile?.openToCollab,
        beginnerFriendly: u.profile?.beginnerFriendly,
      })),
      projects: (projects as typeof projects).map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        visibility: p.visibility,
        projectType: (p as any).projectType,
        commitmentStyle: (p as any).commitmentStyle,
        localRemote: (p as any).localRemote,
        city: p.city,
        tags: p.tags,
        openRoles: p.openRoles,
        filledRoles: (p as any).filledRoles ?? [],
        memberCount: p._count.members,
      })),
      cyphers: (cyphers as typeof cyphers).map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        state: c.state,
        city: c.city,
        venue: c.venue,
        startsAt: c.startsAt,
        pullingUp: c._count.rsvps,
      })),
      clips: (clips as typeof clips).map((cl) => ({
        id: cl.id,
        caption: cl.caption,
        reason: cl.reason,
        city: cl.city,
        likes: cl.likes,
        comments: cl.comments,
        creator: {
          id: cl.creator.id,
          displayName: cl.creator.displayName,
          handle: cl.creator.profile?.handle,
          avatarUrl: cl.creator.profile?.avatarUrl,
        },
      })),
      community: (community as typeof community).map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        city: s.city,
        freeLearning: s.freeLearning,
        topic: s.topic,
        startsAt: s.startsAt,
        pullingUp: s._count.rsvps,
      })),
    };
  }
}
