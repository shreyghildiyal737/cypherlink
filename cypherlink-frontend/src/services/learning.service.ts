import { api } from './api';

export interface CreateLearningSessionData {
  title: string;
  description?: string;
  topic: string;
  level?: string;
  city: string;
  venue?: string;
  approximateLocation?: string;
  safetyTags?: string[];
  capacity?: number;
  startsAt: string;
  endsAt?: string;
}

export async function fetchLearningSessions(city?: string) {
  const r = await api.get('/sessions/learning', { params: city ? { city } : undefined });
  return r.data;
}

export async function createLearningSession(data: CreateLearningSessionData) {
  const r = await api.post('/sessions/learning', data);
  return r.data;
}
