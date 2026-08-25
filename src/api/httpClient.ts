 // adjust path to your config file

import { AUTH_TOKEN_KEY, FULL_BASE_URL, REQUEST_TIMEOUT_MS } from "../config/api.config";

interface RequestOptions extends RequestInit {
  timeout?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? REQUEST_TIMEOUT_MS);

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  // Don't force Content-Type for FormData — the browser sets the correct
  // multipart boundary itself. Forcing it here breaks file uploads.
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  try {
    const res = await fetch(`${FULL_BASE_URL}${path}`, { ...options, headers, signal: controller.signal });

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body.detail || JSON.stringify(body);
      } catch {
        /* response wasn't JSON — keep statusText */
      }
      throw new Error(`API error ${res.status}: ${detail}`);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body instanceof FormData ? body : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};