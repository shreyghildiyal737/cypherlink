import { useQuery } from '@tanstack/react-query';
import { fetchCommunitySessions, fetchCommunitySession } from '../services/community.service';

export function useCommunity() {
  return useQuery({
    queryKey: ['community-sessions'],
    queryFn: fetchCommunitySessions,
    staleTime: 60_000,
  });
}

export function useCommunitySession(id: string) {
  return useQuery({
    queryKey: ['community-session', id],
    queryFn: () => fetchCommunitySession(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}
