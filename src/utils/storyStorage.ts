// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers — track which items the current user has liked,
// bookmarked, and shared. Lives outside PostComposer.tsx so that file only
// exports components (Vite Fast Refresh requirement).
//
// IMPORTANT: keys are namespaced per SOURCE. Articles and love stories come
// from different backends with independent id spaces, so article #5 and love
// story #5 are different items. Keying on the bare number made liking one
// light the other's heart — so every key is `${source}:${id}`.
// ─────────────────────────────────────────────────────────────────────────────

export type LikeSource = "article" | "love_story";

function readSet(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function writeSet(storageKey: string, set: Set<string>) {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...set]));
  } catch { /* quota exceeded — ignore */ }
}

function itemKey(id: number, source: LikeSource): string {
  return `${source}:${id}`;
}

function hasItem(storageKey: string, id: number, source: LikeSource): boolean {
  return readSet(storageKey).has(itemKey(id, source));
}

function toggleItem(storageKey: string, id: number, source: LikeSource, on: boolean) {
  const set = readSet(storageKey);
  const key = itemKey(id, source);
  if (on) set.add(key); else set.delete(key);
  writeSet(storageKey, set);
}

// ── Likes ───────────────────────────────────────────────────────────────────
// `_v2` because the old key stored bare numbers; a one-time reset of the
// lit-state is preferable to mixing the two formats.
const LIKED_KEY = "daykin_liked_stories_v2";

export function isStoryLiked(id: number, source: LikeSource = "love_story"): boolean {
  return hasItem(LIKED_KEY, id, source);
}

export function setStoryLiked(id: number, liked: boolean, source: LikeSource = "love_story") {
  toggleItem(LIKED_KEY, id, source, liked);
}

// ── Bookmarks ─────────────────────────────────────────────────────────────────
const BOOKMARKED_KEY = "daykin_bookmarked_stories_v2";

export function isStoryBookmarked(id: number, source: LikeSource = "love_story"): boolean {
  return hasItem(BOOKMARKED_KEY, id, source);
}

export function setStoryBookmarked(id: number, bookmarked: boolean, source: LikeSource = "love_story") {
  toggleItem(BOOKMARKED_KEY, id, source, bookmarked);
}

// ── Shares ──────────────────────────────────────────────────────────────────
// Dedupe so a story's share count only bumps once per client; repeat clicks
// still re-share the link but don't inflate the count.
const SHARED_KEY = "daykin_shared_stories_v2";

export function isStorySharedLocal(id: number, source: LikeSource = "love_story"): boolean {
  return hasItem(SHARED_KEY, id, source);
}

export function setStorySharedLocal(id: number, shared: boolean, source: LikeSource = "love_story") {
  toggleItem(SHARED_KEY, id, source, shared);
}
