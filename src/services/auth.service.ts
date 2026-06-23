// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────────────────────────────────────

import apiClient, { tokenStorage } from "./api.service";
import type {
  User,
  TokenPair,
  RegisterPayload,
  LoginPayload,
  Subscription,
} from "../types/api";

const ENDPOINTS = {
  REGISTER:  "/auth/register/",
  LOGIN:     "/auth/login/",        // FIX: was "/token/"
  ME:        "/auth/me/",
  SUBSCRIBE: (authorId: number) => `/subscriptions/${authorId}/`,
  MY_SUBS:   "/subscriptions/mine/",
} as const;

export async function register(payload: RegisterPayload): Promise<User> {
  return apiClient.post<User>(ENDPOINTS.REGISTER, payload, true); // skipAuth
}

export async function login(payload: LoginPayload): Promise<TokenPair> {
  const tokens = await apiClient.post<TokenPair>(ENDPOINTS.LOGIN, payload, true);

  // IMPORTANT: use tokenStorage (the same helper api.service.ts reads from)
  // instead of raw localStorage keys — otherwise AuthContext and the
  // refresh-token interceptor will never see these tokens.
  tokenStorage.setTokenPair(tokens.access, tokens.refresh);

  return tokens;
}

export function logout(): void {
  tokenStorage.clear();
}

export async function getMe(): Promise<User> {
  return apiClient.get<User>(ENDPOINTS.ME);
}

export async function updateMe(
  payload: Partial<Pick<User, "first_name" | "last_name" | "email">>,
): Promise<User> {
  return apiClient.patch<User>(ENDPOINTS.ME, payload);
}

export async function subscribeToAuthor(authorId: number): Promise<Subscription> {
  return apiClient.post<Subscription>(ENDPOINTS.SUBSCRIBE(authorId));
}

export async function unsubscribeFromAuthor(authorId: number): Promise<void> {
  return apiClient.delete(ENDPOINTS.SUBSCRIBE(authorId));
}

export async function getMySubscriptions(): Promise<Subscription[]> {
  return apiClient.get<Subscription[]>(ENDPOINTS.MY_SUBS);
}