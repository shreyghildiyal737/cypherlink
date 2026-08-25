import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CyphersService } from './cyphers.service';
import { CreateCypherDto } from './dto/create-cypher.dto';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { ScanCheckInDto } from './dto/scan-checkin.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Cyphers')
@Controller('cyphers')
export class CyphersController {
  constructor(private readonly cyphersService: CyphersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all cyphers' })
  async findAll(@CurrentUser('sub') userId?: string) {
    return this.cyphersService.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new cypher' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async create(@Body() dto: CreateCypherDto, @CurrentUser('sub') userId: string) {
    return this.cyphersService.create(dto, userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get cypher details' })
  async findById(@Param('id') id: string, @CurrentUser('sub') userId?: string) {
    return this.cyphersService.findById(id, userId);
  }

  @Post(':id/rsvp')
  @ApiOperation({ summary: 'RSVP to a cypher' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async rsvp(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.cyphersService.rsvp(id, userId);
  }

  @Post(':id/waitlist')
  @ApiOperation({ summary: 'Join cypher waitlist' })
  async waitlist(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.cyphersService.addToWaitlist(id, userId);
  }

  @Get(':id/my-checkin-token')
  @ApiOperation({ summary: 'Get your personal QR check-in token (must have RSVPed)' })
  async getMyCheckInToken(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.cyphersService.getMyCheckInToken(id, userId);
  }

  @Post(':id/checkin-scan')
  @ApiOperation({ summary: 'Validate attendee QR token and create check-in (event host or admin)' })
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async scanCheckIn(
    @Param('id') id: string,
    @Body() dto: ScanCheckInDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.cyphersService.scanCheckIn(id, userId, dto.token, userRole);
  }

  @Post(':id/highlights')
  @ApiOperation({ summary: 'Add highlight to cypher (event host or admin)' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async addHighlight(
    @Param('id') id: string,
    @Body() dto: CreateHighlightDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.cyphersService.addHighlight(id, dto, userId, userRole);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get cypher summary (event host or admin)' })
  async getSummary(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.cyphersService.getSummary(id, userId, userRole);
  }

  @Patch(':id/rsvp-intent')
  @ApiOperation({ summary: 'Set your participation intent note (must have RSVPed)' })
  async setRsvpIntent(
    @Param('id') id: string,
    @Body() dto: { intentNote?: string; aliasName?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.cyphersService.setRsvpIntent(id, userId, dto.intentNote ?? '', dto.aliasName);
  }

  @Public()
  @Get(':id/participants')
  @ApiOperation({ summary: 'Get checked-in participants (anonymized for public, full for organizer)' })
  async getParticipants(
    @Param('id') id: string,
    @CurrentUser('sub') requesterId?: string,
    @CurrentUser('role') userRole?: string,
  ) {
    return this.cyphersService.getParticipants(id, requesterId ?? '', userRole ?? 'USER');
  }

  @Public()
  @Get(':id/continuation')
  @ApiOperation({ summary: 'Get afterglow continuation data: born projects, intents, clips' })
  async getContinuation(@Param('id') id: string) {
    return this.cyphersService.getContinuation(id);
  }

  @Post(':id/create-project')
  @ApiOperation({ summary: 'Create a project from this cypher (must have RSVPed)' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async createProjectFromCypher(
    @Param('id') id: string,
    @Body() dto: { title: string; description?: string; openRoles?: string[]; tags?: string[] },
    @CurrentUser('sub') userId: string,
  ) {
    return this.cyphersService.createProjectFromCypher(id, dto, userId);
  }

  @Delete(':id/attendees/:userId')
  @ApiOperation({ summary: 'Remove attendee from check-in record (organizer/admin only)' })
  async removeAttendee(
    @Param('id') id: string,
    @Param('userId') attendeeUserId: string,
    @CurrentUser('sub') organizerId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.cyphersService.removeAttendee(id, attendeeUserId, organizerId, userRole);
  }
}
