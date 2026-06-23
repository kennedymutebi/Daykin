// ─────────────────────────────────────────────────────────────────────────────
// CELEBRITIES SERVICE
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./api.service";
import type { Celebrity, CelebrityFilters, PaginatedResponse } from "../types/api";

const ENDPOINTS = {
  LIST:            "/celebrities/",
  DETAIL:          (id: number) => `/celebrities/${id}/`,
  BIRTHDAYS_TODAY: "/celebrities/birthdays-today/",
} as const;

export async function getCelebrities(
  filters: CelebrityFilters = {},
): Promise<PaginatedResponse<Celebrity>> {
  return apiClient.get<PaginatedResponse<Celebrity>>(
    ENDPOINTS.LIST,
    filters as Record<string, unknown>,
  );
}

export async function getCelebrity(id: number): Promise<Celebrity> {
  return apiClient.get<Celebrity>(ENDPOINTS.DETAIL(id));
}

export async function getBirthdaysToday(): Promise<Celebrity[]> {
  return apiClient.get<Celebrity[]>(ENDPOINTS.BIRTHDAYS_TODAY);
}