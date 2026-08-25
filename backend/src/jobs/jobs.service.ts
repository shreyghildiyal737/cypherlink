import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { WsGateway } from '../websocket/websocket.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly wsGateway: WsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 */6 * * *')
  async deleteExpiredCypherAssets() {
    const expired = await this.prisma.cypherAsset.findMany({
      where: { isHighlight: false, expiresAt: { lte: new Date() } },
      select: { id: true, fileKey: true },
    });

    if (!expired.length) return;

    // Delete from storage first; if this fails the DB rows remain and
    // will be retried on the next cron run.
    await this.uploadService.deleteObjects(expired.map((a) => a.fileKey));

    await this.prisma.cypherAsset.deleteMany({
      where: { id: { in: expired.map((a) => a.id) } },
    });

    this.logger.log(`Deleted ${expired.length} expired cypher assets from storage and DB`);
  }

  @Cron('0 */2 * * *')
  async sendCypherReminders() {
    const upcomingCyphers = await this.prisma.cypher.findMany({
      where: {
        state: 'UPCOMING',
        startsAt: { gte: new Date(), lte: new Date(Date.now() + 2 * 60 * 60 * 1000) },
      },
      include: { rsvps: true },
    });

    for (const cypher of upcomingCyphers) {
      for (const rsvp of cypher.rsvps) {
        await this.notificationsService.push(rsvp.userId, {
          type: 'CYPHER_REMINDER',
          title: 'Cypher Starting Soon',
          body: `${cypher.title} starts in less than 2 hours!`,
          referenceId: cypher.id,
        });
      }
      this.logger.log(`Sent reminders for cypher ${cypher.id} to ${cypher.rsvps.length} users`);
    }
  }

  @Cron('0 */3 * * *')
  async archiveExpiredOpenCollabs() {
    const expired = await this.prisma.project.findMany({
      where: {
        deletedAt: null,
        projectType: 'OPEN_COLLAB',
        status: { notIn: ['FINISHED', 'ARCHIVED'] },
        expiresAt: { lte: new Date() },
      },
      select: { id: true },
    });

    if (!expired.length) return;

    await this.prisma.project.updateMany({
      where: { id: { in: expired.map((p) => p.id) } },
      data: { status: 'ARCHIVED' },
    });

    this.logger.log(`Auto-archived ${expired.length} expired open collaborations`);
  }

  @Cron('0 * * * *')
  async updateProjectLifecycles() {
    const now = new Date();
    const openCollabSlowing = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const openCollabInactive = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const structuredSlowing = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const structuredInactive = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const pr = this.prisma.project as any;

    // Use lastMeaningfulActivityAt when available; fall back to createdAt for projects
    // that predate this field or have never had a meaningful event recorded.
    const makeActivityWhere = (threshold: Date) => ({
      OR: [
        { lastMeaningfulActivityAt: { lte: threshold } },
        { AND: [{ lastMeaningfulActivityAt: null }, { createdAt: { lte: threshold } }] },
      ],
    });

    await pr.updateMany({
      where: { deletedAt: null, projectType: 'OPEN_COLLAB', status: { notIn: ['FINISHED', 'ARCHIVED'] }, lifecycleState: 'ACTIVE', ...makeActivityWhere(openCollabSlowing) },
      data: { lifecycleState: 'SLOWING_DOWN' },
    });
    await pr.updateMany({
      where: { deletedAt: null, projectType: 'OPEN_COLLAB', status: { notIn: ['FINISHED', 'ARCHIVED'] }, lifecycleState: { in: ['ACTIVE', 'SLOWING_DOWN'] }, ...makeActivityWhere(openCollabInactive) },
      data: { lifecycleState: 'INACTIVE' },
    });
    await pr.updateMany({
      where: { deletedAt: null, projectType: 'STRUCTURED', status: { notIn: ['FINISHED', 'ARCHIVED'] }, lifecycleState: 'ACTIVE', ...makeActivityWhere(structuredSlowing) },
      data: { lifecycleState: 'SLOWING_DOWN' },
    });
    await pr.updateMany({
      where: { deletedAt: null, projectType: 'STRUCTURED', status: { notIn: ['FINISHED', 'ARCHIVED'] }, lifecycleState: { in: ['ACTIVE', 'SLOWING_DOWN'] }, ...makeActivityWhere(structuredInactive) },
      data: { lifecycleState: 'INACTIVE' },
    });
    await pr.updateMany({
      where: { deletedAt: null, status: 'FINISHED', lifecycleState: { not: 'COMPLETED' } },
      data: { lifecycleState: 'COMPLETED' },
    });
    await pr.updateMany({
      where: { deletedAt: null, status: 'ARCHIVED', lifecycleState: { not: 'ARCHIVED' } },
      data: { lifecycleState: 'ARCHIVED' },
    });

    this.logger.log('Updated project lifecycle states');
  }

  @Cron('0 2 * * *')
  async buildCollaborationMemory() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const cm = (this.prisma as any).collaborationMemory;

    const recentlyFinished = await this.prisma.project.findMany({
      where: { status: 'FINISHED', completedAt: { gte: since }, deletedAt: null },
      include: { members: { where: { status: { in: ['ACTIVE', 'COMPLETED_CONTRIBUTION'] } } } },
    });

    for (const project of recentlyFinished) {
      const memberIds = [...new Set([project.ownerId, ...project.members.map((m: any) => m.userId)])];
      for (let i = 0; i < memberIds.length; i++) {
        for (let j = i + 1; j < memberIds.length; j++) {
          const [a, b] = [memberIds[i], memberIds[j]].sort();
          await cm.upsert({
            where: { userAId_userBId: { userAId: a, userBId: b } },
            create: {
              userAId: a, userBId: b, collabCount: 1,
              firstContextType: 'project',
              firstContextId: project.id,
              firstContextTitle: project.title,
              lastCollabAt: project.completedAt ?? new Date(),
            },
            update: { collabCount: { increment: 1 }, lastCollabAt: project.completedAt ?? new Date() },
          });
        }
      }
    }

    // Also build from recent cypher check-in pairs
    const recentArchived = await this.prisma.cypher.findMany({
      where: { state: { in: ['AFTERGLOW', 'ARCHIVED'] }, updatedAt: { gte: since }, deletedAt: null },
      include: { checkIns: { select: { userId: true } } },
    });

    for (const cypher of recentArchived) {
      const attendeeIds = [...new Set(cypher.checkIns.map((c: any) => c.userId))];
      if (attendeeIds.length < 2) continue;
      for (let i = 0; i < attendeeIds.length; i++) {
        for (let j = i + 1; j < attendeeIds.length; j++) {
          const [a, b] = [attendeeIds[i], attendeeIds[j]].sort();
          await cm.upsert({
            where: { userAId_userBId: { userAId: a, userBId: b } },
            create: {
              userAId: a, userBId: b, collabCount: 1,
              firstContextType: 'cypher',
              firstContextId: cypher.id,
              firstContextTitle: cypher.title,
              lastCollabAt: cypher.updatedAt,
            },
            update: { lastCollabAt: cypher.updatedAt },
          });
        }
      }
    }

    this.logger.log(`Built collaboration memory from ${recentlyFinished.length} projects and ${recentArchived.length} cyphers`);
  }

  @Cron('*/5 * * * *')
  async updateCypherStates() {
    const now = new Date();
    const cancelTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    // AFTERGLOW begins as soon as the event ends (endsAt <= now).
    // ARCHIVED after 24 h in AFTERGLOW (endsAt <= now - 24 h).
    const archiveTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Cancel UPCOMING cyphers that never started (no check-ins after 24h past start).
    // Must run BEFORE the UPCOMING→ACTIVE rule, otherwise stale UPCOMINGs are promoted
    // to ACTIVE first and never get a chance to be cancelled.
    const staleUpcoming = await this.prisma.cypher.findMany({
      where: { state: 'UPCOMING', startsAt: { lte: cancelTime } },
      select: { id: true, _count: { select: { checkIns: true } } },
    });
    const toCancel = staleUpcoming.filter((c) => c._count.checkIns === 0).map((c) => c.id);
    if (toCancel.length) {
      await this.prisma.cypher.updateMany({
        where: { id: { in: toCancel } },
        data: { state: 'CANCELLED' },
      });
    }

    const toActivate = await this.prisma.cypher.findMany({
      where: { state: 'UPCOMING', startsAt: { lte: now } },
      select: { id: true },
    });
    if (toActivate.length) {
      await this.prisma.cypher.updateMany({
        where: { id: { in: toActivate.map((c) => c.id) } },
        data: { state: 'ACTIVE' },
      });
      for (const c of toActivate) {
        this.wsGateway.sendToCypher(c.id, 'cypher:state_changed', { cypherId: c.id, state: 'active' });
      }
    }

    const toAfterglow = await this.prisma.cypher.findMany({
      where: { state: 'ACTIVE', endsAt: { lte: now } },
      select: { id: true },
    });
    if (toAfterglow.length) {
      await this.prisma.cypher.updateMany({
        where: { id: { in: toAfterglow.map((c) => c.id) } },
        data: { state: 'AFTERGLOW' },
      });
      for (const c of toAfterglow) {
        this.wsGateway.sendToCypher(c.id, 'cypher:state_changed', { cypherId: c.id, state: 'afterglow' });
      }
    }

    await this.prisma.cypher.updateMany({
      where: { state: 'AFTERGLOW', endsAt: { lte: archiveTime } },
      data: { state: 'ARCHIVED' },
    });
  }
}
