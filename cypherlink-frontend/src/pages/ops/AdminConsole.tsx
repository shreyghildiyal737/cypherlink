import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { OpsCard } from "../../components/ops/OpsCard";
import { OpsMetric } from "../../components/ops/OpsMetric";
import { useReportsWithFallback } from "../../hooks/useAdminReports";
import { useVerificationRequestsWithFallback } from "../../hooks/useVerificationRequests";
import { useAuthStore } from "../../store/authStore";

export default function AdminConsole() {
  const user = useAuthStore((s) => s.user);
  const { data: reportsData } = useReportsWithFallback();
  const { data: verificationRequests } = useVerificationRequestsWithFallback();

  if (!user || (user.role !== "MODERATOR" && user.role !== "ADMIN")) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-white/40">
        Access denied
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Badge tone="cyan">Protect culture quietly</Badge>
      <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
        Admin console
      </h1>
      <p className="mt-3 max-w-2xl text-white/60">
        Built for safety, fairness and context. No public shaming. No careless
        moderation. Every action should be traceable.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <OpsMetric
          label="Open reports"
          value={String(reportsData.items.length)}
          helper="Awaiting review"
        />
        <OpsMetric
          label="Verification"
          value={String(verificationRequests.length)}
          helper="Pending requests"
        />
        <OpsMetric label="Organizer review" value="0" helper="Needs approval" />
        <OpsMetric label="Incidents" value="0" helper="This week" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <OpsCard title="Report queue" eyebrow="Safety">
          <div className="space-y-3">
            {reportsData.items.length === 0 && (
              <p className="text-sm text-white/60">No reports to review</p>
            )}
            {reportsData.items.map(
              (report: {
                id: string;
                type: string;
                targetType: string;
                priority: string;
                status: string;
                description?: string;
              }) => (
                <div key={report.id} className="rounded-2xl bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{report.type}</p>
                    <span className="text-xs text-orangeGlow">
                      {report.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/60">
                    {report.targetType} &bull; {report.status}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" className="py-2">
                      Review
                    </Button>
                    <Button variant="ghost" className="py-2">
                      Assign
                    </Button>
                  </div>
                </div>
              ),
            )}
          </div>
        </OpsCard>

        <OpsCard title="Verification & organizer requests" eyebrow="Trust">
          <div className="space-y-3">
            {verificationRequests.length === 0 && (
              <p className="text-sm text-white/60">No pending requests</p>
            )}
            {verificationRequests.map(
              (request: {
                id: string;
                name: string;
                reason: string;
                status: string;
              }) => (
                <div key={request.id} className="rounded-2xl bg-white/5 p-4">
                  <p className="font-bold">{request.name}</p>
                  <p className="mt-1 text-sm text-white/60">{request.reason}</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" className="py-2">
                      Approve
                    </Button>
                    <Button variant="ghost" className="py-2">
                      Need info
                    </Button>
                    <Button variant="danger" className="py-2">
                      Reject
                    </Button>
                  </div>
                </div>
              ),
            )}
          </div>
        </OpsCard>
      </div>
    </div>
  );
}
