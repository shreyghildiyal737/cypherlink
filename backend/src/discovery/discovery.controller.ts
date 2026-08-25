import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { DiscoveryService } from './discovery.service';

@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Public()
  @Get('artists')
  @ApiOperation({ summary: 'Discover artists with locality-biased compatibility scoring' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'genre', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'language', required: false })
  @ApiQuery({ name: 'openToCollab', required: false })
  @ApiQuery({ name: 'beginnerFriendly', required: false })
  @ApiQuery({ name: 'localRemote', required: false })
  @ApiQuery({ name: 'availability', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async discoverArtists(
    @CurrentUser('sub') userId?: string,
    @Query('city') city?: string,
    @Query('genre') genre?: string,
    @Query('role') role?: string,
    @Query('language') language?: string,
    @Query('openToCollab') openToCollab?: string,
    @Query('beginnerFriendly') beginnerFriendly?: string,
    @Query('localRemote') localRemote?: string,
    @Query('availability') availability?: string,
    @Query('limit') limit?: string,
  ) {
    return this.discoveryService.discoverArtists(
      {
        city,
        genre,
        role,
        language,
        openToCollab: openToCollab === 'true',
        beginnerFriendly: beginnerFriendly === 'true',
        localRemote,
        availability,
        limit: limit ? parseInt(limit) : undefined,
      },
      userId,
    );
  }

  @Public()
  @Get('projects')
  @ApiOperation({ summary: 'Discover projects with compatibility scoring' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'openRole', required: false })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'projectType', required: false })
  @ApiQuery({ name: 'commitmentStyle', required: false })
  @ApiQuery({ name: 'localRemote', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async discoverProjects(
    @CurrentUser('sub') userId?: string,
    @Query('city') city?: string,
    @Query('openRole') openRole?: string,
    @Query('tag') tag?: string,
    @Query('projectType') projectType?: string,
    @Query('commitmentStyle') commitmentStyle?: string,
    @Query('localRemote') localRemote?: string,
    @Query('limit') limit?: string,
  ) {
    return this.discoveryService.discoverProjects(
      { city, openRole, tag, projectType, commitmentStyle, localRemote, limit: limit ? parseInt(limit) : undefined },
      userId,
    );
  }

  @Public()
  @Get('open-collabs')
  @ApiOperation({ summary: 'Discover open collaboration projects (newcomer-friendly entry surface)' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'openRole', required: false })
  @ApiQuery({ name: 'commitmentStyle', required: false })
  @ApiQuery({ name: 'localRemote', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async discoverOpenCollabs(
    @CurrentUser('sub') userId?: string,
    @Query('city') city?: string,
    @Query('openRole') openRole?: string,
    @Query('commitmentStyle') commitmentStyle?: string,
    @Query('localRemote') localRemote?: string,
    @Query('limit') limit?: string,
  ) {
    return this.discoveryService.discoverOpenCollabs(
      { city, openRole, commitmentStyle, localRemote, limit: limit ? parseInt(limit) : undefined },
      userId,
    );
  }

  @Public()
  @Get('trust-signals/:userId')
  @ApiOperation({ summary: 'Get computed soft trust signals for a user profile' })
  async getTrustSignals(@Param('userId') userId: string) {
    return this.discoveryService.computeSoftTrustSignals(userId);
  }

  @Public()
  @Get('organizer-signals/:userId')
  @ApiOperation({ summary: 'Get computed organizer trust signals (event history, turnout, highlights)' })
  async getOrganizerSignals(@Param('userId') userId: string) {
    return this.discoveryService.computeOrganizerTrustSignals(userId);
  }

  @Get('collab-memory/:targetUserId')
  @ApiOperation({ summary: 'Get collaboration memory context between the current user and a target user' })
  async getCollabMemory(
    @CurrentUser('sub') viewerUserId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.discoveryService.checkCollaborationMemory(viewerUserId, targetUserId);
  }

  @Get('my-collaborators')
  @ApiOperation({ summary: 'Get your top collaborators with frequency and context labels' })
  async getMyCollaborators(@CurrentUser('sub') userId: string) {
    return this.discoveryService.getMyTopCollaborators(userId);
  }

  @Get('continuation-suggestions')
  @ApiOperation({ summary: 'Get post-collaboration continuation suggestions for the current user' })
  async getContinuationSuggestions(@CurrentUser('sub') userId: string) {
    return this.discoveryService.getContinuationSuggestions(userId);
  }

  @Post('collab-memory/:targetUserId/hide')
  @ApiOperation({ summary: 'Hide a collaboration memory from public view (internal memory preserved)' })
  async hideCollabMemory(
    @CurrentUser('sub') userId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.discoveryService.hideCollaborationMemory(userId, targetUserId);
  }

  @Public()
  @Get('quick-opportunities')
  @ApiOperation({ summary: 'Discover low-commitment quick-entry collaboration opportunities' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'openRole', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getQuickOpportunities(
    @CurrentUser('sub') userId?: string,
    @Query('city') city?: string,
    @Query('openRole') openRole?: string,
    @Query('limit') limit?: string,
  ) {
    return this.discoveryService.discoverQuickOpportunities(
      { city, openRole, limit: limit ? parseInt(limit) : undefined },
      userId,
    );
  }

  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Post('suppress/project/:projectId')
  @ApiOperation({ summary: 'Soft-suppress a project from discovery (moderator/admin only)' })
  async suppressProject(
    @Param('projectId') projectId: string,
    @Body('reason') reason: string,
  ) {
    return this.discoveryService.suppressProject(projectId, reason ?? 'moderation');
  }

  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Post('unsuppress/project/:projectId')
  @ApiOperation({ summary: 'Remove soft-suppression from a project' })
  async unsuppressProject(@Param('projectId') projectId: string) {
    return this.discoveryService.unsuppressProject(projectId);
  }
}
