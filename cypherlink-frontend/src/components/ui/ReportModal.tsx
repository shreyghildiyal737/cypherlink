import { useState } from "react";
import { Button } from "./Button";
import { useReport } from "../../hooks";
import { useModalAccessibility } from "../../hooks/useModalAccessibility";

interface ReportModalProps {
  targetId: string;
  targetType: "user" | "cypher" | "clip" | "project";
  targetName?: string;
  onClose: () => void;
}

const REASONS = [
  { value: "FAKE_EVENT", label: "Fake or misleading event" },
  { value: "UNSAFE_BEHAVIOR", label: "Unsafe behavior or environment" },
  { value: "PREDATORY_CONDUCT", label: "Predatory conduct" },
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "HATE_SPEECH", label: "Hate speech" },
  { value: "IMPERSONATION", label: "Impersonation" },
  { value: "SPAM", label: "Spam or commercial abuse" },
  { value: "COPYRIGHT", label: "Copyright violation" },
  { value: "OTHER", label: "Something else" },
] as const;

export function ReportModal({ targetId, targetType, targetName, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const report = useReport();

  const handleSubmit = () => {
    if (!reason) return;
    report.mutate(
      { targetId, targetType, reason, note: note.trim() || undefined },
      {
        onSuccess: () => setSubmitted(true),
      }
    );
  };

  const dialogRef = useModalAccessibility(true, onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Report concern"
        className="glass-panel max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/[0.08] p-6 shadow-xl"
      >
        {submitted ? (
          <div className="text-center">
            <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Thanks.</p>
            <p className="mt-3 font-body-md text-on-surface-variant/60">
              We'll review this and limit your exposure to it. You stay in control.
            </p>
            <Button className="mt-6 w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <h2 className="font-headline-lg-mobile text-xl text-on-surface">
              Tell us what happened
              {targetName && (
                <span className="ml-1 font-normal text-on-surface-variant/50 text-base">
                  · {targetName}
                </span>
              )}
            </h2>
            <p className="mt-1 font-body-md text-sm text-on-surface-variant/50">
              You stay in control. This goes to our review team, not publicly.
            </p>

            <div className="mt-5 space-y-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`w-full rounded-2xl px-4 py-3 text-left font-body-md text-sm transition ${
                    reason === r.value
                      ? "bg-primary-container/12 ring-1 ring-primary-container/40 text-on-surface"
                      : "bg-white/[0.04] text-on-surface-variant/70 hover:bg-white/[0.07]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional context (optional)"
              rows={3}
              className="glass-card mt-4 w-full resize-none rounded-xl border border-white/[0.08] px-4 py-3 font-body-md text-sm text-on-surface outline-none placeholder:text-on-surface-variant/28 focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20 transition-colors"
            />

            <div className="mt-4 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!reason || report.isPending}
                onClick={handleSubmit}
              >
                {report.isPending ? "Sending..." : "Send report"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
