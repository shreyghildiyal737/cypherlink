import { api } from "./api";

export const developerOpsApi = {
  getHealth: () => api.get("/dev/health").then((r) => r.data.data),
  getQueues: () => api.get("/dev/queues").then((r) => r.data.data),
  getJobs: () => api.get("/dev/jobs").then((r) => r.data.data),
  getUploadErrors: () =>
    api.get("/dev/uploads/errors").then((r) => r.data.data),
  getWsStatus: () => api.get("/dev/ws/status").then((r) => r.data.data),
  retryFailedJobs: (queueName: string) =>
    api.post(`/dev/jobs/${queueName}/retry-failed`).then((r) => r.data.data),
};
