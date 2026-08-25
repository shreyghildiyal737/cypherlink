import type { Artist, Project, Cypher, Clip, CommunitySession, SceneCity, ProjectMemberInfo } from "../types";

export function mapArtist(p: any): Artist {
  return {
    id: p.id,
    name: p.displayName ?? p.handle ?? "",
    handle: p.handle ?? "",
    city: p.city ?? p.location ?? "",
    genres: p.genres ?? [],
    verified: !!(p.isVerified ?? p.verified),
    momentum: p.momentum ?? "New Voice",
    avatar: (p.displayName ?? p.handle ?? " ")[0] ?? " ",
  };
}

export function mapProfile(p: any) {
  return {
    ...mapArtist(p),
    bio: p.bio ?? null,
    followers: p.followers ?? 0,
    following: p.following ?? 0,
    projects: (p.projects ?? []).map(mapProject),
    organizerSummary: p.organizerSummary ?? null,
    avatarUrl: p.avatarUrl ?? null,
    coverUrl: p.coverUrl ?? null,
    primaryRole: p.primaryRole ?? null,
    openToCollab: p.openToCollab ?? false,
    beginnerFriendly: p.beginnerFriendly ?? false,
    trustSignals: (p.trustSignals ?? []) as string[],
    languages: (p.languages ?? []) as string[],
    socialLinks: p.socialLinks ?? null,
    followedScenes: (p.followedScenes ?? []) as string[],
    softLabels: (p.softLabels ?? []) as string[],
    cyphersAttended: p.cyphersAttended ?? 0,
    communitySessionsJoined: p.communitySessionsJoined ?? 0,
    recentCyphers: (p.recentCyphers ?? []) as Array<{
      id: string; title: string; city: string; state: string; checkedInAt: string;
    }>,
    memoryTrails: (p.memoryTrails ?? []) as Array<{
      kind: string; label: string; href?: string;
    }>,
  };
}

export function mapProject(p: any): Project {
  const members: ProjectMemberInfo[] = Array.isArray(p.members)
    ? p.members.map((m: any) => ({
        id: m.id ?? m.userId,
        userId: m.userId ?? m.id,
        displayName: m.displayName ?? m.user?.displayName ?? "Unknown",
        handle: m.handle ?? m.user?.profile?.handle,
        avatarUrl: m.avatarUrl ?? m.user?.profile?.avatarUrl,
        role: m.role ?? "member",
        creativeRole: m.creativeRole ?? null,
        status: m.status ?? "ACTIVE",
        joinedAt: m.joinedAt ?? null,
        removedAt: m.removedAt ?? null,
      }))
    : p.creator
      ? [{
          id: p.creator.id,
          userId: p.creator.id,
          displayName: p.creator.displayName ?? "",
          role: "owner",
          creativeRole: null,
          status: "ACTIVE" as const,
          joinedAt: p.createdAt ?? new Date().toISOString(),
          removedAt: null,
        }]
      : [];

  return {
    id: p.id,
    title: p.title ?? "",
    status: mapStatus(p.status),
    city: p.city ?? "",
    tags: p.tags ?? [],
    openRoles: p.openRoles ?? [],
    filledRoles: p.filledRoles ?? [],
    members,
    visibility: (p.visibility ?? "discoverable").toLowerCase() as Project["visibility"],
    files: Array.isArray(p.files)
      ? p.files.map((f: any) => ({
          id: f.id,
          fileName: f.fileName,
          fileKey: f.fileKey,
          fileSize: f.fileSize,
          mimeType: f.mimeType,
          publicUrl: f.publicUrl ?? undefined,
          createdAt: f.createdAt,
        }))
      : undefined,
    ownerId: p.ownerId ?? p.owner?.id ?? undefined,
    description: p.description ?? undefined,
    memoryTrail: p.memoryTrail ?? undefined,
    projectType: p.projectType ?? undefined,
    localRemote: p.localRemote ?? undefined,
    roughExpectation: p.roughExpectation ?? null,
    commitmentStyle: p.commitmentStyle ?? null,
    expiresAt: p.expiresAt ?? null,
    milestones: p.milestones ?? [],
    typeTransitionLog: p.typeTransitionLog ?? [],
    completedAt: p.completedAt ?? null,
    pendingApplications: p.pendingApplications ?? 0,
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
    description: c.description ?? undefined,
    organizerId: c.organizerId ?? undefined,
    organizer: c.organizer ?? undefined,
    endsAt: c.endsAt ?? undefined,
    memoryTrail: c.memoryTrail ?? undefined,
    isUserRsvped: c.isUserRsvped ?? false,
    rsvpIntents: c.rsvpIntents ?? undefined,
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
    mediaUrl: c.mediaUrl ?? undefined,
    createdAt: c.createdAt ?? undefined,
    cypher: c.cypher ?? null,
    project: c.project ?? null,
    communitySession: c.communitySession ?? null,
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
    COMMUNITY_HELP: "community-help",
  };
  return m[t ?? ""] ?? "cleanup";
}

export function mapHomeResponse(d: any) {
  return {
    cyphers: (d.cyphers ?? d.activeCyphers ?? []).map(mapCypher),
    projects: (d.projects ?? d.openProjects ?? d.trendingProjects ?? []).map(mapProject),
    artists: (d.artists ?? d.featuredArtists ?? d.activeArtists ?? []).map(mapArtist),
    sessions: (d.sessions ?? d.upcomingSessions ?? []).map(mapSession),
  };
}

export function mapFeedResponse(d: any, cursor?: string) {
  const items = d.clips ?? d.items ?? (Array.isArray(d) ? d : []);
  return {
    items: items.map((i: any) => mapClip(i, i.creator)),
    nextCursor: d.nextCursor ?? null,
    hasMore: d.hasMore ?? false,
  };
}

// API returns an array of city scene objects: [{ city, lat, lng, artistCount, activeCyphers, topGenres }]
export function mapMapResponse(d: any): { cities: SceneCity[]; cyphers: Cypher[]; sessions: CommunitySession[] } {
  if (Array.isArray(d)) {
    return { cities: d as SceneCity[], cyphers: [], sessions: [] };
  }
  return {
    cities: (d.cities ?? []) as SceneCity[],
    cyphers: (d.cyphers ?? []).map(mapCypher),
    sessions: (d.sessions ?? []).map(mapSession),
  };
}

export function mapNotification(n: any) {
  return {
    id: n.id,
    type: n.type,
    title: n.title ?? "",
    message: n.body ?? n.message ?? "",
    read: !!(n.readAt ?? n.read),
    createdAt: n.createdAt ?? new Date().toISOString(),
    referenceId: n.referenceId ?? null,
  };
}

export function mapConversation(c: any) {
  // Backend returns flat fields: otherUserId, otherUserName, otherUserHandle, otherUserAvatar
  const name = c.otherUserName ?? c.participant?.displayName ?? c.participant?.name ?? "";
  return {
    id: c.id,
    participant: {
      id: c.otherUserId ?? c.participant?.id ?? "",
      name,
      handle: c.otherUserHandle ?? c.participant?.handle ?? "",
      city: "",
      genres: [] as string[],
      avatar: name[0] ?? "?",
      verified: false as const,
      momentum: "New Voice" as const,
    },
    lastMessage: c.lastMessage ?? null,
    unread: c.unreadCount ?? c.unread ?? 0,
    updatedAt: c.lastMessageAt ?? c.updatedAt ?? new Date().toISOString(),
    intent: c.intent ?? null,
  };
}

export function mapMessage(m: any) {
  return {
    id: m.id,
    senderId: m.senderId ?? m.sender?.id ?? "",
    sender: mapArtist(m.sender ?? {}),
    content: m.content ?? m.body ?? "",
    createdAt: m.createdAt ?? new Date().toISOString(),
    intent: m.intent ?? null,
    readAt: m.readAt ?? null,
  };
}
