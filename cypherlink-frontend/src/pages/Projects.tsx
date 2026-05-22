import { useProjects } from "../hooks";
import { ProjectCard } from "../components/cards/ProjectCard";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Link } from "react-router-dom";
export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="green">Culture outside. Focus inside.</Badge>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Project rooms
          </h1>
          <p className="mt-3 max-w-2xl text-white/60">
            Calm digital studio spaces for files, roles, chat, credits and
            creative continuity.
          </p>
        </div>
        <Link to="/create">
          <Button>Start project</Button>
        </Link>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center text-white/40">
            Loading projects...
          </div>
        ) : projects?.length === 0 ? (
          <div className="col-span-full text-center text-white/40">
            No projects yet
          </div>
        ) : (
          projects?.map((p: any) => <ProjectCard key={p.id} project={p} />)
        )}
      </div>
    </div>
  );
}
