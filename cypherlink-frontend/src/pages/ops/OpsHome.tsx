import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { OpsCard } from "../../components/ops/OpsCard";

export default function OpsHome() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Badge tone="orange">
        Internal tools should feel helpful, not hostile
      </Badge>
      <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
        CypherLink operations
      </h1>
      <p className="mt-4 max-w-2xl text-white/60">
        Three dedicated workspaces for the people keeping the ecosystem useful,
        safe, and alive.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <OpsCard title="Organizer Dashboard" eyebrow="For hosts">
          <p className="text-sm text-white/60">
            Run cyphers and community sessions without feeling like event
            software. RSVP, waitlist, QR check-in, safety notes, highlights.
          </p>
          <Link to="/ops/organizer">
            <Button className="mt-5 w-full">Open organizer tools</Button>
          </Link>
        </OpsCard>

        <OpsCard title="Admin Console" eyebrow="For trust">
          <p className="text-sm text-white/60">
            Review reports, verification requests, organizer approvals,
            incidents and moderation history with context and care.
          </p>
          <Link to="/ops/admin">
            <Button className="mt-5 w-full">Open admin console</Button>
          </Link>
        </OpsCard>

        <OpsCard title="Developer Console" eyebrow="For reliability">
          <p className="text-sm text-white/60">
            Monitor API, sockets, queues, uploads, cleanup jobs and system
            health before users feel problems.
          </p>
          <Link to="/ops/developer">
            <Button className="mt-5 w-full">Open developer console</Button>
          </Link>
        </OpsCard>
      </div>
    </div>
  );
}
