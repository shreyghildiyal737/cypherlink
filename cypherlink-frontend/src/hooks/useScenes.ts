import { useQuery } from '@tanstack/react-query';
import { fetchScenes, fetchScene } from '../services/scenes.service';

export function useScenes() {
  return useQuery({
    queryKey: ['scenes'],
    queryFn: fetchScenes,
    staleTime: 5 * 60_000,
  });
}

export function useScene(city: string) {
  return useQuery({
    queryKey: ['scene', city],
    queryFn: () => fetchScene(city),
    enabled: !!city,
    staleTime: 2 * 60_000,
  });
}
