import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ScenesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // Aggregate scene data by city from existing records.
    const [profileCities, projectCities, cypherCities, sessionCities] = await Promise.all([
      this.prisma.profile.groupBy({ by: ['city'], _count: { id: true }, where: { city: { not: null } } }),
      this.prisma.project.groupBy({ by: ['city'], _count: { id: true }, where: { city: { not: null }, deletedAt: null, visibility: { in: ['DISCOVERABLE', 'OPEN'] } } }),
      this.prisma.cypher.groupBy({ by: ['city'], _count: { id: true }, where: { deletedAt: null, state: { in: ['UPCOMING', 'ACTIVE'] } } }),
      this.prisma.communitySession.groupBy({ by: ['city'], _count: { id: true }, where: { state: { in: ['UPCOMING', 'ACTIVE'] } } }),
    ]);

    const cities = [...new Set(profileCities.map((r) => r.city).filter(Boolean) as string[])];

    return cities.map((city) => ({
      city,
      activeArtists: profileCities.find((r) => r.city === city)?._count.id ?? 0,
      openProjects: projectCities.find((r) => r.city === city)?._count.id ?? 0,
      upcomingCyphers: cypherCities.find((r) => r.city === city)?._count.id ?? 0,
      communitySessions: sessionCities.find((r) => r.city === city)?._count.id ?? 0,
    })).sort((a, b) => b.activeArtists - a.activeArtists);
  }

  async findByCity(city: string) {
    const normalizedCity = city.trim();

    const [artists, projects, cyphers, sessions] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null, profile: { city: { equals: normalizedCity, mode: 'insensitive' } } },
        take: 12,
        include: { profile: true },
        orderBy: { profile: { lastActiveAt: 'desc' } },
      }),
      this.prisma.project.findMany({
        where: { deletedAt: null, city: { contains: normalizedCity, mode: 'insensitive' }, visibility: { in: ['DISCOVERABLE', 'OPEN'] } },
        take: 6,
        include: { _count: { select: { members: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.cypher.findMany({
        where: { deletedAt: null, city: { contains: normalizedCity, mode: 'insensitive' }, state: { in: ['UPCOMING', 'ACTIVE'] } },
        take: 5,
        include: { _count: { select: { rsvps: true } } },
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.communitySession.findMany({
        where: { city: { contains: normalizedCity, mode: 'insensitive' }, state: { in: ['UPCOMING', 'ACTIVE'] } },
        take: 5,
        include: { _count: { select: { rsvps: true } } },
        orderBy: { startsAt: 'asc' },
      }),
    ]);

    if (!artists.length && !projects.length && !cyphers.length && !sessions.length) {
      throw new NotFoundException(`No scene data found for city: ${normalizedCity}`);
    }

    const allGenres = artists.flatMap((u) => u.profile?.genres ?? []);
    const genreCounts = allGenres.reduce<Record<string, number>>((acc, g) => { acc[g] = (acc[g] ?? 0) + 1; return acc; }, {});
    const risingGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    return {
      city: normalizedCity,
      activeArtists: artists.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        isVerified: u.isVerified,
        handle: u.profile?.handle,
        avatarUrl: u.profile?.avatarUrl,
        primaryRole: u.profile?.primaryRole,
        momentum: u.profile?.momentum,
        openToCollab: u.profile?.openToCollab ?? false,
      })),
      openProjects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        tags: p.tags,
        openRoles: p.openRoles,
        memberCount: p._count.members,
      })),
      upcomingCyphers: cyphers.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        state: c.state,
        venue: c.venue,
        startsAt: c.startsAt,
        pullingUp: c._count.rsvps,
      })),
      communitySessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        freeLearning: s.freeLearning,
        startsAt: s.startsAt,
        pullingUp: s._count.rsvps,
      })),
      risingGenres,
    };
  }
}
