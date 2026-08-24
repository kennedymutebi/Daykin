// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers — track which story IDs the current user has liked
// and bookmarked. Lives outside PostComposer.tsx so that file only exports
// components (Vite Fast Refresh requirement).
// ─────────────────────────────────────────────────────────────────────────────

const LIKED_KEY = "daykin_liked_stories";

function getLikedSet(): Set<number> {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    const arr: number[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function persistLikedSet(set: Set<number>) {
  try {
    localStorage.setItem(LIKED_KEY, JSON.stringify([...set]));
  } catch { /* quota exceeded — ignore */ }
}

export function isStoryLiked(id: number): boolean {
  return getLikedSet().has(id);
}

export function setStoryLiked(id: number, liked: boolean) {
  const set = getLikedSet();
  if (liked) set.add(id); else set.delete(id);
  persistLikedSet(set);
}

// ── Bookmarks ───────────────────────────────────────────────────────────────
const BOOKMARKED_KEY = "daykin_bookmarked_stories";

function getBookmarkedSet(): Set<number> {
  try {
    const raw = localStorage.getItem(BOOKMARKED_KEY);
    const arr: number[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function isStoryBookmarked(id: number): boolean {
  return getBookmarkedSet().has(id);
}

export function setStoryBookmarked(id: number, bookmarked: boolean) {
  const set = getBookmarkedSet();
  if (bookmarked) set.add(id); else set.delete(id);
  try {
    localStorage.setItem(BOOKMARKED_KEY, JSON.stringify([...set]));
  } catch { /* ignore */ }
}
