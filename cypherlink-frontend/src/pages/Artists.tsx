import { useState } from 'react';
import { ArtistCard } from '../components/artists/ArtistCard';
import { ArtistFilters } from '../components/artists/ArtistFilters';
import { Badge } from '../components/ui/Badge';
import { FadeUp, StaggerChildren } from '../components/ui/motion';
import { discoverableArtists, DiscoverableArtist, ArtistRole } from '../data/discoveryMock';
import { useDiscoverArtists, type ArtistDiscoveryFilters } from '../hooks';

function mapDiscoveryArtist(a: any): DiscoverableArtist & { matchReasons?: string[] } {
  const lastActive = a.lastActiveAt
    ? new Date(a.lastActiveAt).toLocaleDateString()
    : 'Recently';
  return {
    id: a.id,
    name: a.displayName ?? a.handle ?? '',
    handle: a.handle ?? '',
    city: a.city ?? '',
    genres: a.genres ?? [],
    verified: !!a.isVerified,
    momentum: a.momentum ?? 'New Voice',
    avatar: (a.displayName ?? a.handle ?? ' ')[0] ?? ' ',
    role: (a.primaryRole as ArtistRole) ?? 'Rapper',
    languages: a.languages ?? [],
    openToCollab: !!a.openToCollab,
    beginnerFriendly: !!a.beginnerFriendly,
    activeProjects: a.activeProjects ?? 0,
    lastActive,
    trustSignals: a.trustSignals ?? [],
    matchReasons: a.matchReasons,
  };
}

export default function Artists() {
  const [filters, setFilters] = useState<ArtistDiscoveryFilters>({});
  const { data, isLoading, isError } = useDiscoverArtists(filters);
  const apiArtists = ((data?.items ?? []) as any[]).map(mapDiscoveryArtist);
  const artists = apiArtists.length > 0 ? apiArtists : (!isLoading ? discoverableArtists.map((a) => ({ ...a, matchReasons: undefined })) : []);
  const showingMock = apiArtists.length === 0 && !isLoading;

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <FadeUp>
        <Badge tone="purple">Artist discovery without LinkedIn energy</Badge>
        <h1 className="mt-4 max-w-4xl font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] text-on-surface tracking-tight">
          Find artists by sound, city, language, role and trust.
        </h1>
        <p className="mt-4 max-w-2xl font-body-md text-body-md text-on-surface-variant/60">
          Discover people to create with. Momentum comes from participation, not follower obsession.
        </p>
      </FadeUp>

      <div className="mt-8">
        <ArtistFilters onFilter={setFilters} />
      </div>

      {isLoading && (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl glass-card" />
          ))}
        </div>
      )}

      {!isLoading && showingMock && !isError && (
        <p className="mt-6 font-label-sm text-xs text-on-surface-variant/28">
          Showing sample artists — real scene data fills in as artists join.
        </p>
      )}

      {!isLoading && (
        <StaggerChildren className="mt-8 grid gap-5 md:grid-cols-2">
          {artists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              matchReasons={(artist as any).matchReasons}
            />
          ))}
        </StaggerChildren>
      )}

      {!isLoading && artists.length === 0 && (
        <div className="mt-16 rounded-2xl border border-primary-container/10 glass-panel p-10 text-center">
          <p className="font-semibold text-on-surface-variant/50">
            No artists found with these filters.
          </p>
          <p className="mt-2 font-body-md text-sm text-on-surface-variant/28">
            Try broadening your search.
          </p>
        </div>
      )}
    </div>
  );
}
