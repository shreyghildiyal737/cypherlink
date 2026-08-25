import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProfile, useFollowProfile, useMyTopCollaborators, useContinuationSuggestions } from "../hooks";
import { useAuthStore } from "../store/authStore";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ProjectCard } from "../components/cards/ProjectCard";
import { SafetyMenu } from "../components/ui/SafetyMenu";
import { ProfileNudge } from "../components/profile/ProfileNudge";
import { FadeUp, fadeUpVariants } from "../components/ui/motion";
import { motion } from "framer-motion";

function AvailabilityBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    OPEN:        { label: "Open to collab",  cls: "border-green-500/40 bg-green-500/08 text-green-400" },
    SELECTIVE:   { label: "Selective",        cls: "border-primary-container/40 bg-primary-container/06 text-primary" },
    BUSY:        { label: "Busy",             cls: "border-yellow-500/30 bg-yellow-500/06 text-yellow-400/80" },
    UNAVAILABLE: { label: "Unavailable",      cls: "border-white/[0.06] bg-white/[0.02] text-on-surface-variant/40" },
  };
  const c = cfg[status];
  if (!c || status === "UNAVAILABLE") return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-label-sm text-[10px] uppercase tracking-wider ${c.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "OPEN" ? "bg-green-400 animate-pulse" : "bg-current"}`} />
      {c.label}
    </span>
  );
}

function momentumTone(m: string | undefined) {
  if (m === "Rising") return "red" as const;
  if (m === "Scene Active") return "cyan" as const;
  if (m === "Community Trusted") return "green" as const;
  return "muted" as const;
}

function stateLabel(s: string) {
  const m: Record<string, string> = {
    afterglow: "Afterglow",
    archived: "Archived",
    active: "Was live",
    upcoming: "Upcoming",
  };
  return m[s] ?? s;
}

export default function Profile() {
  const { id } = useParams();
  const { data: profile, isLoading } = useProfile(id ?? "");
  const user = useAuthStore((s) => s.user);
  const follow = useFollowProfile();
  const [followed, setFollowed] = useState(false);
  const isOwn = !!(user && profile && user.id === profile.id);
  const { data: myCollaborators } = useMyTopCollaborators(isOwn);
  const { data: continuationSuggestions } = useContinuationSuggestions(isOwn);
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/artists/${profile?.id}`
      : `https://cypherlink.app/artists/${profile?.id}`;

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center text-on-surface-variant/35">
        Finding this artist...
      </div>
    );
  if (!profile)
    return (
      <div className="flex min-h-screen items-center justify-center text-on-surface-variant/35">
        Artist not found in this scene.
      </div>
    );

  const hasCreativeHistory =
    profile.cyphersAttended > 0 ||
    profile.communitySessionsJoined > 0 ||
    profile.recentCyphers?.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">

      {/* ─── Profile Hero ───────────────────────────────────────────────── */}
      <FadeUp>
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] glass-panel">
          {profile.coverUrl && (
            <div className="absolute inset-0">
              <img
                src={profile.coverUrl}
                alt=""
                className="h-full w-full object-cover opacity-15"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/95 via-surface-container-lowest/60 to-transparent" />
            </div>
          )}

          {/* Ambient bloom */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.10) 0%, transparent 45%)",
            }}
          />

          <div className="relative p-6 md:p-10">
            <div className="flex flex-wrap items-end gap-5">
              {/* Avatar */}
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container via-[#6d28d9] to-[#5200b0] text-4xl font-black text-on-primary-container">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile.avatar
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {profile.momentum && (
                    <Badge tone={momentumTone(profile.momentum)}>
                      {profile.momentum}
                    </Badge>
                  )}
{(profile as any).availabilityStatus && (
                    <AvailabilityBadge status={(profile as any).availabilityStatus} />
                  )}
                </div>

                <h1 className="mt-2 font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4.5rem)] text-on-surface tracking-tight">
                  {profile.name}
                </h1>

                <p className="mt-1 font-body-md text-body-md text-on-surface-variant/60 flex flex-wrap items-center gap-1">
                  {profile.handle && (
                    <span className="text-on-surface-variant/40">{profile.handle}</span>
                  )}
                  {profile.primaryRole && <span> · {profile.primaryRole}</span>}
                  {(profile as any).secondaryRoles?.length > 0 && (
                    <span className="text-on-surface-variant/35">
                      {" "}· {(profile as any).secondaryRoles.slice(0, 2).join(", ")}
                    </span>
                  )}
                  {(profile as any).localRemotePreference && (profile as any).localRemotePreference !== "BOTH" && (
                    <span className="text-on-surface-variant/35">
                      {" "}· {(profile as any).localRemotePreference === "LOCAL" ? "Local" : "Remote"}
                    </span>
                  )}
                  {profile.city && (
                    <span className="flex items-center gap-1">
                      ·
                      <span className="material-symbols-outlined text-[13px]">location_on</span>
                      {profile.city}
                    </span>
                  )}
                </p>

                {profile.genres.length > 0 && (
                  <p className="mt-1 font-label-sm text-sm text-on-surface-variant/40">
                    {profile.genres.slice(0, 4).join(" / ")}
                    {profile.languages?.length > 0 &&
                      ` · ${profile.languages.slice(0, 3).join(", ")}`}
                  </p>
                )}

              </div>
            </div>

            {profile.softLabels?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.softLabels.map((label: string) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 font-label-sm text-xs text-on-surface-variant/55"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            {profile.bio && (
              <p className="mt-5 max-w-2xl font-body-md text-body-md text-on-surface-variant/70 leading-relaxed">
                {profile.bio}
              </p>
            )}

            {profile.trustSignals.length > 0 && (
              <div className="mt-4 inline-block rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                <p className="font-label-sm text-xs text-on-surface-variant/35">
                  Why they show up
                </p>
                <p className="mt-1 font-body-md text-sm text-on-surface-variant/65">
                  {profile.trustSignals.join(" · ")}
                </p>
              </div>
            )}

            {/* Looking for */}
            {(profile as any).lookingFor?.length > 0 && (
              <div className="mt-4">
                <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35 mb-2">
                  Looking for
                </p>
                <div className="flex flex-wrap gap-2">
                  {(profile as any).lookingFor.map((item: string) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary-container/30 bg-primary-container/08 px-3 py-1 font-label-sm text-sm text-primary-fixed-dim"
                    >
                      <span className="material-symbols-outlined text-[12px]">search</span>
                      {item}
                    </span>
                  ))}
                  {(profile as any).collaborationCapacity && (
                    <span className="rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1 font-label-sm text-xs text-on-surface-variant/45">
                      {(profile as any).collaborationCapacity} slot{(profile as any).collaborationCapacity === 1 ? "" : "s"} open
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Collaboration intent */}
            {(profile as any).collaborationIntent && (
              <p className="mt-3 font-body-md text-sm text-on-surface-variant/55 italic">
                "{(profile as any).collaborationIntent}"
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {!isOwn && user && (
                <Button
                  onClick={() =>
                    follow.mutate(profile.id, { onSuccess: () => setFollowed(true) })
                  }
                  disabled={follow.isPending || followed}
                >
                  {follow.isPending
                    ? "Following..."
                    : followed
                    ? "Following ✓"
                    : "Follow"}
                </Button>
              )}
              {!isOwn && user && (
                <Link to="/messages">
                  <Button variant="secondary">
                    <span className="material-symbols-outlined text-[15px]">send</span>
                    Send intent
                  </Button>
                </Link>
              )}
              {isOwn && (
                <Link to="/settings">
                  <Button variant="secondary">
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    Edit profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </FadeUp>

      {/* ─── Main + Sidebar grid ────────────────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {isOwn && <ProfileNudge profile={profile as any} />}

          {/* Memory trails */}
          {Array.isArray((profile as any).memoryTrails) &&
            (profile as any).memoryTrails.length > 0 && (
              <section className="rounded-2xl border border-primary-container/20 bg-primary-container/04 p-5">
                <p className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-primary/70">
                  Memory trail
                </p>
                <ul className="mt-3 space-y-2">
                  {(profile as any).memoryTrails.map(
                    (t: { kind: string; label: string; href?: string }, i: number) => (
                      <li key={`${t.kind}-${i}`}>
                        {t.href ? (
                          <Link
                            to={t.href}
                            className="font-body-md text-sm text-on-surface-variant/75 hover:text-primary-fixed-dim transition-colors flex items-center gap-1"
                          >
                            {t.label}
                            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                          </Link>
                        ) : (
                          <span className="font-body-md text-sm text-on-surface-variant/70">
                            {t.label}
                          </span>
                        )}
                      </li>
                    )
                  )}
                </ul>
              </section>
            )}

          {/* Projects */}
          {profile.projects.length > 0 && (
            <section className="rounded-2xl border border-white/[0.07] glass-card p-5">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-4">
                Projects
              </h2>
              <div className="grid gap-liquid_gap md:grid-cols-2">
                {profile.projects.map((p: any) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}

          {/* Creative history */}
          {hasCreativeHistory && (
            <section className="rounded-2xl border border-white/[0.07] glass-card p-5">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Creative history
              </h2>
              <p className="mt-1 font-body-md text-sm text-on-surface-variant/40">
                Moments that built this identity.
              </p>

              {(() => {
                const contrib = (profile as any).contributions;
                const cyphersCount = contrib?.cypherCount ?? profile.cyphersAttended ?? 0;
                const sessionsCount = contrib?.sessionCount ?? profile.communitySessionsJoined ?? 0;
                const projectsCount = contrib?.projectCount ?? 0;
                const hasStats = cyphersCount > 0 || sessionsCount > 0 || projectsCount > 0;
                if (!hasStats) return null;
                return (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {projectsCount > 0 && (
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <p className="text-xl font-bold text-on-surface">{projectsCount}</p>
                        <p className="font-label-sm text-xs text-on-surface-variant/40 mt-0.5">
                          {projectsCount === 1 ? "project" : "projects"} collaborated
                        </p>
                      </div>
                    )}
                    {cyphersCount > 0 && (
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <p className="text-xl font-bold text-on-surface">{cyphersCount}</p>
                        <p className="font-label-sm text-xs text-on-surface-variant/40 mt-0.5">
                          {cyphersCount === 1 ? "cypher" : "cyphers"} attended
                        </p>
                      </div>
                    )}
                    {sessionsCount > 0 && (
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <p className="text-xl font-bold text-on-surface">{sessionsCount}</p>
                        <p className="font-label-sm text-xs text-on-surface-variant/40 mt-0.5">
                          community {sessionsCount === 1 ? "session" : "sessions"}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {profile.recentCyphers?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/35">
                    Recently in
                  </p>
                  {profile.recentCyphers.map((c: any) => (
                    <Link
                      key={c.id}
                      to={`/cyphers/${c.id}`}
                      className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 transition-all duration-300 hover:border-primary-container/20 group"
                    >
                      <div>
                        <p className="font-semibold text-sm text-on-surface/85 group-hover:text-primary-fixed-dim transition-colors">
                          {c.title}
                        </p>
                        <p className="font-label-sm text-xs text-on-surface-variant/40">
                          {c.city} · {stateLabel(c.state)}
                        </p>
                      </div>
                      <span className="font-label-sm text-xs text-on-surface-variant/28">
                        {new Date(c.checkedInAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Top collaborators — own profile only */}
          {isOwn && (myCollaborators?.length ?? 0) > 0 && (
            <section className="rounded-2xl border border-white/[0.07] glass-card p-5">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Your circle
              </h2>
              <p className="mt-1 font-body-md text-sm text-on-surface-variant/40">
                Creators you've built with more than once.
              </p>
              <div className="mt-4 space-y-2">
                {myCollaborators!.slice(0, 5).map((c) => (
                  <Link
                    key={c.userId}
                    to={`/profile/${c.userId}`}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 transition-all duration-300 hover:border-primary-container/20 group"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-container via-[#6d28d9] to-[#5200b0] text-sm font-bold text-on-primary-container">
                      {c.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm text-on-surface group-hover:text-primary-fixed-dim transition-colors">
                        {c.displayName}
                        {c.handle && <span className="ml-1 text-on-surface-variant/40 font-normal">{c.handle}</span>}
                      </p>
                      <p className="font-label-sm text-[11px] text-on-surface-variant/40">
                        {c.label}{c.firstContextTitle ? ` · started at ${c.firstContextTitle}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 font-label-sm text-[10px] text-on-surface-variant/30">
                      {c.collabCount}×
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Continuation suggestions — own profile only */}
          {isOwn && (continuationSuggestions?.length ?? 0) > 0 && (
            <section className="rounded-2xl border border-primary-container/15 bg-primary-container/04 p-5">
              <p className="font-label-sm text-[10px] font-bold uppercase tracking-widest text-primary/60">
                Keep the momentum
              </p>
              <div className="mt-3 space-y-3">
                {continuationSuggestions!.map((s, i) => (
                  <div key={`${s.type}-${i}`} className="flex items-start gap-3">
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-container/15">
                      <span className="material-symbols-outlined text-[14px] text-primary/70">
                        {s.type === "create_collective" ? "group" : s.type === "attend_cypher" ? "event" : s.type === "reconnect_collaborator" ? "handshake" : "arrow_forward"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-on-surface/80">{s.label}</p>
                      <p className="font-body-md text-sm text-on-surface-variant/55 mt-0.5">{s.context}</p>
                      {s.referenceId && s.type === "attend_cypher" && (
                        <Link to={`/cyphers/${s.referenceId}`} className="mt-1 inline-flex items-center gap-1 font-label-sm text-[11px] text-primary/70 hover:text-primary transition-colors">
                          View cypher <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                        </Link>
                      )}
                      {s.referenceId && s.type === "start_followup" && (
                        <Link to={`/projects/${s.referenceId}`} className="mt-1 inline-flex items-center gap-1 font-label-sm text-[11px] text-primary/70 hover:text-primary transition-colors">
                          View project <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Organizer track record */}
          {profile.organizerSummary && (
            <section className="rounded-2xl border border-white/[0.07] glass-card p-5">
              <div className="flex items-center gap-3">
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  As organizer
                </h2>
                <Badge tone="red">Host</Badge>
              </div>
              <p className="mt-1 font-body-md text-sm text-on-surface-variant/40">
                The circles they've held. The moments they've preserved.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  { value: profile.organizerSummary.totalCyphers, label: "circles held" },
                  { value: profile.organizerSummary.totalSessions, label: "sessions led" },
                  { value: profile.organizerSummary.totalHighlights, label: "moments preserved" },
                ].map(({ value, label }) => (
                  <div key={label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                    <p className="text-2xl font-bold text-on-surface">{value}</p>
                    <p className="mt-1 font-label-sm text-xs text-on-surface-variant/40">{label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ─── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="space-y-5">
          <div className="rounded-2xl border border-white/[0.07] glass-card p-5">
            <h2 className="font-headline-lg-mobile text-on-surface">Artist QR</h2>
            <p className="mt-2 font-body-md text-sm text-on-surface-variant/50">
              Share to let people find your space.
            </p>
            <div className="mt-4 grid place-items-center rounded-xl bg-white p-5">
              <QRCodeSVG value={profileUrl} size={160} />
            </div>
          </div>

          {profile.followedScenes?.length > 0 && (
            <div className="rounded-2xl border border-white/[0.07] glass-card p-5">
              <h2 className="font-headline-lg-mobile text-on-surface">
                Scenes they follow
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.followedScenes.map((city: string) => (
                  <Link
                    key={city}
                    to={`/scenes/${city.toLowerCase()}`}
                    className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 font-label-sm text-sm text-on-surface-variant/55 transition-all duration-300 hover:border-primary-container/20 hover:text-primary-fixed-dim"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/[0.07] glass-card p-5">
            <h2 className="font-headline-lg-mobile text-on-surface">Privacy</h2>
            <p className="mt-2 font-body-md text-sm text-on-surface-variant/50">
              City-level only. Location is never shared without an explicit action.
            </p>
          </div>

          {user && !isOwn && profile && (
            <div className="rounded-2xl border border-white/[0.07] glass-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-lg-mobile text-on-surface">Safety</h2>
                <SafetyMenu
                  targetId={profile.id}
                  targetType="user"
                  targetName={profile.name}
                />
              </div>
              <p className="mt-2 font-body-md text-sm text-on-surface-variant/45">
                Report, block, or mute this artist.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
