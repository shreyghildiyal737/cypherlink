import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminOpsApi } from "../services/adminOps.service";
import { reportQueue } from "../data/opsMock";

export function useReports(params?: {
  page?: string;
  cursor?: string;
  status?: string;
  targetType?: string;
}) {
  return useQuery({
    queryKey: ["admin", "reports", params],
    queryFn: () => adminOpsApi.getReports(params),
    staleTime: 10000,
    retry: 1,
  });
}

export function useReportsWithFallback(params?: {
  page?: string;
  cursor?: string;
  status?: string;
  targetType?: string;
}) {
  const q = useReports(params);
  const fallback = { items: reportQueue, nextCursor: null, hasMore: false };
  return { ...q, data: q.data || fallback };
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status: string;
      action?: string;
      internalNote?: string;
    }) => adminOpsApi.updateReport(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      qc.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
    },
  });
}
