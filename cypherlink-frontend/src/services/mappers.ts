import type { Artist, Project, Cypher, Clip, CommunitySession } from "../types";

export function mapArtist(p: any): Artist {
  return {
    id: p.id,
    name: p.displayName ?? p.handle ?? "",
    handle: p.handle ?? "",
    city: p.location ?? "",
    genres: p.genres ?? [],
    verified: !!p.verified,
    momentum: p.momentum ?? "New Voice",
    avatar: (p.displayName ?? p.handle ?? " ")[0] ?? " ",
  };
}
export function mapProject(p: any): Project {
  return {
    id: p.id,
    title: p.title ?? "",
    status: mapStatus(p.status),
    city: p.city ?? "",
    tags: p.tags ?? [],
    openRoles: p.openRoles ?? [],
    members: ((p.members ?? p.creator) ? [mapArtist(p.creator)] : []).map(
      mapArtist,
    ),
    visibility: p.visibility ?? "discoverable",
  };
}
function mapStatus(s: string | undefined): Project["status"] {
  const m: Record<string, Project["status"]> = {
    COOKING: "Cooking",
    LOOKING_FOR_COLLABORATORS: "Looking for collaborators",
    RECORDING: "Recording",
    MIXING: "Mixing",
    FINISHED: "Finished",
    ARCHIVED: "Finished",
  };
  return m[s ?? ""] ?? "Cooking";
}
export function mapCypher(c: any): Cypher {
  return {
    id: c.id,
    title: c.title ?? "",
    type: c.type === "VENUE" ? "venue" : "open",
    state: mapState(c.state),
    city: c.city ?? "",
    venue: c.venue ?? "",
    startsAt: c.startsAt ?? "",
    pullingUp: c.pullingUp ?? 0,
    quota: c.quota ?? undefined,
    spotsLeft: c.spotsLeft ?? undefined,
    safetyTags: c.safetyTags ?? [],
    highlights: c.highlights ?? [],
  };
}
function mapState(s: string | undefined): Cypher["state"] {
  const m: Record<string, Cypher["state"]> = {
    UPCOMING: "upcoming",
    ACTIVE: "active",
    AFTERGLOW: "afterglow",
    ARCHIVED: "archived",
    CANCELLED: "archived",
  };
  return m[s ?? ""] ?? "upcoming";
}
export function mapClip(c: any, creator?: any): Clip {
  return {
    id: c.id,
    creator: creator
      ? mapArtist(creator)
      : { id: "", name: "", handle: "", city: "", genres: [], avatar: "" },
    projectTitle: c.projectTitle ?? "",
    city: c.city ?? "",
    reason: c.reason ?? "",
    caption: c.caption ?? "",
    likes: c.likes ?? 0,
    comments: c.comments ?? 0,
  };
}
export function mapSession(s: any): CommunitySession {
  return {
    id: s.id,
    title: s.title ?? "",
    city: s.city ?? "",
    type: mapSessionType(s.type),
    state: mapState(s.state),
    pullingUp: s.pullingUp ?? 0,
  };
}
function mapSessionType(t: string | undefined): CommunitySession["type"] {
  const m: Record<string, CommunitySession["type"]> = {
    CLEANUP: "cleanup",
    TEACHING: "teaching",
    RELIEF: "relief",
    ARTIST_SUPPORT: "artist-support",
  };
  return m[t ?? ""] ?? "cleanup";
}
export function mapHomeResponse(d: any) {
  return {
    cyphers: (d.activeCyphers ?? []).map(mapCypher),
    projects: (d.openProjects ?? []).map(mapProject),
    artists: (d.featuredArtists ?? d.activeArtists ?? []).map(mapArtist),
    sessions: (d.upcomingSessions ?? []).map(mapSession),
  };
}
export function mapFeedResponse(d: any, cursor?: string) {
  return {
    items: (d.items ?? d ?? []).map((i: any) => mapClip(i, i.creator)),
    nextCursor: d.nextCursor ?? null,
    hasMore: d.hasMore ?? false,
  };
}
export function mapMapResponse(d: any) {
  return {
    cyphers: (d.cyphers ?? []).map(mapCypher),
    sessions: (d.sessions ?? []).map(mapSession),
  };
}
export function mapNotification(n: any) {
  return {
    id: n.id,
    type: n.type,
    message: n.message ?? "",
    read: n.read ?? false,
    createdAt: n.createdAt ?? new Date().toISOString(),
    data: n.data ?? null,
  };
}
export function mapConversation(c: any) {
  return {
    id: c.id,
    participant: mapArtist(c.participant ?? c.otherUser ?? {}),
    lastMessage: c.lastMessage ?? null,
    unread: c.unread ?? 0,
    updatedAt: c.updatedAt ?? new Date().toISOString(),
    intent: c.intent ?? null,
  };
}
export function mapMessage(m: any) {
  return {
    id: m.id,
    senderId: m.senderId ?? m.sender?.id ?? "",
    sender: mapArtist(m.sender ?? {}),
    content: m.content ?? "",
    createdAt: m.createdAt ?? new Date().toISOString(),
    intent: m.intent ?? null,
    readAt: m.readAt ?? null,
  };
}
