import { Link } from "react-router-dom";
import { Artist } from "../../types";
import { Badge } from "../ui/Badge";

export function ProfileMini({ artist }: { artist: Artist }) {
  return (
    <Link
      to={`/profile/${artist.id}`}
      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all duration-300 hover:border-primary-container/20 hover:bg-primary-container/05 group"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-container via-[#6d28d9] to-[#5200b0] font-bold text-on-primary-container text-sm">
        {artist.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-on-surface text-sm group-hover:text-primary-fixed-dim transition-colors duration-200">
          {artist.name}{" "}
        </p>
        <p className="truncate font-label-sm text-[11px] text-on-surface-variant/40">
          {artist.handle}
          {artist.city ? ` · ${artist.city}` : ""}
        </p>
      </div>
      {artist.momentum && (
        <Badge tone="muted">{artist.momentum}</Badge>
      )}
    </Link>
  );
}
