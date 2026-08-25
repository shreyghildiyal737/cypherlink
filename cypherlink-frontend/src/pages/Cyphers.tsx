import { useState } from "react";
import { motion } from "framer-motion";
import { useCyphers } from "../hooks";
import { CypherCard } from "../components/cards/CypherCard";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Marquee } from "../components/ui/Marquee";
import { StaggerChildren, FadeUp, fadeUpVariants } from "../components/ui/motion";
import { Link } from "react-router-dom";

const GENRE_TAGS = [
  "FREESTYLE", "BATTLE", "OPEN MIC", "VENUE",
  "CIPHER", "AFTERGLOW", "HIP-HOP", "RAP", "OPEN CIRCLE",
  "BOOM BAP", "TRAP", "DRILL", "CONSCIOUS", "GULLY",
];

type Filter = "all" | "live" | "upcoming" | "venue";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live Now" },
  { key: "upcoming", label: "Upcoming" },
  { key: "venue", label: "Venue" },
];

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (t.includes(q)) return true;
  // word-by-word partial match
  return q.split(/\s+/).every((word) => t.includes(word));
}

export default function Cyphers() {
  const { data: cyphers, isLoading } = useCyphers();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = (cyphers ?? []).filter((c: any) => {
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "live" && c.state === "active") ||
      (activeFilter === "upcoming" && c.state === "upcoming") ||
      (activeFilter === "venue" && c.type === "venue");
    const matchesSearch =
      !searchQuery ||
      fuzzyMatch(c.title ?? "", searchQuery) ||
      fuzzyMatch(c.city ?? "", searchQuery) ||
      fuzzyMatch(c.venue ?? "", searchQuery);
    return matchesFilter && matchesSearch;
  });

  const liveCount = (cyphers ?? []).filter((c: any) => c.state === "active").length;

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">

      {/* ─── Hero heading ───────────────────────────────────────────────── */}
      <FadeUp>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {liveCount > 0 ? (
              <Badge tone="live">{liveCount} live right now</Badge>
            ) : (
              <Badge tone="muted">Temporary pages. Curated highlights survive.</Badge>
            )}

            <h1 className="mt-4 font-headline-xl text-headline-xl md:text-[clamp(3rem,7vw,5rem)] text-on-surface tracking-tight">
              Cyphers
            </h1>

            <p className="mt-3 max-w-xl font-body-md text-body-md text-on-surface-variant/70">
              Open circles and venue sessions that become living timelines, then
              fade after 24 hours — except chosen highlights.
            </p>
          </div>

          <Link to="/create" className="mt-2">
            <Button>
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              Host cypher
            </Button>
          </Link>
        </div>
      </FadeUp>

      {/* ─── Genre marquee ──────────────────────────────────────────────── */}
      <FadeUp delay={0.1} className="mt-8 overflow-hidden">
        <Marquee speed={22} className="py-2">
          {GENRE_TAGS.map((tag) => (
            <span
              key={tag}
              className="shrink-0 rounded-full border border-white/07 bg-white/[0.02] px-4 py-1.5 font-label-sm text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/35"
            >
              {tag}
            </span>
          ))}
        </Marquee>
      </FadeUp>

      {/* ─── Search ─────────────────────────────────────────────────────── */}
      <FadeUp delay={0.12} className="mt-6">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-on-surface-variant/40 pointer-events-none">
            search
          </span>
          <input
            type="search"
            aria-label="Search cyphers by name or city"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cyphers by name or city…"
            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] pl-11 pr-10 py-3 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/35 focus:outline-none focus:border-primary-container/50 focus:bg-white/[0.04] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </FadeUp>

      {/* ─── Filter tabs ────────────────────────────────────────────────── */}
      <FadeUp delay={0.15} className="mt-3">
        <div role="tablist" aria-label="Cypher filters" className="relative flex gap-1 overflow-hidden rounded-xl border border-white/07 bg-white/[0.02] p-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeFilter === key}
              onClick={() => setActiveFilter(key)}
              className="relative flex-1 rounded-lg py-2.5 font-label-sm text-sm font-semibold transition-colors"
            >
              {activeFilter === key && (
                <motion.span
                  layoutId="cypher-filter-pill"
                  className="absolute inset-0 rounded-lg bg-primary-container/20 border border-primary-container/30"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <span
                className={`relative z-10 flex items-center justify-center gap-1.5 transition-colors ${
                  activeFilter === key
                    ? "text-on-surface"
                    : "text-on-surface-variant/40 hover:text-on-surface-variant/70"
                }`}
              >
                {key === "live" && (
                  <span className={`relative flex h-2 w-2 ${activeFilter === key ? "" : ""}`}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-error" />
                  </span>
                )}
                {label}
              </span>
            </button>
          ))}
        </div>
      </FadeUp>

      {/* ─── Card grid ──────────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-liquid_gap">
        {isLoading ? (
          [0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-40 rounded-2xl border border-white/[0.05] glass-card"
              animate={{ opacity: [0.4, 0.65, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25 }}
            />
          ))
        ) : filtered.length === 0 ? (
          <FadeUp>
            <div className="flex flex-col items-center rounded-2xl border border-white/[0.06] glass-panel px-8 py-20 text-center">
              <div className="mb-6 flex items-center gap-4 w-full max-w-xs">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/10 select-none">graphic_eq</span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              <p className="font-semibold text-on-surface-variant/50">
                {searchQuery
                  ? `No cyphers found for "${searchQuery}"`
                  : activeFilter === "live"
                    ? "No circles are active right now."
                    : "No cyphers forming here."}
              </p>
              <p className="mt-2 font-body-md text-sm text-on-surface-variant/30">
                {searchQuery
                  ? "Try a different name or city."
                  : activeFilter === "live"
                    ? "The city breathes between sessions."
                    : "The city is quiet — be the one who calls people in."}
              </p>

              <div className="mt-6 h-px w-12 bg-primary-container/30" />

              <Link to="/create">
                <Button className="mt-8">Host a cypher</Button>
              </Link>
            </div>
          </FadeUp>
        ) : (
          <StaggerChildren>
            {filtered.map((c: any) => (
              <motion.div key={c.id} variants={fadeUpVariants}>
                <CypherCard cypher={c} />
              </motion.div>
            ))}
          </StaggerChildren>
        )}
      </div>
    </div>
  );
}
