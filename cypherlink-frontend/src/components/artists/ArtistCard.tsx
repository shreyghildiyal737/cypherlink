import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { DiscoverableArtist } from '../../data/discoveryMock';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ArtistCardProps {
  artist: DiscoverableArtist;
  matchReasons?: string[];
  collaboratedBefore?: boolean;
}

export function ArtistCard({ artist, matchReasons, collaboratedBefore }: ArtistCardProps) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      whileHover={reduced ? {} : { scale: 1.012 }}
      whileTap={reduced ? {} : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="glass-card rounded-2xl border border-white/[0.06] p-5 transition-all duration-200 hover:border-primary-container/20 hover:shadow-[0_0_20px_rgba(124,58,237,0.08)]"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-primary-container via-[#6d28d9] to-[#5200b0] text-xl font-black text-on-surface">
          {artist.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {artist.name}
            </h3>
            {artist.verified && (
              <span className="material-symbols-outlined text-base text-tertiary" aria-label="Verified">verified</span>
            )}
          </div>
          <p className="mt-0.5 font-label-sm text-sm text-on-surface-variant/45">
            {artist.handle}
            {artist.city ? ` · ${artist.city}` : ""}
          </p>
          <p className="mt-1 font-body-md text-sm text-on-surface-variant/60">
            {artist.role}
            {artist.languages?.length ? ` · ${artist.languages.join(' / ')}` : ""}
          </p>
          {artist.momentum && (
            <div className="mt-2">
              <Badge tone="muted">{artist.momentum}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Genre chips */}
      {artist.genres?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {artist.genres.slice(0, 4).map((genre) => (
            <Badge key={genre} tone="muted">{genre}</Badge>
          ))}
          {artist.openToCollab && <Badge tone="cyan">Open to collab</Badge>}
          {artist.beginnerFriendly && <Badge tone="green">Beginner friendly</Badge>}
        </div>
      )}

      {/* Match reasons — why this creator surfaces for you */}
      {matchReasons && matchReasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchReasons.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 rounded-full border border-primary-container/20 bg-primary-container/08 px-2.5 py-0.5 font-label-sm text-[10px] text-primary-fixed-dim/80"
            >
              {r}
            </span>
          ))}
          {collaboratedBefore && (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-500/25 bg-green-500/08 px-2.5 py-0.5 font-label-sm text-[10px] text-green-400/80">
              Collaborated before
            </span>
          )}
        </div>
      )}

      {/* Trust signals */}
      {artist.trustSignals?.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
          <p className="font-label-sm text-xs text-on-surface-variant/35">Why they show up</p>
          <p className="mt-1 font-body-md text-sm text-on-surface-variant/70">
            {artist.trustSignals.join(' · ')}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
          <p className="text-lg font-bold text-on-surface">{artist.activeProjects}</p>
          <p className="font-label-sm text-xs text-on-surface-variant/50">projects</p>
        </div>
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
          <p className="font-body-md text-sm font-semibold text-on-surface/80">{artist.lastActive}</p>
          <p className="font-label-sm text-xs text-on-surface-variant/50">last active</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/artists/${artist.id}`}>
          <Button size="sm">View profile</Button>
        </Link>
        <Button variant="secondary" size="sm">
          <span className="material-symbols-outlined text-sm">person_add</span>
          Connect
        </Button>
        <Button variant="ghost" size="sm">
          <span className="material-symbols-outlined text-sm">forum</span>
          Intent DM
        </Button>
      </div>
    </motion.article>
  );
}
