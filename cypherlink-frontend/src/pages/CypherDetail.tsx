import { useParams } from "react-router-dom";
import { useCypher, useRSVPCypher, useCheckIn } from "../hooks";
import { useAuthStore } from "../store/authStore";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { QRCodeSVG } from "qrcode.react";
export default function CypherDetail() {
  const { id } = useParams();
  const { data: cypher, isLoading } = useCypher(id ?? "");
  const user = useAuthStore((s) => s.user);
  const rsvp = useRSVPCypher();
  const checkin = useCheckIn();
  if (isLoading)
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-white/40">
        Loading cypher...
      </div>
    );
  if (!cypher)
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-white/40">
        Cypher not found
      </div>
    );
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-orangeGlow/20 via-panel to-purpleGlow/15 p-6 md:p-10">
        <Badge tone={cypher.type === "open" ? "cyan" : "orange"}>
          {cypher.type === "open" ? "OPEN CYPHER" : "VENUE CYPHER"}
        </Badge>
        <h1 className="mt-5 text-4xl font-black md:text-6xl">{cypher.title}</h1>
        <p className="mt-3 text-white/65">
          {cypher.startsAt} • {cypher.venue}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {user ? (
            <Button onClick={() => rsvp.mutate({ id: cypher.id })}>
              {rsvp.isPending
                ? "RSVPing..."
                : cypher.type === "open"
                  ? "Pull up"
                  : "Save a spot"}
            </Button>
          ) : (
            <Button>Log in to RSVP</Button>
          )}
          <Button variant="secondary">Share</Button>
        </div>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[2rem] border border-white/10 bg-panel p-5">
          <h2 className="text-2xl font-black">Cypher timeline</h2>
          <div className="mt-4 rounded-2xl bg-white/5 p-4">
            {cypher.pullingUp} people pulling up
          </div>
          <div className="mt-4 rounded-2xl bg-white/5 p-4">
            Cypher is {cypher.state}
          </div>
          {cypher.highlights.map((h, i) => (
            <div key={i} className="mt-4 rounded-2xl bg-white/5 p-4">
              Highlight: {h}
            </div>
          ))}
        </section>
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-panel p-5">
            <h2 className="font-black">Optional check-in</h2>
            <p className="mt-2 text-sm text-white/60">
              No penalty if skipped. Scanning simply saves this moment to your
              history.
            </p>
            <div className="mt-4 grid place-items-center rounded-2xl bg-white p-5">
              <QRCodeSVG
                value={`cypherlink://checkin/${cypher.id}/${user?.id ?? "guest"}`}
              />
            </div>
            {user && (
              <Button
                variant="secondary"
                className="mt-4 w-full"
                onClick={() =>
                  checkin.mutate({ cypherId: cypher.id, userId: user.id })
                }
              >
                Check in
              </Button>
            )}
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-panel p-5">
            <h2 className="font-black">Organizer summary</h2>
            <p className="mt-2 text-sm text-white/60">
              RSVPs, check-ins, highlights, incidents and timings are stored
              privately for safety/legal purposes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
