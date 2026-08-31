import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminOpsService } from './admin-ops.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { UpdateReportDto, UpdateRequestDto, UpdateIncidentDto } from './dto/admin-ops.dto';

@ApiTags('Admin Ops')
@Controller('admin')
@Roles(UserRole.MODERATOR, UserRole.ADMIN)
export class AdminOpsController {
  constructor(private readonly service: AdminOpsService) {}

  @Get('reports')
  @ApiOperation({ summary: 'Get report queue' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'targetType', required: false })
  async getReports(
    @Query('page') page?: string,
    @Query('cursor') cursor?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('targetType') targetType?: string,
  ) {
    const data = await this.service.getReports({ page, cursor, status, priority, targetType });
    return { success: true, data };
  }

  @Patch('reports/:id')
  @ApiOperation({ summary: 'Update report status and take action' })
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async updateReport(@Param('id') id: string, @Body() body: UpdateReportDto, @CurrentUser('sub') userId: string) {
    const data = await this.service.updateReport(id, userId, body);
    return { success: true, data };
  }

  @Get('verification-requests')
  @ApiOperation({ summary: 'Get verification requests' })
  async getVerificationRequests() {
    const data = await this.service.getVerificationRequests();
    return { success: true, data };
  }

  @Patch('verification-requests/:id')
  @ApiOperation({ summary: 'Approve/reject verification request' })
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async updateVerificationRequest(@Param('id') id: string, @Body() body: UpdateRequestDto, @CurrentUser('sub') userId: string) {
    const data = await this.service.updateVerificationRequest(id, userId, body);
    return { success: true, data };
  }

  @Get('organizer-requests')
  @ApiOperation({ summary: 'Get organizer privilege requests' })
  async getOrganizerRequests() {
    const data = await this.service.getOrganizerRequests();
    return { success: true, data };
  }

  @Patch('organizer-requests/:id')
  @ApiOperation({ summary: 'Approve/reject organizer request' })
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async updateOrganizerRequest(@Param('id') id: string, @Body() body: UpdateRequestDto, @CurrentUser('sub') userId: string) {
    const data = await this.service.updateOrganizerRequest(id, userId, body);
    return { success: true, data };
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get internal audit logs' })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'targetId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  async getAuditLogs(
    @Query('actorId') actorId?: string,
    @Query('targetId') targetId?: string,
    @Query('action') action?: string,
    @Query('cursor') cursor?: string,
  ) {
    const data = await this.service.getAuditLogs({ actorId, targetId, action, cursor });
    return { success: true, data };
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Get safety incidents' })
  async getIncidents() {
    const data = await this.service.getIncidents();
    return { success: true, data };
  }

  @Patch('incidents/:id')
  @ApiOperation({ summary: 'Update incident status/resolution' })
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async updateIncident(@Param('id') id: string, @Body() body: UpdateIncidentDto, @CurrentUser('sub') userId: string) {
    const data = await this.service.updateIncident(id, userId, body);
    return { success: true, data };
  }
}
