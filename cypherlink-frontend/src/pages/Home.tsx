import { Link } from "react-router-dom";
import { CypherCard } from "../components/cards/CypherCard";
import { ProjectCard } from "../components/cards/ProjectCard";
import { ProfileMini } from "../components/cards/ProfileMini";
import { FadeUp, StaggerChildren, fadeUpVariants } from "../components/ui/motion";
import { motion } from "framer-motion";
import { usePublicHome } from "../hooks";
import { useAuthStore } from "../store/authStore";

function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-6 animate-pulse">
      <div className="h-3 w-20 bg-surface-variant rounded mb-4" />
      <div className="h-5 w-3/4 bg-surface-variant rounded mb-2" />
      <div className="h-3 w-1/2 bg-surface-variant rounded" />
    </div>
  );
}

export default function Home() {
  const { data, isLoading } = usePublicHome();
  const user = useAuthStore((s) => s.user);
  const cyphers = data?.cyphers ?? [];
  const projects = data?.projects ?? [];
  const artists = data?.artists ?? [];
  const sessions = data?.sessions ?? [];

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">

      {/* ─── Welcome hero ───────────────────────────────────────────────── */}
      <FadeUp>
        <section className="relative overflow-hidden rounded-2xl glass-panel border border-white/5 p-6 md:p-12 mb-10">
          {/* Ambient bloom */}
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(124,58,237,0.18) 0%, rgba(100,97,149,0.06) 50%, transparent 80%)" }}
          />

          {/* Live indicator */}
          <div className="relative flex items-center gap-2 mb-5">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error/75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error" />
            </div>
            <span className="font-label-sm text-label-sm text-error uppercase tracking-widest">Scene active tonight</span>
          </div>

          <h1 className="relative font-headline-xl text-headline-xl md:text-[clamp(2rem,4vw,3rem)] text-on-surface tracking-tight max-w-3xl mb-4">
            {user
              ? `Welcome back, ${user.name?.split(" ")[0]}.`
              : "Welcome into the creative city."}
          </h1>

          <p className="relative font-body-md text-body-md text-on-surface-variant max-w-2xl mb-8">
            Look around before logging in. When you want to pull up, message,
            RSVP, create or save something, we'll help you make your space.
          </p>

          <div className="relative flex flex-wrap gap-3">
            <Link to="/create">
              <button className="btn-liquid px-6 py-3 rounded-xl font-label-sm text-label-sm text-on-primary-container uppercase tracking-widest flex items-center gap-2 shadow-primary-glow">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                Start something
              </button>
            </Link>
            <Link to="/feed">
              <button className="glass-panel px-6 py-3 rounded-xl font-label-sm text-label-sm text-on-surface uppercase tracking-widest flex items-center gap-2 hover:bg-surface-variant/40 transition-all duration-300">
                <span className="material-symbols-outlined text-[16px]">movie_filter</span>
                Watch clips
              </button>
            </Link>
            <Link to="/map">
              <button className="glass-panel px-6 py-3 rounded-xl font-label-sm text-label-sm text-on-surface uppercase tracking-widest flex items-center gap-2 hover:bg-surface-variant/40 transition-all duration-300">
                <span className="material-symbols-outlined text-[16px]">explore</span>
                Explore map
              </button>
            </Link>
          </div>
        </section>
      </FadeUp>

      {/* ─── Loading skeleton ────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid gap-liquid_gap md:grid-cols-2">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && (
        <>
          {/* ─── Active cyphers ──────────────────────────────────────────── */}
          {cyphers.length > 0 && (
            <section className="mt-10">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="font-label-sm text-label-sm text-error uppercase tracking-widest flex items-center gap-2 mb-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                      <span className="relative rounded-full h-1.5 w-1.5 bg-error" />
                    </span>
                    Happening now
                  </p>
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                    Cyphers breathing nearby
                  </h2>
                </div>
                <Link to="/cyphers" className="font-label-sm text-label-sm text-primary hover:text-primary-fixed-dim transition-colors uppercase tracking-widest flex items-center gap-1">
                  View all
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>

              <StaggerChildren className="grid gap-liquid_gap md:grid-cols-2">
                {cyphers.slice(0, 4).map((c: any) => (
                  <motion.div key={c.id} variants={fadeUpVariants}>
                    <CypherCard cypher={c} />
                  </motion.div>
                ))}
              </StaggerChildren>
            </section>
          )}

          {/* ─── Bento grid: Projects + Artists ─────────────────────────── */}
          {(projects.length > 0 || artists.length > 0) && (
            <section className="mt-12 grid gap-gutter lg:grid-cols-[1.3fr_.7fr]">
              {projects.length > 0 && (
                <div>
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest mb-1">Open doors</p>
                      <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                        Projects looking for people
                      </h2>
                    </div>
                    <Link to="/projects" className="font-label-sm text-label-sm text-primary hover:text-primary-fixed-dim transition-colors uppercase tracking-widest flex items-center gap-1">
                      View all
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                  <StaggerChildren className="grid gap-liquid_gap md:grid-cols-2">
                    {projects.slice(0, 4).map((p: any) => (
                      <motion.div key={p.id} variants={fadeUpVariants}>
                        <ProjectCard project={p} />
                      </motion.div>
                    ))}
                  </StaggerChildren>
                </div>
              )}

              {artists.length > 0 && (
                <div>
                  <div className="mb-6">
                    <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-1">Momentum</p>
                    <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Active artists</h2>
                  </div>
                  <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2">
                    {artists.slice(0, 5).map((a: any) => (
                      <ProfileMini key={a.id} artist={a} />
                    ))}
                    <Link to="/discover" className="mt-2 text-center font-label-sm text-label-sm text-on-surface-variant/50 hover:text-primary transition-colors py-2 border-t border-white/5">
                      See more artists →
                    </Link>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ─── Community sessions ──────────────────────────────────────── */}
          {sessions.length > 0 && (
            <section className="mt-12">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest mb-1">Community</p>
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Sessions nearby</h2>
                </div>
                <Link to="/community" className="font-label-sm text-label-sm text-primary hover:text-primary-fixed-dim transition-colors uppercase tracking-widest flex items-center gap-1">
                  View all
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>

              <StaggerChildren className="grid gap-liquid_gap md:grid-cols-2">
                {sessions.slice(0, 4).map((s: any) => (
                  <motion.div
                    key={s.id}
                    variants={fadeUpVariants}
                    className="glass-card liquid-hover rounded-2xl p-5 border border-white/5 hover:border-secondary-container/30 transition-all duration-400 group cursor-pointer"
                  >
                    <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest mb-2">{s.type}</p>
                    <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface group-hover:text-primary-fixed-dim transition-colors">
                      {s.title}
                    </h3>
                    <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant/60 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {s.city}
                      {s.pullingUp ? ` · ${s.pullingUp} pulling up` : ""}
                    </p>
                    <Link to={`/community/${s.id}`} className="mt-4 inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant/50 hover:text-primary transition-colors">
                      View session
                      <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                    </Link>
                  </motion.div>
                ))}
              </StaggerChildren>
            </section>
          )}

          {/* ─── Empty state ─────────────────────────────────────────────── */}
          {!cyphers.length && !projects.length && !sessions.length && (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  graphic_eq
                </span>
              </div>
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">The scene is warming up.</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto mb-8">
                No cyphers or projects nearby yet. Be the first to start something.
              </p>
              <Link to="/create">
                <button className="btn-liquid px-8 py-4 rounded-xl font-label-sm text-label-sm text-on-primary-container uppercase tracking-widest">
                  Start the scene
                </button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
