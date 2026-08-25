import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ClipsService } from './clips.service';
import { CreateClipDto } from './dto/create-clip.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Clips')
@Controller('clips')
export class ClipsController {
  constructor(private readonly clipsService: ClipsService) {}

  @Post()
  @ApiOperation({ summary: 'Drop a new clip' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async create(@Body() dto: CreateClipDto, @CurrentUser('sub') userId: string) {
    return this.clipsService.create(dto, userId);
  }

  @Public()
  @Get('by-cypher/:cypherId')
  @ApiOperation({ summary: 'List clips captured during a specific cypher' })
  @ApiParam({ name: 'cypherId' })
  async byCypher(@Param('cypherId') cypherId: string) {
    const clips = await this.clipsService.findByCypher(cypherId);
    return clips.map((c) => mapClipResponse(c));
  }

  @Public()
  @Get('by-project/:projectId')
  @ApiOperation({ summary: 'List clips associated with a project' })
  @ApiParam({ name: 'projectId' })
  async byProject(@Param('projectId') projectId: string) {
    const clips = await this.clipsService.findByProject(projectId);
    return clips.map((c) => mapClipResponse(c));
  }
}

function mapClipResponse(c: any) {
  return {
    id: c.id,
    creator: c.creator
      ? {
          id: c.creator.id,
          displayName: c.creator.displayName,
          handle: c.creator.profile?.handle || '',
          city: c.creator.profile?.city,
          avatarUrl: c.creator.profile?.avatarUrl,
        }
      : null,
    projectTitle: c.projectTitle,
    city: c.city,
    reason: c.reason,
    caption: c.caption,
    likes: c.likes,
    comments: c.comments,
    mediaUrl: c.mediaUrl,
    createdAt: c.createdAt,
  };
}
