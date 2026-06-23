// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES SERVICE
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./api.service";
import type {
  Article,
  ArticleFilters,
  ArticleAudioResponse,
  CountResponse,
  PaginatedResponse,
} from "../types/api";

const ENDPOINTS = {
  LIST:           "/articles/",
  DETAIL:         (id: number) => `/articles/${id}/`,
  LIKE:           (id: number) => `/articles/${id}/like/`,
  SHARE:          (id: number) => `/articles/${id}/share/`,
  ADD_COMMENT:    (id: number) => `/articles/${id}/add-comment/`,
  GENERATE_AUDIO: (id: number) => `/articles/${id}/generate-audio/`,
} as const;

export async function getArticles(
  filters: ArticleFilters = {},
): Promise<PaginatedResponse<Article>> {
  return apiClient.get<PaginatedResponse<Article>>(
    ENDPOINTS.LIST,
    filters as Record<string, unknown>,
  );
}

export async function getArticle(id: number): Promise<Article> {
  return apiClient.get<Article>(ENDPOINTS.DETAIL(id));
}

export async function likeArticle(id: number): Promise<CountResponse> {
  return apiClient.post<CountResponse>(ENDPOINTS.LIKE(id));
}

export async function shareArticle(id: number): Promise<CountResponse> {
  return apiClient.post<CountResponse>(ENDPOINTS.SHARE(id));
}

export async function addComment(id: number): Promise<CountResponse> {
  return apiClient.post<CountResponse>(ENDPOINTS.ADD_COMMENT(id));
}

export async function generateArticleAudio(
  id: number,
): Promise<ArticleAudioResponse> {
  return apiClient.post<ArticleAudioResponse>(ENDPOINTS.GENERATE_AUDIO(id));
}