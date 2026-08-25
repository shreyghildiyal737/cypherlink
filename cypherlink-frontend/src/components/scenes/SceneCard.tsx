import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Scene } from '../../data/discoveryMock';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function SceneCard({ scene }: { scene: Scene }) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      whileHover={reduced ? {} : { scale: 1.012 }}
      whileTap={reduced ? {} : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="glass-card relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 transition-all duration-200 hover:border-primary-container/20 hover:shadow-[0_0_24px_rgba(124,58,237,0.10)]"
    >
      {/* Subtle radial bg bloom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.07),transparent_55%)]"
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <Badge tone="muted">{scene.momentum}</Badge>
          <p className="flex items-center gap-1 font-label-sm text-xs text-on-surface-variant/35">
            <span className="material-symbols-outlined text-sm">location_on</span>
            {scene.region}
          </p>
        </div>

        {/* Scene name */}
        <h3 className="mt-6 font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
          {scene.title}
        </h3>
        <p className="mt-2 font-body-md text-sm leading-relaxed text-on-surface-variant/55">
          {scene.subtitle}
        </p>

        {/* Genre tags */}
        {scene.dominantGenres?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {scene.dominantGenres.map((genre) => (
              <Badge key={genre} tone="muted">{genre}</Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <p className="text-2xl font-bold text-on-surface">{scene.activeArtists}</p>
            <p className="mt-0.5 font-label-sm text-xs text-on-surface-variant/45">artists</p>
          </div>
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <p className="text-2xl font-bold text-on-surface">{scene.openProjects}</p>
            <p className="mt-0.5 font-label-sm text-xs text-on-surface-variant/45">open projects</p>
          </div>
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <p className="text-2xl font-bold text-on-surface">{scene.upcomingCyphers}</p>
            <p className="mt-0.5 font-label-sm text-xs text-on-surface-variant/45">cyphers</p>
          </div>
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <p className="text-2xl font-bold text-on-surface">{scene.communitySessions}</p>
            <p className="mt-0.5 font-label-sm text-xs text-on-surface-variant/45">community</p>
          </div>
        </div>

        <Link to={`/scenes/${scene.city.toLowerCase()}`}>
          <Button className="mt-5 w-full">Enter scene</Button>
        </Link>
      </div>
    </motion.article>
  );
}
