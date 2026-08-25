import { useParams, Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FadeUp } from '../components/ui/motion';
import { useAuthStore } from '../store/authStore';
import { ArtistCard } from '../components/artists/ArtistCard';
import { ProjectCard } from '../components/cards/ProjectCard';
import { CypherCard } from '../components/cards/CypherCard';
import { CommunitySessionCard } from '../components/community/CommunitySessionCard';
import { discoverableArtists, scenes, causeSessions, DiscoverableArtist, ArtistRole, CauseSession } from '../data/discoveryMock';
import { useScene } from '../hooks/useScenes';
import { mapCypher, mapProject } from '../services/mappers';
import { useMyScenes, useFollowScene, useUnfollowScene } from '../hooks';

function mapApiArtist(a: any): DiscoverableArtist {
  return {
    id: a.id,
    name: a.displayName ?? a.handle ?? '',
    handle: a.handle ?? '',
    city: '',
    genres: [],
    verified: !!a.isVerified,
    momentum: a.momentum ?? 'New Voice',
    avatar: (a.displayName ?? a.handle ?? ' ')[0] ?? ' ',
    role: (a.primaryRole as ArtistRole) ?? 'Rapper',
    languages: [],
    openToCollab: !!a.openToCollab,
    beginnerFriendly: false,
    activeProjects: 0,
    lastActive: 'Recently',
    trustSignals: [],
  };
}

function mapApiCause(s: any): CauseSession {
  const typeMap: Record<string, CauseSession['type']> = {
    CLEANUP: 'cleanup',
    RELIEF: 'relief',
    TEACHING: 'teaching',
    ARTIST_SUPPORT: 'artist-support',
    COMMUNITY_HELP: 'community-help',
  };
  return {
    id: s.id,
    title: s.title,
    city: '',
    cause: s.topic ?? '',
    type: typeMap[s.type] ?? 'community-help',
    date: s.startsAt ? new Date(s.startsAt).toLocaleDateString() : 'TBD',
    pullingUp: s.pullingUp ?? 0,
    safetyTags: [],
  };
}

export default function ScenePage() {
  const { city } = useParams();
  const { data, isLoading } = useScene(city ?? '');
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { data: myScenes } = useMyScenes();
  const followScene = useFollowScene();
  const unfollowScene = useUnfollowScene();
  const followed = isLoggedIn && (myScenes ?? []).includes(city ?? '');

  const fallback = scenes.find((item) => item.city.toLowerCase() === city?.toLowerCase()) ?? scenes[0];

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center font-body-md text-on-surface-variant/35">
        Loading {city}…
      </div>
    );
  }

  const apiArtists = ((data?.activeArtists ?? []) as any[]).map(mapApiArtist);
  const apiProjects = ((data?.openProjects ?? []) as any[]).map(mapProject);
  const apiCyphers = ((data?.upcomingCyphers ?? []) as any[]).map(mapCypher);
  const apiCauses = ((data?.communitySessions ?? []) as any[]).map(mapApiCause);

  const heroCity = data?.city ?? fallback.city;
  const subtitle = data
    ? `${apiArtists.length} active artists • ${apiCyphers.length} cyphers • ${apiCauses.length} community moves`
    : fallback.subtitle;
  const genres: string[] = data?.risingGenres ?? fallback.dominantGenres;

  const cityArtists = apiArtists.length > 0 ? apiArtists : discoverableArtists.filter((artist) => artist.city === fallback.city);
  const cityProjects = apiProjects;
  const cityCyphers = apiCyphers;
  const cityCommunity = apiCauses.length > 0 ? apiCauses : causeSessions.filter((s) => s.city === fallback.city);

  const today = new Date();
  const activeCyphers = cityCyphers.filter((c) => c.state === "active");
  const todayCyphers = cityCyphers.filter((c) => {
    if (c.state !== "upcoming" || !c.startsAt) return false;
    const d = new Date(c.startsAt);
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  });
  const hasScenePulse = activeCyphers.length > 0 || todayCyphers.length > 0;

  const lookingToCollab = cityArtists.filter((a: any) => a.openToCollab);
  const sceneIsEmpty = cityArtists.length === 0 && cityProjects.length === 0 && cityCyphers.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      {/* Hero */}
      <FadeUp>
        <section className="glass-panel relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 md:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.12)_0%,transparent_55%)]"
          />
          <div className="relative">
            <div className="flex items-center gap-3">
              <Badge tone="muted">Scene</Badge>
              {hasScenePulse && (
                <span className="flex items-center gap-1.5 font-body-md text-sm text-error">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-error" />
                  Active now
                </span>
              )}
            </div>
            <h1 className="mt-5 max-w-4xl font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] tracking-tight text-on-surface">
              {heroCity} scene
            </h1>
            <p className="mt-4 max-w-2xl font-body-md text-on-surface-variant/50">{subtitle}</p>
            {genres.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {genres.map((genre) => <Badge key={genre} tone="muted">{genre}</Badge>)}
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              {isLoggedIn ? (
                <Button
                  onClick={() => {
                    if (followed) {
                      unfollowScene.mutate(city ?? '');
                    } else {
                      followScene.mutate(city ?? '');
                    }
                  }}
                  variant={followed ? "secondary" : "primary"}
                  disabled={followScene.isPending || unfollowScene.isPending}
                >
                  {followed ? `Tapped into ${heroCity}` : "Follow scene"}
                </Button>
              ) : (
                <Link to="/login">
                  <Button variant="secondary">Follow scene</Button>
                </Link>
              )}
              <Link to="/create/cypher?type=open">
                <Button variant="secondary">Start something here</Button>
              </Link>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* Scene pulse */}
      {hasScenePulse && (
        <section className="mt-8 rounded-2xl border border-error/20 bg-error/05 p-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-error" />
            <h2 className="font-headline-lg-mobile font-semibold text-primary-fixed-dim">
              {activeCyphers.length > 0 ? "Happening right now" : "Today in this scene"}
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {[...activeCyphers, ...todayCyphers].slice(0, 3).map((c) => (
              <Link
                key={c.id}
                to={`/cyphers/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 transition hover:border-primary-container/20"
              >
                <div>
                  <p className="font-body-md font-semibold text-on-surface">{c.title}</p>
                  {c.startsAt && (
                    <p className="font-label-sm text-xs text-on-surface-variant/40">
                      {new Date(c.startsAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      {c.venue ? ` · ${c.venue}` : ""}
                    </p>
                  )}
                </div>
                <span className="font-label-sm text-sm text-on-surface-variant/50">{c.pullingUp} pulling up →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Looking to collaborate */}
      {lookingToCollab.length > 0 && (
        <section className="mt-10">
          <h2 className="font-headline-lg-mobile text-2xl font-semibold text-on-surface">Looking to collaborate</h2>
          <p className="mt-1 font-body-md text-on-surface-variant/50">Artists in this scene open to working with you.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lookingToCollab.slice(0, 6).map((artist: any) => (
              <Link
                key={artist.id}
                to={`/profile/${artist.id}`}
                className="glass-card flex items-center gap-3 rounded-2xl border border-white/[0.06] p-4 transition hover:border-primary-container/20 hover:shadow-[0_0_24px_rgba(124,58,237,0.08)]"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-container via-[#6d28d9] to-[#5200b0] text-sm font-black text-on-surface">
                  {artist.avatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-body-md font-semibold text-on-surface">{artist.name}</p>
                  <p className="truncate font-label-sm text-xs text-on-surface-variant/50">
                    {artist.role}{artist.momentum && artist.momentum !== "New Voice" ? ` · ${artist.momentum}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sceneIsEmpty ? (
        <div className="glass-card mt-16 rounded-2xl border border-white/[0.06] p-10 text-center">
          <p className="font-headline-lg-mobile text-2xl font-semibold text-on-surface">This scene is still warming up.</p>
          <p className="mt-3 font-body-md text-on-surface-variant/50">
            Be the first to build something here. Start a project, drop a clip, or call a cypher.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/create">
              <Button>Start something</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {cityArtists.length > 0 && (
            <section className="mt-10">
              <h2 className="font-headline-lg-mobile text-3xl font-semibold text-on-surface">Artists in this scene</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {cityArtists.slice(0, 4).map((artist) => <ArtistCard key={artist.id} artist={artist} />)}
              </div>
            </section>
          )}
          {cityProjects.length > 0 && (
            <section className="mt-12">
              <h2 className="font-headline-lg-mobile text-3xl font-semibold text-on-surface">Open projects</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {cityProjects.slice(0, 4).map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
            </section>
          )}
          {cityCyphers.length > 0 && (
            <section className="mt-12">
              <h2 className="font-headline-lg-mobile text-3xl font-semibold text-on-surface">Cyphers</h2>
              <div className="mt-5 grid gap-5">
                {cityCyphers.slice(0, 3).map((cypher) => <CypherCard key={cypher.id} cypher={cypher} />)}
              </div>
            </section>
          )}
          {cityCommunity.length > 0 && (
            <section className="mt-12">
              <h2 className="font-headline-lg-mobile text-3xl font-semibold text-on-surface">Community moves</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {cityCommunity.slice(0, 4).map((session) => <CommunitySessionCard key={session.id} session={session} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
