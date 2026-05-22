import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./services/api";
import {
  mapHomeResponse,
  mapFeedResponse,
  mapMapResponse,
  mapCypher,
  mapProject,
  mapArtist,
  mapClip,
  mapSession,
  mapNotification,
  mapConversation,
  mapMessage,
} from "./services/mappers";
import { artists, projects, cyphers, clips, sessions } from "./data/mock";

// ── Public ──
export function usePublicHome() {
  return useQuery({
    queryKey: ["public", "home"],
    queryFn: async () => {
      try {
        const r = await api.get("/public/home");
        return mapHomeResponse(r.data);
      } catch {
        return {
          cyphers: cyphers.slice(0, 2),
          projects: projects.slice(0, 2),
          artists: artists.slice(0, 4),
          sessions: sessions.slice(0, 2),
        };
      }
    },
    staleTime: 30000,
  });
}

export function usePublicFeed(cursor?: string) {
  return useQuery({
    queryKey: ["public", "feed", cursor],
    queryFn: async () => {
      try {
        const r = await api.get("/public/feed", {
          params: cursor ? { cursor } : {},
        });
        return mapFeedResponse(r.data, cursor);
      } catch {
        return { items: clips, nextCursor: null, hasMore: false };
      }
    },
    staleTime: 15000,
  });
}

export function usePublicMap() {
  return useQuery({
    queryKey: ["public", "map"],
    queryFn: async () => {
      try {
        const r = await api.get("/public/map");
        return mapMapResponse(r.data);
      } catch {
        return { cyphers, sessions };
      }
    },
    staleTime: 30000,
  });
}

// ── Projects (GET /api/projects is @Public()) ──
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const r = await api.get("/projects");
      return (r.data ?? []).map(mapProject);
    },
    staleTime: 30000,
    retry: 1,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const r = await api.get(`/public/projects/${id}`);
      return mapProject(r.data);
    },
    enabled: !!id,
    staleTime: 30000,
    retry: 1,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => (await api.post("/projects", d)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// ── Cyphers (GET /api/cyphers is @Public()) ──
export function useCyphers() {
  return useQuery({
    queryKey: ["cyphers"],
    queryFn: async () => {
      const r = await api.get("/cyphers");
      return (r.data ?? []).map(mapCypher);
    },
    staleTime: 30000,
    retry: 1,
  });
}

export function useCypher(id: string) {
  return useQuery({
    queryKey: ["cyphers", id],
    queryFn: async () => {
      const r = await api.get(`/public/cyphers/${id}`);
      return mapCypher(r.data);
    },
    enabled: !!id,
    staleTime: 30000,
    retry: 1,
  });
}

export function useCreateCypher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => (await api.post("/cyphers", d)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cyphers"] });
    },
  });
}

export function useRSVPCypher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) =>
      (await api.post(`/cyphers/${id}/rsvp`)).data,
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["cyphers", id] });
    },
  });
}

// ── Profiles ──
export function useProfile(id: string) {
  return useQuery({
    queryKey: ["profiles", id],
    queryFn: async () => {
      const r = await api.get(`/public/profiles/${id}`);
      return mapArtist(r.data);
    },
    enabled: !!id,
    staleTime: 30000,
    retry: 1,
  });
}

export function useFollowProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/profiles/${id}/follow`)).data,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["profiles", id] });
    },
  });
}

// ── Search ──
export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      try {
        const r = await api.get("/search", { params: { q } });
        const d = r.data;
        return {
          artists: (d.artists ?? []).map(mapArtist),
          projects: (d.projects ?? []).map(mapProject),
          cyphers: (d.cyphers ?? []).map(mapCypher),
        };
      } catch {
        return {
          artists: artists.filter(
            (a) =>
              a.name.toLowerCase().includes(q.toLowerCase()) ||
              a.handle.toLowerCase().includes(q.toLowerCase()),
          ),
          projects: projects.filter((p) =>
            p.title.toLowerCase().includes(q.toLowerCase()),
          ),
          cyphers: cyphers.filter((c) =>
            c.title.toLowerCase().includes(q.toLowerCase()),
          ),
        };
      }
    },
    enabled: q.length >= 2,
    staleTime: 15000,
  });
}

// ── Feed ──
export function useClips() {
  return useQuery({
    queryKey: ["clips"],
    queryFn: async () => {
      try {
        const r = await api.get("/public/feed");
        return mapFeedResponse(r.data).items;
      } catch {
        return clips;
      }
    },
    staleTime: 30000,
    retry: 1,
  });
}

// ── Notifications ──
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const r = await api.get("/notifications");
      return (r.data ?? []).map(mapNotification);
    },
    staleTime: 10000,
    retry: 1,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.patch(`/notifications/${id}/read`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ── Messages ──
export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const r = await api.get("/messages/conversations");
      return (r.data ?? []).map(mapConversation);
    },
    staleTime: 10000,
    retry: 1,
  });
}

export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const r = await api.get(`/messages/${conversationId}`);
      return {
        items: (r.data.items ?? []).map(mapMessage),
        nextCursor: r.data.nextCursor,
        hasMore: r.data.hasMore,
      };
    },
    enabled: !!conversationId,
    staleTime: 5000,
    retry: 1,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      receiverId,
      message,
      intent,
    }: {
      receiverId: string;
      message: string;
      intent: string;
    }) =>
      (await api.post("/messages/request", { receiverId, intent, message }))
        .data,
    onSuccess: (_, { receiverId }) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ── Sessions (use /api/sessions directly) ──
export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      try {
        const r = await api.get("/sessions");
        return (r.data ?? []).map(mapSession);
      } catch {
        return sessions;
      }
    },
    staleTime: 30000,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) => (await api.post("/sessions", d)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useRSVPSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/sessions/${id}/rsvp`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

// ── QR Check-in ──

// Attendee: fetch your own personal QR token for a cypher you RSVPed to
export function useMyCypherCheckInToken(cypherId: string) {
  return useQuery({
    queryKey: ["checkin-token", "cypher", cypherId],
    queryFn: async () => {
      const r = await api.get(`/cyphers/${cypherId}/my-checkin-token`);
      return r.data as { checkInToken: string; expiresAt: string };
    },
    enabled: !!cypherId,
    staleTime: 0, // always refetch — token may have refreshed
    retry: false,
  });
}

// Attendee: fetch your own personal QR token for a session you RSVPed to
export function useMySessionCheckInToken(sessionId: string) {
  return useQuery({
    queryKey: ["checkin-token", "session", sessionId],
    queryFn: async () => {
      const r = await api.get(`/sessions/${sessionId}/my-checkin-token`);
      return r.data as { checkInToken: string; expiresAt: string };
    },
    enabled: !!sessionId,
    staleTime: 0,
    retry: false,
  });
}

// Legacy userId-based check-in (kept for non-QR flows)
export function useCheckIn() {
  return useMutation({
    mutationFn: async ({
      cypherId,
      userId,
    }: {
      cypherId: string;
      userId: string;
    }) =>
      (await api.post(`/cyphers/${cypherId}/checkin-scan`, { userId })).data,
  });
}

// ── Safety ──
export function useReport() {
  return useMutation({
    mutationFn: async (d: any) => (await api.post("/reports", d)).data,
  });
}

// ── Upload ──
export function useUploadUrl() {
  return useMutation({
    mutationFn: async (d: {
      fileName: string;
      fileType: string;
      purpose: string;
    }) => {
      const r = await api.post("/upload/sign", d);
      return r.data;
    },
  });
}
