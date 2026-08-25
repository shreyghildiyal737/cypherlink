import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Marquee } from "../components/ui/Marquee";
import { Grain } from "../components/ui/Grain";
import { FadeUp, FadeIn, StaggerChildren, fadeUpVariants } from "../components/ui/motion";
import { HeroGradientLazy } from "../components/ui/HeroGradientLazy";
import { usePublicHome } from "../hooks";

const MARQUEE_WORDS = [
  "CYPHERS", "·", "COLLABS", "·", "COMMUNITY", "·", "CULTURE", "·",
  "CIRCLES", "·", "MEMORY", "·", "AFTERGLOW", "·", "INDIA", "·",
];

const features = [
  {
    headline: "The cypher never dies.",
    body: "Open circles and venue sessions that stay alive as long as someone's in the circle. When the last verse drops, a 24-hour afterglow window begins — the brief moment where what happened can be preserved before it fades.",
    tag: "CYPHERS",
    icon: "mic_external_on",
    accentClass: "text-primary",
    borderClass: "border-primary-container/30",
    bgClass: "bg-primary-container/10",
    iconColor: "text-primary",
  },
  {
    headline: "Build it together.",
    body: "Projects aren't announcements — they're open doors. Post what you're cooking, who you need, and what stage you're at. Cooking → Collab → Recording → Mixing → Finished.",
    tag: "PROJECTS",
    icon: "layers",
    accentClass: "text-tertiary",
    borderClass: "border-tertiary-container/30",
    bgClass: "bg-tertiary-container/10",
    iconColor: "text-tertiary",
  },
  {
    headline: "Your scene. Your map.",
    body: "Every city has its own CypherLink scene. Follow your local circle, discover who's moving, and watch the community hold events that aren't about clout — they're about culture.",
    tag: "SCENES",
    icon: "explore",
    accentClass: "text-secondary",
    borderClass: "border-secondary-container/30",
    bgClass: "bg-secondary-container/10",
    iconColor: "text-secondary",
  },
];

export default function Landing() {
  const { data } = usePublicHome();
  const cyphers = data?.cyphers?.slice(0, 3) ?? [];

  return (
    <div className="relative overflow-x-hidden bg-surface-container-lowest">
      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-[96vh] overflow-hidden flex items-center">
        <Grain opacity={0.016} className="z-10" />
        <HeroGradientLazy />

        {/* Ambient orbs — complement the shader gradient */}
        <div aria-hidden className="pointer-events-none absolute top-[20%] left-[15%] w-[40vw] h-[40vw] rounded-full" style={{ background: "radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 65%)", filter: "blur(90px)" }} />
        <div aria-hidden className="pointer-events-none absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] rounded-full" style={{ background: "radial-gradient(circle, rgba(15,160,145,0.10) 0%, transparent 65%)", filter: "blur(80px)" }} />

        <div className="relative z-20 mx-auto w-full max-w-7xl px-margin-mobile md:px-margin-desktop py-24">
          <FadeIn delay={0.05}>
            <span className="inline-flex items-center gap-2 font-label-sm text-label-sm text-primary uppercase tracking-widest border border-primary-container/30 bg-primary-container/10 px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-liquid-pulse" />
              India's independent music scene
            </span>
          </FadeIn>

          <div className="overflow-hidden">
            <StaggerChildren delay={0.12}>
              <motion.h1
                variants={fadeUpVariants}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="font-headline-xl text-headline-xl md:text-[clamp(3.5rem,8vw,6.5rem)] text-on-surface leading-none tracking-[-0.04em]"
              >
                Enter the
              </motion.h1>
              <motion.h1
                variants={fadeUpVariants}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="font-headline-xl text-headline-xl md:text-[clamp(3.5rem,8vw,6.5rem)] text-primary-fixed-dim leading-none tracking-[-0.04em]"
              >
                Flow.
              </motion.h1>
            </StaggerChildren>
          </div>

          <FadeUp delay={0.45}>
            <p className="mt-8 max-w-2xl font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Browse scenes freely. Find collaborators. Host cyphers. Build
              projects. Preserve only the moments that matter.
            </p>
          </FadeUp>

          <FadeUp delay={0.55}>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/home">
                <button className="btn-liquid px-8 py-4 rounded-xl font-label-sm text-label-sm text-on-primary-container uppercase tracking-widest flex items-center gap-2 shadow-primary-glow">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                  Join the circle
                </button>
              </Link>
              <Link to="/cyphers">
                <button className="glass-panel px-8 py-4 rounded-xl font-label-sm text-label-sm text-on-surface uppercase tracking-widest flex items-center gap-2 hover:bg-surface-variant/50 transition-all duration-300">
                  <span className="material-symbols-outlined text-[18px]">sensors</span>
                  See what's live
                </button>
              </Link>
            </div>
          </FadeUp>

          <FadeUp delay={0.65} className="mt-14">
            <Marquee speed={28}>
              {MARQUEE_WORDS.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className={`shrink-0 font-label-sm text-label-sm ${
                    word === "·"
                      ? "text-on-surface-variant/20"
                      : "text-on-surface-variant/35"
                  }`}
                >
                  {word}
                </span>
              ))}
            </Marquee>
          </FadeUp>
        </div>

        <div aria-hidden className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-container/20 to-transparent" />
      </section>

      {/* ─── Feature cards ───────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-24">
        <FadeUp>
          <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-3">The Platform</p>
          <h2 className="font-headline-xl text-headline-xl md:text-[clamp(2.5rem,5vw,4rem)] text-on-surface tracking-tight">
            Built for the scene.
          </h2>
        </FadeUp>

        <div className="mt-16 grid gap-liquid_gap md:grid-cols-3">
          {features.map(({ headline, body, tag, icon, accentClass, borderClass, bgClass, iconColor }, i) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`glass-panel liquid-card rounded-2xl p-8 border ${borderClass} hover:border-opacity-60 transition-all duration-500 group`}
            >
              <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <span className={`material-symbols-outlined text-[24px] ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {icon}
                </span>
              </div>
              <p className={`font-label-sm text-label-sm ${accentClass} uppercase tracking-widest mb-3`}>{tag}</p>
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-4 tracking-tight">{headline}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Live cyphers preview ─────────────────────────────────────────── */}
      {cyphers.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-16">
          <FadeUp>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="font-label-sm text-label-sm text-error uppercase tracking-widest flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-error" />
                  </span>
                  Happening now
                </p>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mt-1">
                  Cyphers live in your city
                </h2>
              </div>
              <Link to="/cyphers" className="font-label-sm text-label-sm text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-1 uppercase tracking-widest">
                Explore All
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </FadeUp>

          <StaggerChildren delay={0.1} className="grid gap-liquid_gap md:grid-cols-3">
            {cyphers.map((c: any) => (
              <motion.div
                key={c.id}
                variants={fadeUpVariants}
                className="glass-card liquid-hover rounded-2xl p-6 cursor-pointer group border border-white/5 hover:border-primary-container/30 transition-all duration-500"
              >
                <Badge tone={c.state === "active" ? "live" : "upcoming"}>
                  {c.type?.toUpperCase()} CYPHER
                </Badge>
                <h3 className="mt-4 font-headline-lg-mobile text-headline-lg-mobile text-on-surface group-hover:text-primary-fixed-dim transition-colors">
                  {c.title}
                </h3>
                <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant/60 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {c.city}
                  {c.pullingUp ? ` · ${c.pullingUp} pulling up` : ""}
                </p>
                <Link
                  to={`/cyphers/${c.id}`}
                  className="mt-5 inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant/50 hover:text-primary transition-colors"
                >
                  Open circle
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </motion.div>
            ))}
          </StaggerChildren>
        </section>
      )}

      {/* ─── Closing CTA ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-white/5 py-32 text-center">
        <Grain opacity={0.016} />
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(124,58,237,0.12) 0%, transparent 60%)" }}
        />
        <div className="relative z-10 px-margin-mobile md:px-margin-desktop">
          <FadeUp>
            <h2 className="font-headline-xl text-headline-xl md:text-[clamp(2.5rem,5vw,4.5rem)] text-on-surface tracking-tight mx-auto max-w-4xl">
              Designed for India's{" "}
              <span className="text-primary-fixed-dim">independent music</span>{" "}
              culture.
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-6 max-w-2xl mx-auto font-body-md text-body-md text-on-surface-variant/70 leading-relaxed">
              CypherLink is a creative network for Indian independent music — from
              cyphers and collabs to community safety and ephemeral moments that
              leave a permanent mark.
            </p>
          </FadeUp>
          <FadeUp delay={0.2} className="mt-10">
            <Link to="/home">
              <button className="btn-liquid px-10 py-5 rounded-full font-label-sm text-label-sm text-on-primary-container uppercase tracking-widest shadow-primary-glow-lg hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] transition-all duration-300">
                Join the culture
              </button>
            </Link>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
