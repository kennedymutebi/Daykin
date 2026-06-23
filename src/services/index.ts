// ─────────────────────────────────────────────────────────────────────────────
// SERVICES — barrel export
// ─────────────────────────────────────────────────────────────────────────────
// Import anything from one place:
//   import { getArticles, likeArticle, ApiError } from "@/services";

export { default as apiClient, ApiError, tokenStorage } from "./api.service";

export * from "./auth.service";
export * from "./articles.service";
export * from "./celebrities.service";
export * from "./loveStories.service";
export * from "./charities.service";