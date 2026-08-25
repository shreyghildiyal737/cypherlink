import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FadeUp, StaggerChildren, fadeUpVariants } from '../components/ui/motion';
import { motion } from 'framer-motion';
import { discoverableArtists, DiscoverableArtist, ArtistRole } from '../data/discoveryMock';
import { useArtist } from '../hooks/useArtists';
import { useFollowProfile } from '../hooks';
import { useAuthStore } from '../store/authStore';

function mapApiArtist(a: any): DiscoverableArtist & { modules?: { title: string; data: unknown }[] } {
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
    activeProjects: 0,
    lastActive: a.lastActiveAt ? new Date(a.lastActiveAt).toLocaleDateString() : 'Recently',
    trustSignals: a.trustSignals ?? [],
    modules: a.modules ?? [],
  };
}

export default function ArtistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useArtist(id ?? '');
  const user = useAuthStore((s) => s.user);
  const follow = useFollowProfile();
  const [followed, setFollowed] = useState(false);

  const artist = data ? mapApiArtist(data) : (discoverableArtists.find((item) => item.id === id) ?? discoverableArtists[0]);
  const usingMock = !data && !isLoading;

  const backendModules = (artist as any).modules ?? [];
  const modules = backendModules.map((m: any) => ({
    title: m.title,
    body: Array.isArray(m.data) ? m.data.map((d: any) => d.title || d.name || d.topic).filter(Boolean).join(' • ') : '',
  })).filter((m: { body: string }) => m.body);

  function handleFollow() {
    if (!user) { navigate('/login'); return; }
    follow.mutate(artist.id, {
      onSuccess: () => setFollowed(true),
    });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-on-surface-variant/35">
        Loading artist...
      </div>
    );
  }

  const isOwnProfile = user?.id === artist.id;

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      {/* Hero */}
      <FadeUp>
        <section className="glass-panel relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 md:p-10">
          {/* Purple radial bloom */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.12)_0%,transparent_55%)]"
          />
          <div className="relative flex flex-wrap items-end gap-5">
            {/* Avatar */}
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container via-[#6d28d9] to-[#5200b0] text-4xl font-black text-on-surface">
              {artist.avatar}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                {artist.momentum && <Badge tone="muted">{artist.momentum}</Badge>}
                {artist.openToCollab && <Badge tone="green">Open to collab</Badge>}
                {artist.beginnerFriendly && <Badge tone="orange">Beginner friendly</Badge>}
                {artist.verified && <Badge tone="gold">Verified</Badge>}
              </div>
              <h1 className="mt-3 font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] text-on-surface tracking-tight">
                {artist.name}
              </h1>
              <p className="mt-2 font-body-md text-on-surface-variant/50">
                {artist.handle}
                {artist.city && ` • ${artist.city}`}
                {artist.role && ` • ${artist.role}`}
                {artist.languages.length > 0 && ` • ${artist.languages.join(' / ')}`}
              </p>
            </div>
          </div>

          {!isOwnProfile && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/messages">
                <Button>Collaborate</Button>
              </Link>
              <Button
                variant="secondary"
                onClick={handleFollow}
                disabled={followed || follow.isPending}
              >
                {followed ? 'Following ✓' : follow.isPending ? 'Following…' : 'Follow'}
              </Button>
              <Link to="/messages">
                <Button variant="secondary">Message with intent</Button>
              </Link>
              {artist.city && (
                <Link to={`/scenes/${artist.city.toLowerCase()}`}>
                  <Button variant="ghost">Open city scene</Button>
                </Link>
              )}
            </div>
          )}
          {usingMock && (
            <p className="mt-4 font-label-sm text-xs text-on-surface-variant/28">Showing sample profile data.</p>
          )}
        </section>
      </FadeUp>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Module grid */}
        <StaggerChildren className="grid content-start gap-5 md:grid-cols-2">
          {modules.map((module: { title: string; body: string }) => (
            <motion.div
              key={module.title}
              variants={fadeUpVariants}
              className="glass-card rounded-2xl border border-white/[0.06] p-5"
            >
              <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35">{module.title}</p>
              <h2 className="mt-3 font-headline-lg-mobile text-2xl text-on-surface">
                {module.body}
              </h2>
            </motion.div>
          ))}
        </StaggerChildren>

        {/* Sidebar */}
        <aside className="space-y-5">
          <FadeUp delay={0.1}>
            <div className="glass-card rounded-2xl border border-white/[0.06] p-5">
              <h2 className="font-headline-lg-mobile text-on-surface">Artist QR</h2>
              <p className="mt-2 font-body-md text-sm text-on-surface-variant/50">
                Scan to preview, connect, collaborate or save. A creative handshake, not a tracking tool.
              </p>
              <div className="mt-4 grid place-items-center rounded-xl bg-white p-5">
                <QRCodeSVG value={`cypherlink://artist/${artist.id}`} />
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="glass-card rounded-2xl border border-white/[0.06] p-5">
              <h2 className="font-headline-lg-mobile text-on-surface">Visible because it exists</h2>
              <p className="mt-2 font-body-md text-sm text-on-surface-variant/50">
                This profile only shows living modules. No empty form-like sections.
              </p>
            </div>
          </FadeUp>
        </aside>
      </div>
    </div>
  );
}
