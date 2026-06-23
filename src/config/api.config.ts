// ─────────────────────────────────────────────────────────────────────────────
// API CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
// ✅ AFTER DEPLOYING YOUR BACKEND: change ONLY this one constant.
//    Everything else in the codebase reads from here.
//
//    Local dev  → "http://localhost:8000/api"
//    Production → "https://your-backend.com/api"
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://84.247.171.71:8085/api";

// Token storage key (localStorage)
export const AUTH_TOKEN_KEY = "daykin_access_token";
export const REFRESH_TOKEN_KEY = "daykin_refresh_token";

// Request timeout in milliseconds
export const REQUEST_TIMEOUT_MS = 15_000;

// API version prefix (update if you version your API later, e.g. "/v2")
export const API_VERSION = "";

// Full base = API_BASE_URL + API_VERSION  e.g. "http://localhost:8000/api"
export const FULL_BASE_URL = `${API_BASE_URL}${API_VERSION}`;