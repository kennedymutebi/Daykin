// ─────────────────────────────────────────────────────────────────────────────
// usePresence — app-wide heartbeat (WRITE side of presence)
// ─────────────────────────────────────────────────────────────────────────────
// Mount ONCE near the top of the tree (App.tsx). Sends POST /api/presence/ping/
// immediately on mount, every ~45s while the tab is visible, and again whenever
// the tab regains focus. Mirrors the visibility-aware polling already used for
// the feed in Home.tsx, just at a slower cadence.
//
// Intentionally holds NO state — mounted at the app root, any state here would
// re-render the whole tree on every beat. The displayed "online" count/avatars
// come from the READ side (useStats → getOnline), scoped to the hero.
//
// FAILS SILENTLY: the ping endpoint doesn't exist yet, so errors are swallowed
// — nothing surfaces to the user and there's no red console spew.

import { useEffect } from "react";
import { pingPresence } from "../services/stats.service";
import { getDeviceId } from "../utils/deviceId";

const PING_MS = 45_000;

export function usePresence(): void {
  useEffect(() => {
    const deviceId = getDeviceId();
    let timer: ReturnType<typeof setInterval> | undefined;

    const ping = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        await pingPresence(deviceId);
      } catch {
        /* endpoint missing / offline — stay silent, try again next beat */
      }
    };

    const start = () => { if (!timer) timer = setInterval(ping, PING_MS); };
    const stop  = () => { if (timer) { clearInterval(timer); timer = undefined; } };

    const onVisibility = () => {
      if (document.visibilityState === "visible") { ping(); start(); }
      else stop();
    };

    ping();   // immediate first beat
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
