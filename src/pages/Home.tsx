// src/pages/Home.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Fully API-integrated Home page
// • Articles fetched from /api/articles/ AND /api/love-stories/, merged into
//   one feed sorted by created_at (Love Stories are written via the composer
//   on the Love Stories page, but should also surface here)
// • Category filter tabs work across both sources ("Love Stories" tab filters
//   to just the love-stories source; other tabs filter /articles/ by category)
// • Today's birthdays from /api/celebrities/birthdays-today/
// • Like / Share wired to the correct endpoint depending on item source,
//   with optimistic UI updates
// • Skeleton loading states while fetching
// • ApiError surfaces as a dismissible inline alert
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box, Typography, Button, Stack, Avatar, AvatarGroup,
  Divider, Skeleton, Chip, Alert, Collapse,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CakeIcon from "@mui/icons-material/Cake";
import RefreshIcon from "@mui/icons-material/Refresh";

import { CreatorHeader } from "../components/shared/CreatorHeader";
import { EngagementBar } from "../components/shared/EngagementBar";
import { AudioControls } from "../components/shared/AudioControls";
import { ArticleModal } from "../components/shared/ArticleModal";
import PostComposer, { MediumReactionBar, isStoryLiked } from "../components/shared/PostComposer";
import type { Comment } from "../components/shared/ReactionMessenger";
import { useAudio } from "../hooks/useAudio";
import { useAuth } from "../hooks/useAuth";

// ── API services ──────────────────────────────────────────────────────────────
import {
  getArticles,
  likeArticle,
  shareArticle,
  getBirthdaysToday,
} from "../services";
import {
  getLoveStories,
  likeLoveStory,
  shareLoveStory,
  submitLoveStory,
  addLoveStoryComment,
  getStoryComments,
} from "../services/loveStories.service";
import { ApiError } from "../services/api.service";

// ── API types ─────────────────────────────────────────────────────────────────
import type {
  Article as ApiArticle,
  Celebrity,
  ArticleCategory,
  LoveStory as ApiLoveStory,
} from "../types/api";

// ── Local Article type used by existing components ────────────────────────────
// Your existing components (CreatorHeader, EngagementBar, AudioControls,
// ArticleModal) use a local Article type from ../types/article.
// We map both API responses into that shape below.
import type { Article } from "../types/article";
import type { Writer } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LOVE_STORY_COLOR = "#EC407A";

const MEDIA_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace("/api", "") ??
  "http://localhost:8000";

/**
 * Every merged item remembers where it came from, so like/share/open
 * actions can be routed to the right backend endpoint.
 */
type FeedSource = "article" | "love_story";

interface FeedItem {
  source: FeedSource;
  apiId: number;
  article: Article;
}

const SERIF = "'Playfair Display', Georgia, serif";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function resolveImg(img: string | null | undefined): string {
  if (!img) return "/placeholder.png";
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  return `${MEDIA_BASE}${img}`;
}

/** Map a generic API article → local Article shape expected by existing components */
function mapApiArticle(a: ApiArticle): Article {
  return {
    id: a.id,  // number — matches Article.id
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    category: a.category,
    categoryColor: categoryColor(a.category),
    img: resolveImg(a.image),
    audio: a.audio ?? undefined,
    readTime: `${Math.ceil(a.content.split(" ").length / 200)} min read`,
    createdAt: a.created_at,
    date: new Date(a.created_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    }),
    author: {
      name: `${a.author.first_name} ${a.author.last_name}`.trim() || a.author.username,
      initials: (
        (a.author.first_name?.[0] ?? "") + (a.author.last_name?.[0] ?? "")
      ).toUpperCase() || a.author.username.slice(0, 2).toUpperCase(),
      role: "Writer",
      verified: false,
    },
    engagement: {
      likes: a.likes,
      shares: a.shares,
      comments: a.comments,
    },
    isEditorsPick: a.is_editors_pick,
  };
}

/** Map a love story → the same local Article shape so it can sit in the same grid */
function mapLoveStoryToArticle(s: ApiLoveStory): Article {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = s as any;
  return {
    id: s.id,
    title: s.title,
    excerpt: s.excerpt,
    content: s.content,
    category: "love_story",
    categoryColor: LOVE_STORY_COLOR,
    img: resolveImg(s.image),
    audio: raw.audio_url ?? undefined,
    readTime: s.read_time ?? `${Math.ceil(s.content.split(" ").length / 200)} min read`,
    createdAt: s.created_at,
    date: new Date(s.created_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    }),
    author: {
      name: s.author_name || "Anonymous",
      initials: raw.author_info?.avatar || (s.author_name ?? "AN").slice(0, 2).toUpperCase(),
      role: "Writer",
      verified: raw.author_info?.verified ?? false,
    },
    engagement: {
      likes: s.likes,
      shares: s.shares,
      comments: s.comments,
    },
    isEditorsPick: raw.is_editors_pick ?? false,
  };
}

function categoryColor(cat: ArticleCategory): string {
  const map: Record<ArticleCategory, string> = {
    birthday:   "#F5A623",
    sports:     "#43A047",
    love_story: LOVE_STORY_COLOR,
    charity:    "#1565C0",
    general:    "#7C3AED",
  };
  return map[cat] ?? "#F5A623";
}

function categoryLabel(cat: ArticleCategory): string {
  const map: Record<ArticleCategory, string> = {
    birthday:   "Birthdays",
    sports:     "Sports",
    love_story: "Love Stories",
    charity:    "Charity",
    general:    "General",
  };
  return map[cat] ?? cat;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static writers for hero avatar strip
// ─────────────────────────────────────────────────────────────────────────────

const WRITERS: Writer[] = [
  { id: "1", name: "James Osei",     initials: "JO", role: "Staff Writer",        followers: "3.2k", color: "#E53935", verified: true },
  { id: "2", name: "Amara Diallo",   initials: "AD", role: "Community Writer",    followers: "1.8k", color: "#F5A623" },
  { id: "3", name: "Sofia Mensah",   initials: "SM", role: "Love Stories Editor", followers: "2.5k", color: "#EC407A" },
  { id: "4", name: "Kwame Asante",   initials: "KA", role: "Sports Contributor",  followers: "4.1k", color: "#43A047" },
  { id: "5", name: "Fatima Al-Said", initials: "FA", role: "Community Writer",    followers: "1.2k", color: "#1565C0" },
  { id: "6", name: "David Nkrumah",  initials: "DN", role: "Sports Writer",       followers: "5.7k", color: "#7C3AED", verified: true },
];

const STATS = [
  { value: "24k+",   label: "Members" },
  { value: "8,400+", label: "Stories Published" },
  { value: "4",      label: "Content Sections" },
];

const CATEGORIES: Array<{ value: ArticleCategory | "all"; label: string }> = [
  { value: "all",        label: "All" },
  { value: "birthday",   label: "Birthdays" },
  { value: "sports",     label: "Sports" },
  { value: "love_story", label: "Love Stories" },
  { value: "charity",    label: "Charity" },
  { value: "general",    label: "General" },
];

// ─────────────────────────────────────────────────────────────────────────────
// ArticleCardSkeleton
// ─────────────────────────────────────────────────────────────────────────────

const ArticleCardSkeleton: React.FC = () => {
  const theme = useTheme();
  return (
    <div style={{
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
      padding: "1.5rem",
    }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Skeleton variant="circular" width={38} height={38} />
        <Box flex={1}>
          <Skeleton width="50%" height={14} />
          <Skeleton width="35%" height={12} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
      <Skeleton variant="rectangular" width="100%" sx={{ aspectRatio: "16/9", borderRadius: 1, mb: 1.5 }} />
      <Skeleton width="30%" height={12} sx={{ mb: 0.5 }} />
      <Skeleton width="80%" height={20} sx={{ mb: 0.5 }} />
      <Skeleton width="60%" height={20} sx={{ mb: 1.5 }} />
      <Skeleton width="100%" height={12} />
      <Skeleton width="90%"  height={12} />
      <Skeleton width="70%"  height={12} sx={{ mb: 1.5 }} />
      <Box display="flex" gap={2}>
        <Skeleton width={60} height={32} />
        <Skeleton width={60} height={32} />
        <Skeleton width={60} height={32} />
      </Box>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ArticleCard
// ─────────────────────────────────────────────────────────────────────────────

const ArticleCard: React.FC<{
  article: Article;
  apiId: number;                           // real backend ID for like/share
  onOpen: (a: Article) => void;
  audio: ReturnType<typeof useAudio>;
  onLike: (apiId: number) => void;
  onShare: (apiId: number) => void;
}> = ({ article, apiId, onOpen, audio, onLike, onShare }) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gold   = theme.palette.gold?.main ?? "#F5A623";
  const accent = article.categoryColor ?? gold;

  return (
    <article style={{
      display: "flex", flexDirection: "column",
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
      padding: "1.5rem",
    }}>
      <CreatorHeader article={article} />

      {/* Thumbnail */}
      <div
        onClick={() => onOpen(article)}
        style={{
          width: "100%", aspectRatio: "16/9",
          overflow: "hidden", marginBottom: "1rem",
          position: "relative", cursor: "pointer",
          borderRadius: theme.shape.borderRadius,
        }}
      >
        <img
          src={article.img}
          alt={article.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        />
        {/* Bookmark badge */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: `${gold}26`, borderRadius: "50%",
          width: 32, height: 32,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={gold}>
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </div>
      </div>

      {/* Category */}
      <span style={{
        fontFamily: theme.typography.fontFamily,
        fontSize: "0.72rem", letterSpacing: "0.04em",
        textTransform: "uppercase", color: accent,
        marginBottom: "0.5rem",
        display: "flex", alignItems: "center", gap: "0.4rem",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill={accent}>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
        {categoryLabel(article.category as ArticleCategory)}
      </span>

      {/* Title */}
      <h2
        onClick={() => onOpen(article)}
        style={{
          fontFamily: theme.typography.fontFamily,
          fontSize: "1.2rem", fontWeight: 700, lineHeight: 1.3,
          color: theme.palette.text.primary,
          marginBottom: "0.6rem", cursor: "pointer", transition: "color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = theme.palette.text.primary; }}
      >
        {article.title}
      </h2>

      {/* Excerpt */}
      <p
        onClick={() => onOpen(article)}
        style={{
          fontFamily: theme.typography.fontFamily,
          fontSize: "0.9rem", color: theme.palette.text.secondary,
          lineHeight: 1.58, marginBottom: "0.9rem", cursor: "pointer",
          display: "-webkit-box",
          WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}
      >
        {article.excerpt}
      </p>

      <p style={{
        fontFamily: theme.typography.fontFamily,
        fontSize: "0.82rem", color: theme.palette.text.secondary,
        marginBottom: "0.75rem", opacity: 0.6,
      }}>
        {article.readTime}
      </p>

      <AudioControls articleId={article.id} audio={audio} color={accent} />

      {/* Engagement bar — pass callbacks so parent updates counts */}
      <EngagementBar
        engagement={article.engagement}
        color={accent}
        onLike={() => onLike(apiId)}
        onShare={() => onShare(apiId)}
      />
    </article>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LoveStoryCard — used only for feed items where source === "love_story".
// Mirrors the card used on the Love Stories page itself: bordered box,
// pink accent, and a full MediumReactionBar so comments actually work here.
// ─────────────────────────────────────────────────────────────────────────────

const LoveStoryCard: React.FC<{
  article: Article;
  apiId: number;
  onOpen: (a: Article) => void;
  audio: ReturnType<typeof useAudio>;
  onLike: (apiId: number) => Promise<void>;
  onShare: (apiId: number) => Promise<void>;
  onCommentSubmit: (apiId: number, text: string) => Promise<void>;
  onFetchComments: (apiId: number) => Promise<Comment[]>;
  currentUser: { name: string; initials: string; avatarColor?: string; id?: number };
}> = ({
  article, apiId, onOpen, audio,
  onLike, onShare, onCommentSubmit, onFetchComments,
  currentUser,
}) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = article.categoryColor ?? LOVE_STORY_COLOR;

  return (
    <article style={{
      display: "flex", flexDirection: "column",
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
      padding: "1.5rem",
    }}>
      <CreatorHeader article={article} />

      {/* Category pill */}
      <span style={{
        fontFamily: SERIF, fontSize: "0.68rem", letterSpacing: "0.04em",
        textTransform: "uppercase", color: accent,
        marginBottom: "0.6rem", display: "inline-block",
      }}>
        {categoryLabel("love_story")}
      </span>

      {/* Thumbnail */}
      {article.img && article.img !== "/placeholder.png" && (
        <div
          onClick={() => onOpen(article)}
          style={{
            width: "100%", aspectRatio: "16/9",
            overflow: "hidden", marginBottom: "1rem",
            cursor: "pointer", borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette.action.hover,
          }}
        >
          <img
            src={article.img}
            alt={article.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          />
        </div>
      )}

      {/* Title */}
      <h2
        onClick={() => onOpen(article)}
        style={{
          fontFamily: SERIF, fontSize: "1.2rem", fontWeight: 700, lineHeight: 1.3,
          color: theme.palette.text.primary,
          marginBottom: "0.6rem", cursor: "pointer", transition: "color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = accent; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = theme.palette.text.primary; }}
      >
        {article.title}
      </h2>

      {/* Excerpt */}
      <p
        onClick={() => onOpen(article)}
        style={{
          fontFamily: SERIF, fontSize: "0.9rem", color: theme.palette.text.secondary,
          lineHeight: 1.58, marginBottom: "0.9rem", cursor: "pointer",
          display: "-webkit-box",
          WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}
      >
        {article.excerpt}
      </p>

      <AudioControls articleId={article.id} audio={audio} color={accent} />

      {/* Full reaction bar — like, comment (working), share */}
      <MediumReactionBar
        storyId={apiId}
        likes={article.engagement.likes}
        comments={article.engagement.comments}
        shares={article.engagement.shares}
        liked={isStoryLiked(apiId)}
        accentColor={accent}
        currentUser={currentUser}
        onLike={onLike}
        onShare={onShare}
        onCommentSubmit={onCommentSubmit}
        onFetchComments={onFetchComments}
      />
    </article>
  );
};



const BirthdayStrip: React.FC<{ celebrities: Celebrity[] }> = ({ celebrities }) => {
  const theme = useTheme();
  const gold  = theme.palette.gold?.main ?? "#F5A623";
  if (!celebrities.length) return null;

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${gold}44`,
        borderRadius: theme.shape.borderRadius,
        p: { xs: 2, md: 3 },
        mb: 4,
        display: "flex", flexWrap: "wrap",
        alignItems: "center", gap: 2,
      }}
    >
      <Box display="flex" alignItems="center" gap={1} sx={{ color: gold }}>
        <CakeIcon fontSize="small" />
        <Typography fontWeight={700} fontSize="0.9rem" color={gold}>
          Birthdays Today
        </Typography>
      </Box>
      <Divider orientation="vertical" flexItem sx={{ borderColor: `${gold}33` }} />
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {celebrities.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            size="small"
            sx={{
              bgcolor: `${gold}18`,
              color: theme.palette.text.primary,
              fontSize: "0.78rem",
              fontWeight: 600,
              border: `1px solid ${gold}33`,
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hero (unchanged — always dark)
// ─────────────────────────────────────────────────────────────────────────────

const Hero: React.FC<{ onShareStory: () => void }> = ({ onShareStory }) => {
  const theme = useTheme();
  const gold  = theme.palette.gold?.main ?? "#F5A623";

  const HERO_BG      = "#1A1A2E";
  const HERO_TEXT    = "#F5F5F7";
  const HERO_MUTED   = "rgba(245,245,247,0.55)";
  const HERO_DIVIDER = "rgba(255,255,255,0.12)";

  return (
    <Box sx={{
      position: "relative",
      py: { xs: 6, sm: 8, md: 12, lg: 16 },
      px: { xs: 2, sm: 4, md: 6, lg: 10 },
      textAlign: "center", overflow: "hidden",
      minHeight: { xs: "85vh", md: "92vh" },
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: HERO_BG,
      backgroundImage: "url('/Hero.png')",
      backgroundSize: "cover", backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      "&::before": { content: '""', position: "absolute", inset: 0, backgroundColor: "rgba(26,26,46,0.55)", zIndex: 1 },
      "&::after":  {
        content: '""', position: "absolute", inset: 0,
        background: `linear-gradient(to right,${HERO_BG} 0%,transparent 30%,transparent 80%,${HERO_BG} 100%),linear-gradient(to bottom,${HERO_BG} 0%,transparent 12%,transparent 72%,${HERO_BG} 100%)`,
        zIndex: 2,
      },
    }}>
      <Box sx={{ position: "relative", zIndex: 3, maxWidth: "100%" }}>
        <Typography variant="h1" sx={{
          fontFamily: theme.typography.fontFamily, fontWeight: 900,
          fontSize: { xs: "1.85rem", sm: "2.6rem", md: "3.5rem", lg: "4.2rem", xl: "5rem" },
          color: gold,
          maxWidth: { xs: "100%", md: 700, lg: 860 },
          mx: "auto", mb: { xs: 1.5, md: 2 }, lineHeight: 1.1,
        }}>
          Stories, Birthdays,<br />Sports &amp; Community
        </Typography>

        <Typography sx={{
          fontFamily: theme.typography.fontFamily, color: HERO_MUTED,
          mb: { xs: 3, md: 4 },
          maxWidth: { xs: "100%", sm: 440, md: 520 }, mx: "auto",
          fontSize: { xs: "0.85rem", sm: "0.9rem", md: "1rem", lg: "1.05rem" },
          px: { xs: 1, sm: 0 },
        }}>
          Your home for celebrity birthdays, love stories, sports action and community support.
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1.5, sm: 2 }}
          justifyContent="center" alignItems="center" sx={{ px: { xs: 3, sm: 0 } }}>
          <Button variant="contained" color="primary" size="large" sx={{
            width: { xs: "100%", sm: "auto" },
            px: { xs: 3, sm: 4, md: 5 }, py: { xs: 1.2, md: 1.5 },
            fontFamily: theme.typography.fontFamily, fontWeight: 700,
            fontSize: { xs: "0.9rem", md: "1rem" },
          }}>Start Reading</Button>

          <Button variant="outlined" size="large" onClick={onShareStory} sx={{
            width: { xs: "100%", sm: "auto" },
            px: { xs: 3, sm: 4, md: 5 }, py: { xs: 1.2, md: 1.5 },
            fontFamily: theme.typography.fontFamily, fontWeight: 700,
            fontSize: { xs: "0.9rem", md: "1rem" },
            borderColor: "rgba(255,255,255,0.3)", color: HERO_TEXT,
            "&:hover": { borderColor: HERO_TEXT, bgcolor: "rgba(255,255,255,0.06)" },
          }}>Share Your Story</Button>
        </Stack>

        <Stack direction="row" spacing={{ xs: 2, sm: 4 }} justifyContent="center"
          mt={{ xs: 4, md: 6 }} flexWrap="wrap" gap={2}
          divider={<Divider orientation="vertical" flexItem sx={{ borderColor: HERO_DIVIDER }} />}>
          {STATS.map(s => (
            <Box key={s.label} textAlign="center">
              <Typography sx={{
                fontFamily: theme.typography.fontFamily, fontWeight: 800,
                fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.7rem", lg: "2rem" }, color: HERO_TEXT,
              }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ fontFamily: theme.typography.fontFamily, color: HERO_MUTED }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Box mt={{ xs: 3, md: 4 }} display="flex" justifyContent="center" alignItems="center" gap={1.5}>
          <AvatarGroup max={5} sx={{ "& .MuiAvatar-root": {
            width: { xs: 28, sm: 32, md: 38 }, height: { xs: 28, sm: 32, md: 38 },
            fontSize: { xs: "0.6rem", md: "0.72rem" }, border: `2px solid ${HERO_BG}`,
          }}}>
            {WRITERS.map(w => (
              <Avatar key={w.id} sx={{ bgcolor: w.color, fontFamily: theme.typography.fontFamily }}>
                {w.initials}
              </Avatar>
            ))}
          </AvatarGroup>
          <Typography variant="caption" sx={{ fontFamily: theme.typography.fontFamily, color: HERO_MUTED }}>
            Join 12,000+ writers
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 6; // how many merged items to reveal per "Load more" click

export default function AeonFeed() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gold   = theme.palette.gold?.main ?? "#F5A623";
  const audio  = useAudio();
  const { user: authUser } = useAuth();

  // composer accent uses the site's gold theme color, not a hardcoded purple,
  // so the "Share Your Story" box matches Home's palette
  const composerUser = authUser
    ? {
        id:          authUser.id,
        name:        authUser.name,
        initials:    authUser.initials,
        avatarSrc:   authUser.avatarSrc,
        color:       gold,
        avatarColor: gold,
      }
    : { name: "Guest", initials: "G", color: gold, avatarColor: gold };

  const composerRef = React.useRef<HTMLDivElement>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [posting, setPosting]           = useState(false);
  const [postError, setPostError]       = useState<string | null>(null);

  const handleShareStoryClick = () => {
    setComposerOpen(true);
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ── State ────────────────────────────────────────────────────────────────
  const [activeItem, setActiveItem] = useState<FeedItem | null>(null);
  const activeArticle = activeItem?.article ?? null;
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | "all">("all");

  // Raw merged feed (articles + love stories), always fetched in full then
  // paginated client-side via `visibleCount` — this keeps "Load more" simple
  // and correct across two independently-paginated backend sources.
  const [feed, setFeed]               = useState<FeedItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError]     = useState<string | null>(null);

  // Birthdays
  const [birthdays, setBirthdays]           = useState<Celebrity[]>([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(true);

  // ── Fetch + merge both sources ────────────────────────────────────────────
  const fetchFeed = useCallback(async () => {
    setFeedLoading(true);
    setFeedError(null);
    try {
      const [articlesRes, loveStoriesRes] = await Promise.allSettled([
        getArticles({ ordering: "-created_at" }),
        getLoveStories({ ordering: "-created_at" }),
      ]);

      const items: FeedItem[] = [];

      if (articlesRes.status === "fulfilled") {
        for (const a of articlesRes.value.results) {
          items.push({ source: "article", apiId: a.id, article: mapApiArticle(a) });
        }
      }

      if (loveStoriesRes.status === "fulfilled") {
        for (const s of loveStoriesRes.value.results) {
          items.push({ source: "love_story", apiId: s.id, article: mapLoveStoryToArticle(s) });
        }
      }

      // If BOTH sources failed, surface an error. If only one failed,
      // show what we have rather than blocking the whole feed.
      if (articlesRes.status === "rejected" && loveStoriesRes.status === "rejected") {
        const err = articlesRes.reason;
        setFeedError(err instanceof ApiError ? err.firstError : "Failed to load articles.");
      }

      items.sort(
        (a, b) => new Date(b.article.createdAt).getTime() - new Date(a.article.createdAt).getTime(),
      );

      setFeed(items);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.firstError : "Failed to load articles.";
      setFeedError(msg);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  // ── Fetch birthdays ───────────────────────────────────────────────────────
  useEffect(() => {
    getBirthdaysToday()
      .then(setBirthdays)
      .catch(() => {/* silently ignore — non-critical */})
      .finally(() => setBirthdaysLoading(false));
  }, []);

  // ── Reset pagination when category changes ───────────────────────────────
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory]);

  // ── Filter by active category (client-side, across the merged feed) ─────
  const filteredFeed = useMemo(() => {
    if (activeCategory === "all") return feed;
    return feed.filter((item) => item.article.category === activeCategory);
  }, [feed, activeCategory]);

  const visibleFeed = filteredFeed.slice(0, visibleCount);
  const hasMore = visibleCount < filteredFeed.length;

  const handleLoadMore = () => setVisibleCount((c) => c + PAGE_SIZE);

  // ── Composer: post a new love story from Home ─────────────────────────────
  const handlePost = useCallback(async (data: { title: string; text: string; mediaFiles?: File[] }) => {
    if (!data.title.trim() && !data.text.trim() && (!data.mediaFiles || data.mediaFiles.length === 0)) return;
    setPosting(true);
    setPostError(null);
    try {
      await submitLoveStory({
        title:      data.title.trim() || data.text.slice(0, 80),
        excerpt:    data.text.slice(0, 160),
        content:    data.text,
        mediaFiles: data.mediaFiles,
      });
      setComposerOpen(false);
      await fetchFeed();
    } catch (err: unknown) {
      setPostError(err instanceof ApiError
        ? err.firstError
        : "Failed to post story. Make sure you are logged in.");
    } finally {
      setPosting(false);
    }
  }, [fetchFeed]);

  // ── Comment submit (love stories only — articles have no comment endpoint) ─
  const handleCommentSubmit = useCallback(async (apiId: number, text: string) => {
    if (!text.trim()) return;
    const bump = (item: FeedItem) =>
      item.source === "love_story" && item.apiId === apiId
        ? { ...item, article: { ...item.article, engagement: { ...item.article.engagement, comments: item.article.engagement.comments + 1 } } }
        : item;
    setFeed((prev) => prev.map(bump));
    try {
      await addLoveStoryComment(apiId, text);
    } catch {
      const unbump = (item: FeedItem) =>
        item.source === "love_story" && item.apiId === apiId
          ? { ...item, article: { ...item.article, engagement: { ...item.article.engagement, comments: item.article.engagement.comments - 1 } } }
          : item;
      setFeed((prev) => prev.map(unbump));
      throw new Error("Failed to post comment.");
    }
  }, []);

  // ── Fetch comments — syncs the authoritative count back into the feed ─────
  const handleFetchComments = useCallback(async (apiId: number): Promise<Comment[]> => {
    const raw = await getStoryComments(apiId);
    const mapped: Comment[] = raw.map((c) => ({
      id:          c.id,
      author:      c.author_name ?? "Anonymous",
      initials:    (c.author_name ?? "AN").slice(0, 2).toUpperCase(),
      avatarColor: gold,
      text:        c.text,
      timestamp:   c.created_at,
    }));

    setFeed((prev) => prev.map((item) =>
      item.source === "love_story" && item.apiId === apiId
        ? { ...item, article: { ...item.article, engagement: { ...item.article.engagement, comments: mapped.length } } }
        : item,
    ));

    return mapped;
  }, [gold]);

  // ── Like (optimistic update, routed by source) ────────────────────────────
  const handleLike = useCallback(async (apiId: number, source: FeedSource) => {
    const adjust = (delta: number) => (item: FeedItem) =>
      item.source === source && item.apiId === apiId
        ? { ...item, article: { ...item.article, engagement: { ...item.article.engagement, likes: item.article.engagement.likes + delta } } }
        : item;

    setFeed((prev) => prev.map(adjust(1)));
    try {
      if (source === "love_story") {
        await likeLoveStory(apiId);
      } else {
        await likeArticle(apiId);
      }
    } catch {
      setFeed((prev) => prev.map(adjust(-1)));
    }
  }, []);

  // ── Share (optimistic update, routed by source) ───────────────────────────
  const handleShare = useCallback(async (apiId: number, source: FeedSource) => {
    const adjust = (delta: number) => (item: FeedItem) =>
      item.source === source && item.apiId === apiId
        ? { ...item, article: { ...item.article, engagement: { ...item.article.engagement, shares: item.article.engagement.shares + delta } } }
        : item;

    setFeed((prev) => prev.map(adjust(1)));
    try {
      if (source === "love_story") {
        await shareLoveStory(apiId);
      } else {
        await shareArticle(apiId);
      }
    } catch {
      setFeed((prev) => prev.map(adjust(-1)));
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
      <Hero onShareStory={handleShareStoryClick} />

      <Box sx={{
        backgroundColor: theme.palette.background.default,
        px: { xs: 2, sm: 3, md: 6, lg: 10 },
        pt: { xs: 4, md: 6 },
      }}>
        <Box ref={composerRef} sx={{ maxWidth: 680, mx: "auto" }}>
          <Collapse in={!!postError}>
            <Alert severity="warning" sx={{ mb: 1.5 }} onClose={() => setPostError(null)}>
              {postError}
            </Alert>
          </Collapse>
          {composerOpen && (
            <PostComposer
              user={composerUser}
              placeholder="Share your story…"
              accentColor={gold}
              onPost={handlePost}
              onCancel={() => setComposerOpen(false)}
              disabled={posting}
              loading={posting}
              sx={{ mb: 3 }}
            />
          )}
        </Box>
      </Box>

      <Box sx={{
        backgroundColor: theme.palette.background.default,
        py: { xs: 5, sm: 6, md: 8, lg: 10 },
        px: { xs: 2, sm: 3, md: 6, lg: 10 },
      }}>

        {/* Birthday strip */}
        {!birthdaysLoading && <BirthdayStrip celebrities={birthdays} />}

        {/* Section header */}
        <Box
          display="flex" justifyContent="space-between" alignItems="center"
          mb={{ xs: 2, md: 3 }}
          sx={{
            borderTop:    `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            py: "0.6rem",
          }}
        >
          <Box>
            <Typography variant="h2" sx={{
              fontFamily: theme.typography.fontFamily, fontWeight: 800,
              fontSize: { xs: "1.3rem", sm: "1.6rem", md: "2rem", lg: "2.4rem" },
              color: theme.palette.text.primary,
            }}>
              Latest Articles
            </Typography>
            <Typography sx={{
              fontFamily: theme.typography.fontFamily,
              color: theme.palette.text.secondary,
              fontSize: { xs: "0.78rem", md: "0.87rem" }, mt: 0.5,
            }}>
              Fresh stories from our community.
            </Typography>
          </Box>
          <Button
            endIcon={<ArrowForwardIcon />}
            sx={{
              fontFamily: theme.typography.fontFamily, fontWeight: 700,
              fontSize: { xs: "0.75rem", md: "0.87rem" },
              color: theme.palette.text.secondary,
              textTransform: "none",
              "&:hover": { color: gold },
            }}
          >
            See all
          </Button>
        </Box>

        {/* Category filter tabs */}
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mb={3}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.value}
              label={cat.label}
              clickable
              onClick={() => setActiveCategory(cat.value)}
              sx={{
                fontWeight: 600,
                fontSize: "0.8rem",
                bgcolor: activeCategory === cat.value ? gold : "transparent",
                color: activeCategory === cat.value
                  ? "#000"
                  : theme.palette.text.secondary,
                border: `1px solid ${activeCategory === cat.value ? gold : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                transition: "all 0.2s",
                "&:hover": { bgcolor: activeCategory === cat.value ? gold : `${gold}22` },
              }}
            />
          ))}
        </Stack>

        {/* Error state */}
        <Collapse in={!!feedError}>
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchFeed}
              >
                Retry
              </Button>
            }
            onClose={() => setFeedError(null)}
          >
            {feedError}
          </Alert>
        </Collapse>

        {/* Article grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "2rem",
          paddingBottom: "2rem",
        }}>
          {/* Loading skeletons */}
          {feedLoading && feed.length === 0 &&
            Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)
          }

          {/* Actual cards */}
          {visibleFeed.map((item) =>
            item.source === "love_story" ? (
              <LoveStoryCard
                key={`${item.source}-${item.apiId}`}
                article={item.article}
                apiId={item.apiId}
                onOpen={() => setActiveItem(item)}
                audio={audio}
                onLike={(apiId) => handleLike(apiId, "love_story")}
                onShare={(apiId) => handleShare(apiId, "love_story")}
                onCommentSubmit={handleCommentSubmit}
                onFetchComments={handleFetchComments}
                currentUser={composerUser}
              />
            ) : (
              <ArticleCard
                key={`${item.source}-${item.apiId}`}
                article={item.article}
                apiId={item.apiId}
                onOpen={() => setActiveItem(item)}
                audio={audio}
                onLike={(apiId) => handleLike(apiId, "article")}
                onShare={(apiId) => handleShare(apiId, "article")}
              />
            ),
          )}
        </div>

        {/* Empty state */}
        {!feedLoading && filteredFeed.length === 0 && !feedError && (
          <Box textAlign="center" py={8}>
            <Typography color="text.secondary" fontSize="1rem">
              No articles found{activeCategory !== "all" ? ` in ${categoryLabel(activeCategory as ArticleCategory)}` : ""}.
            </Typography>
          </Box>
        )}

        {/* Load more */}
        {hasMore && !feedLoading && (
          <Box display="flex" justifyContent="center" mt={2} pb={4}>
            <Button
              variant="outlined"
              onClick={handleLoadMore}
              sx={{
                fontWeight: 700, px: 4,
                borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                color: theme.palette.text.secondary,
                "&:hover": { borderColor: gold, color: gold },
              }}
            >
              Load more
            </Button>
          </Box>
        )}
      </Box>

      {activeArticle && activeItem && (
        <ArticleModal
          article={activeArticle}
          onClose={() => setActiveItem(null)}
          audio={audio}
          onLike={() => handleLike(activeItem.apiId, activeItem.source)}
          onShare={() => handleShare(activeItem.apiId, activeItem.source)}
        />
      )}
    </Box>
  );
}