// ─────────────────────────────────────────────────────────────────────────────
// CHARITIES SERVICE
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./api.service";
import type { Charity, CharityFilters, PaginatedResponse } from "../types/api";

const ENDPOINTS = {
  LIST:   "/charities/",
  DETAIL: (id: number) => `/charities/${id}/`,
} as const;

export async function getCharities(
  filters: CharityFilters = {},
): Promise<PaginatedResponse<Charity>> {
  return apiClient.get<PaginatedResponse<Charity>>(
    ENDPOINTS.LIST,
    filters as Record<string, unknown>,
  );
}

export async function getCharity(id: number): Promise<Charity> {
  return apiClient.get<Charity>(ENDPOINTS.DETAIL(id));
}