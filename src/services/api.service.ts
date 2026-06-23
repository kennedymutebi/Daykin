// ─────────────────────────────────────────────────────────────────────────────
// BASE API SERVICE  (native fetch — zero extra dependencies)
// ─────────────────────────────────────────────────────────────────────────────

import {
  FULL_BASE_URL,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  REQUEST_TIMEOUT_MS,
} from "../config/api.config";

// ─────────────────────────────────────────────────────────────────────────────
// 1. ApiError
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  data: unknown;
  fieldErrors: Record<string, string[]>;
  nonFieldErrors: string[];

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.fieldErrors = {};
    this.nonFieldErrors = [];

    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      for (const [key, val] of Object.entries(d)) {
        if (key === "non_field_errors" && Array.isArray(val)) {
          this.nonFieldErrors = val as string[];
        } else if (Array.isArray(val)) {
          this.fieldErrors[key] = val as string[];
        } else if (typeof val === "string") {
          this.fieldErrors[key] = [val];
        }
      }
    }
  }

  get firstError(): string {
    if (this.nonFieldErrors.length) return this.nonFieldErrors[0];
    const first = Object.values(this.fieldErrors)[0];
    if (first?.length) return first[0];
    return this.message || "An unexpected error occurred.";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Token storage helpers
// ─────────────────────────────────────────────────────────────────────────────

export const tokenStorage = {
  getAccess:    () => localStorage.getItem(AUTH_TOKEN_KEY),
  getRefresh:   () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setAccess:    (t: string) => localStorage.setItem(AUTH_TOKEN_KEY, t),
  setTokenPair: (access: string, refresh: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Debug logger (dev only)
// ─────────────────────────────────────────────────────────────────────────────

const isDev = import.meta.env.DEV;

function logRequest(method: string, url: string, body?: unknown): void {
  if (!isDev) return;
  console.groupCollapsed(`%c⬆ ${method} ${url}`, "color:#4fc3f7;font-weight:bold");
  if (body) console.log("Body:", body);
  console.groupEnd();
}

function logResponse(method: string, url: string, status: number, data: unknown): void {
  if (!isDev) return;
  console.groupCollapsed(
    `%c⬇ ${status} ${method} ${url}`,
    status >= 400 ? "color:#ef9a9a;font-weight:bold" : "color:#81c784;font-weight:bold",
  );
  console.log("Data:", data);
  console.groupEnd();
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Token refresh queue
// ─────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

async function refreshAccessToken(): Promise<string> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new ApiError("No refresh token", 401, null);

  const res = await fetch(`${FULL_BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      tokenStorage.clear();
    }
    throw new ApiError("Session expired. Please log in again.", 401, null);
  }

  const data = (await res.json()) as { access: string };
  tokenStorage.setAccess(data.access);
  return data.access;
}

function drainQueue(err: unknown, token: string | null): void {
  refreshQueue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  refreshQueue = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Core request function
// ─────────────────────────────────────────────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, unknown>;
  skipAuth?: boolean;
  _isRetry?: boolean;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    params,
    skipAuth = false,
    _isRetry = false,
  } = options;

  const url = new URL(`${FULL_BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const headers: Record<string, string> = {};
  const isFormData = body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth) {
    const token = tokenStorage.getAccess();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  logRequest(method, url.toString(), body);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === "AbortError";
    throw new ApiError(
      isAbort ? "Request timed out." : "Network error — check your connection.",
      0,
      null,
    );
  }
  clearTimeout(timeoutId);

  let data: unknown = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json") && res.status !== 204) {
    data = await res.json();
  }

  logResponse(method, url.toString(), res.status, data);

  // ── 401 → try refresh once ────────────────────────────────────────────────
  if (res.status === 401 && !_isRetry && !skipAuth) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push({
          resolve: () => {
            resolve(request<T>(path, { ...options, _isRetry: true }));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      drainQueue(null, newToken);
      return request<T>(path, { ...options, _isRetry: true });
    } catch (refreshErr: unknown) {
      drainQueue(refreshErr, null);
      throw refreshErr;
    } finally {
      isRefreshing = false;
    }
  }

  // ── Error responses ───────────────────────────────────────────────────────
  if (!res.ok) {
    let message = "An unexpected error occurred.";
    if (res.status === 403) message = "You do not have permission to do this.";
    else if (res.status === 404) message = "Resource not found.";
    else if (res.status >= 500) message = "Server error — please try again later.";
    else if (data && typeof data === "object" && "detail" in (data as object)) {
      message = (data as Record<string, string>)["detail"];
    }
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Convenience methods
// ─────────────────────────────────────────────────────────────────────────────

const apiClient = {
  get: <T>(path: string, params?: Record<string, unknown>) =>
    request<T>(path, { method: "GET", params }),

  post: <T>(path: string, body?: unknown, skipAuth = false) =>
    request<T>(path, { method: "POST", body, skipAuth }),

  postForm: <T>(path: string, formData: FormData, skipAuth = false) =>
    request<T>(path, { method: "POST", body: formData, skipAuth }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),

  // ── NEW: patchForm — same as postForm but uses PATCH (for editing with file uploads)
  patchForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "PATCH", body: formData }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),

  delete: <T = void>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

export default apiClient;