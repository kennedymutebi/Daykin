// ─────────────────────────────────────────────────────────────────────────────
// API TYPES  — mirrors your Django serializers exactly
// ─────────────────────────────────────────────────────────────────────────────

// ── Generic wrapper ───────────────────────────────────────────────────────────

/** Standard DRF paginated list response */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Shape returned when an action just echoes a count */
export interface CountResponse {
  likes?: number;
  shares?: number;
  comments?: number;
}

/** Generic detail message response */
export interface DetailResponse {
  detail: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

// ── Subscription ──────────────────────────────────────────────────────────────

export interface Subscription {
  id: number;
  subscriber: number;
  author: number;
  author_name: string;
  created_at: string;
}

// ── Celebrity ─────────────────────────────────────────────────────────────────

export interface Celebrity {
  id: number;
  name: string;
  profession: string;
  nationality: string;
  birth_date: string;          // "YYYY-MM-DD"
  age: number;
  bio: string;
  image: string | null;
  created_at: string;
}

// ── Article ───────────────────────────────────────────────────────────────────

export type ArticleCategory =
  | "birthday"
  | "sports"
  | "love_story"
  | "charity"
  | "general";

export interface Article {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  category: ArticleCategory;
  tag: string;
  author: User;
  image: string | null;
  audio: string | null;
  likes: number;
  shares: number;
  comments: number;
  reads: number;
  is_published: boolean;
  is_editors_pick: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArticleAudioResponse {
  audio_url: string | null;
  detail: string;
}

// ── Post ──────────────────────────────────────────────────────────────────────

export interface Post {
  id: number;
  user: User;
  content: string;
  image: string | null;
  likes: number;
  is_published: boolean;
  created_at: string;
}

// ── Charity ───────────────────────────────────────────────────────────────────

export interface Charity {
  id: number;
  title: string;
  description: string;
  tag: string;
  beneficiary: string;
  location: string;
  goal: number;
  raised: number;
  is_active: boolean;
  urgent: boolean;
  image: string | null;
  created_at: string;
}

// ── Love Story ────────────────────────────────────────────────────────────────

// FIX: author is returned as a FK integer id, not a nested User object.
//      author_name and author_info are the computed fields from the serializer.
export interface LoveStoryAuthorInfo {
  name: string;
  avatar: string;        // two-letter initials e.g. "KE"
  verified: boolean;
  gradient_from: string;
  gradient_to: string;
  is_subscribed: boolean;
}

export interface LoveStory {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: number;                   // FIX: FK id, not a User object
  author_name: string;              // FIX: computed full name from serializer
  author_info: LoveStoryAuthorInfo; // FIX: computed author details from serializer
  read_time: string;                // FIX: computed read time from serializer
  image: string | null;
  likes: number;
  shares: number;
  comments: number;
  is_published: boolean;
  created_at: string;
}
export interface LoveStoryComment {
  id: number;
  author: string;     // display name, computed server-side
  initials: string;   // two-letter initials, computed server-side
  text: string;
  timestamp: string;  // ISO string from comment.created_at
}

export interface LoveStoryCommentCreateResponse extends LoveStoryComment {
  comments: number;   // updated total comment count on the story
}

// ── Query params helpers ──────────────────────────────────────────────────────

export interface ArticleFilters {
  category?: ArticleCategory;
  search?: string;
  tag?: string;
  is_editors_pick?: boolean;
  ordering?: string;
  page?: number;
}

export interface CelebrityFilters {
  search?: string;
  ordering?: string;
  page?: number;
}

export interface CharityFilters {
  search?: string;
  tag?: string;
  urgent?: boolean;
  page?: number;
}

export interface LoveStoryFilters {
  search?: string;
  ordering?: string;
  page?: number;
}
// ── Love Story Comment ─────────────────────────────────────────────────────────

// ── Site stats & presence ───────────────────────────────────────────────────────
// Backend endpoints these mirror (not built yet — see stats.service.ts):
//   GET  /api/stats/            → SiteStats
//   GET  /api/presence/online/  → OnlinePresence
//   POST /api/presence/ping/    → PresencePing

/** GET /api/stats/ — live numbers for the home hero. */
export interface SiteStats {
  members: number;
  stories_published: number;
  total_visits: number;
  online_now: number;
}

/** A logged-in user currently online, for the hero avatar strip. */
export interface OnlineUser {
  id: number;
  name: string;
  initials: string;
}

/** GET /api/presence/online/ — total online count (incl. guests) + named users. */
export interface OnlinePresence {
  count: number;
  users: OnlineUser[];
}

/** POST /api/presence/ping/ response. */
export interface PresencePing {
  online_now: number;
}

