import React from "react";
import { useTheme } from "@mui/material/styles";
import { SERIF } from "./constants";
import type { Article } from "../../types/article";

type Props = {
  article: Pick<Article, "author" | "date" | "categoryColor" | "verified" | "creatorImg">;
};

export const CreatorHeader: React.FC<Props> = ({ article }) => {
  const theme  = useTheme();
  const accent = article.categoryColor ?? theme.palette.primary.main;

  const { name, initials, verified: authorVerified, avatarUrl } = article.author;

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

      <button
        style={{
          fontFamily: SERIF, fontSize: "0.78rem", fontWeight: 700,
          color: accent, background: "transparent",
          border: `1px solid ${accent}`,
          padding: "0.28rem 0.75rem", borderRadius: 2,
          cursor: "pointer", whiteSpace: "nowrap",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = accent + "22")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        Subscribe
      </button>
    </div>
  );
};