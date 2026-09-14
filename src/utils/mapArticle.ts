// src/utils/mapArticle.ts
// Shared mappers between the raw API article/love-story shape and the local
// `Article` type used by ArticleCard / ArticleModal / ArticlePage. Extracted
// out of Home.tsx so ArticlePage (the deep-link/share target) can map the
// same way without duplicating the logic.

import type { Article as ApiArticle, LoveStory as ApiLoveStory } from "../types/api";
import type { Article } from "../types/article";

export const MEDIA_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace("/api", "") ??
  "http://localhost:8000";

export function resolveImg(img: string | null | undefined): string {
  if (!img) return "/placeholder.png";
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  return `${MEDIA_BASE}${img}`;
}

/** Map a generic API article → local Article shape expected by existing components */
export function mapApiArticle(a: ApiArticle, accent: string): Article {
  return {
    id: a.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authorId: (a.author as any)?.id,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    category: "Article",
    categoryColor: accent,
    img: resolveImg(a.image),
    audio: a.audio ?? undefined,
    readTime: `${Math.ceil(a.content.split(" ").length / 200)} min read`,
    createdAt: a.created_at,
    date: new Date(a.created_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    }),
    author: {
      name: `${a.author.first_name} ${a.author.last_name}`.trim() || a.author.username,
      initials: (
        (a.author.first_name?.[0] ?? "") + (a.author.last_name?.[0] ?? "")
      ).toUpperCase() || a.author.username.slice(0, 2).toUpperCase(),
      role: "Writer",
      verified: false,
    },
    engagement: {
      likes: a.likes,
      shares: a.shares,
      comments: a.comments,
    },
    isEditorsPick: a.is_editors_pick,
  };
}

/** Map a story (written via the shared composer) → the same local Article shape */
export function mapLoveStoryToArticle(s: ApiLoveStory, accent: string): Article {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = s as any;
  return {
    id: s.id,
    authorId: s.author,
    title: s.title,
    excerpt: s.excerpt,
    content: s.content,
    category: "Article",
    categoryColor: accent,
    img: resolveImg(s.image),
    audio: raw.audio_url ?? undefined,
    readTime: s.read_time ?? `${Math.ceil(s.content.split(" ").length / 200)} min read`,
    createdAt: s.created_at,
    date: new Date(s.created_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    }),
    author: {
      name: s.author_name || "Anonymous",
      initials: raw.author_info?.avatar || (s.author_name ?? "AN").slice(0, 2).toUpperCase(),
      role: "Writer",
      verified: raw.author_info?.verified ?? false,
    },
    engagement: {
      likes: s.likes,
      shares: s.shares,
      comments: s.comments,
    },
    isEditorsPick: raw.is_editors_pick ?? false,
  };
}