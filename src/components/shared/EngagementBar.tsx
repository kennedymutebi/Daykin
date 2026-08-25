// src/components/shared/EngagementBar.tsx
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { SERIF } from "./constants";
import { useAuth } from "../../hooks/useAuth";
import { isStoryLiked, setStoryLiked, type LikeSource } from "../../utils/storyStorage";
import type { Engagement } from "../../types/article";

interface Props {
  engagement: Engagement;
  color: string;
  storyId?: number;                    // per-device like-persistence key
  source?: LikeSource;                 // namespaces the per-device like state
  initialLiked?: boolean;              // seed the filled heart from the caller
  onLike?: () => void | Promise<void | { likes?: number; liked?: boolean }>;
  onShare?: () => void;
  onComment?: () => void;      // ← ADDED
  onSubscribe?: () => void;
  isSubscribed?: boolean;
}

export const EngagementBar: React.FC<Props> = ({
  engagement,
  color,
  storyId,
  source = "love_story",
  initialLiked = false,
  onLike,
  onShare,
  onComment,                   // ← ADDED
  onSubscribe,
  isSubscribed = false,
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  // The filled heart is per-device (localStorage); the count is the shared,
  // server-authoritative value the parent keeps in `engagement.likes`.
  const [liked,      setLiked]      = useState<boolean>(
    () => initialLiked || (storyId !== undefined && isStoryLiked(storyId, source)),
  );
  const [localLikes, setLocalLikes] = useState<number>(engagement.likes ?? 0);
  const [shared,     setShared]     = useState(false);
  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [authMsg,    setAuthMsg]    = useState<string | null>(null);

  // While a like is in flight, don't let a parent refresh (poll / reopen)
  // overwrite the optimistic count with a stale value.
  const likePending = useRef(false);

  // Keep the count in sync with parent refreshes (reconcile after a like,
  // background polling, reopening the modal) without clobbering local liked state.
  useEffect(() => {
    if (likePending.current) return;
    setLocalLikes(engagement.likes ?? 0);
  }, [engagement.likes]);

  // Keep the local subscribed flag in sync when the prop changes (e.g. the
  // SubscriptionsContext finishes loading, or the user subscribes elsewhere).
  useEffect(() => { setSubscribed(isSubscribed); }, [isSubscribed]);

  const idle = theme.palette.text.secondary;

  const btn: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "0.35rem",
    background: "none", border: "none", cursor: "pointer",
    fontFamily: SERIF, fontSize: "0.82rem", padding: "0.2rem 0",
    transition: "color 0.15s",
  };

  const handleLike = async () => {
    if (likePending.current) return;
    if (!user) { setAuthMsg("Please log in to like this article."); return; }
    setAuthMsg(null);

    const next = !liked;
    // Optimistic, per-device flip. The filled heart is the user's own marker
    // and stays lit as proof; the count reconciles to the server value below
    // (and via the parent refresh flowing in through the useEffect above).
    setLiked(next);
    setLocalLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    if (storyId !== undefined) setStoryLiked(storyId, next, source);

    likePending.current = true;
    try {
      const res = await onLike?.();
      if (res && typeof res.likes === "number") setLocalLikes(res.likes);
      if (res && typeof res.liked === "boolean") {
        setLiked(res.liked);
        if (storyId !== undefined) setStoryLiked(storyId, res.liked, source);
      }
    } catch {
      // Keep the heart lit as the user's local proof; the parent refresh
      // reconciles the shared count from the server.
    } finally {
      likePending.current = false;
    }
  };

  const handleShare = () => {
    const nowShared = !shared;
    setShared(nowShared);
    if (nowShared) onShare?.();
  };

  const handleSubscribe = () => {
    if (!user) { setAuthMsg("Please log in to subscribe."); return; }
    setAuthMsg(null);
    setSubscribed((s) => !s);
    onSubscribe?.();
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.25rem",
      borderTop: `1px solid ${theme.palette.divider}`,
      paddingTop: "0.7rem", marginTop: "0.6rem",
    }}>
      {/* Like */}
      <button onClick={handleLike} style={{ ...btn, color: liked ? color : idle, marginRight: "0.75rem" }}>
        <svg width="16" height="16" viewBox="0 0 24 24"
          fill={liked ? color : "none"}
          stroke={liked ? color : "currentColor"} strokeWidth="1.8">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {localLikes}
      </button>

      {/* Comment — NOW WIRED UP */}
      <button onClick={onComment} style={{ ...btn, color: idle, marginRight: "0.75rem" }}>
        <svg width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {engagement.comments}
      </button>

      {/* Share */}
      <button onClick={handleShare} style={{ ...btn, color: shared ? "#22c55e" : idle, marginRight: "0.75rem" }}>
        <svg width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        {engagement.shares + (shared ? 1 : 0)}
      </button>

      {/* Subscribe button */}
      {onSubscribe && (
        <button
          onClick={handleSubscribe}
          style={{
            ...btn,
            marginLeft: "auto",
            padding: "0.25rem 0.7rem",
            borderRadius: "20px",
            border: `1px solid ${subscribed ? color : theme.palette.divider}`,
            color: subscribed ? color : idle,
            fontSize: "0.75rem",
            fontWeight: 600,
            background: subscribed ? `${color}18` : "none",
            transition: "all 0.2s",
          }}
        >
          {subscribed ? "✓ Subscribed" : "Subscribe"}
        </button>
      )}

      {/* Upload/share icon */}
      {!onSubscribe && (
        <button style={{ ...btn, color: idle, marginLeft: "auto" }}>
          <svg width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      )}

      {/* Auth-required feedback (e.g. guest tapped Like / Subscribe) */}
      {authMsg && (
        <span style={{
          flexBasis: "100%",
          color: theme.palette.error.main,
          fontFamily: SERIF,
          fontSize: "0.75rem",
          marginTop: "0.4rem",
        }}>
          {authMsg}
        </span>
      )}
    </div>
  );
};