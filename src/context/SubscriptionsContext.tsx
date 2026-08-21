// src/context/SubscriptionsContext.tsx
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";
import {
  getMySubscriptions,
  subscribeToAuthor,
  unsubscribeFromAuthor,
  type Subscription,
} from "../services/subscriptions.service";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/api.service";

interface SubscriptionsContextValue {
  subscriptions: Subscription[];
  loading: boolean;
  isSubscribed: (authorId: number) => boolean;
  toggleSubscribe: (authorId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null);

export const SubscriptionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setSubscriptions([]);
      return;
    }
    setLoading(true);
    try {
      setSubscriptions(await getMySubscriptions());
    } catch {
      // non-critical — leave whatever we already had rather than blank the UI
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refetch whenever the logged-in user changes (login/logout/switch account)
  useEffect(() => { refresh(); }, [refresh]);

  const subscribedIds = useMemo(
    () => new Set(subscriptions.map((s) => s.author.id)),
    [subscriptions],
  );

  const isSubscribed = useCallback(
    (authorId: number) => subscribedIds.has(authorId),
    [subscribedIds],
  );

  const toggleSubscribe = useCallback(async (authorId: number) => {
    // Auth guard — subscribing/unsubscribing requires a logged-in user.
    // Throw a clear ApiError so callers can surface the message.
    if (!user) {
      throw new ApiError("Please log in to subscribe.", 401, null);
    }

    const wasSubscribed = subscribedIds.has(authorId);

    // Optimistic update so the button flips instantly
    setSubscriptions((prev) =>
      wasSubscribed
        ? prev.filter((s) => s.author.id !== authorId)
        : [
            ...prev,
            {
              id: -Date.now(), // temp id, replaced by refresh() below
              author: { id: authorId, name: "…", initials: "" },
              createdAt: new Date().toISOString(),
            },
          ],
    );

    try {
      if (wasSubscribed) {
        await unsubscribeFromAuthor(authorId);
      } else {
        await subscribeToAuthor(authorId);
        await refresh(); // swap the placeholder for the real author details
      }
    } catch (err) {
      await refresh(); // revert to server truth on failure
      throw err;
    }
  }, [user, subscribedIds, refresh]);

  const value: SubscriptionsContextValue = {
    subscriptions, loading, isSubscribed, toggleSubscribe, refresh,
  };

  return (
    <SubscriptionsContext.Provider value={value}>
      {children}
    </SubscriptionsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- context hook intentionally co-located with its provider; Fast Refresh DX only
export function useSubscriptions(): SubscriptionsContextValue {
  const ctx = useContext(SubscriptionsContext);
  if (!ctx) throw new Error("useSubscriptions must be used within a SubscriptionsProvider");
  return ctx;
}