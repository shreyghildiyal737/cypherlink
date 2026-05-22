import { useClips } from "../hooks";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Heart, MessageCircle, Share2, Users } from "lucide-react";
export default function Feed() {
  const { data: clips, isLoading } = useClips();
  if (isLoading)
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-white/40">
        Loading clips...
      </div>
    );
  if (!clips || clips.length === 0)
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-white/40">
        No clips yet
      </div>
    );
  return (
    <div className="h-[calc(100vh-4rem)] snap-y snap-mandatory overflow-y-auto">
      {clips.map((clip: any, i: number) => (
        <section
          key={clip.id}
          className="relative flex h-[calc(100vh-4rem)] snap-start items-end overflow-hidden px-4 pb-24 md:pb-10"
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${i % 2 === 0 ? "from-purpleGlow/50 via-ink to-orangeGlow/30" : "from-cyanGlow/35 via-ink to-purpleGlow/30"}`}
          />
          <div className="absolute inset-6 rounded-[3rem] border border-white/10 bg-white/5 shadow-glow" />
          <div className="relative z-10 max-w-xl">
            <Badge tone="cyan">{clip.reason || "Scene clip"}</Badge>
            <h2 className="mt-4 text-4xl font-black tracking-tight">
              {clip.creator.name}
            </h2>
            <p className="mt-1 text-white/70">
              {clip.creator.handle} • {clip.city}
            </p>
            <p className="mt-5 text-xl font-semibold">"{clip.caption}"</p>
            <p className="mt-3 text-white/60">Project: {clip.projectTitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button>Open project</Button>
              <Button variant="secondary">Collaborate</Button>
            </div>
          </div>
          <div className="absolute bottom-28 right-5 z-10 flex flex-col gap-4 md:bottom-10">
            <button className="grid h-12 w-12 place-items-center rounded-full bg-white/10">
              <Heart />
            </button>
            <span className="-mt-3 text-center text-xs">{clip.likes}</span>
            <button className="grid h-12 w-12 place-items-center rounded-full bg-white/10">
              <MessageCircle />
            </button>
            <span className="-mt-3 text-center text-xs">{clip.comments}</span>
            <button className="grid h-12 w-12 place-items-center rounded-full bg-white/10">
              <Users />
            </button>
            <button className="grid h-12 w-12 place-items-center rounded-full bg-white/10">
              <Share2 />
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
