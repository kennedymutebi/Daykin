// ─────────────────────────────────────────────────────────────────────────────
// LOVE STORIES SERVICE — wired to Django LoveStoryViewSet
// Uses the native-fetch apiClient from api.service.ts:
//   api.get<T>(path, params?)          → Promise<T>
//   api.post<T>(path, body?, skip?)    → Promise<T>
//   api.postForm<T>(path, formData)    → Promise<T>
//   api.patch<T>(path, body?)          → Promise<T>
//   api.patchForm<T>(path, formData)   → Promise<T>
//   api.delete(path)                   → Promise<void>
// ─────────────────────────────────────────────────────────────────────────────

import api from "./api.service";
import type { LoveStory, PaginatedResponse } from "../types/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoveStoryComment {
  id:        number;
  author:    string;
  initials:  string;
  text:      string;
  timestamp: string;
}

export interface LoveStoryCommentCreateResponse extends LoveStoryComment {
  comments: number;
}

export interface GetLoveStoriesParams {
  page?:     number;
  ordering?: string;
  search?:   string;
}

export interface SubmitLoveStoryData {
  title:       string;
  excerpt:     string;
  content:     string;
  mediaFiles?: File[];
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function getLoveStories(
  params: GetLoveStoriesParams = {},
): Promise<PaginatedResponse<LoveStory>> {
  // api.get returns T directly — no .data wrapper
  return api.get<PaginatedResponse<LoveStory>>("/love-stories/", params as Record<string, unknown>);
}

// ── Retrieve ──────────────────────────────────────────────────────────────────

export async function getLoveStory(id: number): Promise<LoveStory> {
  return api.get<LoveStory>(`/love-stories/${id}/`);
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function submitLoveStory(data: SubmitLoveStoryData): Promise<LoveStory> {
  const form = new FormData();
  form.append("title",   data.title);
  form.append("excerpt", data.excerpt);
  form.append("content", data.content);

  if (data.mediaFiles && data.mediaFiles.length > 0) {
    form.append("image", data.mediaFiles[0]);
    data.mediaFiles.slice(1).forEach(f => form.append("media", f));
  }

  // postForm — browser sets multipart/form-data + boundary automatically
  return api.postForm<LoveStory>("/love-stories/", form);
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateLoveStory(
  id:   number,
  data: Partial<SubmitLoveStoryData>,
): Promise<LoveStory> {
  const form = new FormData();
  if (data.title   !== undefined) form.append("title",   data.title);
  if (data.excerpt !== undefined) form.append("excerpt", data.excerpt);
  if (data.content !== undefined) form.append("content", data.content);

  if (data.mediaFiles && data.mediaFiles.length > 0) {
    form.append("image", data.mediaFiles[0]);
    data.mediaFiles.slice(1).forEach(f => form.append("media", f));
  }

  // patchForm — multipart PATCH
  return api.patchForm<LoveStory>(`/love-stories/${id}/`, form);
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteLoveStory(id: number): Promise<void> {
  await api.delete(`/love-stories/${id}/`);
}

// ── Like (toggle) ─────────────────────────────────────────────────────────────

export async function likeLoveStory(id: number): Promise<{ liked: boolean; likes: number }> {
  return api.post<{ liked: boolean; likes: number }>(`/love-stories/${id}/like/`);
}

// ── Share ─────────────────────────────────────────────────────────────────────

export async function shareLoveStory(id: number): Promise<{ shares: number }> {
  return api.post<{ shares: number }>(`/love-stories/${id}/share/`);
}

// ── Add comment ───────────────────────────────────────────────────────────────

export async function addLoveStoryComment(
  id:   number,
  text: string,
): Promise<LoveStoryCommentCreateResponse> {
  return api.post<LoveStoryCommentCreateResponse>(`/love-stories/${id}/add-comment/`, { text });
}

// ── Get comments ──────────────────────────────────────────────────────────────

// Django may return a plain array OR a paginated { results: [] } object.
// Type as unknown and narrow at runtime — avoids TS collapsing the union to never.
interface PaginatedComments {
  results: LoveStoryComment[];
}

export async function getStoryComments(id: number): Promise<LoveStoryComment[]> {
  const data = await api.get<unknown>(`/love-stories/${id}/comments/`);
  if (Array.isArray(data)) return data as LoveStoryComment[];
  if (data !== null && typeof data === "object" && "results" in data) {
    return (data as PaginatedComments).results ?? [];
  }
  return [];
}