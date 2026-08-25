import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { NotificationsService } from '../notifications/notifications.service';
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
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(userId?: string, filters?: {
    city?: string;
    openRole?: string;
    tag?: string;
    projectType?: string;
    commitmentStyle?: string;
    localRemote?: string;
  }) {
    const where: any = { deletedAt: null };
    if (userId) {
      where['OR'] = [
        { visibility: { in: ['DISCOVERABLE', 'OPEN'] } },
        { members: { some: { userId } } },
      ];
    } else {
      where['visibility'] = { in: ['DISCOVERABLE', 'OPEN'] };
    }

    if (filters?.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters?.openRole) where.openRoles = { has: filters.openRole };
    if (filters?.tag) where.tags = { has: filters.tag };
    if (filters?.projectType) where.projectType = filters.projectType;
    if (filters?.commitmentStyle) where.commitmentStyle = filters.commitmentStyle;
    if (filters?.localRemote) where.localRemote = filters.localRemote;

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        members: { include: { user: { include: { profile: true } } } },
        files: true,
        owner: { include: { profile: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return projects.map((p) => this.mapProject(p));
  }

  async findById(id: string, userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: { include: { user: { include: { profile: true } } } },
        files: true,
        owner: { include: { profile: true } },
        credits: { include: { profile: true } },
        milestones: { orderBy: { order: 'asc' }, include: { assignedContributor: true } },
        _count: {
          select: {
            applications: { where: { status: 'PENDING' } },
            deliverables: true,
            revisions: { where: { resolvedAt: null } },
          },
        },
      },
    });

    if (!project || project.deletedAt) throw new NotFoundException('Project not found');

    const isMember = userId && project.members.some((m) => m.userId === userId);
    if (project.visibility === 'PRIVATE' && !isMember) {
      throw new ForbiddenException('This project is private');
    }

    return this.mapProject(project);
  }

  async create(dto: CreateProjectDto, userId: string) {
    const project = await (this.prisma.project.create as any)({
      data: {
        title: dto.title,
        description: dto.description,
        tags: dto.tags || [],
        openRoles: dto.openRoles || [],
        filledRoles: [],
        city: dto.city,
        visibility: dto.visibility || 'DISCOVERABLE',
        projectType: dto.projectType || 'STRUCTURED',
        localRemote: dto.localRemote || 'BOTH',
        roughExpectation: dto.roughExpectation,
        commitmentStyle: dto.commitmentStyle,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        bornFromCypherId: dto.bornFromCypherId || null,
        participantCap: dto.participantCap ?? null,
        aiDisclosureLabel: dto.aiDisclosureLabel ?? null,
        ownerId: userId,
        members: {
          create: { userId, role: 'owner' },
        },
      },
      include: {
        members: { include: { user: { include: { profile: true } } } },
        files: true,
        owner: { include: { profile: true } },
      },
    });

    return this.mapProject(project);
  }

  async inviteMember(projectId: string, dto: InviteProjectMemberDto, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only project owner can invite');

    const existingMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: dto.userId } },
    });
    if (existingMember) throw new BadRequestException('User is already a member');

    const invite = await this.prisma.projectInvite.create({
      data: { projectId, userId: dto.userId },
    });

    return invite;
  }

  async requestJoin(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.visibility === 'PRIVATE') throw new ForbiddenException('This project is private');

    const existingMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existingMember) throw new BadRequestException('Already a member');

    const existingInvite = await this.prisma.projectInvite.findFirst({
      where: { projectId, userId, status: 'pending' },
    });
    if (existingInvite) throw new BadRequestException('Join request already pending');

    const invite = await this.prisma.projectInvite.create({
      data: { projectId, userId },
    });

    return invite;
  }

  async completeProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only owner can mark complete');

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'FINISHED', completedAt: new Date(), lastMeaningfulActivityAt: new Date() } as any,
      include: {
        members: { include: { user: { include: { profile: true } } } },
        files: true,
        owner: { include: { profile: true } },
        milestones: { orderBy: { order: 'asc' }, include: { assignedContributor: true } },
        _count: {
          select: {
            applications: { where: { status: 'PENDING' } },
            deliverables: true,
            revisions: { where: { resolvedAt: null } },
          },
        },
      },
    });

    return this.mapProject(updated);
  }

  async signFileUpload(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const isMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!isMember) throw new ForbiddenException('Only project members can upload files');

    const fileKey = `projects/${projectId}/${uuidv4()}`;
    const maxSize = parseInt(process.env.UPLOAD_MAX_MB || '250') * 1024 * 1024;

    return {
      uploadUrl: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${fileKey}`,
      fileKey,
      publicUrl: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${fileKey}`,
      maxSize,
    };
  }

  async confirmFileUpload(projectId: string, userId: string, data: { fileKey: string; fileName: string; fileSize: number; mimeType: string; publicUrl?: string }) {
    const isMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!isMember) throw new ForbiddenException('Only project members can confirm uploads');

    const file = await this.prisma.projectFile.create({
      data: {
        projectId,
        uploaderId: userId,
        fileName: data.fileName,
        fileKey: data.fileKey,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        publicUrl: data.publicUrl,
      },
    });

    return file;
  }

  async removeFile(projectId: string, fileId: string, userId: string) {
    const file = await this.prisma.projectFile.findUnique({ where: { id: fileId } });
    if (!file || file.projectId !== projectId) {
      throw new NotFoundException('File not found');
    }
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const isOwner = project.ownerId === userId;
    const isUploader = file.uploaderId === userId;
    if (!isOwner && !isUploader) {
      throw new ForbiddenException('Only the uploader or project owner can remove this file');
    }

    await this.prisma.projectFile.delete({ where: { id: fileId } });

    try {
      await this.uploadService.deleteObjects([file.fileKey]);
    } catch {
      // Swallow — storage layer logs its own warning.
    }

    return { removed: true, fileId };
  }

  async updateFilledRoles(projectId: string, filledRoles: string[], userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only the owner can update role occupancy');

    return (this.prisma.project as any).update({
      where: { id: projectId },
      data: { filledRoles, lastMeaningfulActivityAt: new Date() },
    });
  }

  private async touchMeaningfulActivity(projectId: string) {
    await (this.prisma.project as any).update({
      where: { id: projectId },
      data: { lastMeaningfulActivityAt: new Date() },
    });
  }

  // ── Role Applications ──────────────────────────────────────────────────────

  async applyForRole(projectId: string, dto: ApplyRoleDto, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true },
    });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.visibility !== 'OPEN' && project.visibility !== 'DISCOVERABLE') {
      throw new ForbiddenException('Project is not open for applications');
    }

    const existingMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existingMember) throw new BadRequestException('Already a member of this project');

    // Participant cap check for open collabs
    const cap = (project as any).participantCap;
    if (cap != null) {
      const activeCount = await this.prisma.projectMember.count({
        where: { projectId, status: 'ACTIVE' },
      });
      if (activeCount >= cap) {
        throw new BadRequestException(`This collaboration is at capacity (${cap} contributors)`);
      }
    }

    const existingApp = await this.prisma.projectRoleApplication.findFirst({
      where: { projectId, applicantId: userId, role: dto.role, status: 'PENDING' },
    });
    if (existingApp) throw new BadRequestException('Already have a pending application for this role');

    const application = await this.prisma.projectRoleApplication.create({
      data: {
        projectId,
        applicantId: userId,
        role: dto.role,
        message: dto.message,
      },
      include: { applicant: true },
    });

    const applicant = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.notificationsService.push(project.ownerId, {
      type: 'ROLE_APPLICATION',
      title: 'New role application',
      body: `${applicant?.displayName ?? 'Someone'} applied for ${dto.role} on ${project.title}`,
      referenceId: projectId,
    });

    return application;
  }

  async getApplications(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only project owner can view applications');

    const applications = await this.prisma.projectRoleApplication.findMany({
      where: { projectId },
      include: {
        applicant: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map((a) => ({
      id: a.id,
      projectId: a.projectId,
      applicantId: a.applicantId,
      applicantName: a.applicant.displayName,
      applicantHandle: a.applicant.profile?.handle,
      applicantAvatar: a.applicant.profile?.avatarUrl,
      role: a.role,
      message: a.message,
      status: a.status,
      createdAt: a.createdAt,
    }));
  }

  async respondToApplication(projectId: string, appId: string, dto: RespondApplicationDto, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only project owner can respond to applications');

    const application = await this.prisma.projectRoleApplication.findUnique({ where: { id: appId } });
    if (!application || application.projectId !== projectId) throw new NotFoundException('Application not found');

    const updated = await this.prisma.projectRoleApplication.update({
      where: { id: appId },
      data: {
        status: dto.status,
        respondedAt: new Date(),
        respondedById: userId,
      },
    });

    if (dto.status === 'ACCEPTED') {
      // Add as member
      const existingMember = await this.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: application.applicantId } },
      });
      if (!existingMember) {
        await this.prisma.projectMember.create({
          data: {
            projectId,
            userId: application.applicantId,
            role: 'member',
            creativeRole: application.role,
          },
        });
      }

      // Update openRoles/filledRoles + meaningful activity
      const currentFilled = project.filledRoles ?? [];
      await (this.prisma.project as any).update({
        where: { id: projectId },
        data: {
          filledRoles: currentFilled.includes(application.role) ? currentFilled : [...currentFilled, application.role],
          lastMeaningfulActivityAt: new Date(),
        },
      });

      await this.notificationsService.push(application.applicantId, {
        type: 'ROLE_APPLICATION',
        title: 'Application accepted',
        body: `You've been accepted as ${application.role} on ${project.title}`,
        referenceId: projectId,
      });
    } else if (dto.status === 'REJECTED') {
      await this.notificationsService.push(application.applicantId, {
        type: 'ROLE_APPLICATION',
        title: 'Application update',
        body: `Your application for ${application.role} on ${project.title} was not accepted this time`,
        referenceId: projectId,
      });
    }

    return updated;
  }

  // ── Milestones ──────────────────────────────────────────────────────────────

  async getMilestones(projectId: string, userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');

    const isMember = userId && project.members.some((m) => m.userId === userId);
    if (project.visibility === 'PRIVATE' && !isMember) {
      throw new ForbiddenException('This project is private');
    }

    const milestones = await this.prisma.projectMilestone.findMany({
      where: { projectId },
      include: { assignedContributor: true },
      orderBy: { order: 'asc' },
    });

    return milestones.map((m) => this.mapMilestone(m));
  }

  async createMilestone(projectId: string, dto: CreateMilestoneDto, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only project owner can create milestones');
    if (project.projectType !== 'STRUCTURED') throw new BadRequestException('Milestones are only for STRUCTURED projects');

    const milestone = await this.prisma.projectMilestone.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assignedRole: dto.assignedRole,
        assignedContributorId: dto.assignedContributorId,
        deliverableExpectation: dto.deliverableExpectation,
        status: dto.status ?? 'TODO',
        order: dto.order ?? 0,
      },
      include: { assignedContributor: true },
    });

    if (dto.assignedContributorId) {
      await this.notificationsService.push(dto.assignedContributorId, {
        type: 'MILESTONE_ASSIGNED',
        title: 'Milestone assigned',
        body: `You've been assigned to '${dto.title}' on ${project.title}`,
        referenceId: projectId,
      });
    }

    return this.mapMilestone(milestone);
  }

  async updateMilestone(projectId: string, milestoneId: string, dto: UpdateMilestoneDto, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new ForbiddenException('Only project members can update milestones');

    const milestone = await this.prisma.projectMilestone.findUnique({ where: { id: milestoneId } });
    if (!milestone || milestone.projectId !== projectId) throw new NotFoundException('Milestone not found');

    const isOwner = project.ownerId === userId;

    // Non-owners can only set status to SUBMITTED or IN_PROGRESS
    if (dto.status && !isOwner) {
      if (!['SUBMITTED', 'IN_PROGRESS'].includes(dto.status)) {
        throw new ForbiddenException('Contributors can only set status to SUBMITTED or IN_PROGRESS');
      }
    }

    // Only owner can update assignedContributorId
    if (dto.assignedContributorId !== undefined && !isOwner) {
      throw new ForbiddenException('Only project owner can reassign milestones');
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.assignedRole !== undefined) updateData.assignedRole = dto.assignedRole;
    if (dto.assignedContributorId !== undefined) updateData.assignedContributorId = dto.assignedContributorId;
    if (dto.deliverableExpectation !== undefined) updateData.deliverableExpectation = dto.deliverableExpectation;
    if (dto.status !== undefined) updateData.status = dto.status;

    const updated = await this.prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: updateData,
      include: { assignedContributor: true },
    });

    const meaningfulStatuses = ['SUBMITTED', 'APPROVED', 'COMPLETED', 'IN_PROGRESS'];
    if (dto.status && meaningfulStatuses.includes(dto.status)) {
      await this.touchMeaningfulActivity(projectId);
    }

    return this.mapMilestone(updated);
  }

  async deleteMilestone(projectId: string, milestoneId: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only project owner can delete milestones');

    const milestone = await this.prisma.projectMilestone.findUnique({ where: { id: milestoneId } });
    if (!milestone || milestone.projectId !== projectId) throw new NotFoundException('Milestone not found');

    await this.prisma.projectMilestone.delete({ where: { id: milestoneId } });

    return { deleted: true, milestoneId };
  }

  // ── Deliverables ───────────────────────────────────────────────────────────

  async submitDeliverable(projectId: string, dto: SubmitDeliverableDto, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new ForbiddenException('Only project members can submit deliverables');

    if (dto.milestoneId) {
      const milestone = await this.prisma.projectMilestone.findUnique({ where: { id: dto.milestoneId } });
      if (!milestone || milestone.projectId !== projectId) throw new BadRequestException('Milestone does not belong to this project');
    }

    const deliverable = await this.prisma.projectDeliverable.create({
      data: {
        projectId,
        milestoneId: dto.milestoneId,
        submittedById: userId,
        role: dto.role,
        fileKey: dto.fileKey,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        publicUrl: dto.publicUrl,
        note: dto.note,
        rightsTag: dto.rightsTag ?? 'PROJECT_USE_ALLOWED',
      },
      include: { submittedBy: true },
    });

    // Notify owner (if submitter is not owner)
    if (project.ownerId !== userId) {
      const submitter = await this.prisma.user.findUnique({ where: { id: userId } });
      let milestoneTitle: string | null = null;
      if (dto.milestoneId) {
        const ms = await this.prisma.projectMilestone.findUnique({ where: { id: dto.milestoneId } });
        milestoneTitle = ms?.title ?? null;
      }
      await this.notificationsService.push(project.ownerId, {
        type: 'DELIVERABLE_SUBMITTED',
        title: 'Deliverable submitted',
        body: `${submitter?.displayName ?? 'Someone'} submitted a deliverable${milestoneTitle ? ' for ' + milestoneTitle : ''} on ${project.title}`,
        referenceId: projectId,
      });
    }

    // Update milestone status to SUBMITTED
    if (dto.milestoneId) {
      await this.prisma.projectMilestone.update({
        where: { id: dto.milestoneId },
        data: { status: 'SUBMITTED' },
      });
    }

    await this.touchMeaningfulActivity(projectId);

    return {
      id: deliverable.id,
      projectId: deliverable.projectId,
      milestoneId: deliverable.milestoneId,
      submittedById: deliverable.submittedById,
      submitterName: deliverable.submittedBy.displayName,
      role: deliverable.role,
      fileName: deliverable.fileName,
      fileSize: deliverable.fileSize,
      mimeType: deliverable.mimeType,
      publicUrl: deliverable.publicUrl,
      note: deliverable.note,
      rightsTag: deliverable.rightsTag,
      createdAt: deliverable.createdAt,
    };
  }

  async getDeliverables(projectId: string, userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');

    const isMember = userId && project.members.some((m) => m.userId === userId);
    if (project.visibility === 'PRIVATE' && !isMember) {
      throw new ForbiddenException('This project is private');
    }

    const deliverables = await this.prisma.projectDeliverable.findMany({
      where: { projectId },
      include: { submittedBy: true },
      orderBy: { createdAt: 'desc' },
    });

    const filtered = isMember ? deliverables : deliverables.filter((d) => !!d.publicUrl);

    return filtered.map((d) => ({
      id: d.id,
      projectId: d.projectId,
      milestoneId: d.milestoneId,
      submittedById: d.submittedById,
      submitterName: d.submittedBy.displayName,
      role: d.role,
      fileName: d.fileName,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      publicUrl: d.publicUrl,
      note: d.note,
      rightsTag: d.rightsTag,
      createdAt: d.createdAt,
    }));
  }

  // ── Revisions ──────────────────────────────────────────────────────────────

  async requestRevision(projectId: string, dto: RequestRevisionDto, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only project owner can request revisions');

    const revision = await this.prisma.projectRevisionRequest.create({
      data: {
        projectId,
        milestoneId: dto.milestoneId,
        deliverableId: dto.deliverableId,
        requestedById: userId,
        note: dto.note,
      },
    });

    if (dto.deliverableId) {
      const deliverable = await this.prisma.projectDeliverable.findUnique({ where: { id: dto.deliverableId } });
      if (deliverable) {
        await this.notificationsService.push(deliverable.submittedById, {
          type: 'REVISION_NEEDED',
          title: 'Revision requested',
          body: `Revision needed on your deliverable for ${project.title}`,
          referenceId: projectId,
        });
      }
    }

    if (dto.milestoneId) {
      await this.prisma.projectMilestone.update({
        where: { id: dto.milestoneId },
        data: { status: 'REVISION_REQUESTED' },
      });
    }

    return revision;
  }

  async resolveRevision(projectId: string, revisionId: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only project owner can resolve revisions');

    const revision = await this.prisma.projectRevisionRequest.findUnique({ where: { id: revisionId } });
    if (!revision || revision.projectId !== projectId) throw new NotFoundException('Revision not found');

    const updated = await this.prisma.projectRevisionRequest.update({
      where: { id: revisionId },
      data: { resolvedAt: new Date() },
    });

    // If linked milestone was REVISION_REQUESTED, set it back to IN_PROGRESS
    if (revision.milestoneId) {
      const milestone = await this.prisma.projectMilestone.findUnique({ where: { id: revision.milestoneId } });
      if (milestone && milestone.status === 'REVISION_REQUESTED') {
        await this.prisma.projectMilestone.update({
          where: { id: revision.milestoneId },
          data: { status: 'IN_PROGRESS' },
        });
      }
    }

    return updated;
  }

  // ── Project Messages ───────────────────────────────────────────────────────

  async getProjectMessages(projectId: string, userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');

    const isMember = userId && project.members.some((m) => m.userId === userId);
    if (project.visibility === 'PRIVATE' && !isMember) {
      throw new ForbiddenException('This project is private');
    }

    if (!isMember) return [];

    const messages = await this.prisma.projectMessage.findMany({
      where: { projectId },
      include: { sender: { include: { profile: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      senderId: m.senderId,
      senderName: m.sender.displayName,
      senderHandle: m.sender.profile?.handle,
      senderAvatar: m.sender.profile?.avatarUrl,
      body: m.body,
      linkedMilestoneId: m.linkedMilestoneId,
      linkedDeliverableId: m.linkedDeliverableId,
      createdAt: m.createdAt,
    }));
  }

  async postProjectMessage(projectId: string, dto: PostProjectMessageDto, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new ForbiddenException('Only project members can post messages');

    const message = await this.prisma.projectMessage.create({
      data: {
        projectId,
        senderId: userId,
        body: dto.body,
        linkedMilestoneId: dto.linkedMilestoneId,
        linkedDeliverableId: dto.linkedDeliverableId,
      },
      include: { sender: { include: { profile: true } } },
    });

    return {
      id: message.id,
      projectId: message.projectId,
      senderId: message.senderId,
      senderName: message.sender.displayName,
      senderHandle: message.sender.profile?.handle,
      senderAvatar: message.sender.profile?.avatarUrl,
      body: message.body,
      linkedMilestoneId: message.linkedMilestoneId,
      linkedDeliverableId: message.linkedDeliverableId,
      createdAt: message.createdAt,
    };
  }

  // ── Type Transition ────────────────────────────────────────────────────────

  async transitionProjectType(projectId: string, dto: TransitionTypeDto, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only project owner can change project type');
    if (project.projectType === dto.projectType) throw new BadRequestException('Project is already this type');

    const currentLog: any[] = Array.isArray(project.typeTransitionLog) ? (project.typeTransitionLog as any[]) : [];
    const newEntry = {
      from: project.projectType,
      to: dto.projectType,
      at: new Date().toISOString(),
      note: dto.note ?? null,
    };

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        projectType: dto.projectType,
        typeTransitionLog: [...currentLog, newEntry],
      },
      include: {
        members: { include: { user: { include: { profile: true } } } },
        files: true,
        owner: { include: { profile: true } },
        milestones: { orderBy: { order: 'asc' }, include: { assignedContributor: true } },
        _count: {
          select: {
            applications: { where: { status: 'PENDING' } },
            deliverables: true,
            revisions: { where: { resolvedAt: null } },
          },
        },
      },
    });

    return this.mapProject(updated);
  }

  // ── Member Management ──────────────────────────────────────────────────────

  async leaveProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.ownerId === userId) throw new ForbiddenException('Project owner cannot leave. Transfer ownership first.');

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this project');

    await this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: {
        status: 'LEFT_VOLUNTARILY',
        removedAt: new Date(),
      },
    });

    return { left: true };
  }

  async removeMember(projectId: string, targetUserId: string, data: { note?: string }, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) throw new ForbiddenException('Only project owner can remove members');
    if (targetUserId === userId) throw new BadRequestException('Cannot remove yourself');

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');

    await this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: targetUserId } },
      data: {
        status: 'REMOVED_BY_LEAD',
        removedAt: new Date(),
        removedNote: data.note,
      },
    });

    return { removed: true };
  }

  // ── Mappers ────────────────────────────────────────────────────────────────

  private mapMilestone(m: any) {
    return {
      id: m.id,
      title: m.title,
      description: m.description ?? null,
      dueDate: m.dueDate ?? null,
      assignedRole: m.assignedRole ?? null,
      assignedContributorId: m.assignedContributorId ?? null,
      assignedContributorName: m.assignedContributor?.displayName ?? null,
      deliverableExpectation: m.deliverableExpectation ?? null,
      status: m.status,
      order: m.order,
      createdAt: m.createdAt,
    };
  }

  private mapProject(project: Record<string, unknown>) {
    const p = project as any;
    const members = (p.members || []).map((m: any) => ({
      id: m.id,
      userId: m.userId,
      displayName: m.user?.displayName || 'Unknown',
      handle: m.user?.profile?.handle,
      avatarUrl: m.user?.profile?.avatarUrl,
      role: m.role,
      creativeRole: m.creativeRole ?? null,
      status: m.status ?? 'ACTIVE',
      joinedAt: m.joinedAt,
      removedAt: m.removedAt ?? null,
    }));

    const files = (p.files || []).map((f: any) => ({
      id: f.id,
      fileName: f.fileName,
      fileKey: f.fileKey,
      fileSize: f.fileSize,
      mimeType: f.mimeType,
      publicUrl: f.publicUrl,
      createdAt: f.createdAt,
    }));

    return {
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      visibility: p.visibility,
      projectType: p.projectType ?? 'STRUCTURED',
      localRemote: p.localRemote ?? 'BOTH',
      roughExpectation: p.roughExpectation ?? null,
      commitmentStyle: p.commitmentStyle ?? null,
      expiresAt: p.expiresAt ?? null,
      city: p.city,
      tags: p.tags,
      openRoles: p.openRoles,
      filledRoles: p.filledRoles ?? [],
      ownerId: p.ownerId,
      members,
      files,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      typeTransitionLog: p.typeTransitionLog ?? [],
      completedAt: p.completedAt ?? null,
      bornFromCypherId: p.bornFromCypherId ?? null,
      lifecycleState: p.lifecycleState ?? 'ACTIVE',
      lastMeaningfulActivityAt: p.lastMeaningfulActivityAt ?? null,
      participantCap: p.participantCap ?? null,
      aiDisclosureLabel: p.aiDisclosureLabel ?? null,
      suppressedAt: p.suppressedAt ?? null,
      pendingApplications: p._count?.applications ?? 0,
      milestonesCount: p._count?.milestones ?? (p.milestones?.length ?? 0),
      milestones: (p.milestones ?? []).map((m: any) => this.mapMilestone(m)),
    };
  }
}
