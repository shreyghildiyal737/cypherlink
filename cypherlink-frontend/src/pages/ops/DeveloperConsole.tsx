import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { OpsCard } from "../../components/ops/OpsCard";
import { OpsTimeline } from "../../components/ops/OpsTimeline";
import { useHealthWithFallback } from "../../hooks/useDeveloperHealth";
import { useJobsWithFallback } from "../../hooks/useQueueStatus";
import { useAuthStore } from "../../store/authStore";

const STATUS_TONES: Record<string, "green" | "orange" | "muted"> = {
  healthy: "green",
  ok: "green",
  degraded: "orange",
  down: "orange",
  unknown: "muted",
};

function statusTone(s: string): "green" | "orange" | "muted" {
  return STATUS_TONES[s?.toLowerCase()] ?? "muted";
}

export default function DeveloperConsole() {
  const user = useAuthStore((s) => s.user);
  const { data: health } = useHealthWithFallback();
  const { data: jobs } = useJobsWithFallback();

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center font-body-md text-on-surface-variant/35">
        Access denied
      </div>
    );
  }

  const healthMetrics = [
    {
      label: "API",
      value: health.api?.status || "Unknown",
      helper: `p95 ${health.api?.p95Ms || 0}ms`,
    },
    {
      label: "Database",
      value: health.database?.status || "Unknown",
      helper: "",
    },
    { label: "Redis", value: health.redis?.status || "Unknown", helper: "" },
    {
      label: "Uploads",
      value: health.uploads?.status || "Unknown",
      helper: `${health.uploads?.warningCount || 0} warnings`,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <Badge tone="green">If it cannot be monitored, it is broken</Badge>
      <h1 className="mt-4 font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] tracking-tight text-on-surface">
        Developer console
      </h1>
      <p className="mt-3 max-w-2xl font-body-md text-on-surface-variant/50">
        Simple reliability visibility for API health, sockets, queues, uploads and cleanup jobs.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {healthMetrics.map((s) => (
          <div key={s.label} className="glass-card rounded-2xl border border-white/[0.06] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/40">{s.label}</p>
              <Badge tone={statusTone(s.value)}>{s.value}</Badge>
            </div>
            <p className="mt-2 font-label-sm font-mono text-sm text-on-surface-variant/60">{s.helper || "—"}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <OpsCard title="Background jobs" eyebrow="Lifecycle">
          {jobs.length > 0 ? (
            <OpsTimeline items={jobs} />
          ) : (
            <p className="font-label-sm font-mono text-sm text-on-surface-variant/50">No job history available</p>
          )}
        </OpsCard>

        <div className="space-y-5">
          <OpsCard title="Fast checks" eyebrow="Runbook">
            <div className="grid gap-3">
              <Button variant="secondary">Check API health</Button>
              <Button variant="secondary">Check queues</Button>
              <Button variant="secondary">Retry failed uploads</Button>
              <Button variant="secondary">View latest errors</Button>
            </div>
          </OpsCard>

          <OpsCard title="Current risks" eyebrow="Watch">
            <ul className="space-y-2 font-label-sm font-mono text-sm text-on-surface-variant/50">
              <li>· Upload retries above normal threshold.</li>
              <li>· Two delayed notification jobs.</li>
              <li>· No critical socket failures.</li>
            </ul>
          </OpsCard>
        </div>
      </div>
    </div>
  );
}
