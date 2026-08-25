import { Controller, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReportTargetType, ReportReason } from '@prisma/client';
import { SafetyService } from './safety.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Safety')
@Controller()
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('reports')
  @ApiOperation({ summary: 'Report a user, project, or content' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async createReport(
    @Body() data: { targetType: ReportTargetType; targetId: string; reason: ReportReason; description?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.safetyService.createReport(data, userId);
  }

  @Post('blocks/:userId')
  @ApiOperation({ summary: 'Block a user' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async blockUser(@Param('userId') blockedId: string, @CurrentUser('sub') userId: string) {
    return this.safetyService.blockUser(userId, blockedId);
  }

  @Delete('blocks/:userId')
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(@Param('userId') blockedId: string, @CurrentUser('sub') userId: string) {
    return this.safetyService.unblockUser(userId, blockedId);
  }

  @Post('mute/:userId')
  @ApiOperation({ summary: 'Mute a user' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async muteUser(@Param('userId') mutedId: string, @CurrentUser('sub') userId: string) {
    return this.safetyService.muteUser(userId, mutedId);
  }
}
