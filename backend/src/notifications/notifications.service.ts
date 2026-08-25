import { Injectable, Optional } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { WsGateway } from '../websocket/websocket.gateway';
import { PushService } from '../push/push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: WsGateway,
    @Optional() private readonly pushService: PushService,
  ) {}

  async push(userId: string, data: {
    type: NotificationType;
    title: string;
    body: string;
    referenceId?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: { userId, ...data },
    });
    this.wsGateway.sendToUser(userId, 'notification:new', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      referenceId: notification.referenceId ?? null,
      readAt: null,
      createdAt: notification.createdAt,
    });
    this.pushService?.sendToUser(userId, {
      title: notification.title,
      body: notification.body,
    });
    return notification;
  }

  async findAll(userId: string, cursor?: string, limit = 20) {
    const where: Record<string, unknown> = { userId };
    if (cursor) {
      where['createdAt'] = { lt: new Date(cursor) };
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = notifications.length > limit;
    const items = notifications.slice(0, limit);
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return {
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        referenceId: n.referenceId,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      nextCursor,
      hasMore,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) return null;

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }
}
