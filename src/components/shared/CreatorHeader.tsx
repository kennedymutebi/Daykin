import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { SERIF } from "./constants";
import { useAuth } from "../../hooks/useAuth";
import { useSubscriptions } from "../../context/SubscriptionsContext";
import { ApiError } from "../../services/api.service";
import type { Article } from "../../types/article";

type Props = {
  // CHANGED: added authorId (optional so this still compiles even if a
  // particular Article instance doesn't carry one yet). Ideally add
  // `authorId?: number;` to the shared Article type in ../../types/article
  // and drop the intersection below.
  article: Pick<Article, "author" | "date" | "categoryColor" | "verified" | "creatorImg"> & {
    authorId?: number;
  };
};

export const CreatorHeader: React.FC<Props> = ({ article }) => {
  const theme  = useTheme();
  const accent = article.categoryColor ?? theme.palette.primary.main;

  const { name, initials, verified: authorVerified, avatarUrl } = article.author;

  const { user } = useAuth();
  const { isSubscribed, toggleSubscribe } = useSubscriptions();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const authorId = article.authorId;
  const isOwnPost = authorId !== undefined && user?.id !== undefined
    && Number(user.id) === Number(authorId);

  // Can't subscribe to yourself, and need to know who the author actually is
  const showButton = authorId !== undefined && !isOwnPost;
  const subscribed = authorId !== undefined && isSubscribed(authorId);

  const handleClick = async () => {
    if (!user) {
      setMsg("Please log in to subscribe.");
      return;
    }
    if (authorId === undefined || busy) return;

    setBusy(true);
    setMsg(null);
    try {
      await toggleSubscribe(authorId);
    } catch (err: unknown) {
      // toggleSubscribe already reverts the optimistic state on failure;
      // surface a clear message instead of failing silently.
      setMsg(err instanceof ApiError ? err.firstError : "Could not update subscription. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between", marginBottom: "0.85rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
        {(article.creatorImg ?? avatarUrl) ? (
          <img
            src={article.creatorImg ?? avatarUrl}
            alt={name}
            style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: accent, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontFamily: SERIF, fontSize: "0.75rem",
            color: "#fff", fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
        )}

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{
              fontFamily: SERIF, fontSize: "0.88rem",
              color: theme.palette.text.primary,
              fontWeight: 600, lineHeight: 1.2,
            }}>
              {name}
            </span>
            {(authorVerified ?? article.verified) && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill={accent} style={{ flexShrink: 0 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z" />
              </svg>
            )}
          </div>
          <span style={{
            fontFamily: SERIF, fontSize: "0.72rem",
            color: theme.palette.text.disabled, lineHeight: 1.2,
          }}>
            {article.date}
          </span>
        </div>
      </div>

      {/* CHANGED: real Subscribe/Unsubscribe toggle instead of static markup.
          Filled style when subscribed, outline when not — same accent color
          scheme as before, just reflecting real state now. */}
      {showButton && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
          <button
            onClick={handleClick}
            disabled={busy}
            style={{
              fontFamily: SERIF, fontSize: "0.78rem", fontWeight: 700,
              color: subscribed ? "#fff" : accent,
              background: subscribed ? accent : "transparent",
              border: `1px solid ${accent}`,
              padding: "0.28rem 0.75rem", borderRadius: 2,
              cursor: busy ? "default" : "pointer", whiteSpace: "nowrap",
              opacity: busy ? 0.7 : 1,
              transition: "background 0.15s, color 0.15s, opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!subscribed) e.currentTarget.style.background = accent + "22";
            }}
            onMouseLeave={(e) => {
              if (!subscribed) e.currentTarget.style.background = "transparent";
            }}
          >
            {subscribed ? "Unsubscribe" : "Subscribe"}
          </button>
          {msg && (
            <span style={{
              fontFamily: SERIF, fontSize: "0.68rem",
              color: theme.palette.error.main, maxWidth: 180, textAlign: "right",
            }}>
              {msg}
            </span>
          )}
        </div>
      )}
    </div>
  );
};