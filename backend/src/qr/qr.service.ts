import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { parseDuration } from '../common/helpers/duration.helper';

@Injectable()
export class QrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async getProfileToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');

    const ttlMs = parseDuration(process.env.PROFILE_QR_TTL || '30d');
    const expiresAt = new Date(Date.now() + ttlMs);

    // Signed, stateless token — verifiable on scan without DB write.
    // Uses JWT_ACCESS_SECRET so revocation requires rotating that secret,
    // which is acceptable for a profile-preview handshake.
    const profileToken = await this.jwtService.signAsync(
      { sub: userId, kind: 'profile-qr' },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: Math.floor(ttlMs / 1000),
      },
    );

    return {
      profileToken,
      profileUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile/${userId}`,
      expiresAt,
      user: {
        id: user.id,
        displayName: user.displayName,
        handle: user.profile?.handle,
        avatarUrl: user.profile?.avatarUrl,
      },
    };
  }

  async scanProfile(profileToken: string) {
    let payload: { sub: string; kind: string };
    try {
      payload = await this.jwtService.verifyAsync(profileToken, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new BadRequestException('Invalid or expired profile QR');
    }

    if (payload.kind !== 'profile-qr') {
      throw new BadRequestException('Not a profile QR token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true },
    });
    if (!user || user.deletedAt) throw new NotFoundException('User no longer exists');

    return {
      success: true,
      scannedAt: new Date().toISOString(),
      profile: {
        id: user.id,
        displayName: user.displayName,
        handle: user.profile?.handle,
        avatarUrl: user.profile?.avatarUrl,
        city: user.profile?.city,
        primaryRole: user.profile?.primaryRole,
        genres: user.profile?.genres ?? [],
        isVerified: user.isVerified,
        openToCollab: user.profile?.openToCollab ?? false,
      },
    };
  }
}
