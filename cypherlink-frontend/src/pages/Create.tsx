import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { FadeUp, StaggerChildren, fadeUpVariants } from "../components/ui/motion";
import { motion } from "framer-motion";

type CreateItem = {
  label: string;
  path: string;
  ready: boolean;
  desc: string;
  icon: string;
};

const groups: { title: string; icon: string; items: CreateItem[] }[] = [
  {
    title: "Start something",
    icon: "add_circle",
    items: [
      { label: "Project", path: "/create/project", ready: true, desc: "Open a studio room and find collaborators", icon: "layers" },
      { label: "Open Cypher", path: "/create/cypher?type=open", ready: true, desc: "Street-style open circle, anyone pulls up", icon: "mic_external_on" },
      { label: "Venue Cypher", path: "/create/cypher?type=venue", ready: true, desc: "Organized venue event with capacity control", icon: "location_city" },
      { label: "Community Session", path: "/create/community", ready: true, desc: "Cleanup, teaching, relief, artist support", icon: "groups" },
    ],
  },
  {
    title: "Share something",
    icon: "movie_filter",
    items: [
      { label: "Drop Clip", path: "/create/clip", ready: true, desc: "A moment worth preserving from your work", icon: "videocam" },
      { label: "Go Live", path: "#", ready: false, desc: "Real-time live session with scene chat", icon: "sensors" },
      { label: "Open Collaboration Call", path: "#", ready: false, desc: "Tell the scene exactly what you need", icon: "record_voice_over" },
    ],
  },
  {
    title: "Learn together",
    icon: "school",
    items: [
      { label: "Free Learning Session", path: "#", ready: false, desc: "Teach a skill to anyone who shows up", icon: "psychology" },
      { label: "Beginner Jam", path: "#", ready: false, desc: "Low-pressure circle for first-timers", icon: "social_leaderboard" },
      { label: "Teach for Free", path: "#", ready: false, desc: "One-on-one or group — no payment, just culture", icon: "volunteer_activism" },
    ],
  },
];

export default function Create() {
  return (
    <div className="mx-auto max-w-5xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <FadeUp>
        <Badge tone="orange">What are you trying to start?</Badge>
        <h1 className="mt-4 font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] text-on-surface tracking-tight">
          Create without killing the momentum.
        </h1>
        <p className="mt-3 max-w-2xl font-body-md text-body-md text-on-surface-variant/60">
          Progressive flows. No giant forms. Creation should feel like initiating movement, not filling out a government form.
        </p>
      </FadeUp>

      <StaggerChildren className="mt-10 grid gap-gutter md:grid-cols-3">
        {groups.map((group) => (
          <motion.section
            key={group.title}
            variants={fadeUpVariants}
            className="rounded-2xl border border-white/[0.06] glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                {group.icon}
              </span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                {group.title}
              </h2>
            </div>
            <div className="space-y-3">
              {group.items.map((item) =>
                item.ready ? (
                  <Link key={item.label} to={item.path} className="block group">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-primary-container/25 hover:bg-primary-container/06 hover:shadow-[0_0_16px_rgba(124,58,237,0.08)]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40 group-hover:text-primary transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {item.icon}
                        </span>
                        <p className="font-semibold text-on-surface group-hover:text-primary-fixed-dim transition-colors">{item.label}</p>
                      </div>
                      <p className="font-label-sm text-xs text-on-surface-variant/50">{item.desc}</p>
                    </div>
                  </Link>
                ) : (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 opacity-30 cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant/30">{item.icon}</span>
                      <p className="font-semibold text-on-surface">{item.label}</p>
                    </div>
                    <p className="font-label-sm text-xs text-on-surface-variant/50">{item.desc}</p>
                  </div>
                ),
              )}
            </div>
          </motion.section>
        ))}
      </StaggerChildren>
    </div>
  );
}
