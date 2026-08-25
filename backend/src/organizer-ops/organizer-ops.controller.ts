import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrganizerOpsService } from './organizer-ops.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

// Class-level @Roles is intentionally absent — the dashboard endpoint gate is
// on the method itself. Event-specific endpoints are auth-only; ownership is
// enforced inside the service via canManageEvent().
@ApiTags('Organizer Ops')
@Controller('organizer')
export class OrganizerOpsController {
  constructor(private readonly service: OrganizerOpsService) {}

  // Platform-wide dashboard: requires ORGANIZER or ADMIN role.
  // Normal event hosts (USER role) see their events via the event-specific
  // endpoints below, not this broad dashboard view.
  @Get('dashboard')
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get organizer dashboard overview' })
  async getDashboard(@CurrentUser('sub') userId: string) {
    const data = await this.service.getDashboard(userId);
    return { success: true, data };
  }

  @Get('cyphers/:id/summary')
  @ApiOperation({ summary: 'Get private host cypher summary' })
  async getCypherSummary(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    const data = await this.service.getCypherSummary(id, userId, userRole);
    return { success: true, data };
  }

  @Post('cyphers/:id/checkin-scan')
  @ApiOperation({ summary: 'Scan attendee QR check-in for cypher' })
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async scanCheckIn(
    @Param('id') id: string,
    @Body() body: { qrToken: string },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    const data = await this.service.scanCheckIn(id, userId, body.qrToken, userRole);
    return { success: true, data };
  }

  @Get('cyphers/:id/assets')
  @ApiOperation({ summary: 'List all uploaded assets for a cypher' })
  async getCypherAssets(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    const data = await this.service.getCypherAssets(id, userId, userRole);
    return { success: true, data };
  }

  @Post('cyphers/:id/highlights')
  @ApiOperation({ summary: 'Add official highlight that survives cleanup' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async addHighlight(
    @Param('id') id: string,
    @Body() body: { assetId: string; title: string; caption?: string; visibility?: string },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    const data = await this.service.addHighlight(id, userId, body, userRole);
    return { success: true, data };
  }

  @Delete('cyphers/:id/highlights/:highlightId')
  @ApiOperation({ summary: 'Remove a preserved highlight from a cypher' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async removeHighlight(
    @Param('id') id: string,
    @Param('highlightId') highlightId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    const data = await this.service.removeHighlight(id, userId, highlightId, userRole);
    return { success: true, data };
  }

  @Post('cyphers/:id/safety-note')
  @ApiOperation({ summary: 'Add private safety note to cypher' })
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async addSafetyNote(
    @Param('id') id: string,
    @Body() body: { note: string; severity?: string },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    const data = await this.service.addSafetyNote(id, userId, body, userRole);
    return { success: true, data };
  }

  @Get('sessions/:id/summary')
  @ApiOperation({ summary: 'Get private host session summary' })
  async getSessionSummary(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    const data = await this.service.getSessionSummary(id, userId, userRole);
    return { success: true, data };
  }

  @Post('sessions/:id/checkin-scan')
  @ApiOperation({ summary: 'Scan attendee QR check-in for session' })
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async scanSessionCheckIn(
    @Param('id') id: string,
    @Body() body: { qrToken: string },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    const data = await this.service.scanSessionCheckIn(id, userId, body.qrToken, userRole);
    return { success: true, data };
  }

  @Post('sessions/:id/safety-note')
  @ApiOperation({ summary: 'Add private safety note to session' })
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async addSessionSafetyNote(
    @Param('id') id: string,
    @Body() body: { note: string; severity?: string },
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    const data = await this.service.addSessionSafetyNote(id, userId, body, userRole);
    return { success: true, data };
  }
}
