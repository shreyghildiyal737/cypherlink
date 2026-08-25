import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { OpsCard } from "../../components/ops/OpsCard";
import { useAuthStore } from "../../store/authStore";

export default function OpsHome() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "";

  const isAdmin = role === "ADMIN";
  const isMod = role === "MODERATOR" || isAdmin;
  const isOrganizer = role === "ORGANIZER" || isAdmin;
  const canAccessHostTools = !!user;

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <Badge tone="muted">Internal tools should feel helpful, not hostile</Badge>
      <h1 className="mt-4 max-w-4xl font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] tracking-tight text-on-surface">
        CypherLink operations
      </h1>
      <p className="mt-4 max-w-2xl font-body-md text-on-surface-variant/50">
        Dedicated workspaces for the people keeping the ecosystem useful, safe, and alive.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {canAccessHostTools && (
          <OpsCard
            title={isOrganizer ? "Organizer Dashboard" : "Host Tools"}
            eyebrow={isOrganizer ? "For organizers" : "For event hosts"}
          >
            <p className="font-body-md text-sm text-on-surface-variant/60">
              {isOrganizer
                ? "Run cyphers and community sessions without feeling like event software. RSVP, waitlist, QR check-in, safety notes, highlights."
                : "Manage the events you created. RSVP lists, QR check-in, safety notes, and highlight curation — scoped to your events only."}
            </p>
            <Link to="/ops/organizer">
              <Button className="mt-5 w-full">
                {isOrganizer ? "Open organizer tools" : "Open host tools"}
              </Button>
            </Link>
          </OpsCard>
        )}

        {isMod && (
          <OpsCard title="Admin Console" eyebrow="For trust">
            <p className="font-body-md text-sm text-on-surface-variant/60">
              Review reports, verification requests, organizer approvals, incidents and moderation history with context and care.
            </p>
            <Link to="/ops/admin">
              <Button className="mt-5 w-full">Open admin console</Button>
            </Link>
          </OpsCard>
        )}

        {isAdmin && (
          <OpsCard title="Developer Console" eyebrow="For reliability">
            <p className="font-body-md text-sm text-on-surface-variant/60">
              Monitor API, sockets, queues, uploads, cleanup jobs and system health before users feel problems.
            </p>
            <Link to="/ops/developer">
              <Button className="mt-5 w-full">Open developer console</Button>
            </Link>
          </OpsCard>
        )}

        {!user && (
          <OpsCard title="Sign in required" eyebrow="Access control">
            <p className="font-body-md text-sm text-on-surface-variant/60">
              These tools are available to event hosts, organizers, moderators, and admins. Sign in to access what applies to your role.
            </p>
            <Link to="/login">
              <Button className="mt-5 w-full">Sign in</Button>
            </Link>
          </OpsCard>
        )}
      </div>
    </div>
  );
}
