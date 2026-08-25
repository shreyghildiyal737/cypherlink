import { useState, useCallback } from "react";
import { useSearch } from "../hooks";
import { ProfileMini } from "../components/cards/ProfileMini";
import { ProjectCard } from "../components/cards/ProjectCard";
import { CypherCard } from "../components/cards/CypherCard";
import { FadeUp, StaggerChildren, fadeUpVariants } from "../components/ui/motion";
import { motion } from "framer-motion";
import { mapArtist, mapProject, mapCypher } from "../services/mappers";

interface SearchFilters {
  city?: string;
  genre?: string;
  openToCollab?: boolean;
  beginnerFriendly?: boolean;
  openRole?: string;
  projectType?: string;
  commitmentStyle?: string;
  localRemote?: string;
}

const TOGGLE_FILTERS = [
  { label: "Open to collab", key: "openToCollab" as const },
  { label: "Beginner friendly", key: "beginnerFriendly" as const },
];

const QUICK_CITIES = ["Delhi", "Mumbai", "Dehradun", "Bangalore", "Hyderabad"];

export default function Search() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [activeTab, setActiveTab] = useState<"all" | "artists" | "projects" | "cyphers">("all");

  const debounced = useCallback((v: string) => {
    const t = setTimeout(() => setDebouncedQ(v), 300);
    return () => clearTimeout(t);
  }, []);

  const { data } = useSearch(debouncedQ);

  const artists = (data?.artists ?? []).map((a: any) => mapArtist(a));
  const projects = (data?.projects ?? []).map((p: any) => mapProject(p));
  const cyphers = (data?.cyphers ?? []).map((c: any) => mapCypher(c));

  const hasResults = artists.length > 0 || projects.length > 0 || cyphers.length > 0;

  function toggleFilter(key: "openToCollab" | "beginnerFriendly") {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] || undefined }));
  }

  function toggleLocalRemote(val: string) {
    setFilters((prev) => ({ ...prev, localRemote: prev.localRemote === val ? undefined : val }));
  }

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <FadeUp>
        {/* Search input */}
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-on-surface-variant/40 pointer-events-none">
            search
          </span>
          <input
            className="w-full rounded-2xl border border-white/[0.08] glass-card pl-14 pr-6 py-4 font-body-md text-lg text-on-surface placeholder:text-on-surface-variant/28 outline-none transition-all duration-300 focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20"
            placeholder="Search artists, projects, cyphers, scenes..."
            onChange={(e) => {
              setQ(e.target.value);
              debounced(e.target.value);
            }}
            value={q}
            aria-label="Search"
          />
        </div>

        {/* Filter section */}
        <div className="mt-4 glass-card rounded-2xl border border-white/[0.06] p-4 space-y-3">
          {/* City quick filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-label-sm text-[10px] text-on-surface-variant/35 uppercase tracking-widest">City</span>
            {QUICK_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setFilters((prev) => ({ ...prev, city: prev.city === city ? undefined : city }))}
                className={`rounded-full border px-3 py-1 font-label-sm text-xs transition ${
                  filters.city === city
                    ? "border-primary-container/50 bg-primary-container/15 text-primary-fixed-dim"
                    : "border-white/[0.08] bg-white/[0.03] text-on-surface-variant/55 hover:border-primary-container/20"
                }`}
              >
                {city}
              </button>
            ))}
            <input
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-body-md text-xs text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-primary-container/40 transition w-28"
              placeholder="Other city..."
              value={QUICK_CITIES.includes(filters.city ?? "") ? "" : (filters.city ?? "")}
              onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value || undefined }))}
            />
          </div>

          {/* Toggle filters */}
          <div className="flex flex-wrap gap-2">
            {TOGGLE_FILTERS.map(({ label, key }) => (
              <button
                key={key}
                onClick={() => toggleFilter(key)}
                className={`rounded-full border px-3 py-1.5 font-label-sm text-sm transition ${
                  filters[key]
                    ? "border-primary-container/50 bg-primary-container/15 text-primary-fixed-dim"
                    : "border-white/[0.08] bg-white/[0.03] text-on-surface-variant/55 hover:border-primary-container/20"
                }`}
              >
                {label}
              </button>
            ))}
            {(["LOCAL", "REMOTE"] as const).map((v) => (
              <button
                key={v}
                onClick={() => toggleLocalRemote(v)}
                className={`rounded-full border px-3 py-1.5 font-label-sm text-sm transition ${
                  filters.localRemote === v
                    ? "border-primary-container/50 bg-primary-container/15 text-primary-fixed-dim"
                    : "border-white/[0.08] bg-white/[0.03] text-on-surface-variant/55 hover:border-primary-container/20"
                }`}
              >
                {v === "LOCAL" ? "Local" : "Remote"}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                onClick={() => setFilters({})}
                className="rounded-full border border-white/[0.06] px-3 py-1.5 font-label-sm text-xs text-on-surface-variant/40 hover:text-on-surface-variant/70 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tab navigation (only when there are results) */}
        {hasResults && debouncedQ.length >= 2 && (
          <div className="mt-6 flex gap-1 overflow-x-auto">
            {(["all", "artists", "projects", "cyphers"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 font-label-sm text-sm capitalize transition whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-primary-container/15 text-primary-fixed-dim border border-primary-container/30"
                    : "text-on-surface-variant/50 hover:text-on-surface-variant/80"
                }`}
              >
                {tab === "all" ? "All" : tab}
                {tab === "artists" && artists.length > 0 && ` (${artists.length})`}
                {tab === "projects" && projects.length > 0 && ` (${projects.length})`}
                {tab === "cyphers" && cyphers.length > 0 && ` (${cyphers.length})`}
              </button>
            ))}
          </div>
        )}
      </FadeUp>

      {/* Results */}
      {debouncedQ.length >= 2 && data && (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {(activeTab === "all" || activeTab === "artists") && artists.length > 0 && (
            <section>
              <h2 className="mb-4 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Artists
              </h2>
              <div className="space-y-3">
                {artists.map((a: any) => (
                  <ProfileMini key={a.id} artist={a} />
                ))}
              </div>
            </section>
          )}
          {(activeTab === "all" || activeTab === "projects") && projects.length > 0 && (
            <section>
              <h2 className="mb-4 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Projects
              </h2>
              <div className="space-y-liquid_gap">
                {projects.map((p: any) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}
          {(activeTab === "all" || activeTab === "cyphers") && cyphers.length > 0 && (
            <section>
              <h2 className="mb-4 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Cyphers
              </h2>
              <div className="space-y-liquid_gap">
                {cyphers.map((c: any) => (
                  <CypherCard key={c.id} cypher={c} />
                ))}
              </div>
            </section>
          )}
          {!hasResults && (
            <div className="col-span-full rounded-2xl border border-white/[0.06] glass-panel p-10 text-center">
              <span className="material-symbols-outlined text-on-surface-variant/20 text-[40px] block mb-3">search_off</span>
              <p className="font-body-md text-on-surface-variant/40">
                No results for &ldquo;{debouncedQ}&rdquo;
              </p>
              <p className="mt-2 font-label-sm text-sm text-on-surface-variant/28">
                Try different keywords or browse by scene.
              </p>
            </div>
          )}
        </div>
      )}

      {debouncedQ.length === 0 && (
        <div className="mt-8 rounded-2xl border border-white/[0.06] glass-panel p-12 text-center">
          <span className="material-symbols-outlined text-on-surface-variant/15 text-[48px] block mb-4">manage_search</span>
          <p className="font-body-md text-on-surface-variant/40">Start typing to search artists, projects, and cyphers.</p>
          <p className="mt-2 font-label-sm text-sm text-on-surface-variant/28">
            Use filters above to narrow by location, collaboration style, or availability.
          </p>
        </div>
      )}
    </div>
  );
}
