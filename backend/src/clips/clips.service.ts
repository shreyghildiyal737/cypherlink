import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateClipDto } from './dto/create-clip.dto';

@Injectable()
export class ClipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClipDto, userId: string) {
    // Validate FK existence so we never store a dangling reference.
    if (dto.cypherId) {
      const cypher = await this.prisma.cypher.findUnique({
        where: { id: dto.cypherId },
        select: { id: true, title: true, deletedAt: true },
      });
      if (!cypher || cypher.deletedAt) {
        throw new BadRequestException('Linked cypher not found');
      }
    }
    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
        select: { id: true, title: true, deletedAt: true },
      });
      if (!project || project.deletedAt) {
        throw new BadRequestException('Linked project not found');
      }
    }
    if (dto.communitySessionId) {
      const session = await this.prisma.communitySession.findUnique({
        where: { id: dto.communitySessionId },
        select: { id: true, title: true },
      });
      if (!session) {
        throw new BadRequestException('Linked community session not found');
      }
    }

    const clip = await this.prisma.clip.create({
      data: {
        creatorId: userId,
        city: dto.city,
        reason: dto.reason,
        caption: dto.caption,
        projectTitle: dto.projectTitle,
        mediaUrl: dto.mediaUrl,
        cypherId: dto.cypherId,
        projectId: dto.projectId,
        communitySessionId: dto.communitySessionId,
      },
    });
    return clip;
  }

  async findByCypher(cypherId: string) {
    const cypher = await this.prisma.cypher.findUnique({
      where: { id: cypherId },
      select: { id: true, deletedAt: true },
    });
    if (!cypher || cypher.deletedAt) throw new NotFoundException('Cypher not found');

    return this.prisma.clip.findMany({
      where: { cypherId },
      orderBy: { createdAt: 'desc' },
      include: { creator: { include: { profile: true } } },
    });
  }

  async findByProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, deletedAt: true, visibility: true },
    });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
    if (project.visibility === 'PRIVATE') {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.clip.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: { creator: { include: { profile: true } } },
    });
  }
}
