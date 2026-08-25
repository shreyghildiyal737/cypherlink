import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ProjectsService — file removal', () => {
  let service: ProjectsService;

  const mockPrisma = {
    projectFile: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    project: { findUnique: jest.fn() },
  };

  const mockUpload = {
    deleteObjects: jest.fn(),
  };

  const mockNotifications = {
    push: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UploadService, useValue: mockUpload },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get<ProjectsService>(ProjectsService);
  });

  it('404s when the file does not belong to the project', async () => {
    mockPrisma.projectFile.findUnique.mockResolvedValue({
      id: 'f1',
      projectId: 'other-project',
      fileKey: 'k',
      uploaderId: 'u1',
    });
    await expect(service.removeFile('p1', 'f1', 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lets the uploader remove their own file', async () => {
    mockPrisma.projectFile.findUnique.mockResolvedValue({
      id: 'f1',
      projectId: 'p1',
      fileKey: 'projects/p1/abc',
      uploaderId: 'u-uploader',
    });
    mockPrisma.project.findUnique.mockResolvedValue({ ownerId: 'u-owner' });
    mockPrisma.projectFile.delete.mockResolvedValue({});
    mockUpload.deleteObjects.mockResolvedValue(undefined);

    const result = await service.removeFile('p1', 'f1', 'u-uploader');
    expect(result).toEqual({ removed: true, fileId: 'f1' });
    expect(mockPrisma.projectFile.delete).toHaveBeenCalled();
    expect(mockUpload.deleteObjects).toHaveBeenCalledWith(['projects/p1/abc']);
  });

  it('lets the project owner remove any file', async () => {
    mockPrisma.projectFile.findUnique.mockResolvedValue({
      id: 'f1',
      projectId: 'p1',
      fileKey: 'k',
      uploaderId: 'u-other',
    });
    mockPrisma.project.findUnique.mockResolvedValue({ ownerId: 'u-owner' });
    mockPrisma.projectFile.delete.mockResolvedValue({});

    await expect(service.removeFile('p1', 'f1', 'u-owner')).resolves.toEqual({
      removed: true,
      fileId: 'f1',
    });
  });

  it('rejects non-uploader non-owner removal attempts', async () => {
    mockPrisma.projectFile.findUnique.mockResolvedValue({
      id: 'f1',
      projectId: 'p1',
      fileKey: 'k',
      uploaderId: 'u-other',
    });
    mockPrisma.project.findUnique.mockResolvedValue({ ownerId: 'u-owner' });

    await expect(service.removeFile('p1', 'f1', 'u-third')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(mockPrisma.projectFile.delete).not.toHaveBeenCalled();
  });

  it('swallows storage errors so the DB row still gets removed', async () => {
    mockPrisma.projectFile.findUnique.mockResolvedValue({
      id: 'f1',
      projectId: 'p1',
      fileKey: 'k',
      uploaderId: 'u-uploader',
    });
    mockPrisma.project.findUnique.mockResolvedValue({ ownerId: 'u-owner' });
    mockPrisma.projectFile.delete.mockResolvedValue({});
    mockUpload.deleteObjects.mockRejectedValue(new Error('S3 down'));

    await expect(service.removeFile('p1', 'f1', 'u-uploader')).resolves.toEqual({
      removed: true,
      fileId: 'f1',
    });
  });
});
