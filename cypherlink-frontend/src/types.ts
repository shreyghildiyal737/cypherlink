export type ProjectLifecycleState = "ACTIVE" | "SLOWING_DOWN" | "INACTIVE" | "ARCHIVED" | "COMPLETED";
export type ContributorStatus = "ACTIVE" | "LEFT_VOLUNTARILY" | "REMOVED_BY_LEAD" | "INACTIVE" | "COMPLETED_CONTRIBUTION";
export type MilestoneStatus = "TODO" | "IN_PROGRESS" | "SUBMITTED" | "REVISION_REQUESTED" | "APPROVED" | "COMPLETED";
export type RightsTag = "DRAFT_ONLY" | "PROJECT_USE_ALLOWED" | "COMMERCIAL_USE_ALLOWED" | "OWNERSHIP_TRANSFERRED" | "ROYALTY_SPLIT_INTENDED";
export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type CypherType = "open" | "venue";
export type EventState = "upcoming" | "active" | "afterglow" | "archived";
export type AvailabilityStatus = "OPEN" | "SELECTIVE" | "BUSY" | "UNAVAILABLE";
export type LocalRemotePreference = "LOCAL" | "REMOTE" | "BOTH";
export type ProjectType = "STRUCTURED" | "OPEN_COLLAB" | "COMMUNITY" | "CYPHER_EVENT";
export type CommitmentStyle =
  | "EXPERIMENTAL"
  | "CASUAL"
  | "QUICK_JAM"
  | "ONE_NIGHT_SESSION"
  | "LONG_TERM_PROJECT"
  | "RELEASE_FOCUSED"
  | "PRACTICE_SESSION"
  | "LEARNING_PROJECT";

export interface ContributionStats {
  projectCount: number;
  cypherCount: number;
  sessionCount: number;
}

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
  // Phase 1 identity fields
  primaryRole?: string;
  secondaryRoles?: string[];
  availabilityStatus?: AvailabilityStatus;
  collaborationCapacity?: number | null;
  lookingFor?: string[];
  localRemotePreference?: LocalRemotePreference;
  collaborationIntent?: string | null;
  openToCollab?: boolean;
  beginnerFriendly?: boolean;
  trustSignals?: string[];
  contributions?: ContributionStats;
}

export interface ProjectMemberInfo {
  id: string;
  userId: string;
  displayName: string;
  handle?: string;
  avatarUrl?: string;
  role: string;
  creativeRole?: string | null;
  status: ContributorStatus;
  joinedAt: string;
  removedAt?: string | null;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  assignedRole?: string | null;
  assignedContributorId?: string | null;
  assignedContributorName?: string | null;
  deliverableExpectation?: string | null;
  status: MilestoneStatus;
  order: number;
  createdAt: string;
}

export interface ProjectDeliverable {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  submittedById: string;
  submitterName?: string;
  role?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  publicUrl?: string | null;
  note?: string | null;
  rightsTag: RightsTag;
  createdAt: string;
}

export interface ProjectRevisionRequest {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  deliverableId?: string | null;
  requestedById: string;
  requesterName?: string;
  note: string;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderHandle?: string;
  senderAvatar?: string;
  body: string;
  linkedMilestoneId?: string | null;
  linkedDeliverableId?: string | null;
  createdAt: string;
}

export interface RoleApplication {
  id: string;
  projectId: string;
  applicantId: string;
  applicantName: string;
  applicantHandle?: string;
  applicantAvatar?: string;
  role: string;
  message?: string | null;
  status: ApplicationStatus;
  createdAt: string;
}

export interface TypeTransitionEntry {
  from: string;
  to: string;
  at: string;
  note?: string | null;
}

export interface ProjectFile {
  id: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  publicUrl?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  status:
    | "Cooking"
    | "Looking for collaborators"
    | "Recording"
    | "Mixing"
    | "Finished"
    | "COOKING"
    | "LOOKING_FOR_COLLABORATORS"
    | "RECORDING"
    | "MIXING"
    | "FINISHED"
    | "ARCHIVED";
  city: string;
  tags: string[];
  openRoles: string[];
  filledRoles?: string[];
  members: ProjectMemberInfo[];
  visibility: "private" | "discoverable" | "open" | "PRIVATE" | "DISCOVERABLE" | "OPEN";
  files?: ProjectFile[];
  ownerId?: string;
  description?: string;
  memoryTrail?: ProjectMemoryTrail;
  // Phase 1 fields
  projectType?: ProjectType;
  localRemote?: LocalRemotePreference;
  roughExpectation?: string | null;
  commitmentStyle?: CommitmentStyle | null;
  expiresAt?: string | null;
  // Phase 2 fields
  milestones?: ProjectMilestone[];
  typeTransitionLog?: TypeTransitionEntry[];
  completedAt?: string | null;
  pendingApplications?: number;
  // Phase 5 lifecycle
  lifecycleState?: ProjectLifecycleState;
  lastMeaningfulActivityAt?: string | null;
  // Phase 6 health
  participantCap?: number | null;
  aiDisclosureLabel?: string | null;
  suppressedAt?: string | null;
}

export interface CypherHighlight {
  id: string;
  title: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface CypherMemoryTrail {
  clipsCount: number;
  preservedHighlights: number;
  projectsStartedAfter: number;
}

export interface CypherRsvpIntent {
  userId: string;
  intentNote: string;
  aliasName?: string | null;
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
  highlights: CypherHighlight[];
  description?: string;
  organizerId?: string;
  organizer?: { displayName: string; handle?: string };
  endsAt?: string;
  memoryTrail?: CypherMemoryTrail;
  isUserRsvped?: boolean;
  rsvpIntents?: CypherRsvpIntent[];
}

export interface ProjectMemoryTrail {
  clipsCount: number;
  bornFromCypher?: { id: string; title: string; city?: string } | null;
}

export interface ClipLinkedCypher {
  id: string;
  title: string;
  city?: string;
  state?: string;
  startsAt?: string;
}

export interface ClipLinkedProject {
  id: string;
  title: string;
  status?: string;
}

export interface ClipLinkedSession {
  id: string;
  title: string;
  city?: string;
  type?: string;
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
  mediaUrl?: string;
  createdAt?: string;
  cypher?: ClipLinkedCypher | null;
  project?: ClipLinkedProject | null;
  communitySession?: ClipLinkedSession | null;
}

export interface MemoryTrail {
  kind: string;
  label: string;
  href?: string;
}

export interface CommunitySession {
  id: string;
  title: string;
  city: string;
  type: "cleanup" | "teaching" | "relief" | "artist-support" | "community-help";
  state: EventState;
  pullingUp: number;
}

export interface SceneCity {
  city: string;
  lat: number;
  lng: number;
  artistCount: number;
  activeCyphers: number;
  topGenres: string[];
}

export interface CollaborationMemory {
  hasCollaborated: boolean;
  projectsTogether: number;
  collabCount: number;
  label: string | null;
  firstContextTitle: string | null;
  firstContextType: string | null;
  lastCollabAt: string | null;
}

export interface TopCollaborator {
  userId: string;
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  city: string | null;
  collabCount: number;
  firstContextTitle: string | null;
  firstContextType: string | null;
  lastCollabAt: string | null;
  label: string;
}

export interface ContinuationSuggestion {
  type: string;
  label: string;
  context: string;
  referenceId?: string;
}

export interface CollectiveMemberInfo {
  userId: string;
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
}

export interface Collective {
  id: string;
  name: string;
  handle: string | null;
  description: string | null;
  city: string | null;
  avatarUrl: string | null;
  bornFromCypherId: string | null;
  foundedById: string;
  founderName: string | null;
  founderHandle: string | null;
  memberCount: number;
  members: CollectiveMemberInfo[];
  createdAt: string;
}
