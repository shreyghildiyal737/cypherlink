export type CypherType = "open" | "venue";
export type EventState = "upcoming" | "active" | "afterglow" | "archived";
export interface Artist {
  id: string;
  name: string;
  handle: string;
  city: string;
  genres: string[];
  verified?: boolean;
  role?: string;
  momentum?: "Rising" | "Scene Active" | "Community Trusted" | "New Voice";
  avatar: string;
}
export interface Project {
  id: string;
  title: string;
  status:
    | "Cooking"
    | "Looking for collaborators"
    | "Recording"
    | "Mixing"
    | "Finished";
  city: string;
  tags: string[];
  openRoles: string[];
  members: Artist[];
  visibility: "private" | "discoverable" | "open";
}
export interface Cypher {
  id: string;
  title: string;
  type: CypherType;
  state: EventState;
  city: string;
  venue: string;
  startsAt: string;
  pullingUp: number;
  quota?: number;
  spotsLeft?: number;
  safetyTags: string[];
  highlights: string[];
}
export interface Clip {
  id: string;
  creator: Artist;
  projectTitle: string;
  city: string;
  reason: string;
  caption: string;
  likes: number;
  comments: number;
}
export interface CommunitySession {
  id: string;
  title: string;
  city: string;
  type: "cleanup" | "teaching" | "relief" | "artist-support";
  state: EventState;
  pullingUp: number;
}
