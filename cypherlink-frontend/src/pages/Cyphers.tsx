import { useCyphers } from "../hooks";
import { CypherCard } from "../components/cards/CypherCard";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Link } from "react-router-dom";
export default function Cyphers() {
  const { data: cyphers, isLoading } = useCyphers();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="orange">
            Temporary pages. Curated highlights survive.
          </Badge>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">Cyphers</h1>
          <p className="mt-3 max-w-2xl text-white/60">
            Open circles and venue sessions that become living timelines, then
            fade after 24 hours except chosen highlights.
          </p>
        </div>
        <Link to="/create">
          <Button>Host cypher</Button>
        </Link>
      </div>
      <div className="mt-10 grid gap-5">
        {isLoading ? (
          <div className="text-center text-white/40">Loading cyphers...</div>
        ) : cyphers?.length === 0 ? (
          <div className="text-center text-white/40">No cyphers right now</div>
        ) : (
          cyphers?.map((c: any) => <CypherCard key={c.id} cypher={c} />)
        )}
      </div>
    </div>
  );
}
