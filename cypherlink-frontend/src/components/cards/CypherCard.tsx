import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Cypher } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export function CypherCard({ cypher }: { cypher: Cypher }) {
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();
  const isVenue = cypher.type === "venue";
  const isActive = cypher.state === "active";
  const isAfterGlow = cypher.state === "afterglow";
  const isArchived = cypher.state === "archived";

  const leftBorderColor = isActive
    ? "rgb(var(--color-error) / 0.8)"
    : isAfterGlow
    ? "rgb(var(--color-error) / 0.25)"
    : isArchived
    ? "transparent"
    : "rgb(var(--color-primary-container) / 0.6)";

  const cardBorder = isActive
    ? "border-error/20 shadow-[0_0_32px_rgba(255,100,80,0.06)]"
    : isAfterGlow
    ? "border-white/[0.07]"
    : "border-white/[0.06]";

  const hoverBorder = isActive
    ? "hover:border-error/35 hover:shadow-[0_0_28px_rgba(255,100,80,0.10)]"
    : "hover:border-primary-container/20 hover:shadow-[0_4px_24px_rgba(124,58,237,0.08)]";

  return (
    <motion.article
      layout
      whileHover={reduced ? {} : { scale: 1.012 }}
      whileTap={reduced ? {} : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border glass-card backdrop-blur-sm transition-all duration-300",
        cardBorder,
        hoverBorder,
        isArchived && "opacity-50",
      )}
    >
      {/* State left-border accent */}
      {!isArchived && (
        <div
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px] rounded-r-sm"
          style={{ background: leftBorderColor }}
        />
      )}

      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent" />

      <div className="relative p-5 md:p-6">
        {/* Top row */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {isActive ? (
              <Badge tone="live">LIVE NOW</Badge>
            ) : isAfterGlow ? (
              <Badge tone="afterglow">AFTERGLOW</Badge>
            ) : isArchived ? (
              <Badge tone="archived">ARCHIVED</Badge>
            ) : (
              <Badge tone="upcoming">UPCOMING</Badge>
            )}
            <Badge tone={isVenue ? "muted" : "cyan"}>
              {isVenue ? "VENUE" : "OPEN CIRCLE"}
            </Badge>
          </div>
          {isVenue && cypher.spotsLeft != null && (
            <span className="shrink-0 rounded-full border border-white/07 bg-white/[0.03] px-3 py-0.5 font-label-sm text-[10px] text-on-surface-variant/40">
              {cypher.spotsLeft} spots left
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface group-hover:text-primary-fixed-dim transition-colors duration-300">
          {cypher.title}
        </h3>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-3 font-label-sm text-[10px] text-on-surface-variant/45">
          {cypher.venue && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px] text-on-surface-variant/28">location_on</span>
              {cypher.venue}
            </span>
          )}
          {cypher.pullingUp != null && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px] text-on-surface-variant/28">group</span>
              {cypher.pullingUp} pulling up
            </span>
          )}
          {!isActive && cypher.startsAt && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px] text-on-surface-variant/28">schedule</span>
              {cypher.startsAt}
            </span>
          )}
        </div>

        {/* Safety tags */}
        {cypher.safetyTags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {cypher.safetyTags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border border-white/05 bg-white/[0.02] px-2.5 py-0.5 text-[10px] text-on-surface-variant/30"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action area */}
        <AnimatePresence mode="wait">
          {hovered ? (
            <motion.div
              key="actions"
              initial={reduced ? {} : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? {} : { opacity: 0, y: 3 }}
              transition={{ duration: 0.18 }}
              className="mt-5 flex flex-wrap gap-2"
            >
              <Link to={`/cyphers/${cypher.id}`}>
                <Button size="sm">
                  {isVenue ? "Save a spot" : "Join the circle"}
                </Button>
              </Link>
              <Link to={`/cyphers/${cypher.id}`}>
                <Button variant="secondary" size="sm">
                  Open page
                  <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                </Button>
              </Link>
              {isVenue && (
                <Button variant="ghost" size="sm">
                  <span className="material-symbols-outlined text-[13px]">qr_code_scanner</span>
                  Host check-in
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="hint"
              initial={reduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? {} : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-5 flex items-center gap-2"
            >
              <div
                className={cn(
                  "h-px flex-1 bg-gradient-to-r from-transparent",
                  isActive ? "via-error/18" : "via-white/08",
                  "to-transparent",
                )}
              />
              <span className="font-label-sm text-[10px] text-on-surface-variant/22 uppercase tracking-widest">
                Tap to join
              </span>
              <div
                className={cn(
                  "h-px flex-1 bg-gradient-to-l from-transparent",
                  isActive ? "via-error/18" : "via-white/08",
                  "to-transparent",
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
