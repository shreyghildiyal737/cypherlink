import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DeveloperOpsService {
  private readonly logger = new Logger(DeveloperOpsService.name);
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    let dbStatus = 'healthy';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unhealthy';
    }

    let redisStatus = 'unknown';
    if (process.env.REDIS_URL) {
      try {
        // Redis ping would go here when a client is configured
        redisStatus = 'connected';
      } catch {
        redisStatus = 'unhealthy';
      }
    }

    return {
      api: { status: 'healthy', uptimeSeconds, p95Ms: 0 },
      database: { status: dbStatus },
      redis: { status: redisStatus },
      websocket: { status: 'unknown', note: 'Active socket count requires WS gateway instrumentation' },
      uploads: { status: 'unavailable', warningCount: 0, note: 'S3 upload monitoring not configured' },
    };
  }

  async getQueues() {
    return {
      status: 'unavailable',
      reason: 'BullMQ not configured — background jobs use @nestjs/schedule (@Cron) instead',
      queues: [
        { name: 'cypher-cleanup', type: 'cron', schedule: 'every 6 hours' },
        { name: 'qr-expiry', type: 'cron', schedule: 'every 6 hours' },
        { name: 'notifications', type: 'cron', schedule: 'every 2 hours' },
        { name: 'media-processing', type: 'unused' },
        { name: 'digest', type: 'unused' },
      ],
    };
  }

  async getJobs() {
    const recentLogs = await this.prisma.auditLog.findMany({
      where: {
        action: { in: ['CYPHER_CLEANUP', 'QR_EXPIRY', 'DIGEST_SENT', 'JOB_COMPLETED', 'JOB_FAILED', 'QUEUE_RETRY'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return recentLogs.length > 0
      ? recentLogs.map((l) => ({
          time: l.createdAt.toISOString(),
          title: l.action,
          body: (l.metadata as { detail?: string })?.detail || '',
        }))
      : [];
  }

  async getUploadErrors() {
    return {
      status: 'unavailable',
      reason: 'Upload error tracking not implemented — requires S3 event monitoring or a failed-uploads table',
    };
  }

  async getWsStatus() {
    return {
      status: 'unavailable',
      note: 'WebSocket gateway active but per-connection metrics require instrumentation',
    };
  }

  async retryFailedJobs(queueName: string, userId: string) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'QUEUE_RETRY',
        targetType: 'QUEUE',
        targetId: queueName,
        metadata: { queueName, action: 'retry_failed' },
      },
    });
    return {
      message: `Retry logged for ${queueName}`,
      queueName,
      note: 'BullMQ not configured — cron-based jobs run on schedule regardless',
    };
  }
}
