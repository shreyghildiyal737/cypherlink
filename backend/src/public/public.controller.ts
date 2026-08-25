import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PublicService } from './public.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Public()
  @Get('home')
  @ApiOperation({ summary: 'Get public home page data' })
  async getHome() {
    return this.publicService.getHome();
  }

  @Public()
  @Get('feed')
  @ApiOperation({ summary: 'Get public feed/clips' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFeed(@Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.publicService.getFeed(cursor, limit ? parseInt(limit) : 12);
  }

  @Public()
  @Get('map')
  @ApiOperation({ summary: 'Get map scenes data' })
  async getMap() {
    return this.publicService.getMap();
  }

  @Public()
  @Get('profiles/:id')
  @ApiOperation({ summary: 'Get public profile' })
  async getProfile(@Param('id') id: string) {
    return this.publicService.getPublicProfile(id);
  }

  @Public()
  @Get('projects/:id')
  @ApiOperation({ summary: 'Get public project' })
  async getProject(@Param('id') id: string) {
    return this.publicService.getPublicProject(id);
  }

  @Public()
  @Get('cyphers/:id')
  @ApiOperation({ summary: 'Get public cypher' })
  async getCypher(@Param('id') id: string) {
    return this.publicService.getPublicCypher(id);
  }

  @Public()
  @Get('clips/:id')
  @ApiOperation({ summary: 'Get public clip' })
  async getClip(@Param('id') id: string) {
    return this.publicService.getPublicClip(id);
  }
}
