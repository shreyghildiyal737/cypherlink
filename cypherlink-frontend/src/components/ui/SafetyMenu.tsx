import { useRef, useState, useEffect } from "react";
import { useBlockUser, useMuteUser } from "../../hooks";
import { ReportModal } from "./ReportModal";

interface SafetyMenuProps {
  targetId: string;
  targetType: "user" | "cypher" | "clip" | "project";
  targetName?: string;
  className?: string;
}

export function SafetyMenu({ targetId, targetType, targetName, className = "" }: SafetyMenuProps) {
  const [open, setOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reporting, setReporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const blockUser = useBlockUser();
  const muteUser = useMuteUser();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleBlock = () => {
    if (!blocking) { setBlocking(true); return; }
    blockUser.mutate(targetId, {
      onSuccess: () => { setBlocked(true); setOpen(false); setBlocking(false); },
    });
  };

  const handleMute = () => {
    muteUser.mutate(targetId, {
      onSuccess: () => { setMuted(true); setOpen(false); },
    });
  };

  if (blocked) {
    return (
      <span className={`font-label-sm text-xs text-on-surface-variant/30 ${className}`}>Blocked</span>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="rounded-full p-1.5 text-on-surface-variant/40 transition hover:bg-white/[0.08] hover:text-on-surface-variant/70"
        aria-label="Safety actions"
      >
        <span className="material-symbols-outlined text-base">more_horiz</span>
      </button>

      {open && (
        <div className="glass-panel absolute right-0 top-8 z-30 min-w-[180px] rounded-2xl border border-white/[0.08] shadow-xl">
          <div className="space-y-0.5 p-1.5">
            <button
              onClick={() => { setReporting(true); setOpen(false); }}
              className="w-full rounded-xl px-3 py-2 text-left font-body-md text-sm text-on-surface-variant/70 transition hover:bg-white/[0.08] hover:text-on-surface"
            >
              Report
            </button>

            {muted ? (
              <p className="px-3 py-2 font-label-sm text-xs text-on-surface-variant/30">Muted</p>
            ) : (
              <button
                onClick={handleMute}
                disabled={muteUser.isPending}
                className="w-full rounded-xl px-3 py-2 text-left font-body-md text-sm text-on-surface-variant/70 transition hover:bg-white/[0.08] hover:text-on-surface disabled:opacity-40"
              >
                {muteUser.isPending ? "Muting..." : "Mute"}
              </button>
            )}

            {blocking ? (
              <div className="px-3 py-2">
                <p className="font-label-sm text-xs text-on-surface-variant/60">They won't see your content.</p>
                <button
                  onClick={handleBlock}
                  disabled={blockUser.isPending}
                  className="mt-1.5 w-full rounded-xl bg-error/15 px-3 py-1.5 text-left font-body-md text-sm text-error/80 transition hover:bg-error/25 disabled:opacity-40"
                >
                  {blockUser.isPending ? "Blocking..." : "Confirm block"}
                </button>
              </div>
            ) : (
              <button
                onClick={handleBlock}
                className="w-full rounded-xl px-3 py-2 text-left font-body-md text-sm text-on-surface-variant/70 transition hover:bg-white/[0.08] hover:text-on-surface"
              >
                Block
              </button>
            )}
          </div>
        </div>
      )}

      {reporting && (
        <ReportModal
          targetId={targetId}
          targetType={targetType}
          targetName={targetName}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}
