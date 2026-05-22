import { useState, useCallback } from "react";
import { useSearch } from "../hooks";
import { ProfileMini } from "../components/cards/ProfileMini";
import { ProjectCard } from "../components/cards/ProjectCard";
import { CypherCard } from "../components/cards/CypherCard";
export default function Search() {
  const [q, setQ] = useState("");
  const { data } = useSearch(q);
  const debounced = useCallback((v: string) => {
    const t = setTimeout(() => setQ(v), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <input
        className="w-full rounded-full border border-white/10 bg-panel px-6 py-4 outline-none placeholder:text-white/35"
        placeholder="Search artists, projects, cyphers, scenes..."
        onChange={(e) => debounced(e.target.value)}
      />
      <div className="mt-5 flex flex-wrap gap-2 text-sm text-white/60">
        {[
          "Location",
          "Genre",
          "Language",
          "Verified",
          "Cypher type",
          "Beginner friendly",
        ].map((f) => (
          <button key={f} className="rounded-full bg-white/5 px-4 py-2">
            {f}
          </button>
        ))}
      </div>
      {q.length >= 2 && data && (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {data.artists.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-black">Artists</h2>
              <div className="space-y-3">
                {data.artists.map((a: any) => (
                  <ProfileMini key={a.id} artist={a} />
                ))}
              </div>
            </section>
          )}
          {data.projects.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-black">Projects</h2>
              <div className="space-y-4">
                {data.projects.map((p: any) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}
          {data.cyphers.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-black">Cyphers</h2>
              <div className="space-y-4">
                {data.cyphers.map((c: any) => (
                  <CypherCard key={c.id} cypher={c} />
                ))}
              </div>
            </section>
          )}
          {data.artists.length === 0 &&
            data.projects.length === 0 &&
            data.cyphers.length === 0 && (
              <p className="col-span-full text-center text-white/40">
                No results for "{q}"
              </p>
            )}
        </div>
      )}
      {q.length === 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <section>
            <h2 className="mb-4 text-xl font-black">Artists</h2>
            <p className="text-white/40">Start typing to search</p>
          </section>
        </div>
      )}
    </div>
  );
}
