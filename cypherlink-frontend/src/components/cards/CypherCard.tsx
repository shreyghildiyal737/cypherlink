import { motion } from "framer-motion";
import { Cypher } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { MapPin, QrCode } from "lucide-react";
export function CypherCard({ cypher }: { cypher: Cypher }) {
  const isVenue = cypher.type === "venue";
  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-panel shadow-glow"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purpleGlow/20 via-transparent to-orangeGlow/15 opacity-80" />
      <div className="relative p-5 md:p-6">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone={isVenue ? "orange" : "cyan"}>
              {isVenue ? "VENUE CYPHER" : "OPEN CYPHER"}
            </Badge>
            <Badge tone={cypher.state === "active" ? "green" : "muted"}>
              {cypher.state === "active" ? "LIVE NOW" : cypher.startsAt}
            </Badge>
          </div>
          {isVenue && <Badge tone="muted">{cypher.spotsLeft} spots left</Badge>}
        </div>
        <h3 className="text-2xl font-black tracking-tight md:text-3xl">
          {cypher.title}
        </h3>
        <p className="mt-2 flex items-center gap-2 text-sm text-white/70">
          <MapPin size={16} />
          {cypher.venue}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-white/50">Pulling up</p>
            <p className="text-2xl font-black">{cypher.pullingUp}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-white/50">Safety</p>
            <p className="text-sm">{cypher.safetyTags[0]}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-white/50">After event</p>
            <p className="text-sm">Highlights stay. Raw assets fade.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button>{isVenue ? "Save a spot" : "Pull up"}</Button>
          <Button variant="secondary">Open page</Button>
          <Button variant="ghost">
            <QrCode size={16} /> Host check-in
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
