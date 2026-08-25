import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ScenesService } from './scenes.service';

@ApiTags('Scenes')
@Controller('scenes')
export class ScenesController {
  constructor(private readonly scenesService: ScenesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List city scenes aggregated from DB data' })
  async findAll() {
    return this.scenesService.findAll();
  }

  @Public()
  @Get(':city')
  @ApiOperation({ summary: 'Get scene summary for a city — artists, projects, cyphers, community' })
  async findByCity(@Param('city') city: string) {
    return this.scenesService.findByCity(city);
  }
}
