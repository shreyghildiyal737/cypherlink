import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from '../ui/Badge';
import { fadeUpVariants } from '../ui/motion';

export function DiscoverPortalCard({ eyebrow, title, body, to, tone = 'muted' }: {
  eyebrow: string;
  title: string;
  body: string;
  to: string;
  tone?: 'muted' | 'cyan' | 'orange' | 'green' | 'purple';
}) {
  const reduced = useReducedMotion();

  return (
    <motion.article
      variants={fadeUpVariants}
      whileHover={reduced ? {} : { scale: 1.012 }}
      whileTap={reduced ? {} : { scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="glass-panel relative overflow-hidden rounded-2xl border border-primary-container/10 p-6 transition-all duration-200 hover:border-primary-container/25 hover:shadow-[0_8px_32px_rgba(124,58,237,0.12)]"
    >
      {/* Subtle radial bloom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.10),transparent_55%)]"
      />

      <div className="relative flex h-full flex-col">
        <Badge tone={tone}>{eyebrow}</Badge>
        <h3 className="mt-8 font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
          {title}
        </h3>
        <p className="mt-3 flex-1 font-body-md text-sm leading-relaxed text-on-surface-variant/55">{body}</p>
        <Link
          to={to}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 font-label-sm text-sm font-semibold text-on-surface/70 transition hover:border-primary-container/30 hover:bg-primary-container/10 hover:text-on-surface"
        >
          Open
          <span className="material-symbols-outlined text-sm">arrow_outward</span>
        </Link>
      </div>
    </motion.article>
  );
}
