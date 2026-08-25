import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { WsGateway } from '../websocket/websocket.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCypherDto } from './dto/create-cypher.dto';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { hashToken, generateToken } from '../common/helpers/crypto.helper';
import { parseDuration } from '../common/helpers/duration.helper';

@Injectable()
export class CyphersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: WsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(userId?: string) {
    const cyphers = await this.prisma.cypher.findMany({
      where: { deletedAt: null },
      include: {
        rsvps: true,
        highlights: true,
        _count: { select: { rsvps: true, checkIns: true } },
      },
      orderBy: { startsAt: 'asc' },
    });

    return cyphers.map((c) => this.mapCypher(c, userId));
  }

  async findById(id: string, userId?: string) {
    // Use `as any` on the include options so the Prisma type system accepts
    // intentNote / aliasName fields added in Phase 4 before the migration runs.
    const cypher = await (this.prisma.cypher.findUnique as any)({
      where: { id },
      include: {
        rsvps: { select: { userId: true, intentNote: true, aliasName: true } },
        highlights: true,
        _count: { select: { rsvps: true, checkIns: true } },
        organizer: { include: { profile: true } },
      },
    }) as any;

    if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');

    // Compute memory trail for afterglow/archived states
    let memoryTrail: any = undefined;
    if (cypher.state === 'AFTERGLOW' || cypher.state === 'ARCHIVED') {
      const [clipsCount, projectsStartedAfter] = await Promise.all([
        this.prisma.clip.count({ where: { cypherId: id } }),
        (this.prisma.project.count as any)({ where: { bornFromCypherId: id, deletedAt: null } }),
      ]);
      memoryTrail = {
        clipsCount,
        preservedHighlights: (cypher.highlights ?? []).length,
        projectsStartedAfter,
      };
    }

    // Surface RSVP intents for upcoming/active states
    const rsvpIntents = (cypher.state === 'UPCOMING' || cypher.state === 'ACTIVE')
      ? ((cypher.rsvps ?? []) as any[])
          .filter((r: any) => r.intentNote)
          .slice(0, 10)
          .map((r: any) => ({
            userId: r.userId,
            intentNote: r.intentNote,
            aliasName: r.aliasName ?? null,
          }))
      : undefined;

    return {
      ...this.mapCypher(cypher, userId),
      memoryTrail,
      rsvpIntents,
    };
  }

  async create(dto: CreateCypherDto, userId: string) {
    const cypher = await this.prisma.cypher.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        city: dto.city,
        venue: dto.venue,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        quota: dto.quota || null,
        safetyTags: dto.safetyTags || [],
        organizerId: userId,
      },
      include: {
        rsvps: true,
        highlights: true,
        _count: { select: { rsvps: true, checkIns: true } },
      },
    });

    return this.mapCypher(cypher, userId);
  }

  async rsvp(cypherId: string, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Row-level lock on the cypher row prevents two concurrent RSVPs
      // from racing past the quota check.
      const locked = await tx.$queryRaw<
        { id: string; quota: number | null; state: string; deletedAt: Date | null }[]
      >(Prisma.sql`SELECT id, quota, state, "deletedAt" FROM "Cypher" WHERE id = ${cypherId} FOR UPDATE`);

      const cypher = locked[0];
      if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');
      if (cypher.state === 'CANCELLED' || cypher.state === 'ARCHIVED') {
        throw new BadRequestException('This cypher is no longer accepting RSVPs');
      }

      const existing = await tx.cypherRSVP.findUnique({
        where: { cypherId_userId: { cypherId, userId } },
      });

      const rsvpCount = await tx.cypherRSVP.count({ where: { cypherId } });

      if (existing) {
        return {
          status: 'ALREADY_RSVPED',
          spotsLeft: cypher.quota ? Math.max(0, cypher.quota - rsvpCount) : 999,
          waitlistCount: 0,
        };
      }

      const isFull = cypher.quota !== null && rsvpCount >= cypher.quota;
      if (isFull) {
        throw new BadRequestException('Cypher is full');
      }

      await tx.cypherRSVP.create({ data: { cypherId, userId } });

      return {
        status: 'RSVP_CONFIRMED',
        pullingUp: rsvpCount + 1,
        spotsLeft: cypher.quota ? Math.max(0, cypher.quota - (rsvpCount + 1)) : 999,
        waitlistCount: 0,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });

    if (result.status === 'RSVP_CONFIRMED') {
      this.wsGateway.sendToCypher(cypherId, 'cypher:rsvp_updated', {
        cypherId,
        pullingUp: result.pullingUp,
        spotsLeft: result.spotsLeft,
      });
    }

    return result;
  }

  async addToWaitlist(cypherId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cypher = await tx.cypher.findUnique({
        where: { id: cypherId },
        include: { _count: { select: { rsvps: true } } },
      });

      if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');

      const existing = await tx.cypherRSVP.findUnique({
        where: { cypherId_userId: { cypherId, userId } },
      });
      if (existing) throw new ConflictException('Already RSVPed');

      if (!cypher.quota) throw new BadRequestException('Open cypher has no waitlist');

      const rsvpCount = cypher._count.rsvps;
      if (rsvpCount < cypher.quota) throw new BadRequestException('Spots available, RSVP instead');

      return { message: 'Added to waitlist', cypherId, waitlistCount: 0 };
    });
  }

  async getMyCheckInToken(cypherId: string, userId: string) {
    const rsvp = await this.prisma.cypherRSVP.findUnique({
      where: { cypherId_userId: { cypherId, userId } },
    });
    if (!rsvp) throw new ForbiddenException('You must RSVP before getting a check-in token');

    const rawToken = generateToken(32);
    const tokenHash = hashToken(rawToken);
    const ttlMs = parseDuration(process.env.ATTENDEE_CHECKIN_TTL || '24h');
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.prisma.cypherRSVP.update({
      where: { cypherId_userId: { cypherId, userId } },
      data: { checkInTokenHash: tokenHash, checkInTokenExpiresAt: expiresAt },
    });

    return { checkInToken: rawToken, expiresAt };
  }

  private canManageEvent(userId: string, userRole: string, eventOrganizerId: string): boolean {
    return userRole === 'ADMIN' || eventOrganizerId === userId;
  }

  async scanCheckIn(cypherId: string, organizerId: string, token: string, userRole: string) {
    const cypher = await this.prisma.cypher.findUnique({ where: { id: cypherId } });
    if (!cypher) throw new NotFoundException('Cypher not found');
    if (!this.canManageEvent(organizerId, userRole, cypher.organizerId)) {
      throw new ForbiddenException('Only the event host or an admin can scan check-ins');
    }
    if (cypher.state === 'ARCHIVED' || cypher.state === 'CANCELLED') {
      throw new BadRequestException('Cypher is no longer accepting check-ins');
    }

    const tokenHash = hashToken(token);
    const rsvp = await this.prisma.cypherRSVP.findFirst({
      where: { cypherId, checkInTokenHash: tokenHash },
      include: { user: { include: { profile: true } } },
    });

    if (!rsvp || !rsvp.checkInTokenExpiresAt || rsvp.checkInTokenExpiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired check-in token');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.cypherCheckIn.findUnique({
        where: { cypherId_userId: { cypherId, userId: rsvp.userId } },
      });

      if (existing) {
        return {
          checkedIn: true,
          alreadyCheckedIn: true,
          checkedInAt: existing.checkedInAt,
          attendee: {
            id: rsvp.user.id,
            displayName: rsvp.user.displayName,
            handle: rsvp.user.profile?.handle,
          },
        };
      }

      const checkIn = await tx.cypherCheckIn.create({
        data: { cypherId, userId: rsvp.userId, tokenHash },
      });

      // Burn the token so it cannot be reused
      await tx.cypherRSVP.update({
        where: { id: rsvp.id },
        data: { checkInTokenHash: null, checkInTokenExpiresAt: null },
      });

      return {
        checkedIn: true,
        alreadyCheckedIn: false,
        checkedInAt: checkIn.checkedInAt,
        attendee: {
          id: rsvp.user.id,
          displayName: rsvp.user.displayName,
          handle: rsvp.user.profile?.handle,
        },
      };
    });

    if (!result.alreadyCheckedIn) {
      await this.notificationsService.push(rsvp.userId, {
        type: 'CHECKIN_CONFIRMED',
        title: "You're checked in",
        body: `You pulled up to ${cypher.title}.`,
        referenceId: cypher.id,
      });
      this.wsGateway.sendToCypher(cypherId, 'cypher:checkin_confirmed', {
        cypherId,
        attendeeId: result.attendee.id,
        displayName: result.attendee.displayName,
      });
    }

    return result;
  }

  async addHighlight(cypherId: string, dto: CreateHighlightDto, userId: string, userRole: string) {
    const cypher = await this.prisma.cypher.findUnique({ where: { id: cypherId } });
    if (!cypher) throw new NotFoundException('Cypher not found');
    if (!this.canManageEvent(userId, userRole, cypher.organizerId)) {
      throw new ForbiddenException('Only the event host or an admin can add highlights');
    }

    const highlight = await this.prisma.cypherHighlight.create({
      data: {
        cypherId,
        title: dto.title,
        description: dto.description,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        selectedBy: userId,
      },
    });

    await this.prisma.organizerSummary.upsert({
      where: { userId },
      update: { totalHighlights: { increment: 1 } },
      create: { userId, totalHighlights: 1 },
    });

    // Mark the source asset so it survives cleanup
    if (dto.mediaUrl) {
      await this.prisma.cypherAsset.updateMany({
        where: { publicUrl: dto.mediaUrl, cypherId },
        data: { isHighlight: true },
      });
    }

    return highlight;
  }

  async getSummary(cypherId: string, userId: string, userRole: string) {
    const cypher = await this.prisma.cypher.findUnique({
      where: { id: cypherId },
      include: {
        rsvps: { include: { user: { include: { profile: true } } } },
        checkIns: { include: { user: { include: { profile: true } } } },
        highlights: true,
        _count: { select: { rsvps: true, checkIns: true } },
      },
    });

    if (!cypher) throw new NotFoundException('Cypher not found');
    if (!this.canManageEvent(userId, userRole, cypher.organizerId)) {
      throw new ForbiddenException('Only the event host or an admin can view the full summary');
    }

    return {
      totalRsvps: cypher._count.rsvps,
      totalCheckIns: cypher._count.checkIns,
      checkedInUsers: cypher.checkIns.map((ci) => ({
        id: ci.userId,
        displayName: ci.user.displayName,
        handle: ci.user.profile?.handle,
        checkedInAt: ci.checkedInAt,
      })),
      rsvpUsers: cypher.rsvps.map((r) => ({
        id: r.userId,
        displayName: r.user.displayName,
        handle: r.user.profile?.handle,
      })),
      highlights: cypher.highlights,
    };
  }

  async setRsvpIntent(cypherId: string, userId: string, intentNote: string, aliasName?: string) {
    const rsvp = await this.prisma.cypherRSVP.findUnique({
      where: { cypherId_userId: { cypherId, userId } },
    });
    if (!rsvp) throw new ForbiddenException('You must RSVP before setting an intent');

    return (this.prisma.cypherRSVP.update as any)({
      where: { cypherId_userId: { cypherId, userId } },
      data: { intentNote: intentNote || null, aliasName: aliasName || null },
      select: { id: true, intentNote: true, aliasName: true },
    });
  }

  async getParticipants(cypherId: string, requesterId: string, userRole: string) {
    const cypher = await this.prisma.cypher.findUnique({ where: { id: cypherId } });
    if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');

    const isOrganizer = this.canManageEvent(requesterId, userRole, cypher.organizerId);

    const checkIns = await this.prisma.cypherCheckIn.findMany({
      where: { cypherId },
      include: { user: { include: { profile: true } } },
      orderBy: { checkedInAt: 'asc' },
    });

    const rsvps: any[] = await (this.prisma.cypherRSVP.findMany as any)({
      where: { cypherId },
      select: { userId: true, intentNote: true, aliasName: true },
    });
    const rsvpMap = new Map(rsvps.map((r: any) => [r.userId, r]));

    return checkIns.map((ci) => {
      const rsvp: any = rsvpMap.get(ci.userId);
      const displayName = rsvp?.aliasName ?? ci.user.displayName;
      const handle = rsvp?.aliasName ? null : (ci.user as any).profile?.handle;

      const userCity = (ci.user as any).profile?.city ?? null;
      if (isOrganizer) {
        return {
          id: ci.userId,
          displayName,
          handle,
          city: userCity,
          intentNote: rsvp?.intentNote ?? null,
          checkedInAt: ci.checkedInAt,
          isAnonymous: !!rsvp?.aliasName,
        };
      }
      // Public afterglow view: first name only, no handle
      return {
        id: ci.userId,
        displayName: displayName.split(' ')[0] ?? displayName,
        handle: null,
        city: userCity,
        intentNote: rsvp?.intentNote ?? null,
        checkedInAt: ci.checkedInAt,
        isAnonymous: !!rsvp?.aliasName,
      };
    });
  }

  async getContinuation(cypherId: string) {
    const cypher = await this.prisma.cypher.findUnique({
      where: { id: cypherId },
      include: { _count: { select: { checkIns: true, highlights: true } } },
    });
    if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');

    const [bornProjects, clipsCount, rsvpIntents] = await Promise.all([
      (this.prisma.project.findMany as any)({
        where: { bornFromCypherId: cypherId, deletedAt: null },
        select: {
          id: true,
          title: true,
          status: true,
          openRoles: true,
          visibility: true,
          ownerId: true,
          owner: { select: { displayName: true, profile: { select: { handle: true } } } },
        },
      }),
      this.prisma.clip.count({ where: { cypherId } }),
      (this.prisma.cypherRSVP.findMany as any)({
        where: { cypherId, intentNote: { not: null } },
        select: { userId: true, intentNote: true, aliasName: true, user: { select: { displayName: true } } },
      }),
    ]) as [any[], number, any[]];

    return {
      cypherId,
      checkInsCount: (cypher as any)._count.checkIns,
      highlightsCount: (cypher as any)._count.highlights,
      clipsCount,
      bornProjects,
      intentCount: rsvpIntents.length,
      intentSnippets: rsvpIntents.slice(0, 5).map((r: any) => ({
        name: r.aliasName ?? (r.user?.displayName?.split(' ')[0] || 'Someone'),
        intent: r.intentNote,
      })),
    };
  }

  async createProjectFromCypher(
    cypherId: string,
    dto: { title: string; description?: string; openRoles?: string[]; tags?: string[] },
    userId: string,
  ) {
    const cypher = await this.prisma.cypher.findUnique({ where: { id: cypherId } });
    if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');

    const attended = await this.prisma.cypherRSVP.findUnique({
      where: { cypherId_userId: { cypherId, userId } },
    });
    if (!attended) throw new ForbiddenException('You must have RSVPed to this cypher to start a project from it');

    const project = await (this.prisma.project.create as any)({
      data: {
        title: dto.title,
        description: dto.description,
        openRoles: dto.openRoles ?? [],
        tags: dto.tags ?? [],
        filledRoles: [],
        projectType: 'OPEN_COLLAB',
        visibility: 'OPEN',
        localRemote: 'BOTH',
        bornFromCypherId: cypherId,
        city: cypher.city,
        ownerId: userId,
        members: {
          create: { userId, role: 'owner' },
        },
      },
    }) as any;

    if (cypher.organizerId !== userId) {
      await this.notificationsService.push(cypher.organizerId, {
        type: 'CYPHER_FOLLOWUP' as any,
        title: 'Project born from your cypher',
        body: `"${dto.title}" was started from ${cypher.title}.`,
        referenceId: project.id,
      });
    }

    return { id: project.id, title: project.title, bornFromCypherId: cypherId };
  }

  async removeAttendee(cypherId: string, attendeeUserId: string, organizerId: string, userRole: string) {
    const cypher = await this.prisma.cypher.findUnique({ where: { id: cypherId } });
    if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');
    if (!this.canManageEvent(organizerId, userRole, cypher.organizerId)) {
      throw new ForbiddenException('Only the organizer or admin can remove attendees');
    }

    await this.prisma.cypherCheckIn.deleteMany({
      where: { cypherId, userId: attendeeUserId },
    });

    await this.prisma.safetyNote.create({
      data: {
        targetType: 'CYPHER',
        targetId: cypherId,
        organizerId,
        note: `Attendee ${attendeeUserId} removed from check-in record`,
        severity: 'LOW',
      },
    });

    return { removed: true, attendeeUserId };
  }

  private mapCypher(cypher: any, userId?: string) {
    const pullingUp = cypher._count?.rsvps || cypher.rsvps?.length || 0;
    const quota = cypher.quota;
    const spotsLeft = quota ? Math.max(0, quota - pullingUp) : 999;
    const isUserRsvped = userId ? cypher.rsvps?.some((r: any) => r.userId === userId) || false : false;

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
      pullingUp,
      spotsLeft,
      waitlistCount: 0,
      safetyTags: cypher.safetyTags,
      isUserRsvped,
      highlights: cypher.highlights || [],
      organizerId: cypher.organizerId,
      organizer: cypher.organizer
        ? { displayName: cypher.organizer.displayName, handle: cypher.organizer.profile?.handle }
        : undefined,
      createdAt: cypher.createdAt,
    };
  }
}
