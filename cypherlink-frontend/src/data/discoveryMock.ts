import { Artist, Cypher, Project } from '../types';
import { artists, cyphers, projects } from './mock';

export type ArtistRole = 'Rapper' | 'Producer' | 'Vocalist' | 'Engineer' | 'Guitarist' | 'DJ' | 'Instrumentalist' | 'Learner' | 'Organizer';

export interface DiscoverableArtist extends Artist {
  role: ArtistRole;
  languages: string[];
  openToCollab: boolean;
  beginnerFriendly: boolean;
  activeProjects: number;
  lastActive: string;
  trustSignals: string[];
}

export interface Scene {
  id: string;
  city: string;
  region: string;
  title: string;
  subtitle: string;
  dominantGenres: string[];
  momentum: 'Quietly Growing' | 'Scene Active' | 'Rising Fast' | 'Legendary Roots';
  activeArtists: number;
  openProjects: number;
  upcomingCyphers: number;
  communitySessions: number;
}

export interface LearningSession {
  id: string;
  title: string;
  city: string;
  host: string;
  topic: string;
  level: 'Beginner Friendly' | 'Open to All' | 'Intermediate';
  date: string;
  pullingUp: number;
  free: true;
}

export interface CauseSession {
  id: string;
  title: string;
  city: string;
  cause: string;
  type: 'cleanup' | 'relief' | 'teaching' | 'artist-support' | 'community-help';
  date: string;
  pullingUp: number;
  safetyTags: string[];
}

export const discoverableArtists: DiscoverableArtist[] = [
  { ...artists[0], role: 'Rapper', languages: ['Hindi', 'English'], openToCollab: true, beginnerFriendly: false, activeProjects: 3, lastActive: '2h ago', trustSignals: ['Cypher regular', 'Frequently collaborates'] },
  { ...artists[1], role: 'Vocalist', languages: ['English', 'Hindi', 'Kannada'], openToCollab: true, beginnerFriendly: true, activeProjects: 2, lastActive: 'Today', trustSignals: ['Beginner friendly', 'Open collaborator'] },
  { ...artists[2], role: 'Producer', languages: ['Hindi', 'Marathi', 'English'], openToCollab: false, beginnerFriendly: true, activeProjects: 4, lastActive: 'Yesterday', trustSignals: ['Community trusted', 'Helps new artists'] },
  { ...artists[3], role: 'Producer', languages: ['English', 'Khasi'], openToCollab: true, beginnerFriendly: true, activeProjects: 1, lastActive: '4h ago', trustSignals: ['New voice', 'Experimental scene'] }
];

export const scenes: Scene[] = [
  { id: 'scene-delhi', city: 'Delhi', region: 'North India', title: 'Delhi Hip-Hop Underground', subtitle: 'Raw freestyles, rooftop sessions, drill pockets and multilingual cyphers.', dominantGenres: ['Hip-Hop', 'Drill', 'Rap'], momentum: 'Scene Active', activeArtists: 128, openProjects: 19, upcomingCyphers: 5, communitySessions: 2 },
  { id: 'scene-mumbai', city: 'Mumbai', region: 'West India', title: 'Mumbai Basement Circuit', subtitle: 'Venue cyphers, producers, engineers and late-night collaborative sessions.', dominantGenres: ['Trap', 'Hip-Hop', 'Indie'], momentum: 'Legendary Roots', activeArtists: 211, openProjects: 31, upcomingCyphers: 7, communitySessions: 3 },
  { id: 'scene-bangalore', city: 'Bangalore', region: 'South India', title: 'Bangalore Fusion Grid', subtitle: 'Neo-soul, electronic, college scenes, open learning circles and jams.', dominantGenres: ['Neo-Soul', 'Electronic', 'Fusion'], momentum: 'Rising Fast', activeArtists: 96, openProjects: 14, upcomingCyphers: 4, communitySessions: 4 },
  { id: 'scene-shillong', city: 'Shillong', region: 'North East India', title: 'Shillong Experimental Wave', subtitle: 'Indie textures, experimental producers and cross-border collaboration energy.', dominantGenres: ['Indie', 'Experimental', 'Rock'], momentum: 'Quietly Growing', activeArtists: 54, openProjects: 9, upcomingCyphers: 2, communitySessions: 1 }
];

export const learningSessions: LearningSession[] = [
  { id: 'learn-1', title: 'Free FL Studio Basics', city: 'Delhi', host: 'RDX', topic: 'Beatmaking basics', level: 'Beginner Friendly', date: 'Saturday • 4PM', pullingUp: 13, free: true },
  { id: 'learn-2', title: 'Vocal Layering Circle', city: 'Bangalore', host: 'Ayesha', topic: 'Recording harmonies and stacks', level: 'Open to All', date: 'Sunday • 2PM', pullingUp: 18, free: true }
];

export const causeSessions: CauseSession[] = [
  { id: 'cause-1', title: 'Bangalore Scene Cleanup', city: 'Bangalore', cause: 'Neighborhood cleanup before open circle', type: 'cleanup', date: 'Sunday • 9AM', pullingUp: 21, safetyTags: ['Daylight', 'Community moderated'] },
  { id: 'cause-2', title: 'Mumbai Artist Support Drive', city: 'Mumbai', cause: 'Collecting gear and studio-hour support for young artists', type: 'artist-support', date: 'Friday • 5PM', pullingUp: 16, safetyTags: ['Verified organizer', 'Public venue'] },
  { id: 'cause-3', title: 'Shillong Free Production Class', city: 'Shillong', cause: 'Musicians teaching beginners for free', type: 'teaching', date: 'Wednesday • 6PM', pullingUp: 12, safetyTags: ['Beginner friendly', 'Open to all'] }
];

export const discoveryCollections: {
  artists: DiscoverableArtist[];
  projects: Project[];
  cyphers: Cypher[];
  scenes: Scene[];
  community: CauseSession[];
  learning: LearningSession[];
} = { artists: discoverableArtists, projects, cyphers, scenes, community: causeSessions, learning: learningSessions };
