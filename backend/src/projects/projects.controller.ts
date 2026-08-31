import { Controller, Get, Post, Patch, Body, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { InviteProjectMemberDto } from './dto/invite-member.dto';
import { ApplyRoleDto } from './dto/apply-role.dto';
import { RespondApplicationDto } from './dto/respond-application.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { SubmitDeliverableDto } from './dto/submit-deliverable.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { PostProjectMessageDto } from './dto/post-message.dto';
import { TransitionTypeDto } from './dto/transition-type.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { SetFilledRolesDto, ConfirmFileUploadDto, OptionalNoteDto } from './dto/project-ops.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all projects with optional filters' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'openRole', required: false })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'projectType', required: false })
  @ApiQuery({ name: 'commitmentStyle', required: false })
  @ApiQuery({ name: 'localRemote', required: false })
  async findAll(
    @CurrentUser('sub') userId?: string,
    @Query('city') city?: string,
    @Query('openRole') openRole?: string,
    @Query('tag') tag?: string,
    @Query('projectType') projectType?: string,
    @Query('commitmentStyle') commitmentStyle?: string,
    @Query('localRemote') localRemote?: string,
  ) {
    return this.projectsService.findAll(userId, { city, openRole, tag, projectType, commitmentStyle, localRemote });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async create(@Body() dto: CreateProjectDto, @CurrentUser('sub') userId: string) {
    return this.projectsService.create(dto, userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', type: String })
  async findById(@Param('id') id: string, @CurrentUser('sub') userId?: string) {
    return this.projectsService.findById(id, userId);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite a user to the project' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async inviteMember(@Param('id') id: string, @Body() dto: InviteProjectMemberDto, @CurrentUser('sub') userId: string) {
    return this.projectsService.inviteMember(id, dto, userId);
  }

  @Post(':id/join-request')
  @ApiOperation({ summary: 'Request to join a project' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async requestJoin(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.requestJoin(id, userId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark project as completed' })
  async completeProject(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.completeProject(id, userId);
  }

  @Patch(':id/filled-roles')
  @ApiOperation({ summary: 'Update which roles are filled (owner only)' })
  async updateFilledRoles(
    @Param('id') id: string,
    @Body() body: SetFilledRolesDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projectsService.updateFilledRoles(id, body.filledRoles, userId);
  }

  @Post(':id/files/sign')
  @ApiOperation({ summary: 'Get signed upload URL for project file' })
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async signFileUpload(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.signFileUpload(id, userId);
  }

  @Post(':id/files/confirm')
  @ApiOperation({ summary: 'Confirm file upload and save metadata' })
  async confirmFileUpload(@Param('id') id: string, @Body() data: ConfirmFileUploadDto, @CurrentUser('sub') userId: string) {
    return this.projectsService.confirmFileUpload(id, userId, data);
  }

  @Delete(':id/files/:fileId')
  @ApiOperation({ summary: 'Remove a file from the shared project space' })
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async removeFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projectsService.removeFile(id, fileId, userId);
  }

  // ── Role Applications ──────────────────────────────────────────────────────

  @Post(':id/apply')
  @ApiOperation({ summary: 'Apply for a role on this project' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async applyForRole(@Param('id') id: string, @Body() dto: ApplyRoleDto, @CurrentUser('sub') userId: string) {
    return this.projectsService.applyForRole(id, dto, userId);
  }

  @Get(':id/applications')
  @ApiOperation({ summary: 'Get all role applications (owner only)' })
  async getApplications(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.getApplications(id, userId);
  }

  @Patch(':id/applications/:appId')
  @ApiOperation({ summary: 'Accept or reject a role application (owner only)' })
  async respondToApplication(
    @Param('id') id: string,
    @Param('appId') appId: string,
    @Body() dto: RespondApplicationDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projectsService.respondToApplication(id, appId, dto, userId);
  }

  // ── Milestones ──────────────────────────────────────────────────────────────

  @Public()
  @Get(':id/milestones')
  @ApiOperation({ summary: 'Get milestones for a project' })
  async getMilestones(@Param('id') id: string, @CurrentUser('sub') userId?: string) {
    return this.projectsService.getMilestones(id, userId);
  }

  @Post(':id/milestones')
  @ApiOperation({ summary: 'Create a milestone (owner only)' })
  async createMilestone(@Param('id') id: string, @Body() dto: CreateMilestoneDto, @CurrentUser('sub') userId: string) {
    return this.projectsService.createMilestone(id, dto, userId);
  }

  @Patch(':id/milestones/:milestoneId')
  @ApiOperation({ summary: 'Update a milestone' })
  async updateMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projectsService.updateMilestone(id, milestoneId, dto, userId);
  }

  @Delete(':id/milestones/:milestoneId')
  @ApiOperation({ summary: 'Delete a milestone (owner only)' })
  async deleteMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projectsService.deleteMilestone(id, milestoneId, userId);
  }

  // ── Deliverables ───────────────────────────────────────────────────────────

  @Post(':id/deliverables')
  @ApiOperation({ summary: 'Submit a deliverable' })
  async submitDeliverable(@Param('id') id: string, @Body() dto: SubmitDeliverableDto, @CurrentUser('sub') userId: string) {
    return this.projectsService.submitDeliverable(id, dto, userId);
  }

  @Public()
  @Get(':id/deliverables')
  @ApiOperation({ summary: 'Get deliverables for a project' })
  async getDeliverables(@Param('id') id: string, @CurrentUser('sub') userId?: string) {
    return this.projectsService.getDeliverables(id, userId);
  }

  // ── Revisions ──────────────────────────────────────────────────────────────

  @Post(':id/revisions')
  @ApiOperation({ summary: 'Request a revision (owner only)' })
  async requestRevision(@Param('id') id: string, @Body() dto: RequestRevisionDto, @CurrentUser('sub') userId: string) {
    return this.projectsService.requestRevision(id, dto, userId);
  }

  @Patch(':id/revisions/:revisionId/resolve')
  @ApiOperation({ summary: 'Resolve a revision request (owner only)' })
  async resolveRevision(
    @Param('id') id: string,
    @Param('revisionId') revisionId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projectsService.resolveRevision(id, revisionId, userId);
  }

  // ── Project Messages ───────────────────────────────────────────────────────

  @Public()
  @Get(':id/messages')
  @ApiOperation({ summary: 'Get project discussion messages' })
  async getProjectMessages(@Param('id') id: string, @CurrentUser('sub') userId?: string) {
    return this.projectsService.getProjectMessages(id, userId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Post a message to project discussion' })
  async postProjectMessage(@Param('id') id: string, @Body() dto: PostProjectMessageDto, @CurrentUser('sub') userId: string) {
    return this.projectsService.postProjectMessage(id, dto, userId);
  }

  // ── Type Transition ────────────────────────────────────────────────────────

  @Patch(':id/type')
  @ApiOperation({ summary: 'Transition project type (owner only)' })
  async transitionType(@Param('id') id: string, @Body() dto: TransitionTypeDto, @CurrentUser('sub') userId: string) {
    return this.projectsService.transitionProjectType(id, dto, userId);
  }

  // ── Member Management ──────────────────────────────────────────────────────

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a project' })
  async leaveProject(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.leaveProject(id, userId);
  }

  @Patch(':id/members/:targetUserId/remove')
  @ApiOperation({ summary: 'Remove a member from the project (owner only)' })
  async removeMember(
    @Param('id') id: string,
    @Param('targetUserId') targetUserId: string,
    @Body() body: OptionalNoteDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.projectsService.removeMember(id, targetUserId, body, userId);
  }
}
