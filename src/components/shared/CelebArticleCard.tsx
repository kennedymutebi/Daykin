import React from "react";
import { useTheme } from "@mui/material/styles";
import { SERIF } from "./constants";
import { CreatorHeader } from "./CreatorHeader";
import { AudioControls } from "./AudioControls";
import { EngagementBar } from "./EngagementBar";
import type { Article } from "../../types/article";
import type { AudioState } from "../../hooks/useAudio";

interface Props {
  article: Article;
  onOpen: (a: Article) => void;
  audio: AudioState;
}

export const CelebArticleCard: React.FC<Props> = ({ article, onOpen, audio }) => {
  const theme = useTheme();
  

  // Fallback to theme's primary color if categoryColor is undefined
  const accent = article.categoryColor ?? theme.palette.primary.main;

  return (
    <article
      style={{
        display: "flex", flexDirection: "column",
        borderBottom: `1px solid ${theme.palette.divider}`,
        paddingBottom: "2rem",
      }}
    >
      <CreatorHeader article={article} />

      {/* Image */}
      <div
        onClick={() => onOpen(article)}
        style={{
          width: "100%", aspectRatio: "16/9",
          overflow: "hidden", marginBottom: "1rem",
          borderRadius: 8, cursor: "pointer",
        }}
      >
        <img
          src={article.img}
          alt={article.title}
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", display: "block",
            transition: "transform 0.4s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        />
      </div>

      {/* Category */}
      <span
        style={{
          fontFamily: SERIF, fontSize: "0.72rem",
          letterSpacing: "0.04em", textTransform: "uppercase",
          color: accent, marginBottom: "0.5rem",
        }}
      >
        🎂 {article.category}
      </span>

      {/* Title */}
      <h2
        onClick={() => onOpen(article)}
        style={{
          fontFamily: SERIF, fontSize: "1.2rem", fontWeight: 700,
          lineHeight: 1.3, color: theme.palette.text.primary,
          marginBottom: "0.6rem", cursor: "pointer",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = accent)}
        onMouseLeave={e => (e.currentTarget.style.color = theme.palette.text.primary)}
      >
        {article.title}
      </h2>

      {/* Excerpt */}
      <p
        onClick={() => onOpen(article)}
        style={{
          fontFamily: SERIF, fontSize: "0.9rem",
          color: theme.palette.text.secondary,
          lineHeight: 1.58, marginBottom: "0.9rem",
          display: "-webkit-box", WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical", overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {article.excerpt}
      </p>

      <p
        style={{
          fontFamily: SERIF, fontSize: "0.82rem",
          color: theme.palette.text.disabled,
          marginBottom: "0.75rem",
        }}
      >
        {article.readTime}
      </p>

      <AudioControls articleId={article.id} audio={audio} color={accent} />
      <EngagementBar engagement={article.engagement} color={accent} />
    </article>
  );
};