import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { causeSessions, learningSessions } from '../data/discoveryMock';
import { useCommunity, useCommunitySession } from '../hooks/useCommunity';
import { useMySessionCheckInToken, useRSVPSession, useProfile } from '../hooks';
import { useAuthStore } from '../store/authStore';

const SESSION_TYPE_CONFIG: Record<string, {
  label: string;
  tone: 'cyan' | 'orange' | 'green' | 'purple' | 'muted';
  gradient: string;
  whoFor: string;
  bring: string;
  mood: string;
}> = {
  cleanup: {
    label: 'Cleanup',
    tone: 'green',
    gradient: 'from-[rgba(34,197,94,0.08)] via-transparent to-[rgba(124,58,237,0.04)]',
    whoFor: 'Anyone who wants to make the city feel cared for.',
    bring: 'Gloves, water, the will to roll up your sleeves.',
    mood: 'Practical. Honest. Tangible result by the end.',
  },
  teaching: {
    label: 'Free learning',
    tone: 'cyan',
    gradient: 'from-[rgba(6,182,212,0.08)] via-transparent to-[rgba(124,58,237,0.04)]',
    whoFor: 'Anyone curious. New voices especially welcome.',
    bring: 'A notebook, your phone, your questions.',
    mood: 'Patient. Generous. No paid courses, no gatekeepers.',
  },
  relief: {
    label: 'Relief',
    tone: 'orange',
    gradient: 'from-[rgba(249,115,22,0.10)] via-transparent to-[rgba(124,58,237,0.04)]',
    whoFor: 'Anyone who can show up when it counts.',
    bring: 'What the organizer requested in the description.',
    mood: 'Urgent. Coordinated. People-first.',
  },
  'artist-support': {
    label: 'Artist support',
    tone: 'purple',
    gradient: 'from-[rgba(124,58,237,0.12)] via-transparent to-[rgba(124,58,237,0.04)]',
    whoFor: 'The artist community looking out for one of its own.',
    bring: 'Yourself. Maybe a kind word.',
    mood: 'Quiet. Respectful. Care above clout.',
  },
  'community-help': {
    label: 'Community',
    tone: 'green',
    gradient: 'from-[rgba(34,197,94,0.08)] via-transparent to-[rgba(249,115,22,0.04)]',
    whoFor: 'Whoever the moment calls for.',
    bring: 'Whatever the organizer asks.',
    mood: 'Calm. Coordinated. Local-first.',
  },
};

function fmt(iso?: string) {
  if (!iso) return 'TBD';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return 'TBD';
  }
}

function happenedFmt(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch {
    return null;
  }
}

export default function CommunityDetail() {
  const { id } = useParams();
  const { data: apiSession, isLoading } = useCommunitySession(id ?? '');
  const { data: allSessions } = useCommunity();
  const user = useAuthStore((s) => s.user);
  const checkinToken = useMySessionCheckInToken(user && id ? id : '');
  const rsvp = useRSVPSession();

  const mock = causeSessions.find((item) => item.id === id)
    ?? learningSessions.find((item) => item.id === id)
    ?? causeSessions[0];

  const session = apiSession ? {
    id: apiSession.id,
    title: apiSession.title,
    city: apiSession.city,
    date: fmt(apiSession.startsAt),
    happenedOn: happenedFmt(apiSession.startsAt),
    pullingUp: apiSession.pullingUp ?? 0,
    type: (apiSession.type ?? 'community-help') as string,
    state: (apiSession.state ?? 'upcoming') as string,
    topic: apiSession.topic ?? '',
    cause: apiSession.description ?? '',
    organizerName: apiSession.organizer?.displayName ?? null,
    organizerId: apiSession.organizerId ?? null,
    safetyTags: apiSession.safetyTags ?? [],
    freeLearning: !!apiSession.freeLearning,
    approximateLocation: apiSession.approximateLocation ?? null,
    venue: apiSession.venue ?? null,
    level: apiSession.level ?? null,
    capacity: apiSession.capacity ?? null,
  } : {
    id: mock.id,
    title: mock.title,
    city: mock.city,
    date: mock.date,
    happenedOn: null,
    pullingUp: mock.pullingUp,
    type: 'community-help',
    state: 'upcoming',
    topic: 'topic' in mock ? mock.topic : '',
    cause: 'cause' in mock ? mock.cause : '',
    organizerName: 'host' in mock ? mock.host : null,
    organizerId: null,
    safetyTags: 'safetyTags' in mock ? mock.safetyTags : [],
    freeLearning: 'topic' in mock,
    approximateLocation: null,
    venue: null,
    level: null,
    capacity: null,
  };

  const normalizedType = typeof session.type === 'string'
    ? session.type.toLowerCase().replace(/_/g, '-')
    : session.type;
  const typeCfg = SESSION_TYPE_CONFIG[normalizedType] ?? SESSION_TYPE_CONFIG['community-help'];
  const sessionState = typeof session.state === 'string' ? session.state.toLowerCase() : session.state;
  const isMemory = sessionState === 'afterglow' || sessionState === 'archived';
  const canRSVP = sessionState === 'upcoming' || sessionState === 'active';
  const isActive = sessionState === 'active';

  const organizerProfile = useProfile(session.organizerId ?? '');
  const organizerSummary = organizerProfile.data?.organizerSummary as
    | { totalCyphers: number; totalSessions: number; totalHighlights: number }
    | null
    | undefined;
  const organizerTrustSignals = organizerProfile.data?.trustSignals ?? [];

  const related = (allSessions ?? [])
    .filter((s: any) => s.id !== session.id && s.city === session.city)
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center font-body-md text-on-surface-variant/40">
        Loading session...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      {/* Back link */}
      <Link
        to="/community"
        className="inline-flex items-center gap-1 font-body-md text-sm text-on-surface-variant/45 transition hover:text-on-surface"
      >
        ← All community sessions
      </Link>

      <section
        className={`glass-panel mt-3 rounded-2xl border border-white/[0.07] bg-gradient-to-br ${typeCfg.gradient} p-6 transition-all duration-500 md:p-10`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={typeCfg.tone}>{typeCfg.label.toUpperCase()}</Badge>
          {isActive && (
            <span className="flex items-center gap-1.5 font-body-md text-sm text-[#34d399]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#34d399]" />
              Happening now
            </span>
          )}
          {isMemory && <Badge tone="muted">PAST SESSION</Badge>}
          {session.freeLearning && <Badge tone="cyan">FREE TO LEARN</Badge>}
        </div>

        <h1 className="mt-5 max-w-4xl font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] tracking-tight text-on-surface">
          {session.title}
        </h1>

        {isMemory && session.happenedOn && (
          <p className="mt-2 font-label-sm text-sm text-on-surface-variant/40">
            Happened on {session.happenedOn} · preserved in community record
          </p>
        )}

        <p className="mt-4 max-w-2xl font-body-md text-on-surface-variant/60">
          {session.freeLearning
            ? `${session.topic} · Learning stays free here.`
            : session.cause}
        </p>

        {session.organizerName && (
          <p className="mt-2 font-body-md text-sm text-on-surface-variant/50">
            Organized by{' '}
            {session.organizerId ? (
              <Link
                to={`/profile/${session.organizerId}`}
                className="text-on-surface/80 transition hover:text-on-surface hover:underline"
              >
                {session.organizerName}
              </Link>
            ) : (
              <span className="text-on-surface/70">{session.organizerName}</span>
            )}
          </p>
        )}

        {canRSVP && (
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Button
                onClick={() => rsvp.mutate(session.id)}
                disabled={rsvp.isPending}
              >
                {rsvp.isPending ? 'RSVPing...' : 'Pull up'}
              </Button>
            ) : (
              <Link to="/login">
                <Button>Pull up</Button>
              </Link>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href).catch(() => {});
                }
              }}
            >
              Share
            </Button>
          </div>
        )}

        {isMemory && (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/create/community">
              <Button variant="secondary">Organize something like this</Button>
            </Link>
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-5">
          {/* Session details grid */}
          <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
            <h2 className="font-headline-lg-mobile text-2xl font-semibold text-on-surface">
              {isMemory ? 'Session record' : isActive ? 'Session status' : 'Session details'}
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/[0.03] p-4">
                <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/45">City</p>
                <p className="mt-1 font-body-md font-semibold text-on-surface">{session.city}</p>
                {session.approximateLocation && (
                  <p className="mt-1 font-label-sm text-xs text-on-surface-variant/45">{session.approximateLocation}</p>
                )}
              </div>
              <div className="rounded-2xl bg-white/[0.03] p-4">
                <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/45">
                  {isMemory ? 'Happened' : 'When'}
                </p>
                <p className="mt-1 font-body-md font-semibold text-on-surface">
                  {isMemory ? (session.happenedOn ?? session.date) : session.date}
                </p>
              </div>
              <div className="rounded-2xl bg-white/[0.03] p-4">
                <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/45">
                  {isMemory ? 'Showed up' : 'Pulling up'}
                </p>
                <p className="mt-1 font-headline-lg-mobile font-semibold text-on-surface">
                  {session.pullingUp}
                  {session.capacity ? <span className="text-on-surface-variant/40"> / {session.capacity}</span> : null}
                  {isActive && (
                    <span className="ml-2 font-body-md text-xs font-normal text-[#34d399]">live</span>
                  )}
                </p>
              </div>
              <div className="rounded-2xl bg-white/[0.03] p-4">
                <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/45">Money</p>
                <p className="mt-1 font-body-md font-semibold text-on-surface">
                  {session.freeLearning ? 'Free by principle' : 'No forced payment'}
                </p>
              </div>
            </div>

            {session.safetyTags.length > 0 && (
              <div className="mt-5 rounded-2xl bg-white/[0.03] p-4">
                <h3 className="font-body-md font-semibold text-on-surface">Safety and comfort</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {session.safetyTags.map((tag: string) => (
                    <Badge key={tag} tone="green">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {isMemory && (
              <p className="mt-5 font-body-md text-sm text-on-surface-variant/40">
                {session.pullingUp} {session.pullingUp === 1 ? 'person' : 'people'} showed up. Their presence is part of the community record.
              </p>
            )}
          </div>

          {/* Who it's for / bring / mood */}
          {!isMemory && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="glass-card rounded-2xl border border-white/[0.07] p-4">
                <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/40">Who this is for</p>
                <p className="mt-2 font-body-md text-sm text-on-surface/80">{typeCfg.whoFor}</p>
                {session.level && (
                  <p className="mt-2 font-label-sm text-xs text-on-surface-variant/60">Level: {session.level}</p>
                )}
              </div>
              <div className="glass-card rounded-2xl border border-white/[0.07] p-4">
                <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/40">What to bring</p>
                <p className="mt-2 font-body-md text-sm text-on-surface/80">{typeCfg.bring}</p>
              </div>
              <div className="glass-card rounded-2xl border border-white/[0.07] p-4">
                <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/40">Community mood</p>
                <p className="mt-2 font-body-md text-sm text-on-surface/80">{typeCfg.mood}</p>
              </div>
            </div>
          )}

          {/* Afterglow */}
          {isMemory && (
            <div className="rounded-2xl border border-primary-container/20 bg-primary-container/05 p-5">
              <p className="font-label-sm text-[10px] uppercase tracking-widest text-primary/70">Preserved moment</p>
              <p className="mt-2 font-body-md text-lg text-on-surface/85">
                People showed up for this. That's the record that stays.
              </p>
              <p className="mt-1 font-body-md text-sm text-on-surface-variant/45">
                Highlights from community sessions get added by the organizer when they're meaningful.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          {/* Check-in QR */}
          {canRSVP && (
            <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
              <h2 className="font-headline-lg-mobile font-semibold text-on-surface">Optional check-in</h2>
              <p className="mt-2 font-body-md text-sm text-on-surface-variant/60">
                Show this QR to the organizer at the door. Optional — no penalty if skipped.
              </p>
              {user && checkinToken.data?.checkInToken ? (
                <div className="mt-4 grid place-items-center rounded-2xl bg-white p-5">
                  <QRCodeSVG value={checkinToken.data.checkInToken} size={160} />
                </div>
              ) : user && checkinToken.isError ? (
                <p className="mt-4 font-body-md text-sm text-on-surface-variant/50">RSVP first to get your QR.</p>
              ) : !user ? (
                <Link to="/login">
                  <Button variant="secondary" className="mt-4 w-full">Log in to get QR</Button>
                </Link>
              ) : (
                <p className="mt-4 font-body-md text-sm text-on-surface-variant/50">Generating QR…</p>
              )}
            </div>
          )}

          {/* Organizer trust */}
          {session.organizerId && organizerProfile.data && (
            <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
              <h2 className="font-headline-lg-mobile font-semibold text-on-surface">About the organizer</h2>
              <p className="mt-2 font-body-md text-sm text-on-surface-variant/70">
                <Link
                  to={`/profile/${session.organizerId}`}
                  className="text-on-surface/80 transition hover:text-on-surface hover:underline"
                >
                  {session.organizerName}
                </Link>{' '}has shown up for this community before.
              </p>
              {organizerSummary && (
                <ul className="mt-3 space-y-1 font-label-sm text-xs text-on-surface-variant/60">
                  {organizerSummary.totalSessions > 0 && (
                    <li>· {organizerSummary.totalSessions} community session{organizerSummary.totalSessions === 1 ? '' : 's'} hosted</li>
                  )}
                  {organizerSummary.totalCyphers > 0 && (
                    <li>· {organizerSummary.totalCyphers} cypher{organizerSummary.totalCyphers === 1 ? '' : 's'} hosted</li>
                  )}
                  {organizerSummary.totalHighlights > 0 && (
                    <li>· {organizerSummary.totalHighlights} moment{organizerSummary.totalHighlights === 1 ? '' : 's'} preserved</li>
                  )}
                </ul>
              )}
              {organizerTrustSignals.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {organizerTrustSignals.slice(0, 3).map((sig: string) => (
                    <Badge key={sig} tone="cyan">{sig}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scene link */}
          {session.city && (
            <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
              <h2 className="font-headline-lg-mobile font-semibold text-on-surface">{session.city} scene</h2>
              <p className="mt-2 font-body-md text-sm text-on-surface-variant/60">
                More cyphers, projects and community moves in this city.
              </p>
              <Link to={`/scenes/${session.city.toLowerCase()}`}>
                <Button variant="secondary" className="mt-4 w-full">Open scene</Button>
              </Link>
            </div>
          )}

          {/* Privacy */}
          <div className="glass-card rounded-2xl border border-white/[0.07] p-5">
            <h2 className="font-headline-lg-mobile font-semibold text-on-surface">Community record</h2>
            <p className="mt-2 font-body-md text-sm text-on-surface-variant/60">
              RSVPs, check-ins, and safety notes are stored privately by the organizer for community memory and safety.
            </p>
          </div>
        </aside>
      </div>

      {/* Related sessions */}
      {related.length > 0 && (
        <section className="mt-10">
          <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/45">
            Other community moves in {session.city}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r: any) => {
              const rType = typeof r.type === 'string'
                ? r.type.toLowerCase().replace(/_/g, '-')
                : r.type;
              const rCfg = SESSION_TYPE_CONFIG[rType] ?? SESSION_TYPE_CONFIG['community-help'];
              return (
                <Link
                  key={r.id}
                  to={`/community/${r.id}`}
                  className="glass-card rounded-2xl border border-white/[0.06] p-4 transition hover:border-primary-container/20 hover:shadow-[0_0_24px_rgba(124,58,237,0.08)]"
                >
                  <Badge tone={rCfg.tone}>{rCfg.label}</Badge>
                  <p className="mt-3 font-body-md font-semibold text-on-surface line-clamp-2">{r.title}</p>
                  <p className="mt-1 font-label-sm text-xs text-on-surface-variant/50">{fmt(r.startsAt)}</p>
                  <p className="mt-2 font-label-sm text-xs text-on-surface-variant/40">
                    {r.pullingUp ?? 0} pulling up
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
