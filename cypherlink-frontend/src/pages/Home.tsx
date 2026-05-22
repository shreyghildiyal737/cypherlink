import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { CypherCard } from "../components/cards/CypherCard";
import { ProjectCard } from "../components/cards/ProjectCard";
import { ProfileMini } from "../components/cards/ProfileMini";
import { usePublicHome } from "../hooks";
import { useAuthStore } from "../store/authStore";
export default function Home() {
  const { data, isLoading } = usePublicHome();
  const user = useAuthStore((s) => s.user);
  const cyphers = data?.cyphers ?? [];
  const projects = data?.projects ?? [];
  const artists = data?.artists ?? [];
  const sessions = data?.sessions ?? [];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-10">
        <Badge tone="orange">Delhi scene active tonight</Badge>
        <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
          Welcome{user ? ` back, ${user.name}` : " into the creative city"}
        </h1>
        <p className="mt-4 max-w-2xl text-white/65">
          Look around before logging in. When you want to pull up, message,
          RSVP, create or save something, we'll help you make your space.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/create">
            <Button>Start something</Button>
          </Link>
          <Link to="/feed">
            <Button variant="secondary">Watch clips</Button>
          </Link>
          <Link to="/map">
            <Button variant="secondary">Explore map</Button>
          </Link>
        </div>
      </section>
      {!isLoading && (
        <>
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-sm text-orangeGlow">Happening now</p>
                <h2 className="text-2xl font-black">
                  Cyphers breathing nearby
                </h2>
              </div>
              <Link to="/cyphers" className="text-sm text-cyanGlow">
                View all
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {cyphers.slice(0, 2).map((c: any) => (
                <CypherCard key={c.id} cypher={c} />
              ))}
            </div>
          </section>
          <section className="mt-12 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <div>
              <div className="mb-4">
                <p className="text-sm text-cyanGlow">Open doors</p>
                <h2 className="text-2xl font-black">
                  Projects looking for people
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {projects.slice(0, 2).map((p: any) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-4">
                <p className="text-sm text-purpleGlow">Momentum</p>
                <h2 className="text-2xl font-black">Active artists</h2>
              </div>
              <div className="space-y-3">
                {artists.slice(0, 4).map((a: any) => (
                  <ProfileMini key={a.id} artist={a} />
                ))}
              </div>
            </div>
          </section>
          {sessions.length > 0 && (
            <section className="mt-12">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-sm text-greenGlow">Community</p>
                  <h2 className="text-2xl font-black">Sessions nearby</h2>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {sessions.map((s: any) => (
                  <div
                    key={s.id}
                    className="rounded-[2rem] border border-white/10 bg-panel p-5"
                  >
                    <p className="text-sm text-white/50">{s.type}</p>
                    <h3 className="mt-2 text-xl font-black">{s.title}</h3>
                    <p className="text-white/60">
                      {s.city} • {s.pullingUp} pulling up
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      {isLoading && (
        <div className="mt-20 text-center text-white/40">Loading scene...</div>
      )}
    </div>
  );
}
