// ─────────────────────────────────────────────────────────────────────────────
// STATS & PRESENCE SERVICE
// ─────────────────────────────────────────────────────────────────────────────
// Thin wrappers over three backend endpoints. NONE of these exist on the
// backend yet — every caller (see useStats / usePresence) is responsible for
// catching failures and degrading gracefully. The endpoint contracts here are
// the source of truth the Django side will be built to match:
//
//   POST /api/presence/ping/     body { device_id }        → { online_now }
//   GET  /api/presence/online/                             → { count, users: [{ id, name, initials }] }
//   GET  /api/stats/                                       → { members, stories_published, total_visits, online_now }
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from "./api.service";
import type { SiteStats, OnlinePresence, PresencePing } from "../types/api";

const ENDPOINTS = {
  STATS:  "/stats/",
  PING:   "/presence/ping/",
  ONLINE: "/presence/online/",
} as const;

/** Live hero numbers. */
export async function getStats(): Promise<SiteStats> {
  return apiClient.get<SiteStats>(ENDPOINTS.STATS);
}

/** Heartbeat — marks this device online. If a JWT is present, api.service
 *  attaches it automatically so the backend can link the device to the user;
 *  guests simply ping with the device_id alone. */
export async function pingPresence(deviceId: string): Promise<PresencePing> {
  return apiClient.post<PresencePing>(ENDPOINTS.PING, { device_id: deviceId });
}

/** Currently-online users (logged-in ones, for the avatar strip) + total count. */
export async function getOnline(): Promise<OnlinePresence> {
  return apiClient.get<OnlinePresence>(ENDPOINTS.ONLINE);
}
