import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome() {
    const [artists, activeCyphers, projects, communitySessions, clips] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null, profile: { isNot: null } },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      }),
      this.prisma.cypher.findMany({
        where: { state: { in: ['UPCOMING', 'ACTIVE'] }, deletedAt: null },
        take: 6,
        orderBy: { startsAt: 'asc' },
        include: { _count: { select: { rsvps: true } }, highlights: { take: 2 } },
      }),
      this.prisma.project.findMany({
        where: { visibility: { in: ['DISCOVERABLE', 'OPEN'] }, deletedAt: null },
        take: 6,
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { members: true } } },
      }),
      this.prisma.communitySession.findMany({
        where: { state: { in: ['UPCOMING', 'ACTIVE'] } },
        take: 4,
        orderBy: { startsAt: 'asc' },
        include: { _count: { select: { rsvps: true } } },
      }),
      this.prisma.clip.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { creator: { include: { profile: true } } },
      }),
    ]);

    return {
      artists: artists.map((a) => ({
        id: a.id,
        displayName: a.displayName,
        handle: a.profile?.handle || '',
        city: a.profile?.city,
        genres: a.profile?.genres || [],
        isVerified: a.isVerified,
        momentum: a.profile?.momentum,
        avatarUrl: a.profile?.avatarUrl,
      })),
      cyphers: activeCyphers.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        state: c.state,
        city: c.city,
        venue: c.venue,
        startsAt: c.startsAt,
        pullingUp: c._count.rsvps,
        quota: c.quota,
        highlights: c.highlights.map((h) => ({ title: h.title, mediaUrl: h.mediaUrl })),
      })),
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        city: p.city,
        tags: p.tags,
        openRoles: p.openRoles,
        memberCount: p._count.members,
      })),
      sessions: communitySessions.map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        city: s.city,
        startsAt: s.startsAt,
        pullingUp: s._count.rsvps,
        freeLearning: s.freeLearning,
        topic: s.topic,
      })),
      clips: clips.map((cl) => ({
        id: cl.id,
        creator: {
          id: cl.creator.id,
          displayName: cl.creator.displayName,
          handle: cl.creator.profile?.handle || '',
          city: cl.creator.profile?.city,
          genres: cl.creator.profile?.genres || [],
          isVerified: cl.creator.isVerified,
          momentum: cl.creator.profile?.momentum,
          avatarUrl: cl.creator.profile?.avatarUrl,
        },
        projectTitle: cl.projectTitle,
        city: cl.city,
        reason: cl.reason,
        caption: cl.caption,
        likes: cl.likes,
        comments: cl.comments,
        createdAt: cl.createdAt,
      })),
    };
  }

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        ownedProjects: {
          where: { deletedAt: null },
          include: { _count: { select: { members: true } } },
        },
        organizerSummary: true,
        _count: {
          select: { sentFollows: true, receivedFollows: true, checkIns: true, sessionRSVPs: true },
        },
        checkIns: {
          take: 3,
          orderBy: { checkedInAt: 'desc' },
          include: {
            cypher: { select: { id: true, title: true, city: true, state: true, startsAt: true } },
          },
        },
      },
    });

    if (!user || user.deletedAt) return null;

    // Derive soft identity labels — editorial, not scores
    const softLabels: string[] = [];
    if (user.profile?.openToCollab) softLabels.push('Open to collaborating');
    if (user.profile?.beginnerFriendly) softLabels.push('Helps new artists');
    if (user.organizerSummary && user.organizerSummary.totalCyphers > 0) softLabels.push('Cypher organizer');
    if (user.organizerSummary && user.organizerSummary.totalSessions > 0) softLabels.push('Session leader');
    if (user._count.checkIns >= 3) softLabels.push('Cypher regular');
    if (user._count.checkIns >= 1 && user._count.sessionRSVPs >= 1) softLabels.push('Community active');

    const profile: Record<string, unknown> = {
      id: user.id,
      handle: user.profile?.handle || '',
      displayName: user.displayName,
      bio: user.profile?.bio || undefined,
      city: user.profile?.city || undefined,
      state: user.profile?.state || undefined,
      avatarUrl: user.profile?.avatarUrl || undefined,
      coverUrl: user.profile?.coverUrl || undefined,
      genres: user.profile?.genres || [],
      momentum: user.profile?.momentum || undefined,
      isVerified: user.isVerified,
      followers: user._count.receivedFollows,
      following: user._count.sentFollows,
      primaryRole: user.profile?.primaryRole || undefined,
      languages: user.profile?.languages || [],
      openToCollab: user.profile?.openToCollab ?? false,
      beginnerFriendly: user.profile?.beginnerFriendly ?? false,
      trustSignals: user.profile?.trustSignals || [],
      socialLinks: user.profile?.socialLinks || undefined,
      followedScenes: user.profile?.followedScenes || [],
      softLabels,
      cyphersAttended: user._count.checkIns,
      communitySessionsJoined: user._count.sessionRSVPs,
      recentCyphers: user.checkIns.map((ci) => ({
        id: ci.cypher.id,
        title: ci.cypher.title,
        city: ci.cypher.city,
        state: ci.cypher.state,
        checkedInAt: ci.checkedInAt,
      })),
    };

    // Only include projects section if there are projects
    const projects = user.ownedProjects
      .filter((p) => p.visibility !== 'PRIVATE')
      .map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        city: p.city,
        tags: p.tags,
        openRoles: p.openRoles,
        memberCount: p._count.members,
      }));

    if (projects.length > 0) {
      profile['projects'] = projects;
    }

    if (user.organizerSummary) {
      profile['organizerSummary'] = {
        totalCyphers: user.organizerSummary.totalCyphers,
        totalSessions: user.organizerSummary.totalSessions,
        totalHighlights: user.organizerSummary.totalHighlights,
      };
    }

    // Memory trails — keep editorial, derive from existing data, no graph walk.
    const trails: Array<{ kind: string; label: string; href?: string }> = [];

    // Active scenes: where they keep showing up via cyphers attended.
    if (user.checkIns.length > 0) {
      const cityCounts = new Map<string, number>();
      for (const ci of user.checkIns) {
        const c = ci.cypher.city;
        if (c) cityCounts.set(c, (cityCounts.get(c) ?? 0) + 1);
      }
      const topScene = Array.from(cityCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      if (topScene) {
        trails.push({
          kind: 'scene',
          label: `Often active in ${topScene[0]} scene`,
          href: `/scenes/${topScene[0].toLowerCase()}`,
        });
      }
      const mostRecent = user.checkIns[0];
      if (mostRecent) {
        trails.push({
          kind: 'cypher',
          label: `Last seen at ${mostRecent.cypher.title}`,
          href: `/cyphers/${mostRecent.cypher.id}`,
        });
      }
    }

    // Projects they've been part of (just one — surface most recent owned).
    if (user.ownedProjects.length > 0) {
      const latest = user.ownedProjects[0];
      trails.push({
        kind: 'project',
        label: `Working on ${latest.title}`,
        href: `/projects/${latest.id}`,
      });
    }

    if (trails.length > 0) {
      profile['memoryTrails'] = trails;
    }

    return profile;
  }

  async getFeed(cursor?: string, limit = 12) {
    const where: Record<string, unknown> = {};
    if (cursor) {
      where['createdAt'] = { lt: new Date(cursor) };
    }

    const clips = await this.prisma.clip.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { include: { profile: true } },
        cypher: { select: { id: true, title: true, city: true } },
        project: { select: { id: true, title: true, visibility: true } },
        communitySession: { select: { id: true, title: true, city: true } },
      },
    });

    const hasMore = clips.length > limit;
    const items = clips.slice(0, limit);
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return {
      clips: items.map((cl) => ({
        id: cl.id,
        creator: {
          id: cl.creator.id,
          displayName: cl.creator.displayName,
          handle: cl.creator.profile?.handle || '',
          city: cl.creator.profile?.city,
          genres: cl.creator.profile?.genres || [],
          isVerified: cl.creator.isVerified,
          momentum: cl.creator.profile?.momentum,
          avatarUrl: cl.creator.profile?.avatarUrl,
        },
        projectTitle: cl.projectTitle,
        city: cl.city,
        reason: cl.reason,
        caption: cl.caption,
        likes: cl.likes,
        comments: cl.comments,
        mediaUrl: cl.mediaUrl,
        createdAt: cl.createdAt,
        cypher: cl.cypher ? { id: cl.cypher.id, title: cl.cypher.title, city: cl.cypher.city } : null,
        project: cl.project && cl.project.visibility !== 'PRIVATE'
          ? { id: cl.project.id, title: cl.project.title }
          : null,
        communitySession: cl.communitySession
          ? { id: cl.communitySession.id, title: cl.communitySession.title, city: cl.communitySession.city }
          : null,
      })),
      nextCursor,
      hasMore,
    };
  }

  async getMap() {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        profile: { city: { not: null }, locationVisibility: { not: 'HIDDEN' } },
      },
      include: { profile: true },
    });

    const cityMap = new Map<string, { artistCount: number; activeCyphers: number; genres: Set<string> }>();

    for (const user of users) {
      const city = user.profile?.city;
      if (!city) continue;
      if (!cityMap.has(city)) {
        cityMap.set(city, { artistCount: 0, activeCyphers: 0, genres: new Set() });
      }
      const entry = cityMap.get(city)!;
      entry.artistCount++;
      user.profile?.genres?.forEach((g) => entry.genres.add(g));
    }

    const activeCyphers = await this.prisma.cypher.findMany({
      where: { state: { in: ['UPCOMING', 'ACTIVE'] }, deletedAt: null },
      select: { city: true },
    });

    for (const c of activeCyphers) {
      if (cityMap.has(c.city)) {
        cityMap.get(c.city)!.activeCyphers++;
      }
    }

    // City coordinates (simplified for MVP)
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      'Delhi': { lat: 28.7041, lng: 77.1025 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Bangalore': { lat: 12.9716, lng: 77.5946 },
      'Shillong': { lat: 25.5788, lng: 91.8933 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Kolkata': { lat: 22.5726, lng: 88.3639 },
      'Pune': { lat: 18.5204, lng: 73.8567 },
      'Hyderabad': { lat: 17.3850, lng: 78.4867 },
      'Goa': { lat: 15.4909, lng: 73.8278 },
      'Guwahati': { lat: 26.1445, lng: 91.7362 },
    };

    return Array.from(cityMap.entries()).map(([city, data]) => ({
      city,
      lat: cityCoords[city]?.lat || 20.5937,
      lng: cityCoords[city]?.lng || 78.9629,
      artistCount: data.artistCount,
      activeCyphers: data.activeCyphers,
      topGenres: Array.from(data.genres).slice(0, 5),
    }));
  }

  async getPublicProfile(id: string) {
    return this.getProfile(id);
  }

  async getPublicProject(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { include: { profile: true } },
        _count: { select: { members: true, clips: true } },
        credits: { include: { profile: true } },
      },
    });

    if (!project || project.deletedAt || project.visibility === 'PRIVATE') return null;

    // Memory trail: was this project born from a cypher? The earliest clip
    // linked to a cypher tells us where the seed came from.
    const seedClip = await this.prisma.clip.findFirst({
      where: { projectId: project.id, cypherId: { not: null } },
      orderBy: { createdAt: 'asc' },
      include: {
        cypher: { select: { id: true, title: true, city: true } },
      },
    });

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      city: project.city,
      tags: project.tags,
      openRoles: project.openRoles,
      owner: { displayName: project.owner.displayName, handle: project.owner.profile?.handle },
      ownerId: project.ownerId,
      memberCount: project._count.members,
      credits: project.credits.map((c) => ({ role: c.role, profileHandle: c.profile.handle })),
      createdAt: project.createdAt,
      memoryTrail: {
        clipsCount: project._count.clips,
        bornFromCypher: seedClip?.cypher
          ? { id: seedClip.cypher.id, title: seedClip.cypher.title, city: seedClip.cypher.city }
          : null,
      },
    };
  }

  async getPublicClip(id: string) {
    const clip = await this.prisma.clip.findUnique({
      where: { id },
      include: {
        creator: { include: { profile: true } },
        cypher: { select: { id: true, title: true, city: true, state: true, startsAt: true } },
        project: { select: { id: true, title: true, status: true, visibility: true } },
        communitySession: { select: { id: true, title: true, city: true, type: true } },
      },
    });
    if (!clip) return null;

    // Hide private project linkage from non-members; the FK is still safe — we
    // just don't surface it publicly.
    const projectLink = clip.project && clip.project.visibility !== 'PRIVATE'
      ? { id: clip.project.id, title: clip.project.title, status: clip.project.status }
      : null;

    return {
      id: clip.id,
      creator: {
        id: clip.creator.id,
        displayName: clip.creator.displayName,
        handle: clip.creator.profile?.handle || '',
        city: clip.creator.profile?.city,
        genres: clip.creator.profile?.genres || [],
        isVerified: clip.creator.isVerified,
        momentum: clip.creator.profile?.momentum,
        avatarUrl: clip.creator.profile?.avatarUrl,
      },
      projectTitle: clip.projectTitle,
      city: clip.city,
      reason: clip.reason,
      caption: clip.caption,
      likes: clip.likes,
      comments: clip.comments,
      mediaUrl: clip.mediaUrl,
      createdAt: clip.createdAt,
      cypher: clip.cypher
        ? {
            id: clip.cypher.id,
            title: clip.cypher.title,
            city: clip.cypher.city,
            state: clip.cypher.state,
            startsAt: clip.cypher.startsAt,
          }
        : null,
      project: projectLink,
      communitySession: clip.communitySession
        ? {
            id: clip.communitySession.id,
            title: clip.communitySession.title,
            city: clip.communitySession.city,
            type: clip.communitySession.type,
          }
        : null,
    };
  }

  async getPublicCypher(id: string) {
    const cypher = await this.prisma.cypher.findUnique({
      where: { id },
      include: {
        highlights: true,
        _count: { select: { rsvps: true, clips: true } },
        organizer: { include: { profile: true } },
      },
    });

    if (!cypher || cypher.deletedAt) return null;

    // Memory trail: how many projects were started after this cypher by people
    // who checked in. Cheap to compute and avoids a true graph walk.
    const projectsStartedAfter = await this.prisma.project.count({
      where: {
        createdAt: { gte: cypher.startsAt },
        owner: { checkIns: { some: { cypherId: cypher.id } } },
      },
    });

    return {
      id: cypher.id,
      title: cypher.title,
      description: cypher.description,
      type: cypher.type,
      state: cypher.state,
      city: cypher.city,
      venue: cypher.venue,
      startsAt: cypher.startsAt,
      endsAt: cypher.endsAt,
      quota: cypher.quota,
      pullingUp: cypher._count.rsvps,
      safetyTags: cypher.safetyTags,
      highlights: cypher.highlights.map((h) => ({ id: h.id, title: h.title, mediaUrl: h.mediaUrl, mediaType: h.mediaType })),
      organizer: { displayName: cypher.organizer.displayName, handle: cypher.organizer.profile?.handle },
      organizerId: cypher.organizerId,
      memoryTrail: {
        clipsCount: cypher._count.clips,
        preservedHighlights: cypher.highlights.length,
        projectsStartedAfter,
      },
    };
  }
}
