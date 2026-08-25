import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

interface ViewerContext {
  city?: string;
  state?: string;
  genres?: string[];
  primaryRole?: string;
  secondaryRoles?: string[];
  lookingFor?: string[];
  commitmentStyle?: string | null;
  isNewcomer?: boolean;
}

export interface ArtistDiscoveryFilters {
  city?: string;
  genre?: string;
  role?: string;
  language?: string;
  openToCollab?: boolean;
  beginnerFriendly?: boolean;
  localRemote?: string;
  availability?: string;
  limit?: number;
}

export interface ProjectDiscoveryFilters {
  city?: string;
  openRole?: string;
  tag?: string;
  projectType?: string;
  commitmentStyle?: string;
  localRemote?: string;
  limit?: number;
}

// Explicit scoring constants — weights are intentionally visible and tunable
const A = {
  SAME_CITY: 4,
  SAME_STATE: 2,
  GENRE_MATCH: 2,         // per shared genre, capped at 3 genres
  ROLE_MATCH: 3,
  OPEN_TO_COLLAB: 2,
  AVAIL_OPEN: 2,
  AVAIL_SELECTIVE: 1,
  PROFILE_COMPLETE: 1,    // per completeness dimension (max 3)
  NEWCOMER_BOOST: 2,      // only applies when overall score is low
  TRUST_SIGNAL: 1,        // per signal (max 4)
  RECENT_7D: 3,
  RECENT_30D: 1,
  EMPTY_PROFILE: -3,
} as const;

const P = {
  SAME_CITY: 4,
  HAS_DESC: 2,
  HAS_TAGS: 2,
  ROLE_MATCH: 3,
  OPEN_VIS: 1,
  OPEN_COLLAB_TYPE: 1,
  COMMIT_MATCH: 2,
  RECENT_7D: 3,
  RECENT_30D: 1,
  STALE_90D: -2,
  NO_ROLES: -2,
  BAD_TITLE: -2,
  NO_INFO: -3,
} as const;

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  private async getViewerContext(userId?: string): Promise<ViewerContext> {
    if (!userId) return {};
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user?.profile) return {};
    const isNewcomer = Date.now() - user.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000;
    return {
      city: user.profile.city ?? undefined,
      state: user.profile.state ?? undefined,
      genres: user.profile.genres ?? [],
      primaryRole: user.profile.primaryRole ?? undefined,
      secondaryRoles: user.profile.secondaryRoles ?? [],
      lookingFor: user.profile.lookingFor ?? [],
      commitmentStyle: (user.profile as any).commitmentStyle ?? null,
      isNewcomer,
    };
  }

  private scoreArtist(u: any, viewer: ViewerContext): { score: number; matchReasons: string[] } {
    const p = u.profile;
    if (!p) return { score: -10, matchReasons: [] };
    let score = 0;
    const reasons: string[] = [];

    // Locality
    if (p.city && viewer.city && p.city.toLowerCase() === viewer.city.toLowerCase()) {
      score += A.SAME_CITY;
      reasons.push('Active in your city');
    } else if (p.state && viewer.state && p.state.toLowerCase() === viewer.state.toLowerCase()) {
      score += A.SAME_STATE;
    }

    // Genre overlap
    const vGenres = (viewer.genres ?? []).map((g: string) => g.toLowerCase());
    const sharedGenres = (p.genres ?? []).filter((g: string) => vGenres.includes(g.toLowerCase()));
    if (sharedGenres.length > 0) {
      score += Math.min(sharedGenres.length, 3) * A.GENRE_MATCH;
      reasons.push('Similar styles');
    }

    // Role match: viewer's roles appear in target's lookingFor
    const vRoles = [viewer.primaryRole, ...(viewer.secondaryRoles ?? [])].filter(Boolean) as string[];
    const targetLF = (p.lookingFor ?? []).map((r: string) => r.toLowerCase());
    if (vRoles.some((r) => targetLF.includes(r.toLowerCase()))) {
      score += A.ROLE_MATCH;
      reasons.push('Looking for your role');
    }

    // Collaboration openness
    if (p.openToCollab) {
      score += A.OPEN_TO_COLLAB;
      if (reasons.length < 3) reasons.push('Open to collaboration');
    }
    if (p.availabilityStatus === 'OPEN') score += A.AVAIL_OPEN;
    else if (p.availabilityStatus === 'SELECTIVE') score += A.AVAIL_SELECTIVE;

    // Beginner friendly — bonus if viewer is a newcomer
    if (viewer.isNewcomer && p.beginnerFriendly) {
      score += 2;
      if (reasons.length < 3) reasons.push('Beginner friendly');
    }

    // Profile completeness (anti-low-info)
    const completeness =
      (p.bio && p.bio.length > 30 ? 1 : 0) +
      (p.genres?.length > 0 ? 1 : 0) +
      (p.primaryRole ? 1 : 0) +
      (p.lookingFor?.length > 0 ? 1 : 0);
    score += Math.min(completeness, 3) * A.PROFILE_COMPLETE;
    if (completeness === 0) score += A.EMPTY_PROFILE;

    // Recency + dormancy weighting
    const lastActive = p.lastActiveAt ?? u.updatedAt;
    if (lastActive) {
      const daysAgo = (Date.now() - new Date(lastActive).getTime()) / 86400000;
      if (daysAgo < 7) score += A.RECENT_7D;
      else if (daysAgo < 30) score += A.RECENT_30D;
      else if (daysAgo > 180) score -= 4;
      else if (daysAgo > 90) score -= 2;
    }

    // Trust signals (user-set)
    score += Math.min((p.trustSignals ?? []).length, 4) * A.TRUST_SIGNAL;

    // Subtle newcomer rotation boost: helps new creators get initial exposure
    const userAgeDays = (Date.now() - new Date(u.createdAt).getTime()) / 86400000;
    if (userAgeDays < 30 && score < 8) score += A.NEWCOMER_BOOST;

    return { score, matchReasons: reasons.slice(0, 3) };
  }

  private scoreProject(p: any, viewer: ViewerContext): { score: number; matchReasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Locality
    if (p.city && viewer.city && p.city.toLowerCase() === viewer.city.toLowerCase()) {
      score += P.SAME_CITY;
      reasons.push('In your city');
    }

    // Role match
    const unfilledRoles = (p.openRoles ?? []).filter((r: string) => !(p.filledRoles ?? []).includes(r));
    const vRoles = [viewer.primaryRole, ...(viewer.secondaryRoles ?? [])].filter(Boolean) as string[];
    if (vRoles.some((vr) => unfilledRoles.map((r: string) => r.toLowerCase()).includes(vr.toLowerCase()))) {
      score += P.ROLE_MATCH;
      reasons.push('Your role is needed');
    }

    // Information quality
    if (p.description && p.description.length > 30) score += P.HAS_DESC;
    if ((p.tags ?? []).length >= 2) score += P.HAS_TAGS;
    if (p.title && p.title.length < 10) score += P.BAD_TITLE;
    if (!p.description && (!p.tags || p.tags.length === 0)) score += P.NO_INFO;

    // Visibility / type
    if (p.visibility === 'OPEN') {
      score += P.OPEN_VIS;
      if (reasons.length < 3) reasons.push('Looking for contributors');
    }
    if (p.projectType === 'OPEN_COLLAB') {
      score += P.OPEN_COLLAB_TYPE;
      if (reasons.length < 3 && !reasons.includes('Looking for contributors')) {
        reasons.push('Open collaboration');
      }
    }

    // Commitment style match
    if (viewer.commitmentStyle && p.commitmentStyle && p.commitmentStyle === viewer.commitmentStyle) {
      score += P.COMMIT_MATCH;
    }
    if (p.commitmentStyle === 'QUICK_JAM' || p.commitmentStyle === 'ONE_NIGHT_SESSION') {
      if (reasons.length < 3) reasons.push('Quick turnaround');
    }

    // Roles
    if ((p.openRoles ?? []).length === 0) score += P.NO_ROLES;

    // Recency based on meaningful activity, not creation date
    const activityDate = (p as any).lastMeaningfulActivityAt ?? p.createdAt;
    const ageDays = (Date.now() - new Date(activityDate).getTime()) / 86400000;
    if (ageDays < 7) score += P.RECENT_7D;
    else if (ageDays < 30) score += P.RECENT_30D;
    else if (ageDays > 90) score += P.STALE_90D;

    const lifecycle = (p as any).lifecycleState;
    if (lifecycle === 'SLOWING_DOWN') score -= 1;
    else if (lifecycle === 'INACTIVE') score -= 4;
    else if (lifecycle === 'ARCHIVED' || lifecycle === 'COMPLETED') score -= 8;

    // Low-risk participation surface boost — newcomer-friendly quick opportunities
    const cs = p.commitmentStyle;
    if (cs === 'QUICK_JAM' || cs === 'EXPERIMENTAL' || cs === 'ONE_NIGHT_SESSION') score += 2;

    return { score, matchReasons: reasons.slice(0, 3) };
  }

  // Soft diversity balancing: top 70% by score + random 30% from remainder
  // Caps: same-city max 4, same-owner max 2 (anti-clique)
  private diversityBalance<T extends { score: number; city?: string | null; ownerId?: string | null; id?: string }>(
    items: T[],
    limit: number,
  ): T[] {
    if (items.length <= limit) return [...items].sort((a, b) => b.score - a.score);
    const sorted = [...items].sort((a, b) => b.score - a.score);
    const topCount = Math.ceil(limit * 0.7);
    const top = sorted.slice(0, topCount);
    const rest = sorted.slice(topCount).sort(() => Math.random() - 0.5);
    const combined = [...top, ...rest.slice(0, limit - topCount)];

    const cityCount: Record<string, number> = {};
    const ownerCount: Record<string, number> = {};
    const result: T[] = [];
    for (const item of combined) {
      const city = item.city?.toLowerCase() ?? '';
      const owner = (item as any).ownerId ?? '';
      if (city && (cityCount[city] ?? 0) >= 4) continue;
      if (owner && (ownerCount[owner] ?? 0) >= 2) continue;
      cityCount[city] = (cityCount[city] ?? 0) + 1;
      if (owner) ownerCount[owner] = (ownerCount[owner] ?? 0) + 1;
      result.push(item);
      if (result.length >= limit) break;
    }
    for (const item of combined) {
      if (result.length >= limit) break;
      if (!result.includes(item)) result.push(item);
    }
    return result;
  }

  // AI saturation cap: items already sorted by score; trim surplus AI-disclosed entries
  // from the bottom so honest creators remain discoverable but don't flood results.
  private aiSaturationCap<T extends { aiDisclosureLabel?: string | null }>(items: T[], limit: number): T[] {
    const maxAi = Math.max(1, Math.ceil(limit * 0.30));
    let aiCount = 0;
    return items.filter((item) => {
      if (item.aiDisclosureLabel) {
        aiCount++;
        return aiCount <= maxAi;
      }
      return true;
    });
  }

  async computeSoftTrustSignals(userId: string): Promise<string[]> {
    const [completedOwned, activeCollab, cypherCheckIns, sessionParticipated] = await Promise.all([
      this.prisma.project.count({ where: { ownerId: userId, status: 'FINISHED', deletedAt: null } }),
      this.prisma.projectMember.count({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.cypherCheckIn.count({ where: { userId } }),
      this.prisma.communitySessionRSVP.count({ where: { userId, checkedInAt: { not: null } } }),
    ]);

    const signals: string[] = [];
    if (completedOwned >= 3) signals.push('Frequently completes projects');
    else if (completedOwned >= 1) signals.push('Completes what they start');
    if (activeCollab >= 3) signals.push('Active collaborator');
    else if (activeCollab >= 1) signals.push('Currently collaborating');
    if (cypherCheckIns >= 5) signals.push('Active in local scene');
    else if (cypherCheckIns >= 2) signals.push('Community participant');
    if (sessionParticipated >= 2) signals.push('Community contributor');
    return signals.slice(0, 4);
  }

  async computeOrganizerTrustSignals(userId: string): Promise<string[]> {
    const [summary, completedCyphers, recentCypher] = await Promise.all([
      this.prisma.organizerSummary.findUnique({ where: { userId } }),
      this.prisma.cypher.count({
        where: { organizerId: userId, state: { in: ['AFTERGLOW', 'ARCHIVED'] }, deletedAt: null },
      }),
      this.prisma.cypher.findFirst({
        where: { organizerId: userId, deletedAt: null },
        orderBy: { startsAt: 'desc' },
        select: { startsAt: true },
      }),
    ]);

    const signals: string[] = [];

    if (completedCyphers >= 5) signals.push('Consistent organizer');
    else if (completedCyphers >= 2) signals.push('Has run multiple events');
    else if (completedCyphers >= 1) signals.push('Has organized before');

    if (summary?.totalHighlights && summary.totalHighlights >= 10) {
      signals.push('Preserves the culture');
    } else if (summary?.totalHighlights && summary.totalHighlights >= 3) {
      signals.push('Curates highlights');
    }

    if (summary?.totalAttendance && summary.totalAttendance >= 50) {
      signals.push('Brings the community out');
    } else if (summary?.totalAttendance && summary.totalAttendance >= 15) {
      signals.push('Solid turnout history');
    }

    if (recentCypher?.startsAt) {
      const daysAgo = (Date.now() - new Date(recentCypher.startsAt).getTime()) / 86400000;
      if (daysAgo < 90) signals.push('Recently active organizer');
    }

    return signals.slice(0, 4);
  }

  async checkCollaborationMemory(viewerUserId: string, targetUserId: string) {
    const viewerProjects = await this.prisma.projectMember.findMany({
      where: { userId: viewerUserId },
      select: { projectId: true },
    });
    const sharedCount = viewerProjects.length > 0
      ? await this.prisma.projectMember.count({
          where: { userId: targetUserId, projectId: { in: viewerProjects.map((m) => m.projectId) } },
        })
      : 0;

    const [a, b] = [viewerUserId, targetUserId].sort();
    const memory = await (this.prisma as any).collaborationMemory.findUnique({
      where: { userAId_userBId: { userAId: a, userBId: b } },
    });

    const totalCount = Math.max(sharedCount, memory?.collabCount ?? 0);
    let label: string | null = null;
    if (totalCount >= 5) label = 'Frequent collaborator';
    else if (totalCount >= 3) label = 'Recurring collaborator';
    else if (totalCount >= 1) label = memory?.firstContextType === 'cypher' ? 'Met at a cypher' : 'Previously worked together';

    return {
      projectsTogether: sharedCount,
      hasCollaborated: totalCount > 0,
      collabCount: totalCount,
      label,
      firstContextTitle: memory?.firstContextTitle ?? null,
      firstContextType: memory?.firstContextType ?? null,
      lastCollabAt: memory?.lastCollabAt ?? null,
    };
  }

  async getMyTopCollaborators(userId: string) {
    // Only respect this user's own hide flag — another user hiding doesn't affect this user's view.
    const memories = await (this.prisma as any).collaborationMemory.findMany({
      where: {
        OR: [
          { userAId: userId, isHiddenByA: false },
          { userBId: userId, isHiddenByB: false },
        ],
      },
      orderBy: [{ collabCount: 'desc' }, { lastCollabAt: 'desc' }],
      take: 10,
    });

    if (!memories.length) return [];

    const collaboratorIds = memories.map((m: any) => (m.userAId === userId ? m.userBId : m.userAId));
    const users = await this.prisma.user.findMany({
      where: { id: { in: collaboratorIds }, deletedAt: null },
      include: { profile: true },
    });

    return memories
      .map((m: any) => {
        const collaboratorId = m.userAId === userId ? m.userBId : m.userAId;
        const user = users.find((u) => u.id === collaboratorId);
        if (!user) return null;
        let label = 'Collaborated together';
        if (m.collabCount >= 5) label = 'Frequent collaborator';
        else if (m.collabCount >= 3) label = 'Recurring collaborator';
        else if (m.firstContextType === 'cypher') label = 'Met at a cypher';
        return {
          userId: collaboratorId,
          displayName: user.displayName,
          handle: user.profile?.handle ?? null,
          avatarUrl: user.profile?.avatarUrl ?? null,
          city: user.profile?.city ?? null,
          collabCount: m.collabCount,
          firstContextTitle: m.firstContextTitle ?? null,
          firstContextType: m.firstContextType ?? null,
          lastCollabAt: m.lastCollabAt,
          label,
        };
      })
      .filter(Boolean);
  }

  async getContinuationSuggestions(userId: string) {
    const suggestions: Array<{ type: string; label: string; context: string; referenceId?: string }> = [];

    const [recentCompleted, topCollabs, profile] = await Promise.all([
      this.prisma.project.findFirst({
        where: { ownerId: userId, status: 'FINISHED', deletedAt: null },
        orderBy: { completedAt: 'desc' },
        select: { id: true, title: true },
      }),
      (this.prisma as any).collaborationMemory.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
          collabCount: { gte: 2 },
        },
        orderBy: { lastCollabAt: 'desc' },
        take: 5,
      }),
      this.prisma.profile.findUnique({ where: { userId }, select: { city: true } }),
    ]);

    if (recentCompleted) {
      suggestions.push({
        type: 'start_followup',
        label: 'Continue the work',
        context: `You wrapped "${recentCompleted.title}". Start a follow-up collaboration?`,
        referenceId: recentCompleted.id,
      });
    }

    if (topCollabs.length > 0) {
      suggestions.push({
        type: 'reconnect_collaborator',
        label: 'Reconnect with your circle',
        context: `You've worked with ${topCollabs.length} creator${topCollabs.length > 1 ? 's' : ''} more than once.`,
      });
    }

    if (topCollabs.length >= 3) {
      suggestions.push({
        type: 'create_collective',
        label: 'Start a collective',
        context: `You've collaborated repeatedly with ${topCollabs.length} creators. Give your crew an identity.`,
      });
    }

    if (profile?.city) {
      const upcomingCypher = await this.prisma.cypher.findFirst({
        where: { city: { contains: profile.city, mode: 'insensitive' }, state: 'UPCOMING', deletedAt: null },
        orderBy: { startsAt: 'asc' },
        select: { id: true, title: true },
      });
      if (upcomingCypher) {
        suggestions.push({
          type: 'attend_cypher',
          label: 'Keep your momentum',
          context: `There's a cypher in ${profile.city} coming up — stay in the scene.`,
          referenceId: upcomingCypher.id,
        });
      }
    }

    return suggestions;
  }

  async hideCollaborationMemory(userId: string, otherUserId: string) {
    const [a, b] = [userId, otherUserId].sort();
    const memory = await (this.prisma as any).collaborationMemory.findUnique({
      where: { userAId_userBId: { userAId: a, userBId: b } },
    });
    if (!memory) return { hidden: false };
    const isA = memory.userAId === userId;
    await (this.prisma as any).collaborationMemory.update({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      data: isA ? { isHiddenByA: true } : { isHiddenByB: true },
    });
    return { hidden: true };
  }

  async discoverArtists(filters: ArtistDiscoveryFilters, viewerUserId?: string) {
    const viewer = await this.getViewerContext(viewerUserId);
    const limit = Math.min(filters.limit ?? 20, 50);

    const where: any = { deletedAt: null, profile: { isNot: null } };
    const profileWhere: any = {};
    if (filters.city) profileWhere.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.genre) profileWhere.genres = { has: filters.genre };
    if (filters.language) profileWhere.languages = { has: filters.language };
    if (filters.role) profileWhere.primaryRole = { contains: filters.role, mode: 'insensitive' };
    if (filters.openToCollab) profileWhere.openToCollab = true;
    if (filters.beginnerFriendly) profileWhere.beginnerFriendly = true;
    if (filters.availability) profileWhere.availabilityStatus = filters.availability;
    if (filters.localRemote) profileWhere.localRemotePreference = filters.localRemote;
    if (Object.keys(profileWhere).length > 0) {
      where.profile = { ...where.profile, ...profileWhere };
    }

    const users = await this.prisma.user.findMany({
      where,
      take: limit * 3,
      include: { profile: true },
      orderBy: { updatedAt: 'desc' },
    });

    const scored = users.map((u) => {
      const { score, matchReasons } = this.scoreArtist(u, viewer);
      return {
        id: u.id,
        displayName: u.displayName,
        isVerified: u.isVerified,
        handle: u.profile?.handle,
        city: u.profile?.city,
        state: u.profile?.state,
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
        score,
        matchReasons,
      };
    });

    const items = this.diversityBalance(scored, limit);
    return { items, total: users.length };
  }

  async discoverProjects(filters: ProjectDiscoveryFilters, viewerUserId?: string) {
    const viewer = await this.getViewerContext(viewerUserId);
    const limit = Math.min(filters.limit ?? 20, 50);

    const where: any = { deletedAt: null, visibility: { in: ['DISCOVERABLE', 'OPEN'] }, suppressedAt: null };
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.openRole) where.openRoles = { has: filters.openRole };
    if (filters.tag) where.tags = { has: filters.tag };
    if (filters.projectType) where.projectType = filters.projectType;
    if (filters.commitmentStyle) where.commitmentStyle = filters.commitmentStyle;
    if (filters.localRemote) where.localRemote = filters.localRemote;

    const projects = await this.prisma.project.findMany({
      where,
      take: limit * 3,
      orderBy: { createdAt: 'desc' },
    });

    const scored = projects.map((p) => {
      const { score, matchReasons } = this.scoreProject(p, viewer);
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        visibility: p.visibility,
        projectType: p.projectType,
        localRemote: p.localRemote,
        commitmentStyle: p.commitmentStyle,
        city: p.city,
        tags: p.tags,
        openRoles: p.openRoles,
        filledRoles: p.filledRoles,
        ownerId: p.ownerId,
        lifecycleState: (p as any).lifecycleState ?? 'ACTIVE',
        participantCap: (p as any).participantCap ?? null,
        aiDisclosureLabel: (p as any).aiDisclosureLabel ?? null,
        createdAt: p.createdAt,
        score,
        matchReasons,
      };
    });

    const balanced = this.diversityBalance(scored, limit);
    // AI saturation cap: honest disclosure is fine, but prevent discovery flooding.
    // Limit AI-disclosed items to 30% of results; trim lowest-scored first (already sorted).
    const items = this.aiSaturationCap(balanced, limit);
    return { items, total: projects.length };
  }

  async discoverOpenCollabs(filters: ProjectDiscoveryFilters, viewerUserId?: string) {
    const result = await this.discoverProjects(filters, viewerUserId);
    return {
      ...result,
      items: result.items.filter((p) => {
        const unfilled = p.openRoles.filter((r: string) => !(p.filledRoles ?? []).includes(r));
        return unfilled.length > 0;
      }),
    };
  }

  async discoverQuickOpportunities(filters: ProjectDiscoveryFilters, viewerUserId?: string) {
    const viewer = await this.getViewerContext(viewerUserId);
    const limit = Math.min(filters.limit ?? 20, 50);

    const where: any = {
      deletedAt: null,
      suppressedAt: null,
      visibility: { in: ['DISCOVERABLE', 'OPEN'] },
      commitmentStyle: { in: ['QUICK_JAM', 'ONE_NIGHT_SESSION', 'EXPERIMENTAL', 'CASUAL'] },
      projectType: { in: ['OPEN_COLLAB', 'STRUCTURED'] },
      status: { notIn: ['FINISHED', 'ARCHIVED'] },
    };
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.openRole) where.openRoles = { has: filters.openRole };

    const projects = await this.prisma.project.findMany({
      where,
      take: limit * 3,
      orderBy: { createdAt: 'desc' },
    });

    const scored = projects.map((p) => {
      const { score, matchReasons } = this.scoreProject(p, viewer);
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        projectType: p.projectType,
        commitmentStyle: p.commitmentStyle,
        city: p.city,
        tags: p.tags,
        openRoles: p.openRoles,
        filledRoles: p.filledRoles,
        ownerId: p.ownerId,
        participantCap: (p as any).participantCap ?? null,
        aiDisclosureLabel: (p as any).aiDisclosureLabel ?? null,
        createdAt: p.createdAt,
        score,
        matchReasons,
      };
    });

    const balanced = this.diversityBalance(scored, limit);
    const items = this.aiSaturationCap(balanced, limit);
    return { items, total: projects.length };
  }

  async suppressProject(projectId: string, reason: string) {
    await (this.prisma.project as any).update({
      where: { id: projectId },
      data: { suppressedAt: new Date(), suppressReason: reason },
    });
    return { suppressed: true, projectId };
  }

  async unsuppressProject(projectId: string) {
    await (this.prisma.project as any).update({
      where: { id: projectId },
      data: { suppressedAt: null, suppressReason: null },
    });
    return { unsuppressed: true, projectId };
  }
}
