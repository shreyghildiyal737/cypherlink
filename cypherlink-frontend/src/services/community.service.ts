import { api } from './api';

export async function fetchCommunitySessions() {
  const r = await api.get('/sessions');
  return r.data;
}

export async function fetchCommunitySession(id: string) {
  const r = await api.get(`/sessions/${id}`);
  return r.data;
}

export async function rsvpCommunitySession(id: string) {
  const r = await api.post(`/sessions/${id}/rsvp`);
  return r.data;
}

export async function getCheckInToken(sessionId: string) {
  const r = await api.get(`/sessions/${sessionId}/my-checkin-token`);
  return r.data;
}
