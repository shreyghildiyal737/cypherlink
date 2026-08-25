import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search across artists, projects, cyphers, clips, community, scenes' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['artists', 'projects', 'cyphers', 'clips', 'community', 'scenes', 'all'] })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'genre', required: false })
  @ApiQuery({ name: 'language', required: false })
  @ApiQuery({ name: 'verified', required: false })
  @ApiQuery({ name: 'openToCollab', required: false })
  @ApiQuery({ name: 'beginnerFriendly', required: false })
  @ApiQuery({ name: 'cypherType', required: false })
  @ApiQuery({ name: 'openRole', required: false })
  @ApiQuery({ name: 'projectType', required: false })
  @ApiQuery({ name: 'commitmentStyle', required: false })
  @ApiQuery({ name: 'localRemote', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'availability', required: false })
  async search(
    @Query('q') q: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('genre') genre?: string,
    @Query('language') language?: string,
    @Query('verified') verified?: string,
    @Query('openToCollab') openToCollab?: string,
    @Query('beginnerFriendly') beginnerFriendly?: string,
    @Query('cypherType') cypherType?: string,
    @Query('openRole') openRole?: string,
    @Query('projectType') projectType?: string,
    @Query('commitmentStyle') commitmentStyle?: string,
    @Query('localRemote') localRemote?: string,
    @Query('role') role?: string,
    @Query('availability') availability?: string,
  ) {
    return this.searchService.search(q, {
      type: type as any,
      city, genre, language, verified, openToCollab, beginnerFriendly, cypherType,
      openRole, projectType, commitmentStyle, localRemote, role, availability,
    });
  }
}
