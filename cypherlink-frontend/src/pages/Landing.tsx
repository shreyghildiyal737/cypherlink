import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { usePublicHome } from "../hooks";
const moments = [
  "Your city already has a sound.",
  "Find your scene. Build together.",
  "Moments fade. Meaning remains.",
];
const fallbackCyphers = [
  {
    id: "c1",
    title: "Delhi Rooftop Sessions",
    type: "open",
    city: "Delhi",
    pullingUp: 34,
  },
];
export default function Landing() {
  const { data } = usePublicHome();
  const cyphers =
    data?.cyphers && data.cyphers.length > 0 ? data.cyphers : fallbackCyphers;
  return (
    <div>
      <section className="relative min-h-[92vh] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(139,92,246,.35),transparent_32%),radial-gradient(circle_at_75%_65%,rgba(251,146,60,.23),transparent_30%)]" />
          <div className="absolute inset-x-6 top-28 h-[60vh] rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-glow" />
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: 120 + i * 25,
                height: 120 + i * 25,
                left: `${8 + i * 12}%`,
                top: `${18 + (i % 3) * 20}%`,
              }}
              animate={{ y: [0, -22, 0], opacity: [0.18, 0.42, 0.18] }}
              transition={{ duration: 6 + i, repeat: Infinity }}
            />
          ))}
        </div>
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-4 py-20">
          <Badge tone="orange">Independent music culture • India first</Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-.06em] md:text-8xl">
            Where independent music scenes connect.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70 md:text-xl">
            Browse scenes freely. Find collaborators. Host cyphers. Build
            projects. Preserve only the moments that matter.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/home">
              <Button>Explore the culture</Button>
            </Link>
            <Link to="/map">
              <Button variant="secondary">Open scene map</Button>
            </Link>
          </div>
          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {moments.map((m) => (
              <div
                key={m}
                className="glass rounded-[2rem] p-5 text-lg font-bold"
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-20">
        <p className="mb-3 text-sm uppercase tracking-[.35em] text-orangeGlow">
          Happening now
        </p>
        <h2 className="text-4xl font-black md:text-6xl">
          Cyphers live in your city
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cyphers.slice(0, 3).map((c: any) => (
            <div
              key={c.id}
              className="rounded-[2rem] border border-white/10 bg-panel p-5"
            >
              <Badge tone={c.type === "open" ? "cyan" : "orange"}>
                {c.type.toUpperCase()} CYPHER
              </Badge>
              <h3 className="mt-4 text-2xl font-black">{c.title}</h3>
              <p className="mt-2 text-white/60">
                {c.city} • {c.pullingUp} pulling up
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="border-t border-white/10 py-20 text-center">
        <h2 className="px-4 text-4xl font-black md:text-6xl">
          Designed for India's independent music culture.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl px-4 text-white/60">
          CypherLink is a creative network for Indian independent music — from
          cyphers and collabs to community safety and ephemeral moments that
          leave a permanent mark.
        </p>
      </section>
    </div>
  );
}
