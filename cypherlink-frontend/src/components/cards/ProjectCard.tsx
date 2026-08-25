import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Project } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

const PHASE_BORDER: Record<string, string> = {
  "Cooking":                    "rgb(var(--color-tertiary) / 0.5)",
  "COOKING":                    "rgb(var(--color-tertiary) / 0.5)",
  "Looking for collaborators":  "rgb(var(--color-primary) / 0.5)",
  "LOOKING_FOR_COLLABORATORS":  "rgb(var(--color-primary) / 0.5)",
  "Recording":                  "rgb(var(--color-error) / 0.5)",
  "RECORDING":                  "rgb(var(--color-error) / 0.5)",
  "Mixing":                     "rgb(var(--color-secondary) / 0.5)",
  "MIXING":                     "rgb(var(--color-secondary) / 0.5)",
  "Finished":                   "rgba(52, 211, 153, 0.4)",
  "FINISHED":                   "rgba(52, 211, 153, 0.4)",
};

const PHASE_TONE: Record<string, "orange" | "cyan" | "red" | "gold" | "green" | "muted"> = {
  "Cooking": "orange",                   "COOKING": "orange",
  "Looking for collaborators": "cyan",   "LOOKING_FOR_COLLABORATORS": "cyan",
  "Recording": "red",                    "RECORDING": "red",
  "Mixing": "gold",                      "MIXING": "gold",
  "Finished": "green",                   "FINISHED": "green",
};

const PROJECT_TYPE_LABEL: Record<string, string> = {
  STRUCTURED:   "Structured",
  OPEN_COLLAB:  "Open Collab",
  COMMUNITY:    "Community",
  CYPHER_EVENT: "Cypher/Event",
};

const COMMITMENT_STYLE_LABEL: Record<string, string> = {
  EXPERIMENTAL:      "Experimental",
  CASUAL:            "Casual",
  QUICK_JAM:         "Quick Jam",
  ONE_NIGHT_SESSION: "One-Night",
  LONG_TERM_PROJECT: "Long-Term",
  RELEASE_FOCUSED:   "Release-Focused",
  PRACTICE_SESSION:  "Practice",
  LEARNING_PROJECT:  "Learning",
};

export function ProjectCard({ project, matchReasons }: { project: Project; matchReasons?: string[] }) {
  const reduced = useReducedMotion();
  const borderColor = PHASE_BORDER[project.status] ?? "rgba(255,255,255,0.10)";
  const phaseTone = PHASE_TONE[project.status] ?? "muted";

  return (
    <motion.article
      whileHover={reduced ? {} : { scale: 1.012 }}
      whileTap={reduced ? {} : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.06] glass-card p-5",
        "transition-all duration-300 hover:border-primary-container/20 hover:shadow-[0_4px_24px_rgba(124,58,237,0.08)]",
      )}
    >
      {/* Phase left-border */}
      <div
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] rounded-r-sm"
        style={{ background: borderColor }}
      />

      {/* Top row */}
      <div className="mb-4 flex items-center justify-between gap-3 pl-1">
        <div className="flex items-center gap-2 flex-wrap">
          {project.projectType && project.projectType !== "STRUCTURED" && (
            <Badge tone={project.projectType === "OPEN_COLLAB" ? "cyan" : "muted"}>
              {PROJECT_TYPE_LABEL[project.projectType] ?? project.projectType}
            </Badge>
          )}
          {project.status && (
            <Badge tone={phaseTone}>{project.status}</Badge>
          )}
          {project.commitmentStyle && (
            <span className="font-label-sm text-[10px] text-on-surface-variant/35 border border-white/[0.06] rounded-full px-2 py-0.5">
              {COMMITMENT_STYLE_LABEL[project.commitmentStyle] ?? project.commitmentStyle}
            </span>
          )}
          {project.aiDisclosureLabel && (
            <span className="font-label-sm text-[9px] text-on-surface-variant/30 border border-white/[0.05] rounded-full px-2 py-0.5 uppercase tracking-wider">
              {project.aiDisclosureLabel === "ai-assisted" ? "AI-assisted" : project.aiDisclosureLabel === "ai-generated" ? "AI-generated" : "AI-workflow"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {project.localRemote && project.localRemote !== "BOTH" && (
            <span className="font-label-sm text-[10px] text-on-surface-variant/30">
              {project.localRemote === "LOCAL" ? "Local" : "Remote"}
            </span>
          )}
          {project.city && (
            <span className="font-label-sm text-[10px] text-on-surface-variant/35 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">location_on</span>
              {project.city}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="pl-1 font-headline-lg-mobile text-headline-lg-mobile text-on-surface group-hover:text-primary-fixed-dim transition-colors duration-300">
        {project.title}
      </h3>

      {/* Match reasons */}
      {matchReasons && matchReasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-1">
          {matchReasons.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 rounded-full border border-primary-container/20 bg-primary-container/08 px-2.5 py-0.5 font-label-sm text-[10px] text-primary-fixed-dim/80"
            >
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 pl-1">
          {project.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} tone="muted">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Role occupancy */}
      {project.openRoles.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
          <p className="flex items-center gap-1.5 font-label-sm text-[10px] text-on-surface-variant/40 uppercase tracking-widest mb-2">
            <span className="material-symbols-outlined text-[12px]">group_add</span>
            Roles
            {project.participantCap != null && (
              <span className="ml-auto font-label-sm text-[9px] text-on-surface-variant/25 normal-case tracking-normal">
                cap: {project.participantCap}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {project.openRoles.map((role) => {
              const filled = (project.filledRoles ?? []).includes(role);
              return (
                <span
                  key={role}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-label-sm text-xs transition-colors ${
                    filled
                      ? "border-green-500/30 bg-green-500/06 text-green-400/70 line-through"
                      : "border-primary-container/30 bg-primary-container/06 text-on-surface/80"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${filled ? "bg-green-400/60" : "bg-primary-container"}`} />
                  {role}
                  {filled ? " ✓" : ""}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex gap-2 pl-1">
        <Link to={`/projects/${project.id ?? ""}`}>
          <Button size="sm">Open room</Button>
        </Link>
        <Button variant="secondary" size="sm">
          Ask to join
        </Button>
      </div>
    </motion.article>
  );
}
