import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { OpsCard } from "../../components/ops/OpsCard";
import { OpsMetric } from "../../components/ops/OpsMetric";
import { OpsTimeline } from "../../components/ops/OpsTimeline";
import { useHealthWithFallback } from "../../hooks/useDeveloperHealth";
import { useJobsWithFallback } from "../../hooks/useQueueStatus";
import { useAuthStore } from "../../store/authStore";

export default function DeveloperConsole() {
  const user = useAuthStore((s) => s.user);
  const { data: health } = useHealthWithFallback();
  const { data: jobs } = useJobsWithFallback();

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-white/40">
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Badge tone="green">If it cannot be monitored, it is broken</Badge>
      <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
        Developer console
      </h1>
      <p className="mt-3 max-w-2xl text-white/60">
        Simple reliability visibility for API health, sockets, queues, uploads
        and cleanup jobs.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {healthMetrics.map((s) => (
          <OpsMetric key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <OpsCard title="Background jobs" eyebrow="Lifecycle">
          {jobs.length > 0 ? (
            <OpsTimeline items={jobs} />
          ) : (
            <p className="text-sm text-white/60">No job history available</p>
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
            <ul className="space-y-2 text-sm text-white/60">
              <li>&bull; Upload retries above normal threshold.</li>
              <li>&bull; Two delayed notification jobs.</li>
              <li>&bull; No critical socket failures.</li>
            </ul>
          </OpsCard>
        </div>
      </div>
    </div>
  );
}
