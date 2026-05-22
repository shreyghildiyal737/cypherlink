import { useParams } from "react-router-dom";
import {
  useProfile,
  useProjects,
  useCyphers,
  useFollowProfile,
} from "../hooks";
import { useAuthStore } from "../store/authStore";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
export default function Profile() {
  const { id } = useParams();
  const { data: artist, isLoading } = useProfile(id ?? "");
  const user = useAuthStore((s) => s.user);
  const follow = useFollowProfile();
  const isOwn = user && artist && user.id === artist.id;
  if (isLoading)
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-white/40">
        Loading profile...
      </div>
    );
  if (!artist)
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-white/40">
        Artist not found
      </div>
    );
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/10 via-panel to-purpleGlow/10 p-6 md:p-10">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-purpleGlow to-orangeGlow text-4xl font-black">
            {artist.avatar}
          </div>
          <div>
            <Badge tone="cyan">{artist.momentum}</Badge>
            <h1 className="mt-3 text-4xl font-black md:text-6xl">
              {artist.name}{" "}
              {artist.verified && <span className="text-cyanGlow">✓</span>}
            </h1>
            <p className="mt-2 text-white/65">
              {artist.handle} • {artist.city} • {artist.genres.join(" / ")}
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {!isOwn && user && (
            <Button onClick={() => follow.mutate(artist.id)}>
              {follow.isPending ? "Following..." : "Follow"}
            </Button>
          )}
          <Button variant="secondary">Message intent</Button>
        </div>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-panel p-5">
            <p className="text-sm text-white/50">Location</p>
            <h2 className="mt-3 text-2xl font-black">{artist.city}</h2>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-panel p-5">
            <p className="text-sm text-white/50">Genres</p>
            <h2 className="mt-3 text-2xl font-black">
              {artist.genres.join(", ")}
            </h2>
          </div>
        </section>
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-panel p-5">
            <h2 className="font-black">Artist QR</h2>
            <p className="mt-2 text-sm text-white/60">
              Creative handshake. Scan to preview, connect, collaborate or save.
            </p>
            <div className="mt-4 grid place-items-center rounded-2xl bg-white p-5">
              <QRCodeSVG value={`cypherlink://artist/${artist.id}`} />
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-panel p-5">
            <h2 className="font-black">Privacy & safety</h2>
            <p className="mt-2 text-sm text-white/60">
              Location and contact are never shared without explicit action. QR
              scans show only what you choose.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
