// src/components/shared/ArticleModal.tsx
import React, { useRef, useEffect } from "react";
import { SERIF } from "./constants";
import { CreatorHeader } from "./CreatorHeader";
import { EngagementBar } from "./EngagementBar";
import { PlayIcon, PauseIcon } from "./AudioControls";
import type { Article } from "../../types/article";
import type { AudioState } from "../../hooks/useAudio";

interface Props {
  article: Article;
  onClose: () => void;
  audio: AudioState;
  onLike?: (apiId: number) => void;    // ← NEW
  onShare?: (apiId: number) => void;   // ← NEW
}

export const ArticleModal: React.FC<Props> = ({ article, onClose, audio, onLike, onShare }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const isPlaying  = audio.articleId === article.id && audio.playing;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // FIX: resolve full image URL (guard against relative paths)
  const imgSrc = article.img?.startsWith("http")
    ? article.img
    : article.img
      ? `${import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ?? "http://localhost:8000"}${article.img}`
      : "/placeholder.png";

  return (
    <div
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
        zIndex: 1300,                   // ← FIX: high enough to cover MUI AppBar (z=1100)
        overflowY: "auto", overflowX: "hidden",
        display: "flex",
        alignItems: "flex-start", justifyContent: "center",
        padding: "3rem 1rem",
      }}
    >
      <div style={{
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.1)",
        maxWidth: 720, width: "100%",
        padding: "3rem 2.5rem 4rem",
        position: "relative", margin: "auto",
        borderRadius: "12px",
        overflow: "hidden",           // ← FIX: stops content bleeding out
        boxSizing: "border-box",
      }}>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "1rem", right: "1.2rem",
            background: "none", border: "none", fontSize: "1.3rem",
            cursor: "pointer", color: "rgba(255,255,255,0.4)",
            lineHeight: 1, fontFamily: SERIF,
          }}
        >✕</button>

        <div style={{ marginBottom: "1.25rem" }}>
          <CreatorHeader article={article} />
        </div>

        <span style={{
          fontFamily: SERIF, fontSize: "0.72rem",
          letterSpacing: "0.06em", textTransform: "uppercase",
          color: article.categoryColor ?? "#F59E0B",
          display: "block", marginBottom: "1rem",
        }}>
          {article.category}
        </span>

        <h2 style={{
          fontFamily: SERIF,
          fontSize: "clamp(1.5rem, 3.5vw, 2.1rem)",
          fontWeight: 700, lineHeight: 1.2, color: "#fff",
          marginBottom: "1rem", maxWidth: 640,
          wordBreak: "break-word", overflowWrap: "anywhere",
        }}>
          {article.title}
        </h2>

        <p style={{
          fontFamily: SERIF, fontSize: "0.85rem",
          color: "rgba(255,255,255,0.35)", marginBottom: "1.5rem",
        }}>
          {article.readTime}
        </p>

        {/* Audio player — only show if audio URL exists or for demo */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.8rem",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "0.7rem 1rem", marginBottom: "1.8rem", borderRadius: 2,
        }}>
          <button
            onClick={() => audio.toggle(article.id, article.audio ?? undefined)}  // ← FIX: pass audioUrl
            style={{
              background: "#fff", border: "none", borderRadius: "50%",
              width: 36, height: 36, display: "flex",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#0D0D0D", flexShrink: 0,
            }}
          >
            {isPlaying ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
          </button>
          <div style={{ flex: 1 }}>
            <input
              type="range" min={0} max={100} step={0.5}
              value={audio.articleId === article.id ? audio.progress : 0}
              onChange={e => audio.seek(e.target.value)}
              style={{
                width: "100%",
                accentColor: article.categoryColor ?? "#F59E0B",
                cursor: "pointer",
              }}
            />
          </div>
          <span style={{
            fontFamily: SERIF, fontSize: "0.75rem",
            color: "rgba(255,255,255,0.35)", minWidth: 80, textAlign: "right",
          }}>
            {audio.fmt(audio.articleId === article.id ? audio.elapsed : 0)}
            {" / "}{audio.fmt(audio.DURATION)}
          </span>
        </div>

        {/* Image — FIX: uses resolved full URL */}
        <img
          src={imgSrc}
          alt={article.title}
          onError={e => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
          style={{
            width: "100%", maxHeight: 360, objectFit: "cover",
            display: "block", marginBottom: "2rem", borderRadius: "8px",
          }}
        />

        <div style={{ maxWidth: 640, wordBreak: "break-word", overflowWrap: "anywhere" }}>
          {(article.body && article.body.length > 0) ? (
            article.body.map((para, i) => (
              <p key={i} style={{
                fontFamily: SERIF, fontSize: "1.05rem",
                lineHeight: 1.68, color: "rgba(255,255,255,0.8)",
                marginBottom: "1.4em",
              }}>
                {para}
              </p>
            ))
          ) : (
            <p style={{
              fontFamily: SERIF, fontSize: "1.05rem",
              lineHeight: 1.68, color: "rgba(255,255,255,0.8)",
              marginBottom: "1.4em",
            }}>
              {article.content || article.excerpt}
            </p>
          )}
        </div>

        {/* FIX: wire up like/share callbacks */}
        <div style={{ maxWidth: 640 }}>
          <EngagementBar
            engagement={article.engagement}
            color={article.categoryColor ?? "#F59E0B"}
            onLike={onLike  ? () => onLike(article.apiId  ?? article.id) : undefined}
            onShare={onShare ? () => onShare(article.apiId ?? article.id) : undefined}
          />
        </div>
      </div>
    </div>
  );
};