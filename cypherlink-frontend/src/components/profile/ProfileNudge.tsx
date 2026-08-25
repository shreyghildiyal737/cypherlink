import { useState } from "react";
import { Link } from "react-router-dom";

const NUDGE_DISMISSED_KEY = "cypherlink:profile-nudge-dismissed";

function hasDismissed(): boolean {
  try {
    return localStorage.getItem(NUDGE_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(NUDGE_DISMISSED_KEY, "1");
  } catch {}
}

export type ProfileLite = {
  city?: string;
  primaryRole?: string | null;
  genres?: string[];
  bio?: string | null;
  languages?: string[];
  openToCollab?: boolean;
};

function missingPieces(p: ProfileLite): string[] {
  const out: string[] = [];
  if (!p.city) out.push("your city");
  if (!p.primaryRole) out.push("what you bring to the circle");
  if (!p.genres || p.genres.length === 0) out.push("your sound");
  return out;
}

interface Props {
  profile: ProfileLite;
}

export function ProfileNudge({ profile }: Props) {
  const [dismissed, setDismissedState] = useState<boolean>(() => hasDismissed());
  const missing = missingPieces(profile);
  if (missing.length === 0) return null;
  if (dismissed) return null;

  return (
    <div className="rounded-2xl border border-primary-container/20 bg-primary-container/05 p-5">
      <p className="font-label-sm text-[10px] uppercase tracking-widest text-primary/70">
        Soft suggestion
      </p>
      <p className="mt-2 font-body-md text-sm leading-relaxed text-on-surface/80">
        Your profile could help more collaborators find you. Adding{" "}
        <span className="text-primary-fixed-dim">{missing.join(", ")}</span>{" "}
        gives the scene a clearer sense of who you are.
      </p>
      <div className="mt-4 flex gap-2">
        <Link
          to="/onboarding"
          className="rounded-full border border-primary-container/30 bg-primary-container/10 px-4 py-1.5 font-label-sm text-xs font-semibold text-primary-fixed-dim transition hover:bg-primary-container/18"
        >
          Add what's missing
        </Link>
        <button
          onClick={() => {
            setDismissed();
            setDismissedState(true);
          }}
          className="rounded-full px-4 py-1.5 font-label-sm text-xs text-on-surface-variant/40 transition hover:text-on-surface-variant/65"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
