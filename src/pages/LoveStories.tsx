import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Avatar, Box, Button, Chip, Dialog, IconButton,
  Stack, Typography, Skeleton, Alert, Collapse,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FavoriteIcon            from "@mui/icons-material/Favorite";
import ArrowForwardIcon        from "@mui/icons-material/ArrowForward";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import AutoStoriesIcon         from "@mui/icons-material/AutoStories";
import RefreshIcon             from "@mui/icons-material/Refresh";
import EditOutlinedIcon        from "@mui/icons-material/EditOutlined";
import CloseIcon               from "@mui/icons-material/Close";

import PostComposer, {
  MediumReactionBar,
  isStoryLiked,
  setStoryLiked,
} from "../components/shared/PostComposer";
import type { Comment } from "../components/shared/ReactionMessenger";
import ArticleSearchBar  from "../components/shared/ArticleSearchBar";
import { AudioControls } from "../components/shared/AudioControls";
import { ArticleModal }  from "../components/shared/ArticleModal";
import { useAudio }      from "../hooks/useAudio";
import { useAuth }       from "../hooks/useAuth";

import {
  getLoveStories,
  likeLoveStory,
  shareLoveStory,
  submitLoveStory,
  addLoveStoryComment,
  updateLoveStory,
  deleteLoveStory,
  getStoryComments,
} from "../services";
import { ApiError }      from "../services/api.service";
import type { LoveStory as ApiLoveStory } from "../types/api";
import type { Article }  from "../types/article";

// ── Constants ──────────────────────────────────────────────────────────────────
const SERIF           = "'Playfair Display', Georgia, serif";
const ACCENT          = "#F59E0B";
const COMPOSER_ACCENT = "#7C3AED";

const MEDIA_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace("/api", "") ??
  "http://localhost:8000";

const FILTERS = ["All", "Recent", "Most Liked", "Editor's Pick"];

// ── Likes persistence (localStorage) ──────────────────────────────────────────



// ── Helpers ────────────────────────────────────────────────────────────────────
function resolveImg(img: string | null | undefined): string {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return `${MEDIA_BASE}${img}`;
}

function hasRealImage(img: string): boolean {
  return !!img && img !== "" && !img.endsWith("undefined") && !img.endsWith("null");
}

function mapLoveStory(s: ApiLoveStory): Article {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = s as any;
  const resolvedImg = resolveImg(s.image);

  return {
    id:            s.id,
    apiId:         s.id,
    authorId:      s.author,
    title:         s.title,
    excerpt:       s.excerpt,
    content:       s.content,
    category:      raw.category || "Article",
    categoryColor: ACCENT,
    img:           resolvedImg,
    audio:         raw.audio_url ?? null,
    readTime:      s.read_time ?? `${Math.ceil(s.content.split(" ").length / 200)} min read`,
    createdAt:     s.created_at,
    date: new Date(s.created_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    }),
    author: {
      name:     s.author_name || "Anonymous",
      initials: s.author_info?.avatar || "AN",
      role:     "Writer",
      verified: s.author_info?.verified ?? false,
    },
    engagement:    { likes: s.likes ?? 0, shares: s.shares ?? 0, comments: s.comments ?? 0 },
    isEditorsPick: raw.is_editors_pick ?? false,
  };
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
const CardSkeleton: React.FC = () => (
  <Box sx={{ pb: "2rem", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
      <Skeleton variant="circular" width={34} height={34} />
      <Box flex={1}>
        <Skeleton width="45%" height={13} />
        <Skeleton width="30%" height={11} sx={{ mt: 0.5 }} />
      </Box>
    </Box>
    <Skeleton width="25%" height={11} sx={{ mb: 0.5 }} />
    <Skeleton width="75%" height={18} sx={{ mb: 0.5 }} />
    <Skeleton width="55%" height={18} sx={{ mb: 1 }} />
    <Skeleton width="100%" height={11} />
    <Skeleton width="85%" height={11} />
  </Box>
);

// ── Natural-ratio image component ──────────────────────────────────────────────
const NaturalImage: React.FC<{ src: string; alt: string; onClick: () => void }> = ({
  src, alt, onClick,
}) => {
  const theme = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);

  if (error) return null;

  return (
    <Box
      onClick={onClick}
      sx={{
        width: "100%",
        mb: 2,
        cursor: "pointer",
        borderRadius: "8px",
        overflow: "hidden",
        bgcolor: loaded ? "transparent" : theme.palette.action.hover,
        // Cap how tall the image can get, regardless of natural size
        maxHeight: { xs: 320, sm: 420 },
        display: "flex",
        justifyContent: "center",
        "&:hover img": { opacity: 0.93 },
        transition: "opacity 0.2s",
      }}
    >
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          display: "block",
          width: "100%",
          maxHeight: "420px",       // ← hard ceiling so big images don't dominate
          height: "auto",
          objectFit: "cover",       // fills the capped box instead of squishing
          borderRadius: "8px",
          transition: "opacity 0.25s ease",
          opacity: loaded ? 1 : 0,
        }}
      />
    </Box>
  );
};

// ── Article card ───────────────────────────────────────────────────────────────
const ArticleCard: React.FC<{
  article:          Article;
  onOpen:           (a: Article) => void;
  audio:            ReturnType<typeof useAudio>;
  onLike:           (apiId: number) => Promise<void>;
  onShare:          (apiId: number) => Promise<void>;
  onComment:        (apiId: number) => void;
  onCommentSubmit:  (apiId: number, text: string) => Promise<Comment>;
  onFetchComments:  (apiId: number) => Promise<Comment[]>;
  onEdit:           (article: Article) => void;
  currentUser:      { name: string; initials: string; avatarColor?: string; id?: number };
}> = ({
  article, onOpen, audio,
  onLike, onShare, onComment, onCommentSubmit,
  onFetchComments,
  onEdit, currentUser,
}) => {
  const theme = useTheme();
  const imgExists = hasRealImage(article.img);

  // ── FIX: author check uses id when available, falls back to name
  // We also watch currentUser reactively so no refresh is needed after login
  const articleAuthorId = (article as { authorId?: number }).authorId;
  const isAuthor = currentUser.id !== undefined && articleAuthorId !== undefined
    ? Number(currentUser.id) === Number(articleAuthorId)
    : currentUser.name !== "Guest" && currentUser.name === article.author.name;

  const storyId = article.apiId ?? article.id;

  return (
    <article style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      minWidth: 0,
      borderBottom: `1px solid ${theme.palette.divider}`,
      paddingTop: "28px",
      paddingBottom: "24px",
      wordBreak: "break-word",
    }}>

      {/*
        ── Substack-style layout:
           • NO image  →  title + excerpt stacked full width (text-first feel)
           • HAS image →  title, excerpt, then full-width natural-ratio image below
      */}

      {/* Title */}
      <Typography
        onClick={() => onOpen(article)}
        sx={{
          fontFamily: SERIF,
          fontSize: { xs: "1.1rem", sm: "1.25rem" },
          fontWeight: 700,
          lineHeight: 1.3,
          color: theme.palette.text.primary,
          mb: 0.75,
          cursor: "pointer",
          transition: "color 0.18s",
          "&:hover": { color: ACCENT },
        }}
      >
        {article.title}
      </Typography>

      {/* Excerpt */}
      <Typography
        onClick={() => onOpen(article)}
        sx={{
          fontFamily: SERIF,
          fontSize: "0.88rem",
          color: theme.palette.text.secondary,
          lineHeight: 1.65,
          mb: imgExists ? 1.5 : 2,
          cursor: "pointer",
          display: "-webkit-box",
          WebkitLineClamp: imgExists ? 2 : 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {article.excerpt}
      </Typography>

      {/* Cover image — natural aspect ratio, only when a real image exists */}
      {imgExists && (
        <NaturalImage
          src={article.img}
          alt={article.title}
          onClick={() => onOpen(article)}
        />
      )}

      {/* Audio */}
      <AudioControls
        articleId={article.id}
        audioUrl={article.audio}
        audio={audio}
        color={ACCENT}
      />

      {/* Bottom row: avatar + author + date + read time + edit + reactions */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        mt={1}
        flexWrap="wrap"
        useFlexGap
      >
        {/* Avatar */}
        <Avatar sx={{
          width: 24, height: 24,
          bgcolor: (article.author as { color?: string }).color ?? ACCENT,
          fontFamily: SERIF, fontSize: "0.55rem", fontWeight: 700,
          flexShrink: 0,
        }}>
          {article.author.initials}
        </Avatar>

        {/* Author name */}
        <Typography sx={{
          fontFamily: SERIF, fontSize: "0.78rem", fontWeight: 600,
          color: theme.palette.text.primary,
          whiteSpace: "nowrap",
        }}>
          {article.author.name}
        </Typography>

        {/* Verified badge */}
        {article.author.verified && (
          <Box sx={{
            width: 13, height: 13, bgcolor: ACCENT,
            borderRadius: "50%", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Typography sx={{ fontSize: "0.45rem", color: "#fff", lineHeight: 1 }}>✓</Typography>
          </Box>
        )}

        {/* Separator */}
        <Typography sx={{ fontSize: "0.7rem", color: theme.palette.text.disabled }}>·</Typography>

        {/* Date + read time */}
        <Typography sx={{
          fontFamily: SERIF, fontSize: "0.7rem",
          color: theme.palette.text.secondary,
          whiteSpace: "nowrap",
        }}>
          {article.date} · {article.readTime}
        </Typography>

        {/* Edit button — visible immediately after login, no refresh needed */}
        {isAuthor && (
          <IconButton
            size="small"
            onClick={() => onEdit(article)}
            sx={{
              ml: 0.5, flexShrink: 0,
              color: theme.palette.text.disabled,
              "&:hover": { color: ACCENT, bgcolor: `${ACCENT}18` },
              transition: "color 0.2s",
            }}
          >
            <EditOutlinedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}

        {/* Reaction bar pushed to right */}
        <Box sx={{ ml: "auto" }}>
          <MediumReactionBar
            storyId={storyId}
            likes={article.engagement.likes}
            comments={article.engagement.comments}
            shares={article.engagement.shares}
            liked={isStoryLiked(storyId)}
            accentColor={ACCENT}
            currentUser={currentUser}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onCommentSubmit={onCommentSubmit}
            onFetchComments={onFetchComments}
          />
        </Box>
      </Stack>

    </article>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LoveStoriesPage() {
  const theme = useTheme();
  const audio = useAudio();
  const { user: authUser } = useAuth();

  // ── FIX: rebuild composerUser only when the user changes so the edit icon
  // reacts immediately after login without needing a page refresh
  const composerUser = useMemo(
    () =>
      authUser
        ? {
            id:          authUser.id,
            name:        authUser.name,
            initials:    authUser.initials,
            avatarSrc:   authUser.avatarSrc,
            color:       COMPOSER_ACCENT,
            avatarColor: COMPOSER_ACCENT,
          }
        : { name: "Guest", initials: "G", color: COMPOSER_ACCENT, avatarColor: COMPOSER_ACCENT },
    [authUser],
  );

  // Keep a ref so callbacks always see latest composerUser without re-creating them
  const composerUserRef = useRef(composerUser);
  useEffect(() => { composerUserRef.current = composerUser; }, [composerUser]);

  const [activeArticle,  setActiveArticle]  = useState<Article | null>(null);
  const [activeFilter,   setActiveFilter]   = useState("All");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [postError,      setPostError]      = useState<string | null>(null);
  const [posting,        setPosting]        = useState(false);
  const [articles,       setArticles]       = useState<Article[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editing,        setEditing]        = useState(false);
  const [editError,      setEditError]      = useState<string | null>(null);

  // ── Fetch stories ──────────────────────────────────────────────────────────
  const fetchStories = useCallback(async (silentArg?: boolean) => {
    // Only an explicit `true` (from the poller) is silent — the retry button
    // passes a MouseEvent, which must still show the skeleton.
    const silent = silentArg === true;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await getLoveStories({ ordering: "-created_at" });
      setArticles(res.results.map(mapLoveStory));
    } catch (err: unknown) {
      if (!silent) setError(err instanceof ApiError ? err.firstError : "Failed to load articles.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  // ── Real-time counts via polling ──────────────────────────────────────────
  // Refetch every 7s while the tab is visible so like/share/comment counts stay
  // in sync across devices. Silent: no skeleton, no error banner, and a failure
  // leaves the current list untouched.
  useEffect(() => {
    const POLL_MS = 7000;
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === "visible") fetchStories(true);
      }, POLL_MS);
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = undefined; } };

    const onVisibility = () => {
      if (document.visibilityState === "visible") { fetchStories(true); start(); }
      else stop();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [fetchStories]);

  // ── Create ─────────────────────────────────────────────────────────────────
  const handlePost = useCallback(async (data: { title: string; text: string; mediaFiles?: File[] }) => {
    if (!data.title.trim() && !data.text.trim() && (!data.mediaFiles || data.mediaFiles.length === 0)) return;

    // Auth guard — stop guests before the request so they get a clear message
    // instead of a raw "not authenticated" error on submit.
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
      await fetchStories();
    } catch (err: unknown) {
      const isAuthError = err instanceof ApiError && (err.status === 401 || err.status === 403);
      setPostError(
        isAuthError
          ? "Your session has expired. Please sign in again to share your story."
          : err instanceof ApiError
            ? err.firstError
            : "Failed to post article. Please try again.",
      );
    } finally {
      setPosting(false);
    }
  }, [authUser, fetchStories]);

  // ── Edit / save ────────────────────────────────────────────────────────────
  const handleEditPost = useCallback(async (data: { title: string; text: string; mediaFiles?: File[] }) => {
    if (!editingArticle) return;
    setEditing(true);
    setEditError(null);
    try {
      const id = editingArticle.apiId ?? editingArticle.id;
      await updateLoveStory(id, {
        title:      data.title.trim() || data.text.slice(0, 80),
        excerpt:    data.text.slice(0, 160),
        content:    data.text,
        mediaFiles: data.mediaFiles && data.mediaFiles.length > 0 ? data.mediaFiles : undefined,
      });
      await fetchStories();
      setEditingArticle(null);
    } catch (err: unknown) {
      setEditError(err instanceof ApiError
        ? err.firstError
        : "Failed to update article. Make sure you are logged in.");
    } finally {
      setEditing(false);
    }
  }, [editingArticle, fetchStories]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
  if (!editingArticle) return;
  const id = editingArticle.apiId ?? editingArticle.id;
  await deleteLoveStory(id);
  setStoryLiked(id, false);
  setArticles(prev => prev.filter(a => (a.apiId ?? a.id) !== id));
  setActiveArticle(prev => prev && (prev.apiId ?? prev.id) === id ? null : prev);
  setEditingArticle(null);
}, [editingArticle]);
  // ── Like ───────────────────────────────────────────────────────────────────
  // The reaction bar (MediumReactionBar in the feed, EngagementBar in the modal)
  // owns the optimistic heart + count flip and the per-device localStorage state.
  // Here we only hit the toggle endpoint and reconcile the *shared* count to the
  // server's authoritative value. Errors are intentionally left to propagate so
  // the bar rolls back its own optimistic update.
  const handleLike = useCallback(async (apiId: number) => {
    const res = await likeLoveStory(apiId);          // { liked, likes } — per-user toggle
    if (typeof res?.likes !== "number") return;
    const reconcile = (a: Article) =>
      (a.apiId ?? a.id) === apiId
        ? { ...a, engagement: { ...a.engagement, likes: res.likes } }
        : a;
    setArticles(p => p.map(reconcile));
    setActiveArticle(p => (p && (p.apiId ?? p.id) === apiId ? reconcile(p) : p));
  }, []);

  // ── Share (optimistic) ─────────────────────────────────────────────────────
  const handleShare = useCallback(async (apiId: number) => {
    const bump   = (a: Article) => (a.apiId ?? a.id) === apiId
      ? { ...a, engagement: { ...a.engagement, shares: a.engagement.shares + 1 } } : a;
    const unbump = (a: Article) => (a.apiId ?? a.id) === apiId
      ? { ...a, engagement: { ...a.engagement, shares: a.engagement.shares - 1 } } : a;
    setArticles(p => p.map(bump));
    setActiveArticle(p => p && (p.apiId ?? p.id) === apiId ? bump(p) : p);
    try {
      await shareLoveStory(apiId);
    } catch {
      setArticles(p => p.map(unbump));
      setActiveArticle(p => p && (p.apiId ?? p.id) === apiId ? unbump(p) : p);
    }
  }, []);

  // ── Comment icon tap ───────────────────────────────────────────────────────
  const handleComment = useCallback(() => {
    // ReactionMessenger manages its own open state
  }, []);

  // ── Comment submit ─────────────────────────────────────────────────────────
 const handleCommentSubmit = useCallback(async (apiId: number, text: string): Promise<Comment> => {
  const saved = await addLoveStoryComment(apiId, text); // must return Django's add_comment response

  const mapped: Comment = {
    id:          saved.id,
    author:      saved.author,
    initials:    saved.initials,
    avatarColor: COMPOSER_ACCENT,
    text:        saved.text,
    timestamp:   saved.timestamp,
  };

  const bump = (a: Article) =>
    (a.apiId ?? a.id) === apiId
      ? { ...a, engagement: { ...a.engagement, comments: saved.comments } }
      : a;
  setArticles(p => p.map(bump));
  setActiveArticle(p => p && (p.apiId ?? p.id) === apiId ? bump(p) : p);

  return mapped;
}, []);

  // ── Fetch comments ─────────────────────────────────────────────────────────
  const handleFetchComments = useCallback(async (apiId: number): Promise<Comment[]> => {
  const raw = await getStoryComments(apiId);
  const mapped: Comment[] = raw.map(c => ({
    id:          c.id,
    author:      c.author,      // matches Django's actual field name
    initials:    c.initials,    // Django already computes this
    avatarColor: COMPOSER_ACCENT,
    text:        c.text,
    timestamp:   c.timestamp,   // matches Django's actual field name
  }));

  setArticles(prev => prev.map(a =>
    (a.apiId ?? a.id) === apiId
      ? { ...a, engagement: { ...a.engagement, comments: mapped.length } }
      : a,
  ));

  return mapped;
}, []);

  // ── Filter + search ────────────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...articles];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.excerpt.toLowerCase().includes(q) ||
        s.author.name.toLowerCase().includes(q),
      );
    }
    if (activeFilter === "Most Liked") {
      list = [...list].sort((a, b) => b.engagement.likes - a.engagement.likes);
    } else if (activeFilter === "Editor's Pick") {
      list = list.filter(s => s.isEditorsPick);
    }
    return list;
  }, [articles, activeFilter, searchQuery]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>

      {/* MAIN 3-COLUMN LAYOUT */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "1450px",
          mx: "auto",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "240px minmax(0, 680px) 280px",
          },
          gap: { xs: 0, lg: 4 },
          px: { xs: 0, lg: 3 },
        }}
      >

        {/* LEFT SIDEBAR */}
        <Box
          sx={{
            display: { xs: "none", lg: "block" },
            position: "sticky",
            top: 20,
            height: "fit-content",
            pt: 4,
          }}
        >
          <Stack spacing={2.5}>

            {/* WRITE A POST CTA */}
            <Box
              sx={{
                borderRadius: "16px",
                p: 2.5,
                background: `linear-gradient(135deg, ${ACCENT}22 0%, #EC407A18 100%)`,
                border: `1px solid ${ACCENT}33`,
                textAlign: "center",
              }}
            >
              <AutoStoriesIcon sx={{ color: ACCENT, fontSize: 32, mb: 1 }} />
              <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.95rem", mb: 0.5 }}>
                Share Your Article
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary, mb: 1.5, lineHeight: 1.6 }}>
                Your perspective matters. Write and share it with the community.
              </Typography>
              <Button
                fullWidth
                size="small"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                sx={{
                  bgcolor: ACCENT,
                  color: "#fff",
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  borderRadius: "8px",
                  textTransform: "none",
                  "&:hover": { bgcolor: "#D97706" },
                }}
              >
                Start Writing
              </Button>
            </Box>

            {/* TRENDING TOPICS */}
            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "16px",
                p: 2.5,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={1.8}>
                <LocalFireDepartmentIcon sx={{ color: ACCENT, fontSize: 16 }} />
                <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.88rem" }}>
                  Trending Topics
                </Typography>
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {[
                  "Technology", "Health", "Finance", "Culture",
                  "Science", "Travel", "Society", "Opinion",
                ].map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onClick={() => setSearchQuery(tag)}
                    sx={{
                      fontFamily: SERIF,
                      fontSize: "0.7rem",
                      height: 24,
                      cursor: "pointer",
                      bgcolor: theme.palette.action.hover,
                      color: theme.palette.text.secondary,
                      "&:hover": { bgcolor: `${ACCENT}22`, color: ACCENT, borderColor: ACCENT },
                      border: `1px solid transparent`,
                      transition: "all 0.18s",
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* READING STATS */}
            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "16px",
                p: 2.5,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.88rem", mb: 1.5 }}>
                This Week
              </Typography>
              <Stack spacing={1.2}>
                {[
                  { icon: <AutoStoriesIcon sx={{ fontSize: 15 }} />, label: "Articles published", value: articles.length },
                  { icon: <FavoriteIcon sx={{ fontSize: 15 }} />, label: "Likes given", value: articles.reduce((a, s) => a + s.engagement.likes, 0) },
                ].map(({ icon, label, value }) => (
                  <Stack key={label} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                      <Box sx={{ color: ACCENT }}>{icon}</Box>
                      <Typography sx={{ fontFamily: SERIF, fontSize: "0.78rem", color: theme.palette.text.secondary }}>
                        {label}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontFamily: SERIF, fontSize: "0.88rem", fontWeight: 700, color: ACCENT }}>
                      {value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

          </Stack>
        </Box>

        {/* CENTER CONTENT */}
        <Box sx={{ minWidth: 0 }}>

          {/* Compose + search */}
          <Box
            sx={{
              maxWidth: "680px",
              mx: "auto",
              px: 2,
              pt: { xs: 3, md: 4 },
              pb: 2.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Collapse in={!!postError}>
              <Alert severity="warning" sx={{ mb: 1.5 }} onClose={() => setPostError(null)}>
                {postError}
              </Alert>
            </Collapse>

            <PostComposer
              user={composerUser}
              placeholder="What's on your mind? Write an article…"
              accentColor={COMPOSER_ACCENT}
              onPost={handlePost}
              disabled={posting}
              sx={{ mb: 1.5 }}
            />

            <ArticleSearchBar
              placeholder="Search articles…"
              accentColor={ACCENT}
              onSearch={setSearchQuery}
            />
          </Box>

          {/* Header + filters */}
          <Box sx={{ maxWidth: "680px", mx: "auto", px: 2, pt: 4, pb: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              mb={2}
              sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 2.5 }}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <AutoStoriesIcon sx={{ color: ACCENT, fontSize: 20 }} />
                  <Typography
                    variant="h2"
                    sx={{
                      fontFamily: SERIF,
                      fontWeight: 800,
                      fontSize: { xs: "1.4rem", md: "2rem" },
                      color: theme.palette.text.primary,
                      lineHeight: 1,
                    }}
                  >
                    Articles
                  </Typography>
                </Stack>
                <Typography sx={{ fontFamily: SERIF, color: theme.palette.text.secondary, fontSize: "0.83rem" }}>
                  {displayed.length} article{displayed.length === 1 ? "" : "s"} from our community
                </Typography>
              </Box>

              <Button
                endIcon={<ArrowForwardIcon />}
                sx={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  color: theme.palette.text.secondary,
                  textTransform: "none",
                  mt: 0.5,
                }}
              >
                See all
              </Button>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {FILTERS.map((f) => {
                const active = activeFilter === f;
                return (
                  <Chip
                    key={f}
                    label={f}
                    onClick={() => setActiveFilter(f)}
                    size="small"
                    sx={{
                      fontFamily: SERIF,
                      fontSize: "0.75rem",
                      height: 28,
                      cursor: "pointer",
                      bgcolor: active ? ACCENT : theme.palette.action.hover,
                      color: active ? "#fff" : theme.palette.text.secondary,
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          {/* Error */}
          <Box sx={{ maxWidth: "680px", mx: "auto", px: 2 }}>
            <Collapse in={!!error}>
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                action={
                  <Button size="small" startIcon={<RefreshIcon />} onClick={fetchStories}>
                    Retry
                  </Button>
                }
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </Collapse>
          </Box>

          {/* Articles list */}
          <Box sx={{ pb: { xs: 6, md: 10 }, pt: 2 }}>
            {loading ? (
              <div style={{
                display: "flex", flexDirection: "column", width: "100%",
                maxWidth: "680px", margin: "0 auto", padding: "0 16px",
              }}>
                {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : displayed.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10 }}>
                <AutoStoriesIcon sx={{ fontSize: 48, color: theme.palette.action.disabled, mb: 2 }} />
                <Typography sx={{ fontFamily: SERIF, fontSize: "1rem", color: theme.palette.text.disabled }}>
                  {searchQuery ? `No articles found for "${searchQuery}"` : "No articles yet. Be the first to write one!"}
                </Typography>
              </Box>
            ) : (
              <div style={{
                display: "flex", flexDirection: "column", width: "100%",
                maxWidth: "680px", margin: "0 auto", padding: "0 16px",
                boxSizing: "border-box", minWidth: 0,
              }}>
                {displayed.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onOpen={setActiveArticle}
                    audio={audio}
                    onLike={handleLike}
                    onShare={handleShare}
                    onComment={handleComment}
                    onCommentSubmit={handleCommentSubmit}
                    onFetchComments={handleFetchComments}
                    onEdit={setEditingArticle}
                    currentUser={composerUser}    // ← reactive, updates on login instantly
                  />
                ))}
              </div>
            )}
          </Box>
        </Box>

        {/* RIGHT SIDEBAR */}
        <Box
          sx={{
            display: { xs: "none", lg: "block" },
            position: "sticky",
            top: 20,
            height: "fit-content",
            pt: 4,
          }}
        >
          <Stack spacing={2.5}>

            {/* EDITORIAL QUOTE */}
            <Box
              sx={{
                borderRadius: "16px",
                p: 2.5,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Typography sx={{
                fontFamily: SERIF, fontSize: "3rem", color: `${ACCENT}30`,
                lineHeight: 1, position: "absolute", top: 8, left: 16, userSelect: "none",
              }}>
                "
              </Typography>
              <Typography sx={{
                fontFamily: SERIF, fontSize: "0.9rem", fontStyle: "italic",
                lineHeight: 1.75, color: theme.palette.text.primary, pt: 2.5, mb: 1.5,
              }}>
                Write what should not be forgotten.
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.72rem", color: ACCENT, fontWeight: 700 }}>
                — Isabel Allende
              </Typography>
            </Box>

            {/* TOP WRITERS */}
            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "16px",
                p: 2.5,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.88rem", mb: 1.8 }}>
                Top Writers
              </Typography>
              <Stack spacing={1.5}>
                {articles.slice(0, 4).map((a) => (
                  <Stack key={a.id} direction="row" alignItems="center" spacing={1.2}>
                    <Avatar sx={{
                      width: 30, height: 30,
                      bgcolor: ACCENT,
                      fontFamily: SERIF, fontSize: "0.6rem", fontWeight: 700, flexShrink: 0,
                    }}>
                      {a.author.initials}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography sx={{
                        fontFamily: SERIF, fontSize: "0.78rem", fontWeight: 600,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {a.author.name}
                      </Typography>
                      <Typography sx={{ fontFamily: SERIF, fontSize: "0.68rem", color: theme.palette.text.secondary }}>
                        {a.engagement.likes} likes
                      </Typography>
                    </Box>
                  </Stack>
                ))}
                {articles.length === 0 && (
                  <Typography sx={{ fontFamily: SERIF, fontSize: "0.78rem", color: theme.palette.text.disabled }}>
                    No writers yet.
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* WRITING TIPS */}
            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "16px",
                p: 2.5,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.88rem", mb: 1.5 }}>
                Writing Tips
              </Typography>
              <Stack spacing={1.2}>
                {[
                  "Start with a hook that earns the reader's next sentence",
                  "Use specific details — a number, a name, a place",
                  "One clear idea per paragraph",
                  "End with something the reader keeps thinking about",
                ].map((tip, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <Box sx={{
                      width: 18, height: 18, borderRadius: "50%",
                      bgcolor: `${ACCENT}18`, display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0, mt: "1px",
                    }}>
                      <Typography sx={{ fontSize: "0.55rem", color: ACCENT, fontWeight: 700 }}>{i + 1}</Typography>
                    </Box>
                    <Typography sx={{ fontFamily: SERIF, fontSize: "0.78rem", lineHeight: 1.55, color: theme.palette.text.secondary }}>
                      {tip}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

          </Stack>
        </Box>

      </Box>

      {/* ARTICLE MODAL */}
      {activeArticle && (
        <ArticleModal
          article={activeArticle}
          onClose={() => setActiveArticle(null)}
          audio={audio}
          onLike={handleLike}
          onShare={handleShare}
        />
      )}

      {/* EDIT DIALOG */}
      <Dialog
        open={!!editingArticle}
        onClose={() => !editing && setEditingArticle(null)}
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
            <IconButton size="small" onClick={() => setEditingArticle(null)} disabled={editing}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>

          <Collapse in={!!editError}>
            <Alert severity="warning" sx={{ mx: 2.5, mt: 1.5 }} onClose={() => setEditError(null)}>
              {editError}
            </Alert>
          </Collapse>

          {editingArticle && (
            <PostComposer
              key={editingArticle.id}
              user={composerUser}
              accentColor={COMPOSER_ACCENT}
              initialText={editingArticle.content}
              currentImageUrl={hasRealImage(editingArticle.img) ? editingArticle.img : undefined}
              editMode
              loading={editing}
              canDelete
              onPost={handleEditPost}
              onDelete={handleDelete}
              onCancel={() => setEditingArticle(null)}
            />
          )}
        </Box>
      </Dialog>

    </Box>
  );
}