// ─────────────────────────────────────────────────────────────────────────────
// deviceId — stable per-browser identifier for anonymous presence / visits
// ─────────────────────────────────────────────────────────────────────────────
// Generated once and persisted in localStorage, then reused forever (until the
// user clears site data). Sent with every presence ping so the backend can:
//   • count guests toward "online now" without them being logged in, and
//   • increment total_visits exactly once per device.
// This deliberately avoids server-side sessions, which don't play nicely with
// the stateless JWT auth this app already uses.

const DEVICE_ID_KEY = "daykin_device_id";

/** RFC-4122-ish v4 id. Prefers crypto.randomUUID (all secure contexts —
 *  https + localhost), with a Math.random fallback for insecure-context http. */
function generateId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* crypto unavailable — fall through to the manual generator */
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Returns this browser's device id, creating and storing one on first call.
 *  If localStorage is unavailable (private mode / blocked), returns a fresh
 *  ephemeral id so presence still works for the current session. */
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = generateId();
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return generateId();
  }
}
