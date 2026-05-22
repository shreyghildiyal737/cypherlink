import { Artist } from "../../types";
import { Badge } from "../ui/Badge";
export function ProfileMini({ artist }: { artist: Artist }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-purpleGlow to-orangeGlow font-black">
        {artist.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">
          {artist.name}{" "}
          {artist.verified && <span className="text-cyanGlow">✓</span>}
        </p>
        <p className="truncate text-xs text-white/50">
          {artist.handle} • {artist.city}
        </p>
      </div>
      {artist.momentum && <Badge tone="cyan">{artist.momentum}</Badge>}
    </div>
  );
}
