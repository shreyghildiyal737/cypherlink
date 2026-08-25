import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ArtistsService, ArtistQuery } from './artists.service';

@ApiTags('Artists')
@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse artists with filters and cursor pagination' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'genre', required: false })
  @ApiQuery({ name: 'language', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'verified', required: false })
  @ApiQuery({ name: 'openToCollab', required: false })
  @ApiQuery({ name: 'beginnerFriendly', required: false })
  @ApiQuery({ name: 'momentum', required: false })
  @ApiQuery({ name: 'localRemote', required: false })
  @ApiQuery({ name: 'availability', required: false })
  @ApiQuery({ name: 'lookingFor', required: false })
  @ApiQuery({ name: 'sort', required: false, enum: ['rising', 'recent', 'trusted'] })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query() query: ArtistQuery) {
    return this.artistsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get public artist profile with living modules only' })
  async findById(@Param('id') id: string) {
    return this.artistsService.findById(id);
  }
}
