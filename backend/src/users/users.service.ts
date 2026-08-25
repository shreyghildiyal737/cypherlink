import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
    // Never return the password hash — strip it regardless of caller.
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateProfile(userId: string, data: {
    displayName?: string;
    bio?: string;
    city?: string;
    genres?: string[];
    avatarUrl?: string;
    locationVisibility?: string;
    dmPrivacy?: string;
    handle?: string;
    primaryRole?: string;
    secondaryRoles?: string[];
    openToCollab?: boolean;
    beginnerFriendly?: boolean;
    languages?: string[];
    availabilityStatus?: string;
    collaborationCapacity?: number | null;
    lookingFor?: string[];
    localRemotePreference?: string;
    collaborationIntent?: string;
  }) {
    const user = await this.findById(userId);

    if (data.handle) {
      const existing = await this.prisma.profile.findUnique({ where: { handle: data.handle } });
      if (existing && existing.userId !== userId) throw new ConflictException('Handle already taken');
    }

    const profileData: Record<string, unknown> = {};
    if (data.bio !== undefined) profileData.bio = data.bio;
    if (data.city !== undefined) profileData.city = data.city;
    if (data.genres !== undefined) profileData.genres = data.genres;
    if (data.avatarUrl !== undefined) profileData.avatarUrl = data.avatarUrl;
    if (data.locationVisibility !== undefined) profileData.locationVisibility = data.locationVisibility;
    if (data.handle !== undefined) profileData.handle = data.handle;
    if (data.primaryRole !== undefined) profileData.primaryRole = data.primaryRole;
    if (data.secondaryRoles !== undefined) profileData.secondaryRoles = data.secondaryRoles;
    if (data.openToCollab !== undefined) profileData.openToCollab = data.openToCollab;
    if (data.beginnerFriendly !== undefined) profileData.beginnerFriendly = data.beginnerFriendly;
    if (data.languages !== undefined) profileData.languages = data.languages;
    if (data.availabilityStatus !== undefined) profileData.availabilityStatus = data.availabilityStatus;
    if (data.collaborationCapacity !== undefined) profileData.collaborationCapacity = data.collaborationCapacity;
    if (data.lookingFor !== undefined) profileData.lookingFor = data.lookingFor;
    if (data.localRemotePreference !== undefined) profileData.localRemotePreference = data.localRemotePreference;
    if (data.collaborationIntent !== undefined) profileData.collaborationIntent = data.collaborationIntent;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        profile: { update: profileData },
      },
    });

    return this.findById(userId);
  }

  async getContributionStats(userId: string) {
    const [projectCount, cypherCount, sessionCount] = await Promise.all([
      this.prisma.projectMember.count({ where: { userId } }),
      this.prisma.cypherCheckIn.count({ where: { userId } }),
      this.prisma.communitySessionRSVP.count({ where: { userId, checkedInAt: { not: null } } }),
    ]);
    return { projectCount, cypherCount, sessionCount };
  }

  async followScene(userId: string, city: string) {
    const user = await this.findById(userId);
    const profile = user.profile;
    if (!profile) throw new NotFoundException('Profile not found');

    const normalized = city.trim();
    if (profile.followedScenes.includes(normalized)) {
      return { message: 'Already following', city: normalized };
    }

    await this.prisma.profile.update({
      where: { userId },
      data: { followedScenes: [...profile.followedScenes, normalized] },
    });

    return { message: 'Scene followed', city: normalized };
  }

  async unfollowScene(userId: string, city: string) {
    const user = await this.findById(userId);
    const profile = user.profile;
    if (!profile) throw new NotFoundException('Profile not found');

    const normalized = city.trim();
    await this.prisma.profile.update({
      where: { userId },
      data: { followedScenes: profile.followedScenes.filter((c: string) => c !== normalized) },
    });

    return { message: 'Scene unfollowed', city: normalized };
  }

  async getFollowedScenes(userId: string) {
    const user = await this.findById(userId);
    return { scenes: user.profile?.followedScenes ?? [] };
  }

  async follow(targetId: string, followerId: string) {
    if (targetId === followerId) throw new ConflictException('Cannot follow yourself');
    await this.findById(targetId);

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: targetId } },
    });
    if (existing) throw new ConflictException('Already following this user');

    return this.prisma.follow.create({
      data: { followerId, followingId: targetId },
    });
  }

  async unfollow(targetId: string, followerId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: targetId } },
    });
    if (!existing) throw new NotFoundException('Not following this user');

    await this.prisma.follow.delete({ where: { id: existing.id } });
    return { message: 'Unfollowed successfully' };
  }
}
