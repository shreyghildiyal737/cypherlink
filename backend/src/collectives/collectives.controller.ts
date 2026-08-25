import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CollectivesService } from './collectives.service';
import { CreateCollectiveDto } from './dto/create-collective.dto';

@ApiTags('Collectives')
@Controller('collectives')
export class CollectivesController {
  constructor(private readonly svc: CollectivesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse collectives, optionally filtered by city' })
  findAll(@Query('city') city?: string, @Query('limit') limit?: string) {
    return this.svc.findAll(city, limit ? parseInt(limit) : 20);
  }

  @Get('me/list')
  @ApiOperation({ summary: 'Get collectives the current user belongs to' })
  getMyCollectives(@CurrentUser('sub') userId: string) {
    return this.svc.getMyCollectives(userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a collective by ID' })
  findById(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new collective' })
  create(@Body() dto: CreateCollectiveDto, @CurrentUser('sub') userId: string) {
    return this.svc.create(dto, userId);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a collective' })
  join(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.svc.join(id, userId);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave a collective (founder cannot leave)' })
  leave(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.svc.leave(id, userId);
  }
}
