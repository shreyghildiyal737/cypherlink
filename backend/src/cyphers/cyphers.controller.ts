import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CyphersService } from './cyphers.service';
import { CreateCypherDto } from './dto/create-cypher.dto';
import { CreateHighlightDto } from './dto/create-highlight.dto';
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

  @Get(':id/checkin-token')
  @ApiOperation({ summary: 'Get QR check-in token (organizer only)' })
  async getCheckInToken(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.cyphersService.getCheckInToken(id, userId);
  }

  @Post(':id/checkin-scan')
  @ApiOperation({ summary: 'Scan QR check-in (organizer only)' })
  async scanCheckIn(@Param('id') id: string, @Body() data: { userId: string }, @CurrentUser('sub') userId: string) {
    return this.cyphersService.scanCheckIn(id, userId, data);
  }

  @Post(':id/highlights')
  @ApiOperation({ summary: 'Add highlight to cypher (organizer only)' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async addHighlight(@Param('id') id: string, @Body() dto: CreateHighlightDto, @CurrentUser('sub') userId: string) {
    return this.cyphersService.addHighlight(id, dto, userId);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get cypher summary (organizer only)' })
  async getSummary(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.cyphersService.getSummary(id, userId);
  }
}
