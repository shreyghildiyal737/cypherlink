import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./services/api";
import {
  mapHomeResponse,
  mapFeedResponse,
  mapMapResponse,
  mapCypher,
  mapProject,
  mapArtist,
  mapProfile,
  mapClip,
  mapSession,
  mapNotification,
  mapConversation,
  mapMessage,
} from "./services/mappers";
import { artists, projects, cyphers, clips, sessions } from "./data/mock";
import { useAuthStore } from "./store/authStore";
import type { Clip, RoleApplication, ProjectMilestone, ProjectDeliverable, ProjectMessage, CollaborationMemory, TopCollaborator, ContinuationSuggestion, Collective } from "./types";

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
        return { cities: [], cyphers, sessions };
      }
    },
    staleTime: 30000,
  });
}

// ── Projects (GET /api/projects is @Public()) ──
export interface ProjectFilters {
  city?: string;
  openRole?: string;
  tag?: string;
  projectType?: string;
  commitmentStyle?: string;
  localRemote?: string;
}

export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: ["projects", filters ?? {}],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters ?? {}).filter(([, v]) => v !== undefined && v !== ""),
      );
      const r = await api.get("/projects", { params });
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
      // /projects/:id is marked @Public() but returns richer data (files, members)
      // when called with a token. Falls back to /public/projects/:id on failure.
      try {
        const r = await api.get(`/projects/${id}`);
        return mapProject(r.data);
      } catch {
        const r = await api.get(`/public/projects/${id}`);
        return mapProject(r.data);
      }
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
      return mapProfile(r.data);
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
      // API returns { items, nextCursor, hasMore } or a plain array
      const items: unknown[] = r.data?.items ?? (Array.isArray(r.data) ? r.data : []);
      return items.map(mapNotification);
    },
    staleTime: 10000,
    retry: 1,
  });
}

export function useUnreadNotificationCount() {
  const { data } = useNotifications();
  return (data ?? []).filter((n) => !n.read).length;
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

export function useSendToConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) =>
      (await api.post(`/messages/${conversationId}`, { body })).data,
    onMutate: async ({ conversationId, body }) => {
      // Optimistic append on the sender side. We snapshot the current cache
      // so onError can roll back if the POST fails.
      const key = ["messages", conversationId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<any>(key);
      const senderId = useAuthStore.getState().user?.id ?? "";
      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      if (previous) {
        qc.setQueryData(key, {
          ...previous,
          items: [
            ...previous.items,
            {
              id: tempId,
              senderId,
              sender: {},
              content: body,
              createdAt: new Date().toISOString(),
              intent: null,
              readAt: null,
              optimistic: true,
            },
          ],
        });
      }
      return { previous, tempId, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous && ctx.key) {
        qc.setQueryData(ctx.key, ctx.previous);
      }
    },
    onSuccess: (data, { conversationId }, ctx) => {
      // Replace the optimistic stub with the server-confirmed message.
      const key = ["messages", conversationId];
      const current = qc.getQueryData<any>(key);
      if (!current || !data?.id) {
        qc.invalidateQueries({ queryKey: key });
        return;
      }
      // Drop any optimistic placeholder, dedup by id.
      const items = current.items.filter(
        (m: any) => m.id !== ctx?.tempId && m.id !== data.id,
      );
      qc.setQueryData(key, {
        ...current,
        items: [
          ...items,
          {
            id: data.id,
            senderId: data.senderId,
            sender: {},
            content: data.body ?? data.content ?? "",
            createdAt: data.createdAt,
            intent: data.intent ?? null,
            readAt: null,
          },
        ],
      });
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

// Organizer: scan attendee QR token to check them in (cypher)
export function useScanCypherCheckIn() {
  return useMutation({
    mutationFn: async ({
      cypherId,
      token,
    }: {
      cypherId: string;
      token: string;
    }) =>
      (await api.post(`/cyphers/${cypherId}/checkin-scan`, { token })).data,
  });
}

// Organizer: scan attendee QR token to check them in (community session)
export function useScanSessionCheckIn() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      token,
    }: {
      sessionId: string;
      token: string;
    }) =>
      (await api.post(`/sessions/${sessionId}/checkin-scan`, { token })).data,
  });
}

// ── Safety ──
export function useReport() {
  return useMutation({
    mutationFn: async (d: any) => (await api.post("/reports", d)).data,
  });
}

export function useBlockUser() {
  return useMutation({
    mutationFn: async (userId: string) =>
      (await api.post(`/blocks/${userId}`)).data,
  });
}

export function useMuteUser() {
  return useMutation({
    mutationFn: async (userId: string) =>
      (await api.post(`/mute/${userId}`)).data,
  });
}

// ── Message Requests ──
export function useMessageRequests() {
  return useQuery({
    queryKey: ["message-requests"],
    queryFn: async () => {
      const r = await api.get("/messages/requests");
      return r.data ?? [];
    },
    staleTime: 10000,
    retry: 1,
  });
}

export function useAcceptMessageRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) =>
      (await api.post(`/messages/requests/${requestId}/accept`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message-requests"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useDeclineMessageRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) =>
      (await api.post(`/messages/requests/${requestId}/decline`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message-requests"] });
    },
  });
}

// ── Clips ──
export function useCreateClip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: {
      city: string;
      reason: string;
      caption?: string;
      projectTitle?: string;
      mediaUrl?: string;
    }) => (await api.post("/clips", d)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clips"] });
    },
  });
}

// ── Profile updates ──
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: {
      displayName?: string;
      bio?: string;
      city?: string;
      genres?: string[];
      avatarUrl?: string;
      handle?: string;
      primaryRole?: string;
      secondaryRoles?: string[];
      openToCollab?: boolean;
      beginnerFriendly?: boolean;
      languages?: string[];
      locationVisibility?: string;
      availabilityStatus?: string;
      collaborationCapacity?: number | null;
      lookingFor?: string[];
      localRemotePreference?: string;
      collaborationIntent?: string;
    }) => (await api.patch("/profiles/me", d)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

// ── Project role occupancy ──
export function useUpdateFilledRoles(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (filledRoles: string[]) =>
      (await api.patch(`/projects/${projectId}/filled-roles`, { filledRoles })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}

// ── Scene follow ──
export function useMyScenes() {
  return useQuery({
    queryKey: ["my-scenes"],
    queryFn: async () => {
      const r = await api.get("/profiles/me/scenes");
      return (r.data?.scenes ?? []) as string[];
    },
    staleTime: 30000,
    retry: false,
  });
}

export function useFollowScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (city: string) =>
      (await api.post(`/profiles/me/scenes/${encodeURIComponent(city)}/follow`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-scenes"] });
    },
  });
}

export function useUnfollowScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (city: string) =>
      (await api.delete(`/profiles/me/scenes/${encodeURIComponent(city)}/follow`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-scenes"] });
    },
  });
}

// ── Clip detail ──
export function useClip(id: string) {
  return useQuery({
    queryKey: ["clips", id],
    queryFn: async () => {
      const r = await api.get(`/public/clips/${id}`);
      return mapClip(r.data, r.data.creator);
    },
    enabled: !!id,
    staleTime: 30000,
    retry: 1,
  });
}

// Related clips — surfaces other clips in the same city / by the same creator.
// No dedicated backend endpoint yet; we lean on the public feed and filter client-side.
export function useRelatedClips(currentId: string, city?: string, creatorId?: string) {
  return useQuery({
    queryKey: ["clips", "related", currentId, city, creatorId],
    queryFn: async () => {
      try {
        const r = await api.get("/public/feed");
        const items: Clip[] = mapFeedResponse(r.data).items;
        const filtered = items.filter((c: Clip) => c.id !== currentId);
        const sameCreator: Clip[] = creatorId
          ? filtered.filter((c: Clip) => c.creator.id === creatorId)
          : [];
        const sameCity: Clip[] = city
          ? filtered.filter(
              (c: Clip) =>
                c.city?.toLowerCase() === city.toLowerCase() &&
                !sameCreator.includes(c),
            )
          : [];
        // Up to 6, creator first, then city, then anything else.
        const rest = filtered.filter(
          (c: Clip) => !sameCreator.includes(c) && !sameCity.includes(c),
        );
        return [...sameCreator, ...sameCity, ...rest].slice(0, 6);
      } catch {
        return [] as Clip[];
      }
    },
    enabled: !!currentId,
    staleTime: 30000,
  });
}

// ── Organizer: cypher assets for highlight selection ──
export function useOrganizerCypherAssets(cypherId: string) {
  return useQuery({
    queryKey: ["organizer", "cypher-assets", cypherId],
    queryFn: async () => {
      const r = await api.get(`/organizer/cyphers/${cypherId}/assets`);
      return (r.data.data ?? []) as Array<{
        id: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        publicUrl: string | null;
        isHighlight: boolean;
        expiresAt: string | null;
        uploaderName: string;
        uploaderHandle: string;
        createdAt: string;
      }>;
    },
    enabled: !!cypherId,
    staleTime: 15000,
    retry: false,
  });
}

export function useAddHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cypherId, assetId, title }: { cypherId: string; assetId: string; title: string }) =>
      (await api.post(`/organizer/cyphers/${cypherId}/highlights`, { assetId, title })).data,
    onSuccess: (_, { cypherId }) => {
      qc.invalidateQueries({ queryKey: ["organizer", "cypher-assets", cypherId] });
      qc.invalidateQueries({ queryKey: ["cyphers", cypherId] });
    },
  });
}

export function useRemoveHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cypherId, highlightId }: { cypherId: string; highlightId: string }) =>
      (await api.delete(`/organizer/cyphers/${cypherId}/highlights/${highlightId}`)).data,
    onSuccess: (_, { cypherId }) => {
      qc.invalidateQueries({ queryKey: ["organizer", "cypher-assets", cypherId] });
      qc.invalidateQueries({ queryKey: ["cyphers", cypherId] });
    },
  });
}

// Clips linked to a cypher (afterglow memory trail)
export function useCypherClips(cypherId: string) {
  return useQuery({
    queryKey: ["cyphers", cypherId, "clips"],
    queryFn: async () => {
      const r = await api.get(`/clips/by-cypher/${cypherId}`);
      return (r.data ?? []).map((c: any) => mapClip(c, c.creator));
    },
    enabled: !!cypherId,
    staleTime: 30000,
    retry: 1,
  });
}

// Clips associated with a project
export function useProjectClips(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "clips"],
    queryFn: async () => {
      const r = await api.get(`/clips/by-project/${projectId}`);
      return (r.data ?? []).map((c: any) => mapClip(c, c.creator));
    },
    enabled: !!projectId,
    staleTime: 30000,
    retry: 1,
  });
}

export function useRemoveProjectFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, fileId }: { projectId: string; fileId: string }) =>
      (await api.delete(`/projects/${projectId}/files/${fileId}`)).data,
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}

// ── Upload ──
export function useUploadUrl() {
  return useMutation({
    mutationFn: async (d: {
      folder: string;
      contentType: string;
      fileName?: string;
      contentLength?: number;
    }) => {
      const r = await api.post("/upload/sign", d);
      return r.data as {
        uploadUrl: string;
        fileKey: string;
        publicUrl: string;
        maxSize: number;
      };
    },
  });
}

// ── Project files ──
export function useConfirmProjectFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      fileKey,
      fileName,
      fileSize,
      mimeType,
      publicUrl,
    }: {
      projectId: string;
      fileKey: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      publicUrl?: string;
    }) =>
      (
        await api.post(`/projects/${projectId}/files/confirm`, {
          fileKey,
          fileName,
          fileSize,
          mimeType,
          publicUrl,
        })
      ).data,
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}

// ── Phase 2: Role Applications ────────────────────────────────────────────────

export function useApplyForRole(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: { role: string; message?: string }) =>
      (await api.post(`/projects/${projectId}/apply`, d)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useProjectApplications(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "applications"],
    queryFn: async () => {
      const r = await api.get(`/projects/${projectId}/applications`);
      return r.data as RoleApplication[];
    },
    enabled: !!projectId,
    staleTime: 15000,
  });
}

export function useRespondToApplication(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) =>
      (await api.patch(`/projects/${projectId}/applications/${appId}`, { status })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "applications"] });
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}

// ── Phase 2: Milestones ───────────────────────────────────────────────────────

export function useProjectMilestones(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "milestones"],
    queryFn: async () => {
      const r = await api.get(`/projects/${projectId}/milestones`);
      return r.data as ProjectMilestone[];
    },
    enabled: !!projectId,
    staleTime: 15000,
  });
}

export function useCreateMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) =>
      (await api.post(`/projects/${projectId}/milestones`, d)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId, "milestones"] }),
  });
}

export function useUpdateMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ milestoneId, ...data }: { milestoneId: string; [key: string]: any }) =>
      (await api.patch(`/projects/${projectId}/milestones/${milestoneId}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId, "milestones"] }),
  });
}

export function useDeleteMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (milestoneId: string) =>
      (await api.delete(`/projects/${projectId}/milestones/${milestoneId}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId, "milestones"] }),
  });
}

// ── Phase 2: Deliverables ─────────────────────────────────────────────────────

export function useProjectDeliverables(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "deliverables"],
    queryFn: async () => {
      const r = await api.get(`/projects/${projectId}/deliverables`);
      return r.data as ProjectDeliverable[];
    },
    enabled: !!projectId,
    staleTime: 15000,
  });
}

export function useSubmitDeliverable(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: any) =>
      (await api.post(`/projects/${projectId}/deliverables`, d)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "deliverables"] });
      qc.invalidateQueries({ queryKey: ["projects", projectId, "milestones"] });
    },
  });
}

// ── Phase 2: Revisions ────────────────────────────────────────────────────────

export function useRequestRevision(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: { note: string; milestoneId?: string; deliverableId?: string }) =>
      (await api.post(`/projects/${projectId}/revisions`, d)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "milestones"] });
      qc.invalidateQueries({ queryKey: ["projects", projectId, "deliverables"] });
    },
  });
}

export function useResolveRevision(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (revisionId: string) =>
      (await api.patch(`/projects/${projectId}/revisions/${revisionId}/resolve`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId, "milestones"] }),
  });
}

// ── Phase 2: Project Messages ─────────────────────────────────────────────────

export function useProjectMessages(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "messages"],
    queryFn: async () => {
      const r = await api.get(`/projects/${projectId}/messages`);
      return r.data as ProjectMessage[];
    },
    enabled: !!projectId,
    staleTime: 5000,
    refetchInterval: 15000,
  });
}

export function usePostProjectMessage(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: { body: string; linkedMilestoneId?: string; linkedDeliverableId?: string }) =>
      (await api.post(`/projects/${projectId}/messages`, d)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId, "messages"] }),
  });
}

// ── Phase 2: Type Transition ──────────────────────────────────────────────────

export function useTransitionProjectType(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: { projectType: string; note?: string }) =>
      (await api.patch(`/projects/${projectId}/type`, d)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

// ── Phase 2: Member Management ────────────────────────────────────────────────

export function useLeaveProject(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post(`/projects/${projectId}/leave`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetUserId, note }: { targetUserId: string; note?: string }) =>
      (await api.patch(`/projects/${projectId}/members/${targetUserId}/remove`, { note })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

// ── Phase 3: Discovery ────────────────────────────────────────────────────────

export interface ArtistDiscoveryFilters {
  city?: string;
  genre?: string;
  role?: string;
  language?: string;
  openToCollab?: boolean;
  beginnerFriendly?: boolean;
  localRemote?: string;
  availability?: string;
  limit?: number;
}

export interface ProjectDiscoveryFilters {
  city?: string;
  openRole?: string;
  tag?: string;
  projectType?: string;
  commitmentStyle?: string;
  localRemote?: string;
  limit?: number;
}

function toDiscoveryParams(filters: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "" && v !== false),
  );
}

export function useDiscoverArtists(filters: ArtistDiscoveryFilters = {}) {
  return useQuery({
    queryKey: ["discovery", "artists", filters],
    queryFn: async () => {
      const r = await api.get("/discovery/artists", { params: toDiscoveryParams(filters as any) });
      return r.data as { items: any[]; total: number };
    },
    staleTime: 60000,
    retry: 1,
  });
}

export function useDiscoverProjects(filters: ProjectDiscoveryFilters = {}) {
  return useQuery({
    queryKey: ["discovery", "projects", filters],
    queryFn: async () => {
      const r = await api.get("/discovery/projects", { params: toDiscoveryParams(filters as any) });
      return r.data as { items: any[]; total: number };
    },
    staleTime: 60000,
    retry: 1,
  });
}

export function useDiscoverOpenCollabs(filters: ProjectDiscoveryFilters = {}) {
  return useQuery({
    queryKey: ["discovery", "open-collabs", filters],
    queryFn: async () => {
      const r = await api.get("/discovery/open-collabs", { params: toDiscoveryParams(filters as any) });
      return r.data as { items: any[]; total: number };
    },
    staleTime: 60000,
    retry: 1,
  });
}

export function useSoftTrustSignals(userId: string) {
  return useQuery({
    queryKey: ["discovery", "trust-signals", userId],
    queryFn: async () => {
      const r = await api.get(`/discovery/trust-signals/${userId}`);
      return r.data as string[];
    },
    enabled: !!userId,
    staleTime: 300000,
  });
}

// ── Phase 4: Cypher Trust + Continuity ───────────────────────────────────────

export function useCypherContinuation(cypherId: string) {
  return useQuery({
    queryKey: ["cyphers", cypherId, "continuation"],
    queryFn: async () => {
      const r = await api.get(`/cyphers/${cypherId}/continuation`);
      return r.data as {
        cypherId: string;
        checkInsCount: number;
        highlightsCount: number;
        clipsCount: number;
        bornProjects: Array<{ id: string; title: string; status: string; openRoles: string[]; visibility: string; owner: { displayName: string; profile?: { handle?: string } | null } }>;
        intentCount: number;
        intentSnippets: Array<{ name: string; intent: string | null }>;
      };
    },
    enabled: !!cypherId,
    staleTime: 60000,
    retry: false,
  });
}

export function useCypherParticipants(cypherId: string) {
  return useQuery({
    queryKey: ["cyphers", cypherId, "participants"],
    queryFn: async () => {
      const r = await api.get(`/cyphers/${cypherId}/participants`);
      return r.data as Array<{
        id: string;
        displayName: string;
        handle: string | null;
        city?: string | null;
        intentNote: string | null;
        checkedInAt: string;
        isAnonymous: boolean;
      }>;
    },
    enabled: !!cypherId,
    staleTime: 60000,
    retry: false,
  });
}

export function useCreateProjectFromCypher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cypherId, ...dto }: { cypherId: string; title: string; description?: string; openRoles?: string[]; tags?: string[] }) =>
      (await api.post(`/cyphers/${cypherId}/create-project`, dto)).data as { id: string; title: string; bornFromCypherId: string },
    onSuccess: (_, { cypherId }) => {
      qc.invalidateQueries({ queryKey: ["cyphers", cypherId, "continuation"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useSetRsvpIntent(cypherId: string) {
  return useMutation({
    mutationFn: async (dto: { intentNote?: string; aliasName?: string }) =>
      (await api.patch(`/cyphers/${cypherId}/rsvp-intent`, dto)).data,
  });
}

export function useRemoveCypherAttendee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cypherId, userId }: { cypherId: string; userId: string }) =>
      (await api.delete(`/cyphers/${cypherId}/attendees/${userId}`)).data,
    onSuccess: (_, { cypherId }) => {
      qc.invalidateQueries({ queryKey: ["cyphers", cypherId, "participants"] });
    },
  });
}

export function useOrganizerTrustSignals(userId: string) {
  return useQuery({
    queryKey: ["discovery", "organizer-signals", userId],
    queryFn: async () => {
      const r = await api.get(`/discovery/organizer-signals/${userId}`);
      return r.data as string[];
    },
    enabled: !!userId,
    staleTime: 300000,
    retry: false,
  });
}

// ── Phase 5: Lifecycle + Memory + Ecosystem Continuity ────────────────────────

export function useCollaborationMemory(targetUserId: string) {
  return useQuery({
    queryKey: ["discovery", "collab-memory", targetUserId],
    queryFn: async () => {
      const r = await api.get(`/discovery/collab-memory/${targetUserId}`);
      return r.data as CollaborationMemory;
    },
    enabled: !!targetUserId,
    staleTime: 300000,
    retry: false,
  });
}

export function useMyTopCollaborators(enabled = true) {
  return useQuery({
    queryKey: ["discovery", "my-collaborators"],
    queryFn: async () => {
      const r = await api.get("/discovery/my-collaborators");
      return r.data as TopCollaborator[];
    },
    enabled,
    staleTime: 120000,
    retry: false,
  });
}

export function useContinuationSuggestions(enabled = true) {
  return useQuery({
    queryKey: ["discovery", "continuation-suggestions"],
    queryFn: async () => {
      const r = await api.get("/discovery/continuation-suggestions");
      return r.data as ContinuationSuggestion[];
    },
    enabled,
    staleTime: 300000,
    retry: false,
  });
}

export function useHideCollabMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetUserId: string) =>
      (await api.post(`/discovery/collab-memory/${targetUserId}/hide`)).data,
    onSuccess: (_, targetUserId) => {
      qc.invalidateQueries({ queryKey: ["discovery", "collab-memory", targetUserId] });
      qc.invalidateQueries({ queryKey: ["discovery", "my-collaborators"] });
    },
  });
}

export function useCollectives(city?: string) {
  return useQuery({
    queryKey: ["collectives", { city: city ?? "" }],
    queryFn: async () => {
      const params: any = {};
      if (city) params.city = city;
      const r = await api.get("/collectives", { params });
      return r.data as Collective[];
    },
    staleTime: 60000,
  });
}

export function useCollective(id: string) {
  return useQuery({
    queryKey: ["collectives", id],
    queryFn: async () => {
      const r = await api.get(`/collectives/${id}`);
      return r.data as Collective;
    },
    enabled: !!id,
    staleTime: 60000,
  });
}

export function useMyCollectives() {
  return useQuery({
    queryKey: ["collectives", "me"],
    queryFn: async () => {
      const r = await api.get("/collectives/me/list");
      return r.data as Collective[];
    },
    staleTime: 60000,
    retry: false,
  });
}

export function useCreateCollective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name: string; handle?: string; description?: string; city?: string; bornFromCypherId?: string }) =>
      (await api.post("/collectives", dto)).data as Collective,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collectives"] });
    },
  });
}

export function useJoinCollective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/collectives/${id}/join`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collectives"] });
    },
  });
}

export function useLeaveCollective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/collectives/${id}/leave`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collectives"] });
    },
  });
}

// ── Phase 6: Ecosystem Health + Anti-Abuse ────────────────────────────────────

export function useDiscoverQuickOpportunities(filters: { city?: string; openRole?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ["discovery", "quick-opportunities", filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ""));
      const r = await api.get("/discovery/quick-opportunities", { params });
      return r.data as { items: any[]; total: number };
    },
    staleTime: 60000,
    retry: 1,
  });
}
