// src/hooks/useAuth.ts
// ─────────────────────────────────────────────────────────────────────────────
// Fetches the currently logged-in user from /auth/me/ and caches it.
// Returns null if not logged in (no token or 401).


export { useAuthContext as useAuth } from "../context/auth.context";
export type { AuthUser } from "../context/auth.context";