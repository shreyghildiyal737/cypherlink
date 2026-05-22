import { Project } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="rounded-[1.7rem] border border-white/10 bg-panel p-5 transition hover:border-white/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Badge tone={project.visibility === "open" ? "green" : "muted"}>
          {project.visibility}
        </Badge>
        <span className="text-xs text-white/50">{project.city}</span>
      </div>
      <h3 className="text-xl font-black">{project.title}</h3>
      <p className="mt-1 text-sm text-white/60">{project.status}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <Badge key={tag} tone="purple">
            {tag}
          </Badge>
        ))}
      </div>
      {project.openRoles.length > 0 && (
        <div className="mt-5 rounded-2xl bg-white/5 p-4">
          <p className="text-xs text-white/50">Needs</p>
          <p className="mt-1 text-sm">{project.openRoles.join(" • ")}</p>
        </div>
      )}
      <div className="mt-5 flex gap-3">
        <Button>Open room</Button>
        <Button variant="secondary">Ask to join</Button>
      </div>
    </article>
  );
}
