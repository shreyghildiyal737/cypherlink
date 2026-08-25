import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { OpsCard } from "../../components/ops/OpsCard";
import { OpsMetric } from "../../components/ops/OpsMetric";
import { OpsTimeline } from "../../components/ops/OpsTimeline";
import { useOrganizerDashboardWithFallback } from "../../hooks/useOrganizerDashboard";
import {
  useOrganizerCypherAssets,
  useAddHighlight,
  useRemoveHighlight,
  useCypher,
} from "../../hooks";
import { useModalAccessibility } from "../../hooks/useModalAccessibility";
import { useAuthStore } from "../../store/authStore";

function HighlightPanel({ cypherId, cypherTitle, onClose }: {
  cypherId: string;
  cypherTitle: string;
  onClose: () => void;
}) {
  const { data: assets, isLoading } = useOrganizerCypherAssets(cypherId);
  const { data: cypher } = useCypher(cypherId);
  const addHighlight = useAddHighlight();
  const removeHighlight = useRemoveHighlight();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const pending = assets?.filter((a) => !a.isHighlight) ?? [];
  const selected = assets?.filter((a) => a.isHighlight) ?? [];
  // Map asset.publicUrl → highlight.id so the "Remove" button knows which
  // highlight to delete server-side.
  const highlightByMediaUrl = new Map<string, string>();
  for (const h of cypher?.highlights ?? []) {
    if (h.mediaUrl) highlightByMediaUrl.set(h.mediaUrl, h.id);
  }

  function handleSelect(assetId: string, fileName: string) {
    setPendingId(assetId);
    addHighlight.mutate(
      { cypherId, assetId, title: fileName },
      { onSettled: () => setPendingId(null) }
    );
  }

  function handleRemove(highlightId: string) {
    setPendingId(highlightId);
    removeHighlight.mutate(
      { cypherId, highlightId },
      {
        onSettled: () => {
          setPendingId(null);
          setConfirmRemoveId(null);
        },
      }
    );
  }

  function fmtSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const dialogRef = useModalAccessibility(true, onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Choose highlights for ${cypherTitle}`}
        className="glass-panel max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-white/[0.08] p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/40">
              Choosing what stays
            </p>
            <h2 className="mt-0.5 font-headline-lg-mobile text-xl text-on-surface">
              {cypherTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-1 font-body-md text-sm text-on-surface-variant/50 transition hover:bg-white/[0.06] hover:text-on-surface"
          >
            Done
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/[0.05]" />
            ))}
          </div>
        ) : (assets?.length ?? 0) === 0 ? (
          <div className="mt-6 rounded-2xl bg-white/[0.04] p-5 text-center">
            <p className="font-body-md text-sm text-on-surface-variant/50">No files uploaded for this cypher yet.</p>
            <p className="mt-1 font-label-sm text-xs text-on-surface-variant/30">
              Raw uploads expire 24h after the cypher ends.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {selected.length > 0 && (
              <div>
                <p className="mb-2 font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/40">
                  Already preserved
                </p>
                <div className="space-y-2">
                  {selected.map((a) => {
                    const highlightId = a.publicUrl
                      ? highlightByMediaUrl.get(a.publicUrl)
                      : undefined;
                    return (
                      <div
                        key={a.id}
                        className="rounded-2xl border border-primary-container/25 bg-primary-container/05 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-label-sm text-xs text-primary">✓</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-body-md text-sm font-medium text-on-surface">{a.fileName}</p>
                            <p className="font-label-sm text-xs text-on-surface-variant/35">{fmtSize(a.fileSize)} · by {a.uploaderName}</p>
                          </div>
                          {a.publicUrl && (
                            <a
                              href={a.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-label-sm text-xs text-on-surface-variant/60 transition hover:text-on-surface hover:underline"
                            >
                              View
                            </a>
                          )}
                          {highlightId && confirmRemoveId !== highlightId && (
                            <button
                              onClick={() => setConfirmRemoveId(highlightId)}
                              className="font-label-sm text-xs text-on-surface-variant/35 transition hover:text-on-surface-variant/70"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        {highlightId && confirmRemoveId === highlightId && (
                          <div className="mt-3 rounded-lg bg-white/[0.04] p-3">
                            <p className="font-body-md text-xs text-on-surface-variant/70">
                              Remove this from preserved highlights?
                            </p>
                            <p className="mt-1 font-label-sm text-xs text-on-surface-variant/40">
                              The raw upload stays available until the 24h window closes.
                            </p>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handleRemove(highlightId)}
                                disabled={pendingId === highlightId}
                                className="rounded-full bg-white/[0.12] px-3 py-1 font-label-sm text-xs font-semibold text-on-surface transition hover:bg-white/[0.20] disabled:opacity-40"
                              >
                                {pendingId === highlightId ? "Removing…" : "Remove"}
                              </button>
                              <button
                                onClick={() => setConfirmRemoveId(null)}
                                className="rounded-full px-3 py-1 font-label-sm text-xs text-on-surface-variant/45 hover:text-on-surface-variant/80"
                              >
                                Keep preserved
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pending.length > 0 && (
              <div>
                <p className="mb-2 font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/40">
                  Uploaded files{" "}
                  <span className="text-on-surface-variant/25">· raw, expires 24h after event</span>
                </p>
                <div className="space-y-2">
                  {pending.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-body-md text-sm font-medium text-on-surface">{a.fileName}</p>
                        <p className="font-label-sm text-xs text-on-surface-variant/35">{fmtSize(a.fileSize)} · by {a.uploaderName}</p>
                      </div>
                      {a.publicUrl && (
                        <a
                          href={a.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-2 font-label-sm text-xs text-on-surface-variant/40 transition hover:text-on-surface-variant/70"
                        >
                          Preview
                        </a>
                      )}
                      <button
                        onClick={() => handleSelect(a.id, a.fileName)}
                        disabled={pendingId === a.id}
                        className="shrink-0 rounded-xl bg-primary-container/15 px-3 py-1 font-label-sm text-xs font-semibold text-primary-fixed-dim transition hover:bg-primary-container/25 disabled:opacity-40"
                      >
                        {pendingId === a.id ? "Saving…" : "Preserve"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrganizerDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data } = useOrganizerDashboardWithFallback();
  const [highlightCypherId, setHighlightCypherId] = useState<string | null>(null);
  const [highlightCypherTitle, setHighlightCypherTitle] = useState("");

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center font-body-md text-on-surface-variant/40">
        Sign in to access host tools
      </div>
    );
  }

  const isVerifiedOrganizer = user.role === "ORGANIZER" || user.role === "ADMIN";
  const hasNoEvents =
    (data.activeCyphers ?? []).length === 0 &&
    (data.activeCommunitySessions ?? []).length === 0;

  const afterglowCyphers = (data.activeCyphers ?? []).filter(
    (c: any) => c.state === "AFTERGLOW"
  );

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      {highlightCypherId && (
        <HighlightPanel
          cypherId={highlightCypherId}
          cypherTitle={highlightCypherTitle}
          onClose={() => setHighlightCypherId(null)}
        />
      )}

      <Badge tone={isVerifiedOrganizer ? "orange" : "muted"}>
        {isVerifiedOrganizer ? "Organizer mode" : "Host tools"}
      </Badge>
      <h1 className="mt-4 font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] tracking-tight text-on-surface">
        {isVerifiedOrganizer
          ? "Run the room, not a spreadsheet."
          : "Your event, your tools."}
      </h1>
      <p className="mt-3 max-w-2xl font-body-md text-on-surface-variant/50">
        {isVerifiedOrganizer
          ? "Organizer tools should help the host protect the vibe: fast check-ins, clear waitlist, safety controls, and highlight curation."
          : "As the event host, you can manage check-ins, safety notes, and highlights for your own events. These tools are scoped to what you created."}
      </p>

      {!isVerifiedOrganizer && hasNoEvents && (
        <div className="mt-8 rounded-2xl border border-white/[0.06] glass-card p-8 text-center">
          <p className="font-body-md text-on-surface-variant/50">You haven't created any cyphers or sessions yet.</p>
          <p className="mt-2 font-label-sm text-sm text-on-surface-variant/35">
            Create an event and come back here to manage it.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {data.stats.map(
          (s: { label: string; value: string; helper: string }) => (
            <OpsMetric key={s.label} {...s} />
          ),
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <OpsCard title="Live cypher timeline" eyebrow="Tonight">
            {data.timeline.length > 0 ? (
              <OpsTimeline items={data.timeline} />
            ) : (
              <p className="font-body-md text-sm text-on-surface-variant/60">No recent events</p>
            )}
          </OpsCard>

          {/* Highlight selection — afterglow cyphers */}
          {afterglowCyphers.length > 0 && (
            <OpsCard title="Choose what stays" eyebrow="Afterglow">
              <p className="font-body-md text-sm text-on-surface-variant/60">
                Raw uploads expire 24h after each cypher. Select what gets preserved permanently as highlights.
              </p>
              <div className="mt-4 space-y-3">
                {afterglowCyphers.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-2xl border border-primary-container/20 bg-primary-container/05 px-4 py-3"
                  >
                    <div>
                      <p className="font-body-md font-semibold text-on-surface">{c.title}</p>
                      <p className="font-label-sm text-xs text-on-surface-variant/40">
                        {c.rsvpCount} RSVPs · {c.checkedInCount} checked in
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setHighlightCypherTitle(c.title);
                        setHighlightCypherId(c.id);
                      }}
                      className="rounded-xl bg-primary-container/15 px-4 py-1.5 font-label-sm text-sm font-semibold text-primary-fixed-dim transition hover:bg-primary-container/25"
                    >
                      Select highlights →
                    </button>
                  </div>
                ))}
              </div>
            </OpsCard>
          )}
        </div>

        <div className="space-y-5">
          <OpsCard title="QR check-in" eyebrow="Optional">
            <p className="font-body-md text-sm text-on-surface-variant/60">
              Scanning saves the moment to attendee history. No one is punished
              for skipping it.
            </p>
            <div className="mt-4 grid place-items-center rounded-2xl bg-white p-5">
              <QRCodeSVG value="cypherlink://organizer/checkin/demo-cypher" />
            </div>
            <Button className="mt-4 w-full opacity-50 cursor-not-allowed" disabled>
              Camera scanner — coming soon
            </Button>
          </OpsCard>

          <OpsCard title="Host actions" eyebrow="Coming soon">
            <p className="font-body-md text-sm text-on-surface-variant/50">
              Waitlist approval, safety notes, and RSVP controls are in development.
            </p>
            <div className="mt-4 grid gap-3">
              <Button variant="secondary" disabled className="opacity-40 cursor-not-allowed">Approve waitlist spot</Button>
              <Button variant="secondary" disabled className="opacity-40 cursor-not-allowed">Add safety note</Button>
              <Button variant="danger" disabled className="opacity-40 cursor-not-allowed">Pause RSVPs</Button>
            </div>
          </OpsCard>
        </div>
      </div>
    </div>
  );
}
