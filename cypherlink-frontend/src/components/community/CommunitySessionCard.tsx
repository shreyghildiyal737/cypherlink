import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CauseSession, LearningSession } from '../../data/discoveryMock';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

function isLearning(item: CauseSession | LearningSession): item is LearningSession {
  return 'topic' in item;
}

export function CommunitySessionCard({ session }: { session: CauseSession | LearningSession }) {
  const reduced = useReducedMotion();
  const learning = isLearning(session);

  return (
    <motion.article
      whileHover={reduced ? {} : { scale: 1.012 }}
      whileTap={reduced ? {} : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="glass-card rounded-2xl border border-white/[0.06] p-5 transition-all duration-200 hover:border-primary-container/20"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <Badge tone={learning ? 'green' : 'cyan'}>
          {learning ? 'FREE LEARNING' : 'MUSICIANS FOR A CAUSE'}
        </Badge>
        <span className="font-label-sm text-xs text-on-surface-variant/35">{session.city}</span>
      </div>

      {/* Title */}
      <h3 className="mt-6 font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
        {session.title}
      </h3>

      {/* Description */}
      <p className="mt-2 font-body-md text-sm leading-relaxed text-on-surface-variant/55">
        {learning
          ? `${session.topic} · hosted by ${session.host}. No money charged. Open learning stays free.`
          : session.cause}
      </p>

      {/* Info grid */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
          <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35">When</p>
          <p className="mt-1 font-body-md text-sm font-medium text-on-surface/80">{session.date}</p>
        </div>
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
          <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35">Pulling up</p>
          <p className="mt-1 font-body-md text-sm font-medium text-on-surface/80">{session.pullingUp}</p>
        </div>
      </div>

      {/* Check-in note */}
      <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
        <p className="flex items-center gap-2 font-label-sm text-xs text-on-surface-variant/45">
          <span className="material-symbols-outlined text-sm">qr_code_2</span>
          Optional check-in. No penalty if skipped.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/community/${session.id}`}>
          <Button size="sm">Open session</Button>
        </Link>
        <Button variant="secondary" size="sm">
          <span className="material-symbols-outlined text-sm">volunteer_activism</span>
          Pull up
        </Button>
      </div>
    </motion.article>
  );
}
