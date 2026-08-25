import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useCypher,
  useRSVPCypher,
  useMyCypherCheckInToken,
  useCypherClips,
  useCypherContinuation,
  useSetRsvpIntent,
  useOrganizerTrustSignals,
} from "../hooks";
import { useCypherSocket } from "../hooks/useCypherSocket";
import { useAuthStore } from "../store/authStore";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { SafetyMenu } from "../components/ui/SafetyMenu";
import { QRCodeSVG } from "qrcode.react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { CypherHighlight } from "../types";

const CITY_COORDS: Record<string, [number, number]> = {
  "mumbai":    [19.076, 72.8777],
  "delhi":     [28.6139, 77.209],
  "new delhi": [28.6139, 77.209],
  "bangalore": [12.9716, 77.5946],
  "bengaluru": [12.9716, 77.5946],
  "hyderabad": [17.385, 78.4867],
  "chennai":   [13.0827, 80.2707],
  "kolkata":   [22.5726, 88.3639],
  "pune":      [18.5204, 73.8567],
  "ahmedabad": [23.0225, 72.5714],
  "jaipur":    [26.9124, 75.7873],
  "lucknow":   [26.8467, 80.9462],
  "chandigarh":[30.7333, 76.7794],
  "shillong":  [25.5788, 91.8933],
  "goa":       [15.2993, 74.124],
  "kochi":     [9.9312, 76.2673],
  "indore":    [22.7196, 75.8577],
  "bhopal":    [23.2599, 77.4126],
  "nagpur":    [21.1458, 79.0882],
  "surat":     [21.1702, 72.8311],
};

function CityMap({ city, venue }: { city: string; venue?: string }) {
  const coords = CITY_COORDS[city.toLowerCase()];
  if (!coords) return null;
  return (
    <div className="rounded-2xl border border-white/[0.06] glass-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 className="font-headline-lg-mobile text-on-surface">Location</h2>
        {venue && (
          <p className="mt-1 font-body-md text-sm text-on-surface-variant/50 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[13px]">location_on</span>
            {venue}
          </p>
        )}
      </div>
      <div className="h-44 w-full">
        <MapContainer
          center={coords}
          zoom={12}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <CircleMarker
            center={coords}
            radius={10}
            pathOptions={{ color: "#7c3aed", fillColor: "#d2bbff", fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>{venue ?? city}</Popup>
          </CircleMarker>
        </MapContainer>
      </div>
    </div>
  );
}

const STATE_CONFIG = {
  upcoming: {
    gradient: "from-primary-container/08 via-transparent to-tertiary-container/04",
    badge: "UPCOMING" as const,
    tone: "upcoming" as const,
    pullingLabel: "Pulling up",
  },
  active: {
    gradient: "from-error/10 via-transparent to-error/04",
    badge: "LIVE NOW" as const,
    tone: "live" as const,
    pullingLabel: "Here right now",
  },
  afterglow: {
    gradient: "from-primary-container/06 via-transparent to-white/[0.02]",
    badge: "AFTERGLOW" as const,
    tone: "afterglow" as const,
    pullingLabel: "Showed up",
  },
  archived: {
    gradient: "from-white/[0.02] via-transparent to-white/[0.01]",
    badge: "ARCHIVED" as const,
    tone: "archived" as const,
    pullingLabel: "Attended",
  },
} as const;

export default function CypherDetail() {
  const { id } = useParams();
  const { data: cypher, isLoading } = useCypher(id ?? "");
  const live = useCypherSocket(id);
  const user = useAuthStore((s) => s.user);
  const rsvp = useRSVPCypher();
  const [rsvpDone, setRsvpDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [intentNote, setIntentNote] = useState("");
  const [intentSaved, setIntentSaved] = useState(false);
  const checkinToken = useMyCypherCheckInToken(user ? (id ?? "") : "");
  const cypherProgressed = cypher && cypher.state !== "upcoming";
  const { data: cypherClips } = useCypherClips(cypherProgressed ? id ?? "" : "");
  const rawState = cypher ? (live.state ?? cypher.state) : "upcoming";
  const isMemoryState = rawState === "afterglow" || rawState === "archived";
  const { data: continuation } = useCypherContinuation(isMemoryState ? (id ?? "") : "");
  const setIntent = useSetRsvpIntent(id ?? "");
  const { data: organizerSignals } = useOrganizerTrustSignals(cypher?.organizerId ?? "");

  async function saveIntent() {
    if (!intentNote.trim()) return;
    try {
      await setIntent.mutateAsync({ intentNote: intentNote.trim() });
      setIntentSaved(true);
      setTimeout(() => setIntentSaved(false), 2000);
    } catch {}
  }

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center text-on-surface-variant/40">
        Loading cypher...
      </div>
    );
  if (!cypher)
    return (
      <div className="flex min-h-screen items-center justify-center text-on-surface-variant/40">
        This circle doesn't exist or was removed.
      </div>
    );

  const state: keyof typeof STATE_CONFIG =
    rawState in STATE_CONFIG
      ? (rawState as keyof typeof STATE_CONFIG)
      : "upcoming";
  const cfg = STATE_CONFIG[state];
  const isMemory = state === "afterglow" || state === "archived";
  const canRSVP = state === "upcoming" || state === "active";
  const pullingUp = live.pullingUp ?? cypher.pullingUp;
  const spotsLeft = live.spotsLeft ?? cypher.spotsLeft;

  const startLabel =
    isMemory || !cypher.startsAt
      ? null
      : new Date(cypher.startsAt).toLocaleDateString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

  const uploadExpiryLabel = (() => {
    if (state !== "afterglow" || !cypher.endsAt) return null;
    const expiresAt = new Date(new Date(cypher.endsAt).getTime() + 24 * 60 * 60 * 1000);
    const msLeft = expiresAt.getTime() - Date.now();
    if (msLeft <= 0) return "Raw uploads cleared";
    const hoursLeft = Math.floor(msLeft / 3_600_000);
    const minsLeft = Math.floor((msLeft % 3_600_000) / 60_000);
    return `Raw uploads fade in ${hoursLeft}h ${minsLeft}m`;
  })();

  const isAlreadyRsvped = rsvpDone || cypher.isUserRsvped;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/cyphers/${cypher.id}`
    : `/cyphers/${cypher.id}`;

  async function handleShare() {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: cypher?.title ?? "", url: shareUrl });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const happenedLabel = cypher.startsAt
    ? new Date(cypher.startsAt).toLocaleDateString("en-IN", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      {/* Hero */}
      <section
        className={`rounded-2xl border border-white/[0.07] glass-panel bg-gradient-to-br ${cfg.gradient} p-6 transition-all duration-500 md:p-10`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={cfg.tone}>{cfg.badge}</Badge>
          <Badge tone={cypher.type === "open" ? "cyan" : "muted"}>
            {cypher.type === "open" ? "OPEN CYPHER" : "VENUE CYPHER"}
          </Badge>
        </div>

        <h1 className="mt-5 font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4.5rem)] text-on-surface tracking-tight">
          {cypher.title}
        </h1>

        {state === "afterglow" && (
          <div className="mt-3 space-y-1">
            <p className="max-w-2xl font-body-md text-lg italic text-on-surface-variant/70">
              The circle has closed. Here's what stayed.
            </p>
            {happenedLabel && (
              <p className="font-label-sm text-sm text-on-surface-variant/35">{happenedLabel}</p>
            )}
            {uploadExpiryLabel && (
              <p className="inline-flex items-center gap-1.5 font-label-sm text-xs text-on-surface-variant/40">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-surface-variant/28" />
                {uploadExpiryLabel}
              </p>
            )}
          </div>
        )}

        {state === "archived" && happenedLabel && (
          <p className="mt-2 font-label-sm text-sm text-on-surface-variant/35">
            Happened on {happenedLabel} · preserved in memory
          </p>
        )}

        {cypher.description && (
          <p className="mt-3 max-w-2xl font-body-md text-body-md text-on-surface-variant/70">{cypher.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-body-md text-sm text-on-surface-variant/60">
          {(cypher.venue || cypher.city) && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {cypher.venue && `${cypher.venue} · `}
              {cypher.city}
            </span>
          )}
          {startLabel && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {startLabel}
            </span>
          )}
          {cypher.organizer && (
            <span className="flex items-center gap-1.5">
              by{" "}
              <Link
                to={`/artists/${cypher.organizer.handle ?? ""}`}
                className="text-primary-fixed-dim hover:text-primary transition-colors"
              >
                {cypher.organizer.displayName}
              </Link>
              {user && cypher.organizerId && user.id !== cypher.organizerId && (
                <SafetyMenu
                  targetId={cypher.organizerId}
                  targetType="user"
                  targetName={cypher.organizer.displayName}
                />
              )}
            </span>
          )}
        </div>

        {cypher.safetyTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {cypher.safetyTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 font-label-sm text-xs text-on-surface-variant/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {canRSVP && (
          <div className="mt-7 flex flex-wrap gap-3">
            {user ? (
              <Button
                onClick={() =>
                  rsvp.mutate(
                    { id: cypher.id },
                    { onSuccess: () => setRsvpDone(true) },
                  )
                }
                disabled={rsvp.isPending || isAlreadyRsvped}
              >
                {rsvp.isPending
                  ? "RSVPing..."
                  : isAlreadyRsvped
                    ? cypher.type === "open" ? "Pulling up ✓" : "Spot saved ✓"
                    : cypher.type === "open"
                      ? "Pull up"
                      : "Save a spot"}
              </Button>
            ) : (
              <Link to="/login">
                <Button>
                  {cypher.type === "open" ? "Pull up" : "Save a spot"}
                </Button>
              </Link>
            )}
            <Button variant="secondary" onClick={handleShare}>
              <span className="material-symbols-outlined text-[15px]">{copied ? "check" : "share"}</span>
              {copied ? "Link copied" : "Share"}
            </Button>
            {user && cypher.organizerId && user.id === cypher.organizerId && (
              <Link to="/ops/organizer">
                <Button variant="secondary">
                  <span className="material-symbols-outlined text-[15px]">settings</span>
                  Host Tools
                </Button>
              </Link>
            )}
          </div>
        )}

        {canRSVP && isAlreadyRsvped && user && (
          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35 mb-2">
              Your role in this circle (optional)
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/28 focus:outline-none focus:border-primary-container/40 transition"
                placeholder="e.g. Producer looking for a vocalist..."
                value={intentNote}
                onChange={(e) => setIntentNote(e.target.value)}
                maxLength={120}
              />
              <Button variant="secondary" size="sm" onClick={saveIntent} disabled={setIntent.isPending}>
                {intentSaved ? "Saved" : "Set"}
              </Button>
            </div>
          </div>
        )}

        {state === "afterglow" && (
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={`/create/project?fromCypher=${cypher.id}`}>
              <Button variant="secondary">
                <span className="material-symbols-outlined text-[15px]">layers</span>
                Start a project from this
              </Button>
            </Link>
            {user && cypher.organizerId && user.id === cypher.organizerId && (
              <Link to="/ops/organizer">
                <Button variant="secondary">
                  <span className="material-symbols-outlined text-[15px]">settings</span>
                  Host Tools — select what stays
                </Button>
              </Link>
            )}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main content */}
        <div className="space-y-5">
          {/* Highlights */}
          {(cypher.highlights.length > 0 || isMemory) && (
            <section className={`rounded-2xl border p-5 ${isMemory ? "border-primary-container/20 bg-primary-container/04" : "border-white/[0.06] glass-card"}`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>music_note</span>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  {isMemory ? "What stayed" : "Highlights"}
                </h2>
                {isMemory && (
                  <span className="font-label-sm text-xs text-on-surface-variant/40">
                    · raw uploads cleared, these remain
                  </span>
                )}
              </div>
              {cypher.highlights.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {cypher.highlights.map((h: CypherHighlight) => (
                    <div
                      key={h.id}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                    >
                      <p className="font-semibold text-on-surface">{h.title}</p>
                      {h.mediaUrl && (
                        <a
                          href={h.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 font-label-sm text-sm text-on-surface-variant/70 hover:text-primary transition-colors"
                        >
                          View {h.mediaType ?? "media"}
                          <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 font-body-md text-sm text-on-surface-variant/40">
                  The organizer hasn't selected highlights yet. Raw uploads will be here until they do.
                </p>
              )}
            </section>
          )}

          {/* Circle status */}
          <section className="rounded-2xl border border-white/[0.06] glass-card p-5">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {state === "active"
                ? "Circle status"
                : isMemory
                  ? "Circle record"
                  : "Circle info"}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="font-label-sm text-xs text-on-surface-variant/50">{cfg.pullingLabel}</p>
                <p className="mt-1 text-2xl font-semibold text-on-surface">
                  {pullingUp}
                  {cypher.quota && (
                    <span className="ml-1 font-body-md text-sm font-normal text-on-surface-variant/50">
                      / {cypher.quota}
                    </span>
                  )}
                  {live.pullingUp !== null && (
                    <span className="ml-2 font-label-sm text-xs font-normal text-[#34D399]">live</span>
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="font-label-sm text-xs text-on-surface-variant/50">State</p>
                <p className="mt-1 font-semibold capitalize text-on-surface">
                  {state}
                </p>
                {state === "active" && (
                  <span className="mt-1 inline-block h-2 w-2 animate-pulse rounded-full bg-[#34D399]" />
                )}
              </div>
            </div>
            {spotsLeft != null && state !== "archived" && (
              <p className="mt-3 font-label-sm text-xs text-on-surface-variant/45">
                {spotsLeft} spots remaining
              </p>
            )}
            {state === "afterglow" && (
              <p className="mt-4 font-body-md text-sm text-on-surface-variant/50">
                {pullingUp} {pullingUp === 1 ? "person" : "people"} showed up to this circle. Their presence is part of the record.
              </p>
            )}
            {state === "archived" && (
              <p className="mt-4 font-body-md text-sm text-on-surface-variant/40">
                Raw uploads from this event have been cleared. Only organizer-selected highlights remain permanently.
              </p>
            )}
          </section>

          {/* Clips from this night */}
          {isMemory && cypherClips && cypherClips.length > 0 && (
            <section className="rounded-2xl border border-white/[0.06] glass-card p-5">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Clips from this night
              </h2>
              <p className="mt-1 font-body-md text-sm text-on-surface-variant/50">
                Moments people chose to drop from this circle.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {cypherClips.slice(0, 6).map((c: any) => (
                  <Link
                    key={c.id}
                    to={`/clips/${c.id}`}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-all duration-300 hover:border-primary-container/20 group"
                  >
                    <p className="font-label-sm text-xs text-on-surface-variant/40">{c.creator.name}</p>
                    <p className="mt-1 line-clamp-2 font-body-md text-sm font-medium text-on-surface/85 group-hover:text-primary-fixed-dim transition-colors">
                      {c.caption || c.reason || "Moment"}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Who's pulling up — intent snippets (upcoming/active only) */}
          {(state === "upcoming" || state === "active") && cypher.rsvpIntents && cypher.rsvpIntents.length > 0 && (
            <section className="rounded-2xl border border-white/[0.06] glass-card p-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary/70" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                <h2 className="font-headline-lg-mobile text-base text-on-surface">Who's pulling up</h2>
                <span className="font-label-sm text-xs text-on-surface-variant/35">· roles & intents</span>
              </div>
              <div className="mt-3 space-y-2">
                {cypher.rsvpIntents.map((r) => (
                  <p key={r.userId} className="font-body-md text-sm text-on-surface-variant/65">
                    <span className="text-on-surface/80">{r.aliasName ?? "Someone"}</span>
                    <span className="mx-1.5 text-on-surface-variant/25">·</span>
                    {r.intentNote}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Memory trail */}
          {state === "afterglow" && cypher.memoryTrail && (
            cypher.memoryTrail.clipsCount > 0 ||
            cypher.memoryTrail.preservedHighlights > 0 ||
            cypher.memoryTrail.projectsStartedAfter > 0
          ) ? (
            <section className="rounded-2xl border border-primary-container/20 bg-primary-container/04 p-5">
              <p className="font-label-sm text-xs uppercase tracking-widest text-primary/70">
                What this circle became
              </p>
              <ul className="mt-3 space-y-1.5 font-body-md text-sm text-on-surface-variant/70">
                {cypher.memoryTrail.preservedHighlights > 0 && (
                  <li>· {cypher.memoryTrail.preservedHighlights} preserved highlight{cypher.memoryTrail.preservedHighlights === 1 ? "" : "s"}</li>
                )}
                {cypher.memoryTrail.clipsCount > 0 && (
                  <li>· {cypher.memoryTrail.clipsCount} clip{cypher.memoryTrail.clipsCount === 1 ? "" : "s"} captured</li>
                )}
                {cypher.memoryTrail.projectsStartedAfter > 0 && (
                  <li>· {cypher.memoryTrail.projectsStartedAfter} project{cypher.memoryTrail.projectsStartedAfter === 1 ? "" : "s"} started after this night</li>
                )}
              </ul>
            </section>
          ) : null}

          {/* Projects born from this circle */}
          {isMemory && continuation && continuation.bornProjects.length > 0 && (
            <section className="rounded-2xl border border-primary-container/20 bg-primary-container/04 p-5">
              <p className="font-label-sm text-xs uppercase tracking-widest text-primary/70 mb-3">
                Projects born from this circle
              </p>
              <div className="space-y-2">
                {continuation.bornProjects.map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all hover:border-primary-container/25 hover:bg-primary-container/05 group"
                  >
                    <div>
                      <p className="font-body-md text-sm font-medium text-on-surface group-hover:text-primary-fixed-dim transition-colors">
                        {p.title}
                      </p>
                      {p.openRoles.length > 0 && (
                        <p className="mt-0.5 font-label-sm text-xs text-on-surface-variant/45">
                          Looking for: {p.openRoles.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant/30 group-hover:text-primary/50 transition-colors">arrow_forward</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Live activity */}
          {state === "active" && live.activity.length > 0 && (
            <section className="rounded-2xl border border-white/[0.06] glass-card p-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#34D399]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                <h2 className="font-headline-lg-mobile text-base text-on-surface">
                  Live activity
                </h2>
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#34D399]" />
              </div>
              <div className="mt-3 space-y-2">
                {live.activity.map((a, i) => (
                  <p key={i} className="font-body-md text-sm text-on-surface-variant/60">
                    <span className="text-on-surface/85">{a.displayName ?? "Someone"}</span> pulled up
                    <span className="ml-2 font-label-sm text-xs text-on-surface-variant/30">
                      {new Date(a.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </p>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Check-in QR */}
          {canRSVP && user && (
            <div className="rounded-2xl border border-white/[0.06] glass-card p-5">
              <h2 className="font-headline-lg-mobile text-on-surface">Your check-in QR</h2>
              <p className="mt-2 font-body-md text-sm text-on-surface-variant/50">
                Optional. Show this to the organizer at the door to log the
                moment to your history.
              </p>
              {checkinToken.data?.checkInToken ? (
                <div className="mt-4 grid place-items-center rounded-2xl bg-white p-5">
                  <QRCodeSVG
                    value={checkinToken.data.checkInToken}
                    size={160}
                  />
                </div>
              ) : checkinToken.isError ? (
                <p className="mt-4 font-body-md text-sm text-on-surface-variant/50">
                  RSVP first to get your QR.
                </p>
              ) : (
                <p className="mt-4 font-body-md text-sm text-on-surface-variant/50">Generating QR…</p>
              )}
            </div>
          )}

          {/* City map */}
          {cypher.city && <CityMap city={cypher.city} venue={cypher.venue} />}

          {/* Scene link */}
          {cypher.city && (
            <div className="rounded-2xl border border-white/[0.06] glass-card p-5">
              <h2 className="font-headline-lg-mobile text-on-surface">
                {cypher.city} scene
              </h2>
              <p className="mt-2 font-body-md text-sm text-on-surface-variant/50">
                More cyphers, projects and community moves in this city.
              </p>
              <Link to={`/scenes/${cypher.city.toLowerCase()}`}>
                <Button variant="secondary" className="mt-4 w-full justify-center">
                  <span className="material-symbols-outlined text-[15px]">explore</span>
                  Open scene
                </Button>
              </Link>
            </div>
          )}

          {/* Organizer record */}
          <div className="rounded-2xl border border-white/[0.06] glass-card p-5">
            <h2 className="font-headline-lg-mobile text-on-surface">Organizer record</h2>
            {organizerSignals && organizerSignals.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {organizerSignals.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full border border-primary-container/20 bg-primary-container/08 px-2.5 py-0.5 font-label-sm text-[10px] text-primary-fixed-dim/80"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-3 font-body-md text-sm text-on-surface-variant/50">
              RSVPs, check-ins, safety notes and highlights are stored privately by the organizer for culture memory and safety purposes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
