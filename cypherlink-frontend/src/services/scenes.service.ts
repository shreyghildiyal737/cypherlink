import { api } from './api';

export async function fetchScenes() {
  const r = await api.get('/scenes');
  return r.data;
}

export async function fetchScene(city: string) {
  const r = await api.get(`/scenes/${encodeURIComponent(city)}`);
  return r.data;
}
