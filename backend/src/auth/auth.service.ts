import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import * as bcryptjs from 'bcryptjs';
import { generateToken, hashToken } from '../common/helpers/crypto.helper';
import { parseDuration } from '../common/helpers/duration.helper';
import { Request } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    if (dto.handle) {
      const handleExists = await this.prisma.profile.findUnique({ where: { handle: dto.handle } });
      if (handleExists) throw new ConflictException('Handle already taken');
    }

    const passwordHash = await bcryptjs.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        profile: {
          create: {
            handle: dto.handle || `@${dto.displayName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
          },
        },
      },
      include: { profile: true },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.createSession(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.rawRefreshToken,
      user: this.mapUser(user),
    };
  }

  async login(dto: LoginDto, req?: Request): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });

    if (!user || user.deletedAt) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcryptjs.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.createSession(user.id, tokens.refreshToken, req);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.rawRefreshToken,
      user: this.mapUser(user),
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; rawRefreshToken: string }> {
    const session = await this.prisma.session.findFirst({
      where: { refreshToken: hashToken(refreshToken) },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: delete the consumed session before issuing new tokens.
    // If an attacker reuses a stolen RT, this delete will still succeed but
    // the legitimate user's next request will fail — detectable theft.
    await this.prisma.session.delete({ where: { id: session.id } });

    const user = session.user;
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.createSession(user.id, tokens.refreshToken);

    return { accessToken: tokens.accessToken, rawRefreshToken: tokens.rawRefreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { refreshToken: hashToken(refreshToken) },
    });
  }

  async getSessions(userId: string): Promise<unknown[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
    });
    return sessions;
  }

  async deleteAllSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, role },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' },
    );

    const rawRefreshToken = generateToken(48);
    const refreshToken = hashToken(rawRefreshToken);

    return { accessToken, rawRefreshToken, refreshToken };
  }

  private async createSession(userId: string, refreshToken: string, req?: Request) {
    const ttlMs = parseDuration(process.env.REFRESH_TOKEN_TTL || '30d');
    await this.prisma.session.create({
      data: { userId, refreshToken, userAgent: req?.headers['user-agent'] || undefined, ipAddress: req?.ip || undefined, expiresAt: new Date(Date.now() + ttlMs) },
    });
  }

  private mapUser(user: { id: string; email: string; displayName: string; role: string; isVerified: boolean; createdAt: Date; profile?: { handle: string; avatarUrl: string | null } | null }): UserResponseDto {
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role, isVerified: user.isVerified, handle: user.profile?.handle, avatarUrl: user.profile?.avatarUrl || undefined, createdAt: user.createdAt };
  }
}
