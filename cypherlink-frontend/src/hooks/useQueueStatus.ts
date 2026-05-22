import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { developerOpsApi } from "../services/developerOps.service";
import { jobTimeline } from "../data/opsMock";

export function useQueues() {
  return useQuery({
    queryKey: ["dev", "queues"],
    queryFn: () => developerOpsApi.getQueues(),
    staleTime: 15000,
    retry: 1,
  });
}

export function useJobs() {
  return useQuery({
    queryKey: ["dev", "jobs"],
    queryFn: () => developerOpsApi.getJobs(),
    staleTime: 30000,
    retry: 1,
  });
}

export function useJobsWithFallback() {
  const q = useJobs();
  return { ...q, data: q.data || jobTimeline };
}

export function useUploadErrors() {
  return useQuery({
    queryKey: ["dev", "uploads", "errors"],
    queryFn: () => developerOpsApi.getUploadErrors(),
    staleTime: 30000,
    retry: 1,
  });
}

export function useRetryFailedJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (queueName: string) =>
      developerOpsApi.retryFailedJobs(queueName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dev", "queues"] });
      qc.invalidateQueries({ queryKey: ["dev", "jobs"] });
    },
  });
}
