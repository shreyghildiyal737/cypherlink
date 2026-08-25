import { useQuery } from '@tanstack/react-query';
import { fetchLearningSessions } from '../services/learning.service';

export function useLearningSessions(city?: string) {
  return useQuery({
    queryKey: ['learning-sessions', city],
    queryFn: () => fetchLearningSessions(city),
    staleTime: 2 * 60_000,
  });
}
