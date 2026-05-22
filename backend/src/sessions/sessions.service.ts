import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCommunitySessionDto } from './dto/create-session.dto';
import { generateToken, hashToken } from '../common/helpers/crypto.helper';
import { parseDuration } from '../common/helpers/duration.helper';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const sessions = await this.prisma.communitySession.findMany({
      include: { _count: { select: { rsvps: true } } },
      orderBy: { startsAt: 'asc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      type: s.type,
      state: s.state,
      city: s.city,
      venue: s.venue,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      organizerId: s.organizerId,
      pullingUp: s._count.rsvps,
      createdAt: s.createdAt,
    }));
  }

  async findById(id: string) {
    const session = await this.prisma.communitySession.findUnique({
      where: { id },
      include: {
        _count: { select: { rsvps: true } },
        organizer: { include: { profile: true } },
      },
    });

    if (!session) throw new NotFoundException('Session not found');

    return {
      id: session.id,
      title: session.title,
      description: session.description,
      type: session.type,
      state: session.state,
      city: session.city,
      venue: session.venue,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      organizerId: session.organizerId,
      organizer: { displayName: session.organizer.displayName, handle: session.organizer.profile?.handle },
      pullingUp: session._count.rsvps,
      createdAt: session.createdAt,
    };
  }

  async create(dto: CreateCommunitySessionDto, userId: string) {
    const session = await this.prisma.communitySession.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        city: dto.city,
        venue: dto.venue,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        organizerId: userId,
      },
      include: { _count: { select: { rsvps: true } } },
    });

    return {
      id: session.id,
      title: session.title,
      type: session.type,
      state: session.state,
      city: session.city,
      venue: session.venue,
      startsAt: session.startsAt,
      organizerId: session.organizerId,
      pullingUp: 0,
    };
  }

  async rsvp(sessionId: string, userId: string) {
    const session = await this.prisma.communitySession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    const rsvp = await this.prisma.communitySessionRSVP.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      create: { sessionId, userId },
      update: {},
    });

    return rsvp;
  }

  async getMyCheckInToken(sessionId: string, userId: string) {
    const rsvp = await this.prisma.communitySessionRSVP.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (!rsvp) throw new ForbiddenException('You must RSVP before getting a check-in token');

    const rawToken = generateToken(32);
    const tokenHash = hashToken(rawToken);
    const ttlMs = parseDuration(process.env.ATTENDEE_CHECKIN_TTL || '24h');
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.prisma.communitySessionRSVP.update({
      where: { sessionId_userId: { sessionId, userId } },
      data: { checkInTokenHash: tokenHash, checkInTokenExpiresAt: expiresAt },
    });

    return { checkInToken: rawToken, expiresAt };
  }

  async scanCheckIn(sessionId: string, organizerId: string, data: { userId: string }) {
    const session = await this.prisma.communitySession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.organizerId !== organizerId) throw new ForbiddenException('Only organizer can scan check-ins');

    const updated = await this.prisma.communitySessionRSVP.updateMany({
      where: { sessionId, userId: data.userId, checkedInAt: null },
      data: { checkedInAt: new Date() },
    });

    return { checkedIn: updated.count > 0 };
  }
}
