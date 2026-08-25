import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FadeUp } from '../components/ui/motion';
import { CommunitySessionCard } from '../components/community/CommunitySessionCard';
import { causeSessions as mockCauses, learningSessions as mockLearning, CauseSession, LearningSession } from '../data/discoveryMock';
import { useCommunity } from '../hooks/useCommunity';
import { useLearningSessions } from '../hooks/useLearningSessions';
import { Link } from 'react-router-dom';

function fmtDate(iso?: string) {
  if (!iso) return 'TBD';
  try {
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return 'TBD';
  }
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
    city: s.city,
    cause: s.description ?? s.topic ?? '',
    type: typeMap[s.type] ?? 'community-help',
    date: fmtDate(s.startsAt),
    pullingUp: s.pullingUp ?? 0,
    safetyTags: s.safetyTags ?? [],
  };
}

function mapApiLearning(s: any): LearningSession {
  const level: LearningSession['level'] =
    s.level === 'beginner' ? 'Beginner Friendly' :
    s.level === 'intermediate' ? 'Intermediate' :
    'Open to All';
  return {
    id: s.id,
    title: s.title,
    city: s.city,
    host: s.host?.displayName ?? 'Host',
    topic: s.topic ?? '',
    level,
    date: fmtDate(s.startsAt),
    pullingUp: s.pullingUp ?? 0,
    free: true,
  };
}

export default function Community() {
  const { data: rawSessions, isLoading: loadingCauses } = useCommunity();
  const { data: rawLearning, isLoading: loadingLearning } = useLearningSessions();

  const apiCauses = Array.isArray(rawSessions)
    ? rawSessions.filter((s: any) => !s.freeLearning).map(mapApiCause)
    : [];
  const apiLearning = Array.isArray(rawLearning) ? rawLearning.map(mapApiLearning) : [];

  const causes = apiCauses.length > 0 ? apiCauses : mockCauses;
  const learning = apiLearning.length > 0 ? apiLearning : mockLearning;
  const showingCausesMock = apiCauses.length === 0 && !loadingCauses;
  const showingLearningMock = apiLearning.length === 0 && !loadingLearning;

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <FadeUp>
        <Badge tone="green">Musicians as communities</Badge>
        <h1 className="mt-4 max-w-4xl font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] text-on-surface tracking-tight">
          Create, learn, help and show up beyond the stage.
        </h1>
        <p className="mt-4 max-w-2xl font-body-md text-body-md text-on-surface-variant/60">
          Cleanup drives, artist support, free learning, relief work and beginner-friendly collaboration.
          No paid teaching marketplace. No pressure. Optional check-ins only.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/create/community">
            <Button>Create community session</Button>
          </Link>
          <Link to="/create/community">
            <Button variant="secondary">Start free learning circle</Button>
          </Link>
        </div>
      </FadeUp>

      {/* Musicians for a cause */}
      <section className="mt-12">
        <FadeUp>
          <div className="mb-5">
            <p className="font-label-sm text-[10px] uppercase tracking-widest text-primary/70">Musicians for a cause</p>
            <h2 className="mt-1 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              People showing up for their city
            </h2>
            {showingCausesMock && (
              <p className="mt-2 font-label-sm text-xs text-on-surface-variant/28">
                Showing sample sessions — real community fills in as organizers post.
              </p>
            )}
          </div>
        </FadeUp>

        {loadingCauses ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl glass-card" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {causes.map((session) => <CommunitySessionCard key={session.id} session={session} />)}
          </div>
        )}
      </section>

      {/* Free learning */}
      <section className="mt-12">
        <FadeUp>
          <div className="mb-5">
            <p className="font-label-sm text-[10px] uppercase tracking-widest text-tertiary/70">Free learning</p>
            <h2 className="mt-1 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              No money charged. No gatekeeping.
            </h2>
            {showingLearningMock && (
              <p className="mt-2 font-label-sm text-xs text-on-surface-variant/28">
                Showing sample sessions — free learning circles fill in as artists host.
              </p>
            )}
          </div>
        </FadeUp>

        {loadingLearning ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl glass-card" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {learning.map((session) => <CommunitySessionCard key={session.id} session={session} />)}
          </div>
        )}
      </section>
    </div>
  );
}
