import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AdminOpsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Reports ──

  async getReports(query: { page?: string; cursor?: string; status?: string; priority?: string; targetType?: string }) {
    const where: Record<string, unknown> = {};
    if (query.status) where['status'] = query.status;
    if (query.targetType) where['targetType'] = query.targetType;

    const limit = 20;
    const items = await this.prisma.report.findMany({
      where,
      include: {
        reporter: { include: { profile: true } },
        reported: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = items.length > limit;
    const pageItems = items.slice(0, limit);
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].createdAt.toISOString() : null;

    return {
      items: pageItems.map((r) => ({
        id: r.id,
        type: r.reason,
        targetType: r.targetType,
        targetId: r.targetId,
        priority: r.status === 'open' ? 'HIGH' : 'MEDIUM',
        status: r.status === 'open' ? 'NEEDS_REVIEW' : r.status,
        createdAt: r.createdAt,
        reporter: { id: r.reporterId, handle: r.reporter.profile?.handle || '' },
        reported: { id: r.reportedId, handle: r.reported.profile?.handle || '' },
        description: r.description,
      })),
      nextCursor,
      hasMore,
    };
  }

  async updateReport(reportId: string, userId: string, data: { status: string; action?: string; internalNote?: string }) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: data.status === 'NEEDS_REVIEW' ? 'open' : data.status === 'RESOLVED' ? 'resolved' : data.status === 'DISMISSED' ? 'dismissed' : 'under_review',
        resolvedAt: data.status === 'RESOLVED' || data.status === 'DISMISSED' ? new Date() : undefined,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'REPORT_UPDATE',
        targetType: 'REPORT',
        targetId: reportId,
        metadata: { status: data.status, action: data.action, internalNote: data.internalNote },
      },
    });

    return updated;
  }

  // ── Verification Requests ──

  async getVerificationRequests() {
    const requests = await this.prisma.verificationRequest.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.user.displayName,
      handle: r.user.profile?.handle,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
    }));
  }

  async updateVerificationRequest(requestId: string, userId: string, data: { status: string; internalNote?: string }) {
    const request = await this.prisma.verificationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Verification request not found');

    const updated = await this.prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status: data.status, reviewedById: userId, reviewedAt: new Date(), internalNote: data.internalNote },
    });

    if (data.status === 'APPROVED') {
      await this.prisma.user.update({ where: { id: request.userId }, data: { isVerified: true } });
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'VERIFICATION_UPDATE',
        targetType: 'VERIFICATION_REQUEST',
        targetId: requestId,
        metadata: { status: data.status, targetUserId: request.userId },
      },
    });

    return updated;
  }

  // ── Organizer Requests ──

  async getOrganizerRequests() {
    const requests = await this.prisma.organizerRequest.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.user.displayName,
      handle: r.user.profile?.handle,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
    }));
  }

  async updateOrganizerRequest(requestId: string, userId: string, data: { status: string; internalNote?: string }) {
    const request = await this.prisma.organizerRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Organizer request not found');

    const updated = await this.prisma.organizerRequest.update({
      where: { id: requestId },
      data: { status: data.status, reviewedById: userId, reviewedAt: new Date(), internalNote: data.internalNote },
    });

    if (data.status === 'APPROVED') {
      await this.prisma.user.update({ where: { id: request.userId }, data: { role: 'ORGANIZER' } });
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ORGANIZER_REQUEST_UPDATE',
        targetType: 'ORGANIZER_REQUEST',
        targetId: requestId,
        metadata: { status: data.status, targetUserId: request.userId },
      },
    });

    return updated;
  }

  // ── Audit Logs ──

  async getAuditLogs(query: { actorId?: string; targetId?: string; action?: string; cursor?: string }) {
    const where: Record<string, unknown> = {};
    if (query.actorId) where['userId'] = query.actorId;
    if (query.targetId) where['targetId'] = query.targetId;
    if (query.action) where['action'] = query.action;
    if (query.cursor) where['createdAt'] = { lt: new Date(query.cursor) };

    const limit = 50;
    const logs = await this.prisma.auditLog.findMany({
      where,
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = logs.length > limit;
    const pageItems = logs.slice(0, limit);
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].createdAt.toISOString() : null;

    return {
      items: pageItems.map((l) => ({
        id: l.id,
        actorId: l.userId,
        actorName: l.user.displayName,
        actorHandle: l.user.profile?.handle,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        metadata: l.metadata,
        createdAt: l.createdAt,
      })),
      nextCursor,
      hasMore,
    };
  }

  // ── Incidents ──

  async getIncidents() {
    const incidents = await this.prisma.incident.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return incidents.map((i) => ({
      id: i.id,
      targetType: i.targetType,
      targetId: i.targetId,
      status: i.status,
      priority: i.priority,
      summary: i.summary,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));
  }

  async updateIncident(incidentId: string, userId: string, data: { status?: string; priority?: string; summary?: string }) {
    const incident = await this.prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new NotFoundException('Incident not found');

    const updateData: Record<string, unknown> = {};
    if (data.status) updateData['status'] = data.status;
    if (data.priority) updateData['priority'] = data.priority;
    if (data.summary) updateData['summary'] = data.summary;
    if (data.status === 'RESOLVED' || data.status === 'DISMISSED') {
      updateData['resolvedAt'] = new Date();
    }

    const updated = await this.prisma.incident.update({
      where: { id: incidentId },
      data: updateData as any,
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'INCIDENT_UPDATE',
        targetType: 'INCIDENT',
        targetId: incidentId,
        metadata: { status: data.status, priority: data.priority },
      },
    });

    return updated;
  }
}
