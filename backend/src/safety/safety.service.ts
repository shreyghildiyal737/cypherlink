import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReportTargetType, ReportReason, NotificationType } from '@prisma/client';

@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(data: { targetType: ReportTargetType; targetId: string; reason: ReportReason; description?: string }, reporterId: string) {
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedId: data.targetType === 'PROFILE' ? data.targetId : reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description,
      },
    });

    return report;
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new BadRequestException('Cannot block yourself');

    const user = await this.prisma.user.findUnique({ where: { id: blockedId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (existing) return existing;

    return this.prisma.block.create({
      data: { blockerId, blockedId },
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const existing = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (!existing) throw new NotFoundException('Block not found');

    await this.prisma.block.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    return { message: 'User unblocked' };
  }

  async muteUser(muterId: string, mutedId: string) {
    if (muterId === mutedId) throw new BadRequestException('Cannot mute yourself');

    const existing = await this.prisma.mute.findUnique({
      where: { muterId_mutedId: { muterId, mutedId } },
    });
    if (existing) return existing;

    return this.prisma.mute.create({
      data: { muterId, mutedId },
    });
  }
}
