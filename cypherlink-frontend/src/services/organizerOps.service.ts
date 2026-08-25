import { api } from "./api";

export const organizerOpsApi = {
  getDashboard: () => api.get("/organizer/dashboard").then((r) => r.data.data),
  getCypherSummary: (id: string) =>
    api.get(`/organizer/cyphers/${id}/summary`).then((r) => r.data.data),
  scanCheckIn: (cypherId: string, qrToken: string) =>
    api
      .post(`/organizer/cyphers/${cypherId}/checkin-scan`, { qrToken })
      .then((r) => r.data.data),
  getCypherAssets: (cypherId: string) =>
    api.get(`/organizer/cyphers/${cypherId}/assets`).then((r) => r.data.data),
  addHighlight: (
    cypherId: string,
    assetId: string,
    title: string,
    caption?: string,
  ) =>
    api
      .post(`/organizer/cyphers/${cypherId}/highlights`, {
        assetId,
        title,
        caption,
      })
      .then((r) => r.data.data),
  addSafetyNote: (cypherId: string, note: string, severity?: string) =>
    api
      .post(`/organizer/cyphers/${cypherId}/safety-note`, { note, severity })
      .then((r) => r.data.data),
  getSessionSummary: (id: string) =>
    api.get(`/organizer/sessions/${id}/summary`).then((r) => r.data.data),
  scanSessionCheckIn: (sessionId: string, qrToken: string) =>
    api
      .post(`/organizer/sessions/${sessionId}/checkin-scan`, { qrToken })
      .then((r) => r.data.data),
  addSessionSafetyNote: (sessionId: string, note: string, severity?: string) =>
    api
      .post(`/organizer/sessions/${sessionId}/safety-note`, { note, severity })
      .then((r) => r.data.data),
};
