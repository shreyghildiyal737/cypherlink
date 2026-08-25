import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCommunitySessionDto } from './dto/create-session.dto';
import { CreateLearningSessionDto } from './dto/create-learning-session.dto';
import { generateToken, hashToken } from '../common/helpers/crypto.helper';
import { parseDuration } from '../common/helpers/duration.helper';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const sessions = await this.prisma.communitySession.findMany({
      include: { _count: { select: { rsvps: true } } },
      orderBy: { startsAt: 'asc' },
      take: 200,
    });

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      type: s.type,
      state: s.state,
      city: s.city,
      venue: s.venue,
      approximateLocation: s.approximateLocation,
      freeLearning: s.freeLearning,
      topic: s.topic,
      level: s.level,
      safetyTags: s.safetyTags,
      capacity: s.capacity,
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
      approximateLocation: session.approximateLocation,
      freeLearning: session.freeLearning,
      topic: session.topic,
      level: session.level,
      safetyTags: session.safetyTags,
      capacity: session.capacity,
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
        approximateLocation: dto.approximateLocation,
        safetyTags: dto.safetyTags ?? [],
        capacity: dto.capacity,
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

  async findLearningSessions(city?: string) {
    const sessions = await this.prisma.communitySession.findMany({
      where: {
        freeLearning: true,
        state: { in: ['UPCOMING', 'ACTIVE'] },
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
      },
      include: { _count: { select: { rsvps: true } }, organizer: { include: { profile: true } } },
      orderBy: { startsAt: 'asc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      city: s.city,
      topic: s.topic,
      level: s.level,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      approximateLocation: s.approximateLocation,
      safetyTags: s.safetyTags,
      pullingUp: s._count.rsvps,
      free: true,
      host: { displayName: s.organizer.displayName, handle: s.organizer.profile?.handle },
    }));
  }

  async createLearningSession(dto: CreateLearningSessionDto, userId: string) {
    const session = await this.prisma.communitySession.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: 'TEACHING',
        freeLearning: true,
        topic: dto.topic,
        level: dto.level,
        city: dto.city,
        venue: dto.venue,
        approximateLocation: dto.approximateLocation,
        safetyTags: dto.safetyTags ?? [],
        capacity: dto.capacity,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        organizerId: userId,
      },
    });

    return { id: session.id, title: session.title, free: true };
  }

  private canManageEvent(userId: string, userRole: string, eventOrganizerId: string): boolean {
    return userRole === 'ADMIN' || eventOrganizerId === userId;
  }

  async scanCheckIn(sessionId: string, organizerId: string, token: string, userRole: string) {
    const session = await this.prisma.communitySession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (!this.canManageEvent(organizerId, userRole, session.organizerId)) {
      throw new ForbiddenException('Only the session host or an admin can scan check-ins');
    }
    if (session.state === 'ARCHIVED' || session.state === 'CANCELLED') {
      throw new BadRequestException('Session is no longer accepting check-ins');
    }

    const tokenHash = hashToken(token);
    const rsvp = await this.prisma.communitySessionRSVP.findFirst({
      where: { sessionId, checkInTokenHash: tokenHash },
      include: { user: { include: { profile: true } } },
    });

    if (!rsvp || !rsvp.checkInTokenExpiresAt || rsvp.checkInTokenExpiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired check-in token');
    }

    if (rsvp.checkedInAt) {
      return {
        checkedIn: true,
        alreadyCheckedIn: true,
        checkedInAt: rsvp.checkedInAt,
        attendee: {
          id: rsvp.user.id,
          displayName: rsvp.user.displayName,
          handle: rsvp.user.profile?.handle,
        },
      };
    }

    const checkedInAt = new Date();
    await this.prisma.communitySessionRSVP.update({
      where: { id: rsvp.id },
      data: { checkedInAt, checkInTokenHash: null, checkInTokenExpiresAt: null },
    });

    await this.prisma.notification.create({
      data: {
        userId: rsvp.userId,
        type: 'CHECKIN_CONFIRMED',
        title: 'You\'re checked in',
        body: `You pulled up to ${session.title}.`,
        referenceId: session.id,
      },
    });

    return {
      checkedIn: true,
      alreadyCheckedIn: false,
      checkedInAt,
      attendee: {
        id: rsvp.user.id,
        displayName: rsvp.user.displayName,
        handle: rsvp.user.profile?.handle,
      },
    };
  }
}
