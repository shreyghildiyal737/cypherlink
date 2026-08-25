import { api } from './api';

export interface ArtistQuery {
  q?: string;
  city?: string;
  genre?: string;
  language?: string;
  role?: string;
  verified?: boolean;
  openToCollab?: boolean;
  beginnerFriendly?: boolean;
  momentum?: string;
  localRemote?: string;
  availability?: string;
  lookingFor?: string;
  sort?: 'rising' | 'recent' | 'trusted';
  cursor?: string;
  limit?: number;
}

export async function fetchArtists(query: ArtistQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== ''),
  );
  const r = await api.get('/artists', { params });
  return r.data;
}

export async function fetchArtist(id: string) {
  const r = await api.get(`/artists/${id}`);
  return r.data;
}
