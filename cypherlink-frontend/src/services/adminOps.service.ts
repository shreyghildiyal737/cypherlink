import { api } from "./api";

export const adminOpsApi = {
  getReports: (params?: {
    page?: string;
    cursor?: string;
    status?: string;
    targetType?: string;
  }) => api.get("/admin/reports", { params }).then((r) => r.data.data),
  updateReport: (
    id: string,
    data: { status: string; action?: string; internalNote?: string },
  ) => api.patch(`/admin/reports/${id}`, data).then((r) => r.data.data),
  getVerificationRequests: () =>
    api.get("/admin/verification-requests").then((r) => r.data.data),
  updateVerificationRequest: (
    id: string,
    data: { status: string; internalNote?: string },
  ) =>
    api
      .patch(`/admin/verification-requests/${id}`, data)
      .then((r) => r.data.data),
  getOrganizerRequests: () =>
    api.get("/admin/organizer-requests").then((r) => r.data.data),
  updateOrganizerRequest: (
    id: string,
    data: { status: string; internalNote?: string },
  ) =>
    api.patch(`/admin/organizer-requests/${id}`, data).then((r) => r.data.data),
  getAuditLogs: (params?: {
    actorId?: string;
    targetId?: string;
    action?: string;
    cursor?: string;
  }) => api.get("/admin/audit-logs", { params }).then((r) => r.data.data),
  getIncidents: () => api.get("/admin/incidents").then((r) => r.data.data),
  updateIncident: (
    id: string,
    data: { status?: string; priority?: string; summary?: string },
  ) => api.patch(`/admin/incidents/${id}`, data).then((r) => r.data.data),
};
