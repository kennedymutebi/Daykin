// ─────────────────────────────────────────────────────────────────────────────
// useStats — live hero numbers + online presence list (READ side)
// ─────────────────────────────────────────────────────────────────────────────
// Fetches GET /api/stats/ and GET /api/presence/online/ on mount and every ~60s
// while the tab is visible. The two endpoints are fetched INDEPENDENTLY so that
// whichever ships first on the backend starts working on its own.
//
// FAILS SILENTLY: neither endpoint exists yet. On failure the corresponding
// slice is left untouched — last-known value is preserved across refreshes, and
// stays `null` until the endpoint ever succeeds. The hero hides whatever's null.

import { useEffect, useRef, useState, useCallback } from "react";
import { getStats, getOnline } from "../services/stats.service";
import type { SiteStats, OnlinePresence } from "../types/api";

const REFRESH_MS = 60_000;

export function useStats(): { stats: SiteStats | null; online: OnlinePresence | null } {
  const [stats,  setStats]  = useState<SiteStats | null>(null);
  const [online, setOnline] = useState<OnlinePresence | null>(null);

  // Guards against setState firing after the hook has unmounted (e.g. the
  // user navigates away while a fetch from refresh() is still in flight).
  // Set to true in the effect's cleanup below.
  const unmountedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const s = await getStats();
      if (!unmountedRef.current && s && typeof s === "object") setStats(s);
    } catch {
      /* /api/stats/ missing — keep last-known value */
    }

    try {
      const o = await getOnline();
      if (!unmountedRef.current && o && typeof o === "object" && Array.isArray(o.users)) {
        setOnline(o);
      }
    } catch {
      /* /api/presence/online/ missing — keep last-known value */
    }
  }, []);

  useEffect(() => {
    unmountedRef.current = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh() is
    // async; its setState calls happen after `await getStats()`/`await getOnline()`,
    // not synchronously during this effect's execution. This is the standard
    // fetch-on-mount-and-poll pattern.
    refresh();
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      if (!timer) {
        timer = setInterval(() => {
          if (document.visibilityState === "visible") refresh();
        }, REFRESH_MS);
      }
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = undefined; } };

    const onVisibility = () => {
      if (document.visibilityState === "visible") { refresh(); start(); }
      else stop();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      unmountedRef.current = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return { stats, online };
}