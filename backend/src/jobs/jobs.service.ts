import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
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
        await this.prisma.notification.create({
          data: {
            userId: rsvp.userId,
            type: 'CYPHER_REMINDER',
            title: 'Cypher Starting Soon',
            body: `${cypher.title} starts in less than 2 hours!`,
            referenceId: cypher.id,
          },
        });
      }
      this.logger.log(`Sent reminders for cypher ${cypher.id} to ${cypher.rsvps.length} users`);
    }
  }

  @Cron('*/5 * * * *')
  async updateCypherStates() {
    const now = new Date();

    await this.prisma.cypher.updateMany({
      where: { state: 'UPCOMING', startsAt: { lte: now } },
      data: { state: 'ACTIVE' },
    });

    const afterglowTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    await this.prisma.cypher.updateMany({
      where: { state: 'ACTIVE', endsAt: { lte: afterglowTime } },
      data: { state: 'AFTERGLOW' },
    });

    const archiveTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    await this.prisma.cypher.updateMany({
      where: { state: 'AFTERGLOW', endsAt: { lte: archiveTime } },
      data: { state: 'ARCHIVED' },
    });

    const cancelTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    await this.prisma.cypher.updateMany({
      where: { state: 'UPCOMING', startsAt: { lte: cancelTime } },
      data: { state: 'CANCELLED' },
    });
  }
}
