import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useClip, useRelatedClips } from "../hooks";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { SafetyMenu } from "../components/ui/SafetyMenu";
import { FadeUp } from "../components/ui/motion";
import { useAuthStore } from "../store/authStore";

const REASON_CONFIG: Record<string, { label: string; tone: "cyan" | "orange" | "green" | "purple" | "muted"; contextLine: (city?: string) => string }> = {
  LIVE_SESSION: {
    label: "Live session",
    tone: "green",
    contextLine: (city) => city ? `Captured live in ${city}.` : "Captured live.",
  },
  STUDIO_DROP: {
    label: "Studio drop",
    tone: "orange",
    contextLine: (city) => city ? `Studio session in ${city}.` : "From the studio.",
  },
  COMMUNITY: {
    label: "Community",
    tone: "cyan",
    contextLine: (city) => city ? `Community moment in ${city}.` : "From the community.",
  },
  INDEPENDENT: {
    label: "Independent drop",
    tone: "purple",
    contextLine: () => "Dropped independently.",
  },
  COLLAB: {
    label: "Open collab",
    tone: "cyan",
    contextLine: () => "Open to collaborators.",
  },
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const secs = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 86400 * 7) return `${Math.floor(secs / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function ClipDetail() {
  const { id } = useParams();
  const { data: clip, isLoading } = useClip(id ?? "");
  const { data: related } = useRelatedClips(
    id ?? "",
    clip?.city,
    clip?.creator?.id,
  );
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (isLoading)
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center font-body-md text-on-surface-variant/35">
        Loading clip...
      </div>
    );
  if (!clip)
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center font-body-md text-on-surface-variant/35">
        This clip doesn't exist or was removed.
      </div>
    );

  const reasonCfg = REASON_CONFIG[clip.reason] ?? {
    label: clip.reason,
    tone: "muted" as const,
    contextLine: (c?: string) => c ? `From ${c}.` : "",
  };

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/clips/${clip.id}`
    : `/clips/${clip.id}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function handleShare() {
    if (!clip) return;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `${clip.creator.name} on CypherLink`,
          text: clip.caption || `${reasonCfg.label} from ${clip.creator.name}`,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to copy
      }
    }
    handleCopy();
  }

  return (
    <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <Link
        to="/feed"
        className="inline-flex items-center gap-1 font-body-md text-sm text-on-surface-variant/45 transition hover:text-on-surface"
      >
        ← Back to feed
      </Link>

      {/* Creator row */}
      <FadeUp>
        <div className="mt-4 flex items-center gap-3">
          <Link
            to={`/profile/${clip.creator.id}`}
            className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container via-[#6d28d9] to-[#5200b0] text-lg font-black text-on-surface transition hover:opacity-80"
          >
            {clip.creator.avatar}
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to={`/profile/${clip.creator.id}`}
              className="font-body-md font-semibold text-on-surface transition hover:text-on-surface/80"
            >
              {clip.creator.name}
            </Link>
            <p className="font-label-sm text-sm text-on-surface-variant/50">
              {clip.creator.handle}
              {clip.creator.city ? ` · ${clip.creator.city}` : ""}
            </p>
          </div>
          {user && clip.creator.id && user.id !== clip.creator.id && (
            <SafetyMenu
              targetId={clip.creator.id}
              targetType="user"
              targetName={clip.creator.name}
            />
          )}
        </div>

        {/* Context badges */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge tone={reasonCfg.tone}>{reasonCfg.label}</Badge>
          {clip.city && <Badge tone="muted">{clip.city}</Badge>}
          {clip.createdAt && (
            <span className="font-label-sm text-xs text-on-surface-variant/35">{timeAgo(clip.createdAt)}</span>
          )}
        </div>

        {/* Context line */}
        <p className="mt-3 font-body-md text-sm text-on-surface-variant/55">
          {reasonCfg.contextLine(clip.city)}
          {!clip.project && clip.projectTitle && (
            <>
              {" "}Part of <span className="text-on-surface/80">{clip.projectTitle}</span>.
            </>
          )}
        </p>

        {/* Memory trail */}
        {(clip.cypher || clip.project || clip.communitySession) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {clip.cypher && (
              <Link
                to={`/cyphers/${clip.cypher.id}`}
                className="group inline-flex items-center gap-2 rounded-full border border-primary-container/25 bg-primary-container/10 px-3 py-1.5 font-label-sm text-xs font-semibold text-primary-fixed-dim transition hover:bg-primary-container/18"
              >
                <span className="text-primary-container/70">↺</span>
                Captured during {clip.cypher.title}
                <span className="text-on-surface-variant/40 group-hover:text-on-surface-variant/70">→</span>
              </Link>
            )}
            {clip.project && (
              <Link
                to={`/projects/${clip.project.id}`}
                className="group inline-flex items-center gap-2 rounded-full border border-white/[0.15] bg-white/[0.05] px-3 py-1.5 font-label-sm text-xs font-semibold text-on-surface-variant/70 transition hover:bg-white/[0.10]"
              >
                <span className="text-on-surface-variant/40">◇</span>
                Part of {clip.project.title}
                <span className="text-on-surface-variant/40 group-hover:text-on-surface-variant/70">→</span>
              </Link>
            )}
            {clip.communitySession && (
              <Link
                to={`/community/${clip.communitySession.id}`}
                className="group inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 font-label-sm text-xs font-semibold text-on-surface-variant/65 transition hover:bg-white/[0.08]"
              >
                <span className="text-on-surface-variant/35">◯</span>
                From {clip.communitySession.title}
                <span className="text-on-surface-variant/40 group-hover:text-on-surface-variant/70">→</span>
              </Link>
            )}
          </div>
        )}
      </FadeUp>

      {/* Main content card */}
      <FadeUp delay={0.08}>
        <div className="glass-card mt-5 rounded-2xl border border-white/[0.06] p-6">
          {clip.caption && (
            <p className="font-body-md text-lg leading-relaxed text-on-surface/85">{clip.caption}</p>
          )}

          {clip.mediaUrl && (
            <div className="mt-5">
              {clip.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                <video
                  src={clip.mediaUrl}
                  controls
                  preload="metadata"
                  className="w-full rounded-2xl bg-[#080808]"
                  style={{ maxHeight: "480px" }}
                />
              ) : clip.mediaUrl.match(/\.(mp3|wav|ogg|flac)$/i) ? (
                <audio src={clip.mediaUrl} controls preload="metadata" className="w-full" />
              ) : (
                <a
                  href={clip.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 font-body-md text-sm text-on-surface-variant/60 transition hover:border-primary-container/30 hover:text-on-surface"
                >
                  Open file →
                </a>
              )}
            </div>
          )}

          {/* Share row */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-5">
            <button
              onClick={handleShare}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 font-label-sm text-xs font-semibold text-on-surface-variant/70 transition hover:bg-white/[0.08]"
            >
              Share
            </button>
            <button
              onClick={handleCopy}
              className="rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 font-label-sm text-xs font-semibold text-on-surface-variant/60 transition hover:bg-white/[0.06]"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
            <button
              onClick={() => setShowQR((v) => !v)}
              className="rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 font-label-sm text-xs font-semibold text-on-surface-variant/60 transition hover:bg-white/[0.06]"
            >
              {showQR ? "Hide QR" : "Show QR"}
            </button>
            {user && user.id !== clip.creator.id && (
              <Link
                to="/messages"
                className="ml-auto rounded-full border border-primary-container/30 bg-primary-container/10 px-4 py-1.5 font-label-sm text-xs font-semibold text-primary-fixed-dim transition hover:bg-primary-container/18"
              >
                Reach out to collaborate
              </Link>
            )}
          </div>

          {showQR && (
            <div className="mt-4 grid place-items-center rounded-2xl bg-white p-5">
              <QRCodeSVG value={shareUrl} size={160} />
            </div>
          )}
        </div>
      </FadeUp>

      {/* Ecosystem links */}
      <FadeUp delay={0.12}>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(clip.city || clip.creator.city) && (
            <Link
              to={`/scenes/${(clip.city || clip.creator.city).toLowerCase()}`}
              className="glass-card flex items-center justify-between rounded-2xl border border-white/[0.06] p-4 transition hover:border-primary-container/20"
            >
              <div>
                <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35">Scene</p>
                <p className="font-body-md font-semibold text-on-surface">{clip.city || clip.creator.city}</p>
              </div>
              <span className="text-on-surface-variant/28">→</span>
            </Link>
          )}
          <Link
            to={`/profile/${clip.creator.id}`}
            className="glass-card flex items-center justify-between rounded-2xl border border-white/[0.06] p-4 transition hover:border-primary-container/20"
          >
            <div>
              <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35">More from</p>
              <p className="font-body-md font-semibold text-on-surface">{clip.creator.name}</p>
            </div>
            <span className="text-on-surface-variant/28">→</span>
          </Link>
        </div>
      </FadeUp>

      {/* Related clips */}
      {related && related.length > 0 && (
        <section className="mt-10">
          <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35">
            More from this corner
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/clips/${r.id}`}
                className="glass-card rounded-2xl border border-white/[0.06] p-4 transition hover:border-primary-container/20"
              >
                <div className="flex items-center gap-2">
                  <Badge tone={REASON_CONFIG[r.reason]?.tone ?? "muted"}>
                    {REASON_CONFIG[r.reason]?.label ?? r.reason}
                  </Badge>
                  {r.city && <span className="font-label-sm text-xs text-on-surface-variant/35">{r.city}</span>}
                </div>
                <p className="mt-2 font-body-md text-sm font-medium text-on-surface/85 line-clamp-2">
                  {r.caption || r.projectTitle || `${r.creator.name}'s drop`}
                </p>
                <p className="mt-1 font-label-sm text-xs text-on-surface-variant/40">{r.creator.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reactions placeholder */}
      <section className="mt-10 rounded-2xl border border-white/[0.04] bg-white/[0.01] p-5">
        <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/35">Reactions</p>
        <p className="mt-2 font-body-md text-sm text-on-surface-variant/50">
          Comment threads live here once we open them up. For now, conversation happens through messages.
        </p>
      </section>

      <div className="mt-8 text-center">
        <Link to="/feed">
          <Button variant="secondary">Explore the feed</Button>
        </Link>
      </div>
    </div>
  );
}
