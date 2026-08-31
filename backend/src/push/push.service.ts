import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as webpush from 'web-push';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private configured = false;

  constructor(private readonly prisma: PrismaService) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL || 'admin@cypherlink.in';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
      this.configured = true;
    } else {
      this.logger.warn('VAPID keys not set — push disabled. Run: npx web-push generate-vapid-keys');
    }
  }

  getPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY ?? null;
  }

  async saveSubscription(userId: string, endpoint: string, p256dh: string, auth: string) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth },
      update: { userId },
    });
  }

  // Scoped to the owner: deleting by endpoint alone let any authenticated user
  // remove another user's subscription if they learned the endpoint URL.
  async deleteSubscription(endpoint: string, userId: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
  }

  async sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
    if (!this.configured) return;

    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
          } else {
            this.logger.error(`Push failed for ${sub.endpoint.slice(0, 60)}: ${err.message}`);
          }
        }
      }),
    );
  }
}
