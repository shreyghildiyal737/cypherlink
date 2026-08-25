import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { developerOpsApi } from "../services/developerOps.service";
import { devHealth, jobTimeline } from "../data/opsMock";

export function useHealth() {
  return useQuery({
    queryKey: ["dev", "health"],
    queryFn: () => developerOpsApi.getHealth(),
    staleTime: 15000,
    retry: 1,
  });
}

export function useHealthWithFallback() {
  const q = useHealth();
  return {
    ...q,
    data: q.data || {
      api: { status: 'healthy', uptimeSeconds: 0, p95Ms: 82 },
      database: { status: 'healthy' },
      redis: { status: 'connected' },
      websocket: { status: 'unknown' },
      uploads: { status: 'unavailable', warningCount: 3 },
    },
  };
}
