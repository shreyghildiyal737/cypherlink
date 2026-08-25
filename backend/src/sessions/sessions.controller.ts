import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SessionsService } from './sessions.service';
import { CreateCommunitySessionDto } from './dto/create-session.dto';
import { CreateLearningSessionDto } from './dto/create-learning-session.dto';
import { ScanSessionCheckInDto } from './dto/scan-checkin.dto';
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

  // NOTE: Static routes must come BEFORE the parameterised /:id routes,
  // otherwise Nest matches '/sessions/learning' against ':id' and 404s.

  @Public()
  @Get('learning')
  @ApiOperation({ summary: 'List free learning sessions — public, no payments' })
  @ApiQuery({ name: 'city', required: false })
  async findLearningSessions(@Query('city') city?: string) {
    return this.sessionsService.findLearningSessions(city);
  }

  @Post('learning')
  @ApiOperation({ summary: 'Create a free learning session — no payments, no paid marketplace' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async createLearningSession(@Body() dto: CreateLearningSessionDto, @CurrentUser('sub') userId: string) {
    return this.sessionsService.createLearningSession(dto, userId);
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
  @ApiOperation({ summary: 'Validate attendee QR token and create check-in (event host or admin)' })
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async scanCheckIn(
    @Param('id') id: string,
    @Body() dto: ScanSessionCheckInDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.sessionsService.scanCheckIn(id, userId, dto.token, userRole);
  }
}
