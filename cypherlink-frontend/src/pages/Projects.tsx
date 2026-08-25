import { useState } from "react";
import { useDiscoverProjects, type ProjectDiscoveryFilters } from "../hooks";
import { ProjectCard } from "../components/cards/ProjectCard";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { FadeUp, StaggerChildren, fadeUpVariants } from "../components/ui/motion";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { mapProject } from "../services/mappers";

const COMMITMENT_OPTIONS = [
  { label: "Quick Jam", value: "QUICK_JAM" },
  { label: "One-Night", value: "ONE_NIGHT_SESSION" },
  { label: "Casual", value: "CASUAL" },
  { label: "Long-Term", value: "LONG_TERM_PROJECT" },
  { label: "Release-Focused", value: "RELEASE_FOCUSED" },
];

const TYPE_OPTIONS = [
  { label: "Open Collab", value: "OPEN_COLLAB" },
  { label: "Structured", value: "STRUCTURED" },
  { label: "Community", value: "COMMUNITY" },
];

export default function Projects() {
  const [filters, setFilters] = useState<ProjectDiscoveryFilters>({});
  const [cityInput, setCityInput] = useState("");
  const [roleInput, setRoleInput] = useState("");

  const { data: discoveryData, isLoading } = useDiscoverProjects(filters);
  // Preserve matchReasons alongside the standard Project shape
  const projects = (discoveryData?.items ?? []).map((item: any) => ({
    ...mapProject(item),
    matchReasons: item.matchReasons as string[] | undefined,
  }));

  const hasFilters = !!filters.city || !!filters.openRole || !!filters.commitmentStyle || !!filters.projectType || !!filters.localRemote;

  function applyFilter(key: keyof ProjectDiscoveryFilters, value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value,
    }));
  }

  function clearFilters() {
    setFilters({});
    setCityInput("");
    setRoleInput("");
  }

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <FadeUp>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="green">Culture outside. Focus inside.</Badge>
            <h1 className="mt-4 font-headline-xl text-headline-xl md:text-[clamp(3rem,7vw,5rem)] text-on-surface tracking-tight">
              Project rooms
            </h1>
            <p className="mt-3 max-w-2xl font-body-md text-body-md text-on-surface-variant/70">
              Calm digital studio spaces for files, roles, chat, credits and
              creative continuity.
            </p>
          </div>
          <Link to="/create">
            <Button>
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              Start project
            </Button>
          </Link>
        </div>
      </FadeUp>

      {/* Filter bar */}
      <div className="mt-8 glass-card rounded-2xl border border-white/[0.06] p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <input
            aria-label="Filter by city"
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary-container/40 transition"
            placeholder="City"
            value={cityInput}
            onChange={(e) => {
              setCityInput(e.target.value);
              setFilters((prev) => ({ ...prev, city: e.target.value || undefined }));
            }}
          />
          <input
            aria-label="Filter by role needed"
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary-container/40 transition"
            placeholder="Role needed (e.g. Rapper)"
            value={roleInput}
            onChange={(e) => {
              setRoleInput(e.target.value);
              setFilters((prev) => ({ ...prev, openRole: e.target.value || undefined }));
            }}
          />
          <select
            aria-label="Filter by location preference"
            value={filters.localRemote ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, localRemote: e.target.value || undefined }))}
            className="rounded-xl border border-white/[0.08] bg-surface px-3 py-2 font-body-md text-sm text-on-surface outline-none focus:border-primary-container/40 transition"
          >
            <option value="">Local + Remote</option>
            <option value="LOCAL">Local only</option>
            <option value="REMOTE">Remote OK</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => applyFilter("projectType", o.value)}
              className={`rounded-full border px-3 py-1 font-label-sm text-xs transition ${
                filters.projectType === o.value
                  ? "border-primary-container/50 bg-primary-container/15 text-primary-fixed-dim"
                  : "border-white/[0.08] bg-white/[0.03] text-on-surface-variant/55 hover:border-primary-container/20"
              }`}
            >
              {o.label}
            </button>
          ))}
          <span className="self-center border-l border-white/[0.06] h-4 mx-1" />
          {COMMITMENT_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => applyFilter("commitmentStyle", o.value)}
              className={`rounded-full border px-3 py-1 font-label-sm text-xs transition ${
                filters.commitmentStyle === o.value
                  ? "border-primary-container/50 bg-primary-container/15 text-primary-fixed-dim"
                  : "border-white/[0.08] bg-white/[0.03] text-on-surface-variant/55 hover:border-primary-container/20"
              }`}
            >
              {o.label}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-full border border-white/[0.06] px-3 py-1 font-label-sm text-xs text-on-surface-variant/40 hover:text-on-surface-variant/70 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-liquid_gap md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-48 rounded-2xl glass-card"
              animate={{ opacity: [0.4, 0.65, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25 }}
            />
          ))
        ) : projects?.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-white/[0.06] glass-panel px-8 py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-tertiary-container/15 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-tertiary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>layers</span>
            </div>
            <p className="font-semibold text-on-surface-variant/50">
              {hasFilters ? "No projects match these filters." : "No studio rooms open yet."}
            </p>
            <p className="mt-1 font-body-md text-sm text-on-surface-variant/28">
              {hasFilters ? "Try broadening your search." : "Projects are where the real work happens. Start one and bring people in."}
            </p>
            {!hasFilters && (
              <Link to="/create">
                <Button className="mt-6">Start a project</Button>
              </Link>
            )}
          </div>
        ) : (
          <StaggerChildren className="contents">
            {projects?.map((p: any) => (
              <motion.div key={p.id} variants={fadeUpVariants}>
                <ProjectCard project={p} matchReasons={p.matchReasons} />
              </motion.div>
            ))}
          </StaggerChildren>
        )}
      </div>
    </div>
  );
}
