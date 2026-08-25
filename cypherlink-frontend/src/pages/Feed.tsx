import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useClips } from "../hooks";
import { useAuthStore } from "../store/authStore";
import { useModalAccessibility } from "../hooks/useModalAccessibility";
import { Badge } from "../components/ui/Badge";
import { SafetyMenu } from "../components/ui/SafetyMenu";
import type { Clip } from "../types";

// ─── Format config ────────────────────────────────────────────────────────────

const FORMAT_CONFIG: Record<string, { label: string; tone: "cyan" | "orange" | "green" | "purple" | "muted" }> = {
  LIVE_SESSION:  { label: "Live session",       tone: "orange" },
  STUDIO_DROP:   { label: "Studio drop",        tone: "purple" },
  COMMUNITY:     { label: "Community session",  tone: "cyan"   },
  INDEPENDENT:   { label: "Independent drop",   tone: "muted"  },
  COLLAB:        { label: "Open collab",        tone: "green"  },
  // String fallbacks (from mock data)
  "Live session moment": { label: "Live session",      tone: "orange" },
  "Studio work":         { label: "Studio drop",       tone: "purple" },
  "Community moment":    { label: "Community session", tone: "cyan"   },
  "New drop":            { label: "Independent drop",  tone: "muted"  },
  "Collaboration work":  { label: "Open collab",       tone: "green"  },
};

// Atmospheric gradients for clips without media — chosen by clip id hash
const ATMOSPHERES = [
  "from-[#0e0e10] via-[#14090d] to-[#0e0e10]",
  "from-[#0e0e10] via-[#160a1a] to-[#0e0e10]",
  "from-[#0e0e10] via-[#1a0a10] to-[#0e0e10]",
  "from-[#0e0e10] via-[#130e1e] to-[#0e0e10]",
  "from-[#0e0e10] via-[#0e0a1c] to-[#0e0e10]",
  "from-[#0e0e10] via-[#1a0e12] to-[#0e0e10]",
];

function pickAtmosphere(id: string): string {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ATMOSPHERES[sum % ATMOSPHERES.length];
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

type FilterState = { formats: string[]; genres: string[] };

function toggle(list: string[], val: string): string[] {
  return list.includes(val) ? list.filter((v) => v !== val) : [...list, val];
}

// ─── Tune panel ───────────────────────────────────────────────────────────────

function FilterChip({
  label, active, onPress,
}: { label: string; active: boolean; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95",
        active
          ? "border-primary-container/30 bg-primary-container/15 text-primary-fixed shadow-[0_0_12px_rgba(139,92,246,0.10)]"
          : "border-white/[0.08] bg-white/[0.03] text-on-surface-variant/50 hover:bg-white/[0.08] hover:text-on-surface",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function FilterSection({
  title, options, selected, onChange,
}: {
  title: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const allActive = selected.length === 0;
  return (
    <div>
      <p className="mb-3 font-label-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/35">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All"
          active={allActive}
          onPress={() => onChange([])}
        />
        {options.map((opt) => (
          <FilterChip
            key={opt}
            label={opt}
            active={!allActive && selected.includes(opt)}
            onPress={() => {
              if (allActive) { onChange([opt]); return; }
              const next = toggle(selected, opt);
              onChange(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function TunePanel({
  open, onClose, availableFormats, availableGenres, filters, onChange,
}: {
  open: boolean;
  onClose: () => void;
  availableFormats: string[];
  availableGenres: string[];
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  const activeCount = filters.formats.length + filters.genres.length;
  // Focus trap + Escape close + focus restore (body-scroll lock included).
  const containerRef = useModalAccessibility(open, onClose);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />
      {/* Sheet — containerRef wires up the focus trap */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tune your feed"
        className={[
          "fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[2rem]",
          "border-t border-primary-container/20 bg-surface-container-lowest px-6 pt-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/[0.15]" />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Tune
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant/60">Shape what you discover</p>
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                onClick={() => onChange({ formats: [], genres: [] })}
                className="font-label-sm text-xs text-on-surface-variant/40 hover:text-primary transition"
              >
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.08] text-sm text-on-surface-variant/50 hover:bg-primary-container/20 hover:text-on-surface transition"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-7">
          {availableFormats.length > 0 && (
            <FilterSection
              title="Format"
              options={availableFormats}
              selected={filters.formats}
              onChange={(v) => onChange({ ...filters, formats: v })}
            />
          )}
          {availableGenres.length > 0 && (
            <FilterSection
              title="Genre"
              options={availableGenres}
              selected={filters.genres}
              onChange={(v) => onChange({ ...filters, genres: v })}
            />
          )}
          {availableFormats.length === 0 && availableGenres.length === 0 && (
            <p className="font-body-md text-sm text-on-surface-variant/40">
              Drop some clips to unlock tune filters.
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full rounded-full border border-white/[0.10] bg-white/[0.06] py-3 font-label-sm text-sm font-semibold text-on-surface-variant/70 transition hover:bg-primary-container/20 hover:text-on-surface"
        >
          Done
        </button>
      </div>
    </>
  );
}

// ─── Individual clip card ─────────────────────────────────────────────────────

function ClipCard({
  clip, saved, tappedIn, onSave, onTapIn,
}: {
  clip: Clip;
  saved: boolean;
  tappedIn: boolean;
  onSave: () => void;
  onTapIn: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const fmtCfg = FORMAT_CONFIG[clip.reason] ?? { label: clip.reason || "Drop", tone: "muted" as const };
  const atmosphere = pickAtmosphere(clip.id);

  const isVideo = !!clip.mediaUrl?.match(/\.(mp4|webm|mov)$/i);
  const isImage = !!clip.mediaUrl?.match(/\.(jpg|jpeg|png|webp|gif)$/i);

  // Fix 1: IntersectionObserver — only play video when this card is ≥50% visible.
  const cardRef  = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const card  = cardRef.current;
    if (!video || !card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  async function handleShare() {
    const url = `${window.location.origin}/clips/${clip.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: clip.creator.name, text: clip.caption || fmtCfg.label, url }); return; }
      catch { /* fallback */ }
    }
    navigator.clipboard.writeText(url).catch(() => {});
  }

  // Fix 5: context line — skip city if already present in linked title.
  const linkedTitle = (clip.cypher?.title ?? clip.communitySession?.title ?? "").toLowerCase();
  const cityAlreadyInTitle = !!clip.city && linkedTitle.includes(clip.city.toLowerCase());
  const contextLine = [
    clip.cypher && `Captured during ${clip.cypher.title}`,
    !clip.cypher && clip.communitySession && `From ${clip.communitySession.title}`,
    clip.city && !cityAlreadyInTitle && clip.city,
  ].filter(Boolean).join(" · ");

  return (
    <div ref={cardRef} className={`relative h-full w-full overflow-hidden bg-gradient-to-b ${atmosphere}`}>
      {/* Media layer — no autoPlay; IntersectionObserver drives playback */}
      {isVideo && (
        <video
          ref={videoRef}
          src={clip.mediaUrl}
          muted loop playsInline preload="none"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
      )}
      {isImage && (
        <img
          src={clip.mediaUrl}
          alt=""
          loading="lazy"
          width={600}
          height={900}
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
      )}

      {/* Gradient overlay — heavy at bottom for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

      {/* Top-right safety menu */}
      {user && clip.creator.id && user.id !== clip.creator.id && (
        <div className="absolute right-4 top-4 z-10">
          <SafetyMenu
            targetId={clip.creator.id}
            targetType="user"
            targetName={clip.creator.name}
          />
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
        {/* Creator */}
        <div className="mb-4 flex items-end gap-3">
          <Link
            to={`/profile/${clip.creator.id}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-container via-[#6d28d9] to-[#5200b0] text-sm font-black border border-primary/25 shadow-primary-glow backdrop-blur-sm transition hover:opacity-80"
          >
            {clip.creator.avatar}
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              to={`/profile/${clip.creator.id}`}
              className="block font-semibold leading-tight text-on-surface hover:text-primary transition-colors"
            >
              {clip.creator.name}
            </Link>
            <p className="truncate font-label-sm text-xs text-on-surface-variant/55">
              {clip.creator.handle}
              {(clip.city || clip.creator.city) && ` · ${clip.city || clip.creator.city}`}
              {clip.creator.role && ` · ${clip.creator.role}`}
            </p>
          </div>
        </div>

        {/* Caption */}
        {clip.caption && (
          <p className="mb-3 font-body-md text-base font-semibold leading-snug text-on-surface/90 line-clamp-3">
            {clip.caption}
          </p>
        )}

        {/* Format + context */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone={fmtCfg.tone}>{fmtCfg.label}</Badge>
          {contextLine && (
            <span className="font-label-sm text-xs text-on-surface-variant/45">{contextLine}</span>
          )}
        </div>

        {/* Ecosystem linkage pills */}
        {(clip.cypher || clip.project || clip.communitySession) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {clip.cypher && (
              <Link
                to={`/cyphers/${clip.cypher.id}`}
                className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-[#8B5CF6]/30 bg-black/40 px-3 py-1 text-xs text-[#E9D5FF] backdrop-blur-sm transition hover:bg-[#8B5CF6]/15"
              >
                <span className="shrink-0 text-[#C084FC]">↺</span>
                <span className="truncate">{clip.cypher.title}</span>
              </Link>
            )}
            {clip.project && (
              <Link
                to={`/projects/${clip.project.id}`}
                className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-white/[0.15] bg-black/50 px-3 py-1 font-label-sm text-xs text-on-surface-variant/70 backdrop-blur-sm transition hover:bg-white/[0.08]"
              >
                <span className="shrink-0 text-on-surface-variant/40">◇</span>
                <span className="truncate">{clip.project.title}</span>
              </Link>
            )}
            {clip.communitySession && !clip.cypher && (
              <Link
                to={`/community/${clip.communitySession.id}`}
                className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-white/[0.12] bg-black/50 px-3 py-1 font-label-sm text-xs text-on-surface-variant/65 backdrop-blur-sm transition hover:bg-white/[0.07]"
              >
                <span className="shrink-0 text-on-surface-variant/35">◯</span>
                <span className="truncate">{clip.communitySession.title}</span>
              </Link>
            )}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTapIn}
            aria-label={tappedIn ? "Tapped in" : "Tap in"}
            className={[
              "flex-1 rounded-full border py-2.5 text-xs font-semibold transition-all duration-200 active:scale-95",
              tappedIn
                ? "border-primary-container/40 bg-primary-container/20 text-primary-fixed shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                : "border-white/[0.15] bg-black/40 text-on-surface/80 backdrop-blur-md hover:border-primary-container/30 hover:bg-primary-container/10 hover:text-primary-fixed",
            ].join(" ")}
          >
            {tappedIn ? "Tapped ✓" : "Tap In"}
          </button>

          <button
            onClick={onSave}
            aria-label={saved ? "Saved" : "Save"}
            className={[
              "rounded-full border py-2.5 px-4 text-xs font-semibold transition-all duration-200 active:scale-95",
              saved
                ? "border-primary-container/30 bg-primary-container/15 text-on-surface"
                : "border-white/[0.12] bg-black/40 text-on-surface-variant/70 backdrop-blur-md hover:bg-white/[0.06] hover:border-primary-container/20",
            ].join(" ")}
          >
            {saved ? "Saved" : "Save"}
          </button>

          <button
            onClick={handleShare}
            aria-label="Share"
            className="rounded-full border border-white/[0.12] bg-black/40 py-2.5 px-4 font-label-sm text-xs font-semibold text-on-surface-variant/70 backdrop-blur-md transition hover:bg-white/[0.06] hover:border-primary-container/20 active:scale-95"
          >
            Share
          </button>

          <Link
            to={`/clips/${clip.id}`}
            aria-label="View clip detail"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.10] bg-black/40 text-sm text-on-surface-variant/50 backdrop-blur-md transition hover:bg-white/[0.06] hover:border-primary-container/20 hover:text-on-surface active:scale-95"
          >
            →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Scope toggle ─────────────────────────────────────────────────────────────

function ScopeToggle({
  scope, onChange,
}: { scope: "near" | "india"; onChange: (s: "near" | "india") => void }) {
  return (
    <div className="flex items-center rounded-full border border-primary-container/15 bg-white/[0.02] p-0.5 backdrop-blur-md">
      {(["near", "india"] as const).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={[
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200",
            scope === s ? "bg-primary-container/15 border border-primary-container/20 text-on-surface" : "text-on-surface-variant/50 hover:text-on-surface-variant",
          ].join(" ")}
        >
          {s === "near" ? "Near You" : "Across India"}
        </button>
      ))}
    </div>
  );
}

// ─── Feed skeleton ─────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-white/[0.08]" />
        <p className="font-body-md text-sm text-on-surface-variant/35">Tuning into the scene...</p>
      </div>
    </div>
  );
}

// ─── Main Feed ────────────────────────────────────────────────────────────────

export default function Feed() {
  const { data: clips, isLoading } = useClips();
  const user = useAuthStore((s) => s.user);

  const [scope, setScope]         = useState<"near" | "india">("near");
  const [tuneOpen, setTuneOpen]   = useState(false);
  const [filters, setFilters]     = useState<FilterState>({ formats: [], genres: [] });
  const [saved, setSaved]         = useState<Set<string>>(new Set());
  const [tappedIn, setTappedIn]   = useState<Set<string>>(new Set());

  // Fix 6: keyboard navigation between snap cards.
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleFeedKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const container = scrollRef.current;
    if (!container) return;
    const dir = e.key === "ArrowDown" ? 1 : -1;
    container.scrollBy({ top: dir * container.clientHeight, behavior: "smooth" });
  }

  // Derive available filter options from real clip data
  const availableFormats = useMemo(() => {
    if (!clips) return [];
    const seen = new Set<string>();
    (clips as Clip[]).forEach((c) => {
      const label = FORMAT_CONFIG[c.reason]?.label;
      if (label) seen.add(label);
    });
    return Array.from(seen);
  }, [clips]);

  const availableGenres = useMemo(() => {
    if (!clips) return [];
    const seen = new Set<string>();
    (clips as Clip[]).forEach((c) => c.creator.genres?.forEach((g) => seen.add(g)));
    return Array.from(seen).slice(0, 12);
  }, [clips]);

  // Apply scope + filter to clips
  const filtered = useMemo((): Clip[] => {
    if (!clips) return [];
    let result = clips as Clip[];

    // Near You: float city-matching clips to top, don't hard-exclude anything
    if (scope === "near" && user?.city) {
      const uc = user.city.toLowerCase();
      const near = result.filter(
        (c) => c.city?.toLowerCase() === uc || c.creator.city?.toLowerCase() === uc,
      );
      const rest = result.filter(
        (c) => c.city?.toLowerCase() !== uc && c.creator.city?.toLowerCase() !== uc,
      );
      result = [...near, ...rest];
    }

    if (filters.formats.length > 0) {
      result = result.filter((c) => {
        const label = FORMAT_CONFIG[c.reason]?.label;
        return label && filters.formats.includes(label);
      });
    }

    if (filters.genres.length > 0) {
      result = result.filter((c) =>
        c.creator.genres?.some((g) => filters.genres.includes(g)),
      );
    }

    return result;
  }, [clips, scope, filters, user]);

  const activeFilterCount = filters.formats.length + filters.genres.length;

  function toggleSave(id: string) {
    setSaved((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleTapIn(id: string) {
    setTappedIn((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    // Height: full viewport minus top nav (4rem) + bottom nav (6rem mobile).
    // pb accounted for by AppShell; we subtract both to avoid double-counting on mobile.
    <div
      className="flex flex-col md:h-screen"
      style={{ height: "calc(100dvh - 5rem - env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Top bar */}
      <div className="shrink-0 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ScopeToggle scope={scope} onChange={setScope} />

          {/* Active filter dot */}
          {activeFilterCount > 0 && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              aria-label={`${activeFilterCount} active filter${activeFilterCount > 1 ? "s" : ""}`}
            />
          )}

          <div className="flex-1" />

          <button
            onClick={() => setTuneOpen(true)}
            aria-label="Open tune filters"
            className={[
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              activeFilterCount > 0
                ? "border-primary-container/30 bg-primary-container/15 text-primary-fixed"
                : "border-white/[0.12] bg-white/[0.02] text-on-surface-variant/60 hover:bg-white/[0.06] hover:border-primary-container/20 hover:text-on-surface",
            ].join(" ")}
          >
            <span className="text-[9px] opacity-60">◈</span>
            Tune
          </button>
        </div>

        {/* Fix 3: Near You no-city nudge — quiet, never intrusive. */}
        {scope === "near" && !user?.city && (
          <p className="mt-1.5 font-label-sm text-[11px] text-on-surface-variant/35">
            <Link
              to="/settings"
              className="underline decoration-on-surface-variant/20 hover:text-on-surface-variant/60 transition"
            >
              Set your city
            </Link>
            {" "}to tune into your local scene.
          </p>
        )}
      </div>

      {/* Clip area */}
      {isLoading ? (
        <FeedSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-8 text-center">
          <div>
            <p className="font-body-md text-on-surface-variant/50">
              {clips && (clips as Clip[]).length > 0
                ? "No clips match your current tune."
                : "This scene is quiet right now."}
            </p>
            <p className="mt-1 font-label-sm text-xs text-on-surface-variant/30">
              {clips && (clips as Clip[]).length > 0
                ? "Try widening your filters or switching to Across India."
                : "Be the first to drop something."}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {clips && (clips as Clip[]).length > 0 ? (
                <button
                  onClick={() => { setFilters({ formats: [], genres: [] }); setScope("india"); }}
                  className="rounded-full border border-white/[0.15] px-4 py-2 font-label-sm text-xs font-semibold text-on-surface-variant/60 transition hover:bg-white/[0.08]"
                >
                  Reset tune
                </button>
              ) : (
                <Link
                  to="/create"
                  className="rounded-full border border-primary-container/30 bg-primary-container/10 px-4 py-2 font-label-sm text-label-sm text-primary-fixed-dim transition hover:bg-primary-container/20"
                >
                  Drop a clip →
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-scroll snap-y snap-mandatory overscroll-y-contain focus-visible:outline-none"
          style={{ scrollbarWidth: "none" }}
          role="feed"
          aria-label="Clips feed"
          tabIndex={0}
          onKeyDown={handleFeedKeyDown}
        >
          {filtered.map((clip) => (
            <article
              key={clip.id}
              className="h-full min-h-full snap-start"
            >
              <ClipCard
                clip={clip}
                saved={saved.has(clip.id)}
                tappedIn={tappedIn.has(clip.id)}
                onSave={() => toggleSave(clip.id)}
                onTapIn={() => toggleTapIn(clip.id)}
              />
            </article>
          ))}

          {/* Tail card — leads to creation */}
          <div className="flex h-full min-h-full snap-start flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="font-body-md text-sm text-on-surface-variant/40">
              You've seen the scene. Now add to it.
            </p>
            <Link
              to="/create"
              className="rounded-full border border-primary-container/30 bg-primary-container/10 px-6 py-3 font-label-sm text-label-sm text-primary-fixed-dim transition hover:bg-primary-container/20"
            >
              Drop a clip
            </Link>
            <Link to="/cyphers" className="font-label-sm text-label-sm text-on-surface-variant/30 hover:text-primary transition">
              Find a circle →
            </Link>
          </div>
        </div>
      )}

      {/* Tune panel */}
      <TunePanel
        open={tuneOpen}
        onClose={() => setTuneOpen(false)}
        availableFormats={availableFormats}
        availableGenres={availableGenres}
        filters={filters}
        onChange={setFilters}
      />
    </div>
  );
}
