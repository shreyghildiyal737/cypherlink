import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminOpsApi } from "../services/adminOps.service";
import { verificationRequests } from "../data/opsMock";

export function useVerificationRequests() {
  return useQuery({
    queryKey: ["admin", "verification-requests"],
    queryFn: () => adminOpsApi.getVerificationRequests(),
    staleTime: 10000,
    retry: 1,
  });
}

export function useVerificationRequestsWithFallback() {
  const q = useVerificationRequests();
  return { ...q, data: q.data || verificationRequests };
}

export function useUpdateVerificationRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status: string;
      internalNote?: string;
    }) => adminOpsApi.updateVerificationRequest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "verification-requests"] });
    },
  });
}

export function useOrganizerRequests() {
  return useQuery({
    queryKey: ["admin", "organizer-requests"],
    queryFn: () => adminOpsApi.getOrganizerRequests(),
    staleTime: 10000,
    retry: 1,
  });
}

export function useUpdateOrganizerRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status: string;
      internalNote?: string;
    }) => adminOpsApi.updateOrganizerRequest(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "organizer-requests"] });
    },
  });
}
