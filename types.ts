export enum RelationshipType {
  UNDEFINED = 'Undefined',
  ROMANTIC = 'Romantic',
  FRIENDSHIP = 'Friendship',
  FAMILY = 'Family',
  WORK = 'Professional',
  OTHER = 'Other',
}

export enum ReflectionSection {
  OVERVIEW = 'Overview',
  TIMELINE = 'Timeline',
  THOUGHTS = 'Thoughts & Feelings',
  LESSONS = 'Lessons Learned',
  PATTERNS = 'Patterns & Boundaries',
  CLOSURE = 'Closure / Release',
}

export interface MediaItem {
  id: string;
  relationshipId: string;
  mimeType: string;
  blob: ArrayBuffer; // Stored as encrypted buffer in DB
  thumbnail?: string; // Optional plaintext thumbnail (base64) for performance, or generate on fly
  timestamp: number;
}

export interface RelationshipProfile {
  id: string;
  name: string; // Stored plain for list view
  type: RelationshipType;
  startDate?: string;
  endDate?: string;
  reflections: Record<ReflectionSection, string>; // Values will be encrypted strings
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  isLocked: boolean;
  hasPin: boolean;
  view: 'AUTH' | 'DASHBOARD' | 'PROFILE' | 'CREATE';
  activeProfileId: string | null;
}
