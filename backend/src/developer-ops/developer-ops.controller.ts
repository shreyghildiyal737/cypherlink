import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeveloperOpsService } from './developer-ops.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Developer Ops')
@Controller('dev')
@Roles(UserRole.ADMIN)
export class DeveloperOpsController {
  constructor(private readonly service: DeveloperOpsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  async getHealth() {
    const data = await this.service.getHealth();
    return { success: true, data };
  }

  @Get('queues')
  @ApiOperation({ summary: 'Get BullMQ queue status' })
  async getQueues() {
    const data = await this.service.getQueues();
    return { success: true, data };
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get recent background job timeline' })
  async getJobs() {
    const data = await this.service.getJobs();
    return { success: true, data };
  }

  @Get('uploads/errors')
  @ApiOperation({ summary: 'Get upload failures and retries' })
  async getUploadErrors() {
    const data = await this.service.getUploadErrors();
    return { success: true, data };
  }

  @Get('ws/status')
  @ApiOperation({ summary: 'Get WebSocket connection status' })
  async getWsStatus() {
    const data = await this.service.getWsStatus();
    return { success: true, data };
  }

  @Post('jobs/:queueName/retry-failed')
  @ApiOperation({ summary: 'Retry failed jobs in a queue' })
  async retryFailedJobs(@Param('queueName') queueName: string, @CurrentUser('sub') userId: string) {
    const data = await this.service.retryFailedJobs(queueName, userId);
    return { success: true, data };
  }
}
