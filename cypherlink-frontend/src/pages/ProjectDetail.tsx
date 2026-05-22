import { useParams } from "react-router-dom";
import { useProject, useProfile } from "../hooks";
import { useAuthStore } from "../store/authStore";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
export default function ProjectDetail() {
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id ?? "");
  const user = useAuthStore((s) => s.user);
  if (isLoading)
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-white/40">
        Loading project...
      </div>
    );
  if (!project)
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-white/40">
        Project not found
      </div>
    );
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <section className="rounded-[2rem] border border-white/10 bg-panel p-5">
        <Badge tone="green">{project.status}</Badge>
        <h1 className="mt-4 text-4xl font-black">{project.title}</h1>
        <p className="mt-2 text-white/60">
          {project.city} • {project.tags.join(" • ")}
        </p>
        <div className="mt-8 space-y-4">
          {project.members.map((m) => (
            <div key={m.id} className="rounded-2xl bg-white/5 p-4">
              {m.name} is part of this project
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-ink p-4">
          <input
            className="w-full bg-transparent outline-none placeholder:text-white/35"
            placeholder="Drop an idea, note, lyric, reference..."
          />
        </div>
      </section>
      <aside className="space-y-5">
        <div className="rounded-[2rem] border border-white/10 bg-panel p-5">
          <h2 className="font-black">Open roles</h2>
          <p className="mt-3 text-sm text-white/60">
            {project.openRoles.join(" • ") || "No open roles right now."}
          </p>
          {user ? (
            <Button className="mt-4 w-full">Ask to join</Button>
          ) : (
            <p className="mt-4 text-sm text-white/40">Log in to ask to join</p>
          )}
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-panel p-5">
          <h2 className="font-black">Collaborators</h2>
          <div className="mt-4 space-y-3">
            {project.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                  {m.avatar}
                </span>
                <span>{m.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-panel p-5">
          <h2 className="font-black">Files</h2>
          <p className="mt-2 text-sm text-white/60">
            Signed URL upload flow ready for backend. Waveform previews later.
          </p>
          {user && (
            <Button variant="secondary" className="mt-4 w-full">
              Upload file
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}
