import { describe, it, expect } from "vitest";
import {
  mapArtist,
  mapCypher,
  mapProject,
  mapClip,
  mapConversation,
  mapNotification,
  mapMapResponse,
  mapSession,
} from "../services/mappers";

// ---------------------------------------------------------------------------
// mapArtist
// ---------------------------------------------------------------------------
describe("mapArtist", () => {
  it("maps a full profile object", () => {
    const result = mapArtist({
      id: "u1",
      displayName: "Shawn",
      handle: "shawn",
      city: "Mumbai",
      genres: ["Boom Bap"],
      isVerified: true,
      momentum: "Rising",
    });
    expect(result).toEqual({
      id: "u1",
      name: "Shawn",
      handle: "shawn",
      city: "Mumbai",
      genres: ["Boom Bap"],
      verified: true,
      momentum: "Rising",
      avatar: "S",
    });
  });

  it("falls back to handle when displayName is missing", () => {
    const result = mapArtist({ id: "u2", handle: "dex" });
    expect(result.name).toBe("dex");
    expect(result.avatar).toBe("d");
  });

  it("defaults verified to false and momentum to New Voice", () => {
    const result = mapArtist({ id: "u3" });
    expect(result.verified).toBe(false);
    expect(result.momentum).toBe("New Voice");
  });

  it("uses location field as city fallback", () => {
    const result = mapArtist({ id: "u4", location: "Delhi" });
    expect(result.city).toBe("Delhi");
  });
});

// ---------------------------------------------------------------------------
// mapCypher
// ---------------------------------------------------------------------------
describe("mapCypher", () => {
  it("maps UPCOMING state to upcoming", () => {
    const c = mapCypher({ id: "c1", state: "UPCOMING", type: "OPEN" });
    expect(c.state).toBe("upcoming");
    expect(c.type).toBe("open");
  });

  it("maps ACTIVE state and VENUE type", () => {
    const c = mapCypher({ id: "c2", state: "ACTIVE", type: "VENUE" });
    expect(c.state).toBe("active");
    expect(c.type).toBe("venue");
  });

  it("maps AFTERGLOW state", () => {
    expect(mapCypher({ id: "c3", state: "AFTERGLOW" }).state).toBe("afterglow");
  });

  it("maps CANCELLED to archived", () => {
    expect(mapCypher({ id: "c4", state: "CANCELLED" }).state).toBe("archived");
  });

  it("defaults isUserRsvped to false", () => {
    expect(mapCypher({ id: "c5" }).isUserRsvped).toBe(false);
  });

  it("passes through memoryTrail", () => {
    const trail = { clipsCount: 3, preservedHighlights: 1, projectsStartedAfter: 2 };
    expect(mapCypher({ id: "c6", memoryTrail: trail }).memoryTrail).toEqual(trail);
  });
});

// ---------------------------------------------------------------------------
// mapProject
// ---------------------------------------------------------------------------
describe("mapProject", () => {
  it("maps LOOKING_FOR_COLLABORATORS status", () => {
    const p = mapProject({ id: "p1", status: "LOOKING_FOR_COLLABORATORS", visibility: "OPEN" });
    expect(p.status).toBe("Looking for collaborators");
    expect(p.visibility).toBe("open");
  });

  it("maps ARCHIVED status to Finished", () => {
    expect(mapProject({ id: "p2", status: "ARCHIVED" }).status).toBe("Finished");
  });

  it("defaults to Cooking when status is unknown", () => {
    expect(mapProject({ id: "p3" }).status).toBe("Cooking");
  });

  it("builds members from flat member list", () => {
    const p = mapProject({
      id: "p4",
      members: [{ userId: "u1", displayName: "Jay" }],
    });
    expect(p.members[0].id).toBe("u1");
    expect(p.members[0].displayName).toBe("Jay");
  });

  it("falls back to creator when members array absent", () => {
    const p = mapProject({
      id: "p5",
      creator: { id: "u2", displayName: "Rae", handle: "rae" },
    });
    expect(p.members[0].id).toBe("u2");
  });

  it("passes through files array", () => {
    const files = [
      { id: "f1", fileName: "beat.mp3", fileKey: "k", fileSize: 100, mimeType: "audio/mpeg", createdAt: "2025-01-01" },
    ];
    expect(mapProject({ id: "p6", files }).files).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// mapClip
// ---------------------------------------------------------------------------
describe("mapClip", () => {
  it("maps a clip with a creator", () => {
    const clip = mapClip(
      { id: "cl1", reason: "LIVE_SESSION", city: "Kolkata", caption: "fire set" },
      { id: "u1", displayName: "Kev", handle: "kev" },
    );
    expect(clip.creator.name).toBe("Kev");
    expect(clip.city).toBe("Kolkata");
  });

  it("provides empty creator when none given", () => {
    const clip = mapClip({ id: "cl2" });
    expect(clip.creator.id).toBe("");
  });

  it("passes through linked cypher / project / communitySession", () => {
    const cypher = { id: "c1", title: "The Spot" };
    const clip = mapClip({ id: "cl3", cypher, project: null, communitySession: null });
    expect(clip.cypher).toEqual(cypher);
    expect(clip.project).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mapConversation
// ---------------------------------------------------------------------------
describe("mapConversation", () => {
  it("reads flat backend fields", () => {
    const c = mapConversation({
      id: "cv1",
      otherUserId: "u99",
      otherUserName: "Temi",
      otherUserHandle: "temi_beats",
      unreadCount: 3,
    });
    expect(c.participant.id).toBe("u99");
    expect(c.participant.name).toBe("Temi");
    expect(c.unread).toBe(3);
  });

  it("falls back to participant object when flat fields absent", () => {
    const c = mapConversation({
      id: "cv2",
      participant: { id: "u88", displayName: "Nora", handle: "nora" },
    });
    expect(c.participant.name).toBe("Nora");
  });
});

// ---------------------------------------------------------------------------
// mapNotification
// ---------------------------------------------------------------------------
describe("mapNotification", () => {
  it("marks read when readAt is set", () => {
    const n = mapNotification({ id: "n1", readAt: "2025-01-01T00:00:00Z" });
    expect(n.read).toBe(true);
  });

  it("marks unread when readAt is null", () => {
    const n = mapNotification({ id: "n2", readAt: null });
    expect(n.read).toBe(false);
  });

  it("uses body as message with title fallback", () => {
    const n = mapNotification({ id: "n3", title: "Check-in confirmed", body: "You're in." });
    expect(n.title).toBe("Check-in confirmed");
    expect(n.message).toBe("You're in.");
  });
});

// ---------------------------------------------------------------------------
// mapMapResponse
// ---------------------------------------------------------------------------
describe("mapMapResponse", () => {
  it("handles array input (city-only API response)", () => {
    const cities = [{ city: "Mumbai", lat: 19.0, lng: 72.8, artistCount: 12, activeCyphers: 2, topGenres: [] }];
    const result = mapMapResponse(cities);
    expect(result.cities).toHaveLength(1);
    expect(result.cyphers).toHaveLength(0);
  });

  it("handles object with cities/cyphers/sessions", () => {
    const result = mapMapResponse({
      cities: [],
      cyphers: [{ id: "c1", state: "ACTIVE" }],
      sessions: [],
    });
    expect(result.cyphers[0].state).toBe("active");
  });
});

// ---------------------------------------------------------------------------
// mapSession
// ---------------------------------------------------------------------------
describe("mapSession", () => {
  it("maps ARTIST_SUPPORT type", () => {
    const s = mapSession({ id: "s1", type: "ARTIST_SUPPORT", state: "ACTIVE" });
    expect(s.type).toBe("artist-support");
    expect(s.state).toBe("active");
  });

  it("defaults to cleanup when type is unknown", () => {
    expect(mapSession({ id: "s2" }).type).toBe("cleanup");
  });
});
