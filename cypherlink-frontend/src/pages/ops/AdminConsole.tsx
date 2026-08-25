import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { OpsCard } from "../../components/ops/OpsCard";
import { OpsMetric } from "../../components/ops/OpsMetric";
import { useReportsWithFallback, useUpdateReport } from "../../hooks/useAdminReports";
import {
  useVerificationRequestsWithFallback,
  useOrganizerRequests,
  useUpdateVerificationRequest,
  useIncidentsWithFallback,
} from "../../hooks/useVerificationRequests";
import { useAuthStore } from "../../store/authStore";

export default function AdminConsole() {
  const user = useAuthStore((s) => s.user);
  const { data: reportsData } = useReportsWithFallback();
  const { data: verificationRequests } = useVerificationRequestsWithFallback();
  const { data: organizerRequests } = useOrganizerRequests();
  const { data: incidents } = useIncidentsWithFallback();

  const updateReport = useUpdateReport();
  const updateVerification = useUpdateVerificationRequest();

  const [actionPending, setActionPending] = useState<string | null>(null);

  if (!user || (user.role !== "MODERATOR" && user.role !== "ADMIN")) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center font-body-md text-on-surface-variant/35">
        Access denied
      </div>
    );
  }

  function handleReportAction(id: string, status: string) {
    setActionPending(`${id}-${status}`);
    updateReport.mutate(
      { id, status },
      { onSettled: () => setActionPending(null) },
    );
  }

  function handleVerificationAction(id: string, status: string) {
    setActionPending(`${id}-${status}`);
    updateVerification.mutate(
      { id, status },
      { onSettled: () => setActionPending(null) },
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <Badge tone="muted">Protect culture quietly</Badge>
      <h1 className="mt-4 font-headline-xl text-headline-xl md:text-[clamp(2.5rem,6vw,4rem)] tracking-tight text-on-surface">
        Admin console
      </h1>
      <p className="mt-3 max-w-2xl font-body-md text-on-surface-variant/50">
        Built for safety, fairness and context. No public shaming. No careless moderation. Every action should be traceable.
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
        <OpsMetric
          label="Organizer review"
          value={String((organizerRequests ?? []).length)}
          helper="Needs approval"
        />
        <OpsMetric label="Incidents" value={String(incidents.length)} helper="This week" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <OpsCard title="Report queue" eyebrow="Safety">
          <div className="space-y-3">
            {reportsData.items.length === 0 && (
              <p className="font-body-md text-sm text-on-surface-variant/50">No reports to review</p>
            )}
            {reportsData.items.map(
              (report: {
                id: string;
                type: string;
                targetType: string;
                priority: string;
                status: string;
                description?: string;
              }) => {
                const isActing = actionPending?.startsWith(report.id);
                return (
                  <div
                    key={report.id}
                    className="glass-card rounded-xl border border-white/[0.05] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-body-md font-semibold text-on-surface">{report.type}</p>
                      <Badge tone="orange">{report.priority}</Badge>
                    </div>
                    <p className="mt-1 font-label-sm text-sm text-on-surface-variant/50">
                      {report.targetType} · {report.status}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="secondary"
                        className="py-1.5 text-xs"
                        disabled={isActing}
                        onClick={() => handleReportAction(report.id, "IN_REVIEW")}
                      >
                        {actionPending === `${report.id}-IN_REVIEW` ? "Updating…" : "Review"}
                      </Button>
                      <Button
                        variant="secondary"
                        className="py-1.5 text-xs"
                        disabled={isActing}
                        onClick={() => handleReportAction(report.id, "RESOLVED")}
                      >
                        {actionPending === `${report.id}-RESOLVED` ? "Updating…" : "Resolve"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="py-1.5 text-xs opacity-35 cursor-not-allowed"
                        disabled
                        title="Assignment coming soon"
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </OpsCard>

        <OpsCard title="Verification requests" eyebrow="Trust">
          <div className="space-y-3">
            {verificationRequests.length === 0 && (
              <p className="font-body-md text-sm text-on-surface-variant/50">No pending requests</p>
            )}
            {verificationRequests.map(
              (request: {
                id: string;
                name?: string;
                reason?: string;
                status: string;
                user?: { displayName?: string };
                type?: string;
              }) => {
                const label = request.name ?? request.user?.displayName ?? "Unknown";
                const isActing = actionPending?.startsWith(request.id);
                return (
                  <div
                    key={request.id}
                    className="glass-card rounded-xl border border-white/[0.05] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-body-md font-semibold text-on-surface">{label}</p>
                      <Badge tone="muted">{request.status}</Badge>
                    </div>
                    {request.reason && (
                      <p className="mt-1 font-label-sm text-sm text-on-surface-variant/50">{request.reason}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="secondary"
                        className="py-1.5 text-xs"
                        disabled={isActing}
                        onClick={() => handleVerificationAction(request.id, "APPROVED")}
                      >
                        {actionPending === `${request.id}-APPROVED` ? "Approving…" : "Approve"}
                      </Button>
                      <Button
                        variant="danger"
                        className="py-1.5 text-xs"
                        disabled={isActing}
                        onClick={() => handleVerificationAction(request.id, "REJECTED")}
                      >
                        {actionPending === `${request.id}-REJECTED` ? "Rejecting…" : "Reject"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="py-1.5 text-xs opacity-35 cursor-not-allowed"
                        disabled
                        title="Follow-up messaging coming soon"
                      >
                        Need info
                      </Button>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </OpsCard>
      </div>
    </div>
  );
}
