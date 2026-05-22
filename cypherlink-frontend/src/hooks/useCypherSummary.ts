import { useQuery } from "@tanstack/react-query";
import { organizerOpsApi } from "../services/organizerOps.service";

export function useCypherSummary(id: string) {
  return useQuery({
    queryKey: ["organizer", "cyphers", id, "summary"],
    queryFn: () => organizerOpsApi.getCypherSummary(id),
    enabled: !!id,
    staleTime: 10000,
    retry: 1,
  });
}

export function useSessionSummary(id: string) {
  return useQuery({
    queryKey: ["organizer", "sessions", id, "summary"],
    queryFn: () => organizerOpsApi.getSessionSummary(id),
    enabled: !!id,
    staleTime: 10000,
    retry: 1,
  });
}
