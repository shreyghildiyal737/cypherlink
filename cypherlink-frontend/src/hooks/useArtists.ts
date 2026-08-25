import { useQuery } from '@tanstack/react-query';
import { fetchArtists, fetchArtist, ArtistQuery } from '../services/artists.service';

export function useArtists(query: ArtistQuery = {}) {
  return useQuery({
    queryKey: ['artists', query],
    queryFn: () => fetchArtists(query),
    staleTime: 60_000,
  });
}

export function useArtist(id: string) {
  return useQuery({
    queryKey: ['artist', id],
    queryFn: () => fetchArtist(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}
