// src/pages/Home.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Fully API-integrated Home page
// • Articles fetched from /api/articles/ AND /api/love-stories/, merged into
//   one feed sorted by created_at (stories are written via the composer,
//   which is shared with the dedicated "write an article" page)
// • No more content-type categorization / love-story-only styling — every
//   card renders identically with a single accent color
// • Purple is intentionally NOT used anywhere on this page — it's reserved
//   for the profile/subscribe UI only
// • Comments work the same way on every card (Article or Love Story sourced),
//   using the same MediumReactionBar pattern as the compose page
// • Today's birthdays from /api/celebrities/birthdays-today/
// • Like / Share wired to the correct endpoint depending on item source,
//   with optimistic UI updates
// • Skeleton loading states while fetching
// • ApiError surfaces as a dismissible inline alert
// • CHANGED: guests are stopped BEFORE the composer opens (clear "please
//   sign in" message + Sign in button), and expired-session/401 failures on
//   post are translated into a friendly message instead of the raw backend
//   error text.
// • CHANGED: excerpt is no longer clamped to 3 lines on the card — full
//   excerpt text is shown ("Read More" clipping removed).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box, Typography, Button, Stack, Avatar, AvatarGroup,
  Divider, Skeleton, Chip, Alert, Collapse, Dialog, IconButton,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CakeIcon from "@mui/icons-material/Cake";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseIcon from "@mui/icons-material/Close";

import { CreatorHeader } from "../components/shared/CreatorHeader";
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
  updateLoveStory,
  deleteLoveStory,
} from "../services/loveStories.service";
import { ApiError } from "../services/api.service";

// ── API types ─────────────────────────────────────────────────────────────────
import type {
  Article as ApiArticle,
  Celebrity,
  LoveStory as ApiLoveStory,
} from "../types/api";

// ── Local Article type used by existing components ────────────────────────────
import type { Article } from "../types/article";
import type { Writer } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MEDIA_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace("/api", "") ??
  "http://localhost:8000";

/**
 * Every merged item remembers where it came from, so like/share/comment
 * actions can be routed to the right backend endpoint. This is purely a
 * data-plumbing detail now — it has no bearing on how the card looks.
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
function mapApiArticle(a: ApiArticle, accent: string): Article {
  return {
    id: a.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authorId: (a.author as any)?.id,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    category: "Article",
    categoryColor: accent, // CHANGED: single accent, no per-category coloring
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

/** Map a story (written via the shared composer) → the same local Article shape */
function mapLoveStoryToArticle(s: ApiLoveStory, accent: string): Article {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = s as any;
  return {
    id: s.id,
    authorId: s.author,
    title: s.title,
    excerpt: s.excerpt,
    content: s.content,
    category: "Article",
    categoryColor: accent, // CHANGED: same accent as every other card, no pink/purple
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

// ─────────────────────────────────────────────────────────────────────────────
// Static writers for hero avatar strip
// ─────────────────────────────────────────────────────────────────────────────

const WRITERS: Writer[] = [
  { id: "1", name: "James Osei",     initials: "JO", role: "Staff Writer",        followers: "3.2k", color: "#E53935", verified: true },
  { id: "2", name: "Amara Diallo",   initials: "AD", role: "Community Writer",    followers: "1.8k", color: "#F5A623" },
  { id: "3", name: "Sofia Mensah",   initials: "SM", role: "Writer",              followers: "2.5k", color: "#F5A623" },
  { id: "4", name: "Kwame Asante",   initials: "KA", role: "Sports Contributor",  followers: "4.1k", color: "#43A047" },
  { id: "5", name: "Fatima Al-Said", initials: "FA", role: "Community Writer",    followers: "1.2k", color: "#1565C0" },
  { id: "6", name: "David Nkrumah",  initials: "DN", role: "Sports Writer",       followers: "5.7k", color: "#7C3AED", verified: true },
];

const STATS = [
  { value: "24k+",   label: "Members" },
  { value: "8,400+", label: "Stories Published" },
  { value: "4",      label: "Content Sections" },
];

// CHANGED: content isn't categorized anymore — everyone posts the same way,
// so instead of category tabs we offer simple sorting, same options as the
// compose page's own feed.
const FILTERS = ["All", "Recent", "Most Liked", "Editor's Pick"];

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
// ArticleCard — the ONLY card type now. Every feed item (whichever backend
// source it came from) renders through this, with the same accent color and
// the same fully-working comment section as the compose page.
// ─────────────────────────────────────────────────────────────────────────────

const ArticleCard: React.FC<{
  article: Article;
  apiId: number;
  canEdit: boolean; // CHANGED: only true for love_story-sourced items with an update endpoint
  onOpen: (a: Article) => void;
  audio: ReturnType<typeof useAudio>;
  onLike: (apiId: number) => Promise<void>;
  onShare: (apiId: number) => Promise<void>;
  onCommentSubmit: (apiId: number, text: string) => Promise<Comment>;
  onFetchComments: (apiId: number) => Promise<Comment[]>;
  onEdit: () => void;
  currentUser: { name: string; initials: string; avatarColor?: string; id?: number };
}> = ({
  article, apiId, canEdit, onOpen, audio,
  onLike, onShare, onCommentSubmit, onFetchComments,
  onEdit, currentUser,
}) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gold   = theme.palette.gold?.main ?? "#F5A623";
  const accent: string = article.categoryColor ?? gold; // CHANGED: guarantees a string, fixes TS2322

  // CHANGED: same author check as the compose page, so the edit icon only
  // shows on the current user's own posts.
  const articleAuthorId = (article as { authorId?: number }).authorId;
  const isAuthor = canEdit && currentUser.id !== undefined && articleAuthorId !== undefined
    ? Number(currentUser.id) === Number(articleAuthorId)
    : false;

  return (
    <article style={{
      display: "flex", flexDirection: "column",
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
      padding: "1.5rem",
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CreatorHeader article={article} />
        </Box>
        {/* CHANGED: edit pencil, same placement/behavior as the compose page.
            flexShrink: 0 + fixed size keeps it from stealing width from
            CreatorHeader's own internal name/Subscribe layout. */}
        {isAuthor && (
          <IconButton
            size="small"
            onClick={onEdit}
            sx={{
              flexShrink: 0,
              color: theme.palette.text.disabled,
              "&:hover": { color: accent, bgcolor: `${accent}18` },
              transition: "color 0.2s",
            }}
          >
            <EditOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      {/* Thumbnail */}
      {article.img && article.img !== "/placeholder.png" && (
        <div
          onClick={() => onOpen(article)}
          style={{
            width: "100%", aspectRatio: "16/9",
            overflow: "hidden", marginBottom: "1rem",
            position: "relative", cursor: "pointer",
            borderRadius: theme.shape.borderRadius,
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

      {/*
        CHANGED: "Read More" clipping removed — the excerpt used to be
        clamped to 3 lines with -webkit-line-clamp. It now renders in full,
        so the whole excerpt is always visible on the card without needing
        to click into the modal to read the rest of it.
      */}
      <p
        onClick={() => onOpen(article)}
        style={{
          fontFamily: SERIF, fontSize: "0.9rem", color: theme.palette.text.secondary,
          lineHeight: 1.58, marginBottom: "0.9rem", cursor: "pointer",
        }}
      >
        {article.excerpt}
      </p>

      <p style={{
        fontFamily: SERIF,
        fontSize: "0.82rem", color: theme.palette.text.secondary,
        marginBottom: "0.75rem", opacity: 0.6,
      }}>
        {article.readTime}
      </p>

      <AudioControls articleId={article.id} audio={audio} color={accent} />

      {/* CHANGED: every card now gets the full reaction bar, with working
          comments, exactly like the compose page — not just story-sourced items */}
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
          Your home for celebrity birthdays, community stories, sports action and community support.
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
          }}>Write an Article</Button>
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

const PAGE_SIZE = 6;

export default function AeonFeed() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gold   = theme.palette.gold?.main ?? "#F5A623";
  const audio  = useAudio();
  const { user: authUser } = useAuth();

  // CHANGED: composer/reaction accent is gold everywhere on Home — purple is
  // reserved for the profile/subscribe UI and never appears here.
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

  // CHANGED: guests are stopped here, before the composer ever opens, with a
  // clear message instead of letting them type a whole story only to hit a
  // raw "no token" error on submit.
  const handleShareStoryClick = () => {
    if (!authUser) {
      setPostError("Please sign in to write an article.");
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setComposerOpen(true);
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ── State ────────────────────────────────────────────────────────────────
  const [activeItem, setActiveItem] = useState<FeedItem | null>(null);
  const activeArticle = activeItem?.article ?? null;
  const [activeFilter, setActiveFilter] = useState("All"); // CHANGED: sort filter, not category

  const [feed, setFeed]                 = useState<FeedItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [feedLoading, setFeedLoading]   = useState(true);
  const [feedError, setFeedError]       = useState<string | null>(null);

  const [birthdays, setBirthdays]               = useState<Celebrity[]>([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(true);

  // ── Edit / delete state — same pattern as the compose page ────────────────
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
  const [editing, setEditing]         = useState(false);
  const [editError, setEditError]     = useState<string | null>(null);

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
          items.push({ source: "article", apiId: a.id, article: mapApiArticle(a, gold) });
        }
      }

      if (loveStoriesRes.status === "fulfilled") {
        for (const s of loveStoriesRes.value.results) {
          items.push({ source: "love_story", apiId: s.id, article: mapLoveStoryToArticle(s, gold) });
        }
      }

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
  }, [gold]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  // ── Fetch birthdays ───────────────────────────────────────────────────────
  useEffect(() => {
    getBirthdaysToday()
      .then(setBirthdays)
      .catch(() => {/* silently ignore — non-critical */})
      .finally(() => setBirthdaysLoading(false));
  }, []);

  // ── Reset pagination when filter changes ──────────────────────────────────
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFilter]);

  // CHANGED: no more category filtering — just sorting/filtering the same
  // merged list, same options as the compose page (feed is already newest
  // first from fetchFeed, so "Recent" is a no-op pass-through).
  const filteredFeed = useMemo(() => {
    let list = feed;
    if (activeFilter === "Most Liked") {
      list = [...list].sort((a, b) => b.article.engagement.likes - a.article.engagement.likes);
    } else if (activeFilter === "Editor's Pick") {
      list = list.filter((item) => item.article.isEditorsPick);
    }
    return list;
  }, [feed, activeFilter]);

  const visibleFeed = filteredFeed.slice(0, visibleCount);
  const hasMore = visibleCount < filteredFeed.length;

  const handleLoadMore = () => setVisibleCount((c) => c + PAGE_SIZE);

  // ── Composer: post a new article from Home ────────────────────────────────
  // CHANGED: 401/403 (missing or expired token) now gets a clean, specific
  // message instead of surfacing the raw backend error text. Guests are
  // already stopped in handleShareStoryClick, but this also covers the case
  // where a session expires while the composer is open.
  const handlePost = useCallback(async (data: { title: string; text: string; mediaFiles?: File[] }) => {
    if (!data.title.trim() && !data.text.trim() && (!data.mediaFiles || data.mediaFiles.length === 0)) return;

    if (!authUser) {
      setPostError("Please sign in to write an article.");
      return;
    }

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = err instanceof ApiError ? (err as any).status : undefined;
      const isAuthError = status === 401 || status === 403;
      setPostError(
        isAuthError
          ? "Your session has expired. Please sign in again to share your story."
          : err instanceof ApiError
            ? err.firstError
            : "Failed to post story. Please try again.",
      );
    } finally {
      setPosting(false);
    }
  }, [authUser, fetchFeed]);

  // ── Edit / save — same flow as the compose page's edit dialog ─────────────
  // NOTE: only love_story-sourced items have an update endpoint today. If
  // your API grows an updateArticle() for plain articles, add it here.
  const handleEditPost = useCallback(async (data: { title: string; text: string; mediaFiles?: File[] }) => {
    if (!editingItem) return;
    setEditing(true);
    setEditError(null);
    try {
      await updateLoveStory(editingItem.apiId, {
        title:      data.title.trim() || data.text.slice(0, 80),
        excerpt:    data.text.slice(0, 160),
        content:    data.text,
        mediaFiles: data.mediaFiles && data.mediaFiles.length > 0 ? data.mediaFiles : undefined,
      });
      await fetchFeed();
      setEditingItem(null);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = err instanceof ApiError ? (err as any).status : undefined;
      const isAuthError = status === 401 || status === 403;
      setEditError(
        isAuthError
          ? "Your session has expired. Please sign in again to update this article."
          : err instanceof ApiError
            ? err.firstError
            : "Failed to update article. Please try again.",
      );
    } finally {
      setEditing(false);
    }
  }, [editingItem, fetchFeed]);

  const handleDelete = useCallback(async () => {
    if (!editingItem) return;
    const { apiId } = editingItem;
    await deleteLoveStory(apiId);
    setFeed((prev) => prev.filter((item) => !(item.source === "love_story" && item.apiId === apiId)));
    setActiveItem((prev) => prev && prev.source === "love_story" && prev.apiId === apiId ? null : prev);
    setEditingItem(null);
  }, [editingItem]);

  // ── Comment submit — routed by source, same shape as the compose page ─────
  const handleCommentSubmit = useCallback(async (apiId: number, source: FeedSource, text: string): Promise<Comment> => {
    if (source === "love_story") {
      const saved = await addLoveStoryComment(apiId, text);
      const mapped: Comment = {
        id:          saved.id,
        author:      saved.author,
        initials:    saved.initials,
        avatarColor: gold,
        text:        saved.text,
        timestamp:   saved.timestamp,
      };
      const bump = (item: FeedItem) =>
        item.source === "love_story" && item.apiId === apiId
          ? { ...item, article: { ...item.article, engagement: { ...item.article.engagement, comments: saved.comments } } }
          : item;
      setFeed((prev) => prev.map(bump));
      setActiveItem((prev) => prev && prev.source === "love_story" && prev.apiId === apiId ? bump(prev) : prev);
      return mapped;
    }

    // Plain articles don't have a comment endpoint yet — surface a clear error
    // instead of silently failing, matching the compose page's error handling.
    throw new Error("Comments aren't available on this article yet.");
  }, [gold]);

  // ── Fetch comments — syncs the authoritative count back into the feed ─────
  const handleFetchComments = useCallback(async (apiId: number, source: FeedSource): Promise<Comment[]> => {
    if (source !== "love_story") return [];

    const raw = await getStoryComments(apiId);
    const mapped: Comment[] = raw.map((c) => ({
      id:          c.id,
      author:      c.author,
      initials:    c.initials,
      avatarColor: gold,
      text:        c.text,
      timestamp:   c.timestamp,
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
    const alreadyLiked = isStoryLiked(apiId);
    const delta = alreadyLiked ? -1 : 1;

    const adjust = (d: number) => (item: FeedItem) =>
      item.source === source && item.apiId === apiId
        ? { ...item, article: { ...item.article, engagement: { ...item.article.engagement, likes: Math.max(0, item.article.engagement.likes + d) } } }
        : item;

    setFeed((prev) => prev.map(adjust(delta)));

    try {
      if (source === "love_story") {
        await likeLoveStory(apiId);
      } else {
        await likeArticle(apiId);
      }
    } catch {
      setFeed((prev) => prev.map(adjust(-delta)));
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
          {/*
            CHANGED: this alert now doubles as the "please sign in" feedback
            when a guest clicks "Write an Article" — it shows even when the
            composer itself never opens, plus a Sign in action for guests.
          */}
          <Collapse in={!!postError}>
            <Alert
              severity="warning"
              sx={{ mb: 1.5 }}
              onClose={() => setPostError(null)}
              action={
                !authUser ? (
                  <Button size="small" component="a" href="/login">
                    Sign in
                  </Button>
                ) : undefined
              }
            >
              {postError}
            </Alert>
          </Collapse>
          {composerOpen && authUser && (
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

        {!birthdaysLoading && <BirthdayStrip celebrities={birthdays} />}

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

        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mb={3}>
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            return (
              <Chip
                key={f}
                label={f}
                clickable
                onClick={() => setActiveFilter(f)}
                sx={{
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  bgcolor: active ? gold : "transparent",
                  color: active ? "#000" : theme.palette.text.secondary,
                  border: `1px solid ${active ? gold : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                  transition: "all 0.2s",
                  "&:hover": { bgcolor: active ? gold : `${gold}22` },
                }}
              />
            );
          })}
        </Stack>

        <Collapse in={!!feedError}>
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button size="small" startIcon={<RefreshIcon />} onClick={fetchFeed}>
                Retry
              </Button>
            }
            onClose={() => setFeedError(null)}
          >
            {feedError}
          </Alert>
        </Collapse>

        {/* Article grid — single card type for every item */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "2rem",
          paddingBottom: "2rem",
        }}>
          {feedLoading && feed.length === 0 &&
            Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)
          }

          {visibleFeed.map((item) => (
            <ArticleCard
              key={`${item.source}-${item.apiId}`}
              article={item.article}
              apiId={item.apiId}
              canEdit={item.source === "love_story"}
              onOpen={() => setActiveItem(item)}
              audio={audio}
              onLike={(apiId) => handleLike(apiId, item.source)}
              onShare={(apiId) => handleShare(apiId, item.source)}
              onCommentSubmit={(apiId, text) => handleCommentSubmit(apiId, item.source, text)}
              onFetchComments={(apiId) => handleFetchComments(apiId, item.source)}
              onEdit={() => setEditingItem(item)}
              currentUser={composerUser}
            />
          ))}
        </div>

        {!feedLoading && filteredFeed.length === 0 && !feedError && (
          <Box textAlign="center" py={8}>
            <Typography color="text.secondary" fontSize="1rem">
              No articles found yet.
            </Typography>
          </Box>
        )}

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

      {/* EDIT DIALOG — same pattern as the compose page */}
      <Dialog
        open={!!editingItem}
        onClose={() => !editing && setEditingItem(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "16px",
            bgcolor: theme.palette.background.paper,
            backgroundImage: "none",
            overflow: "visible",
          },
        }}
      >
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ px: 2.5, pt: 2, pb: 0 }}
          >
            <Typography sx={{
              fontFamily: SERIF, fontWeight: 700, fontSize: "1rem",
              color: theme.palette.text.primary,
            }}>
              Edit Article
            </Typography>
            <IconButton size="small" onClick={() => setEditingItem(null)} disabled={editing}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>

          <Collapse in={!!editError}>
            <Alert severity="warning" sx={{ mx: 2.5, mt: 1.5 }} onClose={() => setEditError(null)}>
              {editError}
            </Alert>
          </Collapse>

          {editingItem && (
            <PostComposer
              key={`${editingItem.source}-${editingItem.apiId}`}
              user={composerUser}
              accentColor={gold}
              initialText={editingItem.article.content}
              currentImageUrl={
                editingItem.article.img && editingItem.article.img !== "/placeholder.png"
                  ? editingItem.article.img
                  : undefined
              }
              editMode
              loading={editing}
              canDelete
              onPost={handleEditPost}
              onDelete={handleDelete}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}