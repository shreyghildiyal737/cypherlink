import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SessionsService } from './sessions.service';
import { CreateCommunitySessionDto } from './dto/create-session.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Community Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all community sessions' })
  async findAll() {
    return this.sessionsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a community session' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async create(@Body() dto: CreateCommunitySessionDto, @CurrentUser('sub') userId: string) {
    return this.sessionsService.create(dto, userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get session details' })
  async findById(@Param('id') id: string) {
    return this.sessionsService.findById(id);
  }

  @Post(':id/rsvp')
  @ApiOperation({ summary: 'RSVP to a community session' })
  async rsvp(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.sessionsService.rsvp(id, userId);
  }

  @Get(':id/my-checkin-token')
  @ApiOperation({ summary: 'Get your personal QR check-in token (must have RSVPed)' })
  async getMyCheckInToken(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.sessionsService.getMyCheckInToken(id, userId);
  }

  @Post(':id/checkin-scan')
  @ApiOperation({ summary: 'Scan check-in for session (organizer only)' })
  async scanCheckIn(@Param('id') id: string, @Body() data: { userId: string }, @CurrentUser('sub') userId: string) {
    return this.sessionsService.scanCheckIn(id, userId, data);
  }
}
