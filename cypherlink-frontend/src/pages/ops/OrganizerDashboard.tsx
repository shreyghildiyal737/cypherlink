import { QRCodeSVG } from "qrcode.react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { OpsCard } from "../../components/ops/OpsCard";
import { OpsMetric } from "../../components/ops/OpsMetric";
import { OpsTimeline } from "../../components/ops/OpsTimeline";
import { useOrganizerDashboardWithFallback } from "../../hooks/useOrganizerDashboard";
import { useAuthStore } from "../../store/authStore";

export default function OrganizerDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data } = useOrganizerDashboardWithFallback();

  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-white/40">
        Access denied
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Badge tone="orange">Host mode</Badge>
      <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
        Run the room, not a spreadsheet.
      </h1>
      <p className="mt-3 max-w-2xl text-white/60">
        Organizer tools should help the host protect the vibe: fast check-ins,
        clear waitlist, safety controls, and highlight curation.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {data.stats.map(
          (s: { label: string; value: string; helper: string }) => (
            <OpsMetric key={s.label} {...s} />
          ),
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <OpsCard title="Live cypher timeline" eyebrow="Tonight">
          {data.timeline.length > 0 ? (
            <OpsTimeline items={data.timeline} />
          ) : (
            <p className="text-sm text-white/60">No recent events</p>
          )}
        </OpsCard>

        <div className="space-y-5">
          <OpsCard title="QR check-in" eyebrow="Optional">
            <p className="text-sm text-white/60">
              Scanning saves the moment to attendee history. No one is punished
              for skipping it.
            </p>
            <div className="mt-4 grid place-items-center rounded-2xl bg-white p-5">
              <QRCodeSVG value="cypherlink://organizer/checkin/demo-cypher" />
            </div>
            <Button className="mt-4 w-full">Open scanner</Button>
          </OpsCard>

          <OpsCard title="Host actions" eyebrow="Keep it moving">
            <div className="grid gap-3">
              <Button variant="secondary">Approve waitlist spot</Button>
              <Button variant="secondary">Add safety note</Button>
              <Button variant="secondary">Select official highlight</Button>
              <Button variant="danger">Pause RSVPs</Button>
            </div>
          </OpsCard>
        </div>
      </div>
    </div>
  );
}
