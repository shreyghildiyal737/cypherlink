import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { hashToken } from '../common/helpers/crypto.helper';

@Injectable()
export class OrganizerOpsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const now = new Date();

    const activeCyphers = await this.prisma.cypher.findMany({
      where: { organizerId: userId, deletedAt: null, state: { not: 'ARCHIVED' } },
      include: { _count: { select: { rsvps: true, checkIns: true } } },
      orderBy: { startsAt: 'desc' },
      take: 10,
    });

    const activeSessions = await this.prisma.communitySession.findMany({
      where: { organizerId: userId, state: { not: 'ARCHIVED' } },
      include: { _count: { select: { rsvps: true } } },
      orderBy: { startsAt: 'desc' },
      take: 10,
    });

    const totalRsvps = activeCyphers.reduce((s, c) => s + c._count.rsvps, 0) + activeSessions.reduce((s, c) => s + c._count.rsvps, 0);
    const totalCheckIns = activeCyphers.reduce((s, c) => s + c._count.checkIns, 0);

    const recentCypherEvents = await this.prisma.auditLog.findMany({
      where: { userId, targetType: 'CYPHER', createdAt: { gte: new Date(now.getTime() - 86400000) } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      stats: [
        { label: 'Pulling up', value: String(totalRsvps), helper: 'RSVPs for your events' },
        { label: 'Checked in', value: String(totalCheckIns), helper: 'Optional scans saved' },
        { label: 'Active events', value: String(activeCyphers.length + activeSessions.length), helper: 'Cyphers & sessions' },
        { label: 'Highlights', value: '0', helper: 'Chosen to survive' },
      ],
      activeCyphers: activeCyphers.map((c) => ({
        id: c.id,
        title: c.title,
        state: c.state,
        startsAt: c.startsAt,
        rsvpCount: c._count.rsvps,
        checkedInCount: c._count.checkIns,
      })),
      activeCommunitySessions: activeSessions.map((s) => ({
        id: s.id,
        title: s.title,
        state: s.state,
        startsAt: s.startsAt,
        rsvpCount: s._count.rsvps,
      })),
      timeline: recentCypherEvents.map((e) => ({
        time: e.createdAt.toISOString(),
        title: e.action,
        body: (e.metadata as { detail?: string })?.detail || '',
      })),
    };
  }

  async getCypherSummary(cypherId: string, userId: string) {
    const cypher = await this.prisma.cypher.findUnique({
      where: { id: cypherId },
      include: {
        rsvps: { include: { user: { include: { profile: true } } } },
        checkIns: { include: { user: { include: { profile: true } } } },
        highlights: true,
        assets: { where: { isHighlight: true } },
        _count: { select: { rsvps: true, checkIns: true } },
      },
    });
    if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');
    if (cypher.organizerId !== userId) throw new ForbiddenException('Only organizer can view summary');

    const safetyNotes = await this.prisma.safetyNote.findMany({
      where: { targetType: 'CYPHER', targetId: cypherId },
      orderBy: { createdAt: 'desc' },
    });

    const timeline = await this.prisma.auditLog.findMany({
      where: { targetType: 'CYPHER', targetId: cypherId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      cypherId: cypher.id,
      title: cypher.title,
      type: cypher.type,
      state: cypher.state,
      startsAt: cypher.startsAt,
      endsAt: cypher.endsAt,
      rsvpCount: cypher._count.rsvps,
      checkedInCount: cypher._count.checkIns,
      waitlistCount: 0,
      highlightCount: cypher.highlights.length,
      reportCount: 0,
      safetyNotes: safetyNotes.map((n) => ({ id: n.id, note: n.note, severity: n.severity, createdAt: n.createdAt })),
      timeline: timeline.map((e) => ({
        time: e.createdAt.toISOString(),
        action: e.action,
        metadata: e.metadata,
      })),
      rsvpUsers: cypher.rsvps.map((r) => ({
        id: r.userId,
        displayName: r.user.displayName,
        handle: r.user.profile?.handle,
      })),
      checkedInUsers: cypher.checkIns.map((ci) => ({
        id: ci.userId,
        displayName: ci.user.displayName,
        handle: ci.user.profile?.handle,
        checkedInAt: ci.checkedInAt,
      })),
      highlights: cypher.highlights,
    };
  }

  async scanCheckIn(cypherId: string, organizerId: string, qrToken: string) {
    const cypher = await this.prisma.cypher.findUnique({ where: { id: cypherId } });
    if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');
    if (cypher.organizerId !== organizerId) throw new ForbiddenException('Only organizer can scan check-ins');

    const tokenHash = hashToken(qrToken);

    // Look up the RSVP that holds this token hash
    const rsvp = await this.prisma.cypherRSVP.findFirst({
      where: { cypherId, checkInTokenHash: tokenHash },
      include: { user: { include: { profile: true } } },
    });

    if (!rsvp) throw new BadRequestException('QR code not recognised — token invalid or not yet generated');

    if (rsvp.checkInTokenExpiresAt && rsvp.checkInTokenExpiresAt < new Date()) {
      throw new BadRequestException('QR code has expired — attendee must regenerate their token');
    }

    // Return early if already checked in
    const existing = await this.prisma.cypherCheckIn.findUnique({
      where: { cypherId_userId: { cypherId, userId: rsvp.userId } },
    });
    if (existing) {
      return {
        checkedIn: true,
        alreadyCheckedIn: true,
        user: { id: rsvp.userId, name: rsvp.user.displayName, handle: rsvp.user.profile?.handle || '' },
        checkedInAt: existing.checkedInAt,
      };
    }

    const checkIn = await this.prisma.cypherCheckIn.create({
      data: { cypherId, userId: rsvp.userId, tokenHash },
    });

    return {
      checkedIn: true,
      alreadyCheckedIn: false,
      user: { id: rsvp.userId, name: rsvp.user.displayName, handle: rsvp.user.profile?.handle || '' },
      checkedInAt: checkIn.checkedInAt,
    };
  }

  async addHighlight(cypherId: string, userId: string, data: { assetId: string; title: string; caption?: string; visibility?: string }) {
    const cypher = await this.prisma.cypher.findUnique({ where: { id: cypherId } });
    if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');
    if (cypher.organizerId !== userId) throw new ForbiddenException('Only organizer can add highlights');

    const asset = await this.prisma.cypherAsset.findUnique({ where: { id: data.assetId } });
    if (!asset) throw new NotFoundException('Asset not found');

    if (asset.expiresAt && asset.expiresAt < new Date()) {
      throw new BadRequestException('Asset has expired');
    }

    const highlight = await this.prisma.cypherHighlight.create({
      data: {
        cypherId,
        title: data.title,
        description: data.caption,
        mediaUrl: asset.publicUrl || asset.fileKey,
        mediaType: asset.mimeType,
        selectedBy: userId,
      },
    });

    await this.prisma.cypherAsset.update({
      where: { id: data.assetId },
      data: { isHighlight: true },
    });

    await this.prisma.organizerSummary.upsert({
      where: { userId },
      update: { totalHighlights: { increment: 1 } },
      create: { userId, totalHighlights: 1 },
    });

    return highlight;
  }

  async addSafetyNote(cypherId: string, userId: string, data: { note: string; severity?: string }) {
    const cypher = await this.prisma.cypher.findUnique({ where: { id: cypherId } });
    if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');
    if (cypher.organizerId !== userId) throw new ForbiddenException('Only organizer can add safety notes');

    const note = await this.prisma.safetyNote.create({
      data: { targetType: 'CYPHER', targetId: cypherId, organizerId: userId, note: data.note, severity: data.severity || 'LOW' },
    });
    return note;
  }

  // ── Community Session equivalents ──

  async getSessionSummary(sessionId: string, userId: string) {
    const session = await this.prisma.communitySession.findUnique({
      where: { id: sessionId },
      include: {
        rsvps: { include: { user: { include: { profile: true } } } },
        _count: { select: { rsvps: true } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.organizerId !== userId) throw new ForbiddenException('Only organizer can view summary');

    const safetyNotes = await this.prisma.safetyNote.findMany({
      where: { targetType: 'SESSION', targetId: sessionId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      sessionId: session.id,
      title: session.title,
      type: session.type,
      state: session.state,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      rsvpCount: session._count.rsvps,
      safetyNotes: safetyNotes.map((n) => ({ id: n.id, note: n.note, severity: n.severity, createdAt: n.createdAt })),
      rsvpUsers: session.rsvps.map((r) => ({
        id: r.userId,
        displayName: r.user.displayName,
        handle: r.user.profile?.handle,
      })),
    };
  }

  async scanSessionCheckIn(sessionId: string, organizerId: string, qrToken: string) {
    const session = await this.prisma.communitySession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.organizerId !== organizerId) throw new ForbiddenException('Only organizer can scan check-ins');

    const tokenHash = hashToken(qrToken);

    // Look up the RSVP that holds this token hash
    const rsvp = await this.prisma.communitySessionRSVP.findFirst({
      where: { sessionId, checkInTokenHash: tokenHash },
      include: { user: { include: { profile: true } } },
    });

    if (!rsvp) throw new BadRequestException('QR code not recognised — token invalid or not yet generated');

    if (rsvp.checkInTokenExpiresAt && rsvp.checkInTokenExpiresAt < new Date()) {
      throw new BadRequestException('QR code has expired — attendee must regenerate their token');
    }

    // Return early if already checked in
    if (rsvp.checkedInAt) {
      return {
        checkedIn: true,
        alreadyCheckedIn: true,
        user: { id: rsvp.userId, name: rsvp.user.displayName, handle: rsvp.user.profile?.handle || '' },
        checkedInAt: rsvp.checkedInAt,
      };
    }

    const updated = await this.prisma.communitySessionRSVP.update({
      where: { id: rsvp.id },
      data: { checkedInAt: new Date() },
    });

    return {
      checkedIn: true,
      alreadyCheckedIn: false,
      user: { id: rsvp.userId, name: rsvp.user.displayName, handle: rsvp.user.profile?.handle || '' },
      checkedInAt: updated.checkedInAt,
    };
  }

  async addSessionSafetyNote(sessionId: string, userId: string, data: { note: string; severity?: string }) {
    const session = await this.prisma.communitySession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.organizerId !== userId) throw new ForbiddenException('Only organizer can add safety notes');

    const note = await this.prisma.safetyNote.create({
      data: { targetType: 'SESSION', targetId: sessionId, organizerId: userId, note: data.note, severity: data.severity || 'LOW' },
    });
    return note;
  }
}
