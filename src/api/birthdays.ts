// src/api/birthdays.ts

import { api } from "./httpClient";

export interface CelebrantDTO {
  id: number;
  full_name: string;
  photo: string | null;
  birth_month: number;
  birth_day: number;
  location: string;
  big_wish: string;
  created_at: string;
  is_birthday_today: boolean;
  // Present once the backend created_by/is_owner fields are deployed —
  // optional so this type still matches older API responses too.
  created_by?: number | null;
  is_owner?: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CreateCelebrantInput {
  full_name: string;
  birth_month: number;
  birth_day: number;
  location?: string;
  big_wish?: string;
  photo?: File | null;
}

export interface UpdateCelebrantInput {
  full_name?: string;
  birth_month?: number;
  birth_day?: number;
  location?: string;
  big_wish?: string;
  photo?: File | null;
}

export interface ListCelebrantsOptions {
  // true → only celebrants the logged-in user personally created
  // (used by the "Your Roster" manage screen). Omit/false → everyone's
  // celebrants (used by the public feed).
  mine?: boolean;
}

export async function listCelebrants(opts?: ListCelebrantsOptions): Promise<CelebrantDTO[]> {
  const qs = opts?.mine ? "?mine=true" : "";
  let url: string | null = `/birthdays/${qs}`;
  const all: CelebrantDTO[] = [];

  while (url) {
    const data: PaginatedResponse<CelebrantDTO> | CelebrantDTO[] = await api.get(url);

    if (Array.isArray(data)) {
      return data;
    }

    all.push(...data.results);
    url = data.next ? data.next.replace(/^https?:\/\/[^/]+\/api/, "") : null;
  }

  return all;
}

export function getCelebrant(id: number): Promise<CelebrantDTO> {
  return api.get<CelebrantDTO>(`/birthdays/${id}/`);
}

export function createCelebrant(input: CreateCelebrantInput): Promise<CelebrantDTO> {
  const fd = new FormData();
  fd.append("full_name", input.full_name);
  fd.append("birth_month", String(input.birth_month));
  fd.append("birth_day", String(input.birth_day));
  if (input.location) fd.append("location", input.location);
  if (input.big_wish) fd.append("big_wish", input.big_wish);
  if (input.photo) fd.append("photo", input.photo);
  return api.post<CelebrantDTO>("/birthdays/", fd);
}

export function updateCelebrant(id: number, input: UpdateCelebrantInput): Promise<CelebrantDTO> {
  const fd = new FormData();
  if (input.full_name !== undefined) fd.append("full_name", input.full_name);
  if (input.birth_month !== undefined) fd.append("birth_month", String(input.birth_month));
  if (input.birth_day !== undefined) fd.append("birth_day", String(input.birth_day));
  if (input.location !== undefined) fd.append("location", input.location);
  if (input.big_wish !== undefined) fd.append("big_wish", input.big_wish);
  if (input.photo) fd.append("photo", input.photo);
  return api.patch<CelebrantDTO>(`/birthdays/${id}/`, fd);
}

export function deleteCelebrant(id: number): Promise<void> {
  return api.delete<void>(`/birthdays/${id}/`);
}

export function parseMonthDay(value: string): { month: number; day: number } | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?$/);
  if (!match) return null;

  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);

  if (month < 1 || month > 12) return null;

  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month - 1]) return null;

  return { month, day };
}