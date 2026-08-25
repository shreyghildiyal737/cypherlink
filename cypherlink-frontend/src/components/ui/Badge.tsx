import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

type Tone =
  | "live"
  | "active"
  | "upcoming"
  | "afterglow"
  | "archived"
  | "purple"
  | "cyan"
  | "orange"
  | "green"
  | "muted"
  | "red"
  | "gold";

export function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  if (tone === "live" || tone === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-container/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary shadow-primary-glow/20">
        <motion.span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest",
        tone === "upcoming" &&
          "border-primary-container/20 bg-primary-container/06 text-on-surface/80",
        tone === "afterglow" &&
          "border-white/06 bg-white/[0.02] text-on-surface-variant/45",
        tone === "archived" &&
          "border-white/[0.04] bg-white/[0.01] text-on-surface-variant/30",
        tone === "purple" &&
          "border-primary-container/20 bg-primary-container/06 text-on-surface/80",
        tone === "orange" &&
          "border-tertiary-container/20 bg-tertiary-container/06 text-tertiary",
        tone === "red" &&
          "border-error/25 bg-error/08 text-error",
        tone === "cyan" &&
          "border-tertiary-container/30 bg-tertiary-container/10 text-tertiary",
        tone === "green" &&
          "border-[#34D399]/20 bg-[rgba(52,211,153,0.06)] text-[#34D399]",
        tone === "gold" &&
          "border-secondary/20 bg-secondary-container/08 text-secondary",
        tone === "muted" &&
          "border-white/06 bg-white/[0.02] text-on-surface-variant/45",
      )}
    >
      {children}
    </span>
  );
}
