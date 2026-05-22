import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCypherDto } from './dto/create-cypher.dto';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { hashToken, generateToken } from '../common/helpers/crypto.helper';
import { parseDuration } from '../common/helpers/duration.helper';

@Injectable()
export class CyphersService {
  constructor(private readonly prisma: PrismaService) {}

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
    const cypher = await this.prisma.cypher.findUnique({
      where: { id },
      include: {
        rsvps: true,
        highlights: true,
        _count: { select: { rsvps: true, checkIns: true } },
        organizer: { include: { profile: true } },
      },
    });

    if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');

    return this.mapCypher(cypher, userId);
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
    return this.prisma.$transaction(async (tx) => {
      const cypher = await tx.cypher.findUnique({
        where: { id: cypherId },
        include: { _count: { select: { rsvps: true } } },
      });

      if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');
      if (cypher.state === 'CANCELLED' || cypher.state === 'ARCHIVED') {
        throw new BadRequestException('This cypher is no longer accepting RSVPs');
      }

      const existing = await tx.cypherRSVP.findUnique({
        where: { cypherId_userId: { cypherId, userId } },
      });

      if (existing) {
        return { status: 'ALREADY_RSVPED', spotsLeft: cypher.quota ? Math.max(0, cypher.quota - cypher._count.rsvps) : 999, waitlistCount: 0 };
      }

      const rsvpCount = cypher._count.rsvps;
      const isFull = cypher.quota !== null && rsvpCount >= cypher.quota;

      if (isFull) {
        throw new BadRequestException('Cypher is full');
      }

      const rsvp = await tx.cypherRSVP.create({
        data: { cypherId, userId },
      });

      return {
        status: 'RSVP_CONFIRMED',
        spotsLeft: cypher.quota ? Math.max(0, cypher.quota - (rsvpCount + 1)) : 999,
        waitlistCount: 0,
      };
    });
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

  async getCheckInToken(cypherId: string, userId: string) {
    const cypher = await this.prisma.cypher.findUnique({ where: { id: cypherId } });
    if (!cypher) throw new NotFoundException('Cypher not found');
    if (cypher.organizerId !== userId) throw new ForbiddenException('Only organizer can generate check-in tokens');

    const token = generateToken(16);
    const ttlMs = parseDuration(process.env.QR_CHECKIN_TOKEN_TTL || '10m');
    return { checkInToken: token, expiresAt: new Date(Date.now() + ttlMs) };
  }

  async scanCheckIn(cypherId: string, organizerId: string, data: { userId: string }) {
    const cypher = await this.prisma.cypher.findUnique({ where: { id: cypherId } });
    if (!cypher) throw new NotFoundException('Cypher not found');
    if (cypher.organizerId !== organizerId) throw new ForbiddenException('Only organizer can scan check-ins');

    const existing = await this.prisma.cypherCheckIn.findUnique({
      where: { cypherId_userId: { cypherId, userId: data.userId } },
    });
    if (existing) {
      return { checkedIn: true, alreadyCheckedIn: true, checkedInAt: existing.checkedInAt };
    }

    const checkIn = await this.prisma.cypherCheckIn.create({
      data: { cypherId, userId: data.userId },
    });

    return { checkedIn: true, alreadyCheckedIn: false, checkedInAt: checkIn.checkedInAt };
  }

  async addHighlight(cypherId: string, dto: CreateHighlightDto, userId: string) {
    const cypher = await this.prisma.cypher.findUnique({ where: { id: cypherId } });
    if (!cypher) throw new NotFoundException('Cypher not found');
    if (cypher.organizerId !== userId) throw new ForbiddenException('Only organizer can add highlights');

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

  async getSummary(cypherId: string, userId: string) {
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
    if (cypher.organizerId !== userId) throw new ForbiddenException('Only organizer can view full summary');

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
      createdAt: cypher.createdAt,
    };
  }
}
