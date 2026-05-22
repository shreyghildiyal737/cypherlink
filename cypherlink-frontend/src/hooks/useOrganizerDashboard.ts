import { useQuery } from "@tanstack/react-query";
import { organizerOpsApi } from "../services/organizerOps.service";
import { organizerStats, organizerTimeline } from "../data/opsMock";

export function useOrganizerDashboard() {
  return useQuery({
    queryKey: ["organizer", "dashboard"],
    queryFn: async () => {
      const data = await organizerOpsApi.getDashboard();
      return data;
    },
    staleTime: 15000,
    retry: 1,
  });
}

export function useOrganizerDashboardWithFallback() {
  const q = useOrganizerDashboard();
  const fallback = {
    stats: organizerStats,
    activeCyphers: [],
    activeCommunitySessions: [],
    timeline: organizerTimeline,
  };
  return { ...q, data: q.data || fallback };
}
