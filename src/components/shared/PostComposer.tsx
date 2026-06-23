import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Avatar, Box, Button, Collapse, IconButton,
  Stack, Tooltip, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Snackbar, Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ImageOutlinedIcon    from "@mui/icons-material/ImageOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import CloseIcon            from "@mui/icons-material/Close";
import DeleteOutlineIcon    from "@mui/icons-material/DeleteOutline";
import SwapHorizIcon        from "@mui/icons-material/SwapHoriz";
import CheckIcon            from "@mui/icons-material/Check";
import FavoriteBorderIcon   from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon         from "@mui/icons-material/Favorite";
import BookmarkBorderIcon   from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon         from "@mui/icons-material/Bookmark";
import ShareOutlinedIcon    from "@mui/icons-material/ShareOutlined";

import { ReactionMessenger } from "./ReactionMessenger";
import type { Comment }      from "./ReactionMessenger";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PostComposerUser {
  name:       string;
  initials:   string;
  avatarSrc?: string;
  color?:     string;
}

export interface PostData {
  text:       string;
  title:      string;
  mediaFiles: File[];
}

export interface ReactionBarProps {
  storyId:           number;
  likes:             number;
  comments:          number;
  shares:            number;
  /** Pass true when the current user has already liked this story (from API) */
  liked?:            boolean;
  bookmarked?:       boolean;
  onLike?:           (id: number) => Promise<void>;
  onUnlike?:         (id: number) => Promise<void>;
  onComment?:        (id: number) => void;
  onShare?:          (id: number) => Promise<void>;
  onBookmark?:       (id: number) => void;
  accentColor?:      string;
  currentUser?:      { name: string; initials: string; avatarColor?: string; id?: number };
  onCommentSubmit?:  (id: number, text: string) => Promise<Comment>;
  /**
   * Called to load existing comments from the API when the comment panel opens.
   * Hits GET /love-stories/{id}/comments/ and maps to Comment[].
   */
  onFetchComments?:  (id: number) => Promise<Comment[]>;   // ← NEW
}

export interface PostComposerProps {
  user:             PostComposerUser;
  placeholder?:     string;
  accentColor?:     string;
  onPost?:          (data: PostData) => void;
  onDelete?:        () => void;
  disabled?:        boolean;
  initialTitle?:    string;
  initialText?:     string;
  currentImageUrl?: string;
  editMode?:        boolean;
  onCancel?:        () => void;
  canDelete?:       boolean;
  loading?:         boolean;
  sx?:              object;
}

// ─────────────────────────────────────────────────────────────────────────────
const SERIF = "'Playfair Display', Georgia, serif";

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers — track which story IDs the current user has liked
// ─────────────────────────────────────────────────────────────────────────────

const LIKED_KEY = "daykin_liked_stories";

function getLikedSet(): Set<number> {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    const arr: number[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function persistLikedSet(set: Set<number>) {
  try {
    localStorage.setItem(LIKED_KEY, JSON.stringify([...set]));
  } catch { /* quota exceeded — ignore */ }
}

export function isStoryLiked(id: number): boolean {
  return getLikedSet().has(id);
}

export function setStoryLiked(id: number, liked: boolean) {
  const set = getLikedSet();
  if (liked) set.add(id); else set.delete(id);
  persistLikedSet(set);
}

// localStorage helpers — bookmarks
const BOOKMARKED_KEY = "daykin_bookmarked_stories";

function getBookmarkedSet(): Set<number> {
  try {
    const raw = localStorage.getItem(BOOKMARKED_KEY);
    const arr: number[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function isStoryBookmarked(id: number): boolean {
  return getBookmarkedSet().has(id);
}

function setStoryBookmarked(id: number, bookmarked: boolean) {
  const set = getBookmarkedSet();
  if (bookmarked) set.add(id); else set.delete(id);
  try {
    localStorage.setItem(BOOKMARKED_KEY, JSON.stringify([...set]));
  } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// MediumReactionBar
// ─────────────────────────────────────────────────────────────────────────────

export const MediumReactionBar: React.FC<ReactionBarProps> = ({
  storyId,
  likes            = 0,
  comments         = 0,
  shares           = 0,
  liked            = false,
  bookmarked       = false,
  onLike,
  onUnlike,
  onShare,
  onBookmark,
  onCommentSubmit,
  onFetchComments,          // ← NEW — forwarded straight to ReactionMessenger
  accentColor      = "#E11D48",
  currentUser      = { name: "You", initials: "YO", avatarColor: "#7C3AED" },
}) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Initialise from localStorage (client-side persistence)
  const [localLiked,      setLocalLiked]      = useState(() => liked || isStoryLiked(storyId));
;
  const [localBookmarked, setLocalBookmarked] = useState(() => bookmarked || isStoryBookmarked(storyId));
  const [likeLoading,     setLikeLoading]     = useState(false);
  const [shareLoading,    setShareLoading]    = useState(false);
  const [bounce,          setBounce]          = useState(false);
  const [copied,          setCopied]          = useState(false);

  // Keep counts in sync with parent refreshes (don't override local liked state)
  const [localLikes,  setLocalLikes]  = useState(likes ?? 0);
  const [localShares, setLocalShares] = useState(shares ?? 0);

  useEffect(() => { setLocalLikes(likes ?? 0);   }, [likes]);
  useEffect(() => { setLocalShares(shares ?? 0); }, [shares]);

  // ── Like / Unlike toggle ───────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (likeLoading) return;

    const wasLiked = localLiked;
    setLocalLiked(!wasLiked);
    setLocalLikes(prev => prev + (wasLiked ? -1 : 1));
    setStoryLiked(storyId, !wasLiked);
    setBounce(true);
    setTimeout(() => setBounce(false), 400);

    setLikeLoading(true);
    try {
      if (wasLiked) {
        await onUnlike?.(storyId);
      } else {
        await onLike?.(storyId);
      }
    } catch {
      setLocalLiked(wasLiked);
      setLocalLikes(prev => prev + (wasLiked ? 1 : -1));
      setStoryLiked(storyId, wasLiked);
    } finally {
      setLikeLoading(false);
    }
  }, [likeLoading, localLiked, onLike, onUnlike, storyId]);

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (shareLoading) return;
    const url = window.location.href;

    if (navigator.share) {
      try { await navigator.share({ title: document.title, url }); }
      catch { return; }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* clipboard blocked */ }
    }

    setLocalShares(prev => prev + 1);
    setShareLoading(true);
    try {
      await onShare?.(storyId);
    } catch {
      setLocalShares(prev => prev - 1);
    } finally {
      setShareLoading(false);
    }
  }, [shareLoading, onShare, storyId]);

  // ── Bookmark (local only) ──────────────────────────────────────────────────
  const handleBookmark = () => {
    const next = !localBookmarked;
    setLocalBookmarked(next);
    setStoryBookmarked(storyId, next);
    onBookmark?.(storyId);
  };

  // ── Button style helper ────────────────────────────────────────────────────
  const btn = (active: boolean, activeColor: string) => ({
    display:      "flex",
    alignItems:   "center",
    gap:          0.6,
    px:           1,
    py:           0.5,
    borderRadius: "20px",
    cursor:       "pointer",
    transition:   "all 0.18s ease",
    color: active
      ? activeColor
      : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
    "&:hover": { color: activeColor, bgcolor: `${activeColor}14` },
    userSelect: "none" as const,
  });

  const countStyle = {
    fontFamily: SERIF,
    fontSize:   "0.78rem",
    fontWeight: 600,
    minWidth:   "1.4ch",
    lineHeight: 1,
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        py:           1,
        px:           0.5,
        borderTop:    `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
      }}
    >
      {/* Left — like + comment */}
      <Stack direction="row" alignItems="center" spacing={0.5}>

        {/* Like / Unlike toggle */}
        <Tooltip title={localLiked ? "Unlike" : "Like"} placement="top" arrow>
          <Box onClick={handleLike} sx={btn(localLiked, accentColor)}>
            <Box sx={{
              transform:  bounce ? "scale(1.38)" : "scale(1)",
              transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              display:    "flex",
            }}>
              {likeLoading
                ? <CircularProgress size={16} sx={{ color: "inherit" }} />
                : localLiked
                  ? <FavoriteIcon       sx={{ fontSize: 19 }} />
                  : <FavoriteBorderIcon sx={{ fontSize: 19 }} />
              }
            </Box>
            <Typography sx={countStyle}>
              {localLikes.toLocaleString()}
            </Typography>
          </Box>
        </Tooltip>

        {/*
          Comment panel — passes onFetchComments so ReactionMessenger
          can hit GET /love-stories/{id}/comments/ when the panel opens.
        */}
        <ReactionMessenger
          postId={storyId}
          accentColor="#6366F1"
          currentUser={currentUser}
          onCommentSubmit={
            onCommentSubmit
              ? async (id, text) => onCommentSubmit(id as number, text)
              : undefined
          }
          onFetchComments={
            onFetchComments
              ? async (id) => onFetchComments(id as number)   // ← NEW
              : undefined
          }
          initialCommentCount={comments}
          iconSize="small"
        />
      </Stack>

      {/* Right — bookmark + share */}
      <Stack direction="row" alignItems="center" spacing={0.5}>

        {/* Bookmark */}
        <Tooltip title={localBookmarked ? "Saved" : "Save for later"} placement="top" arrow>
          <Box onClick={handleBookmark} sx={btn(localBookmarked, "#F59E0B")}>
            {localBookmarked
              ? <BookmarkIcon       sx={{ fontSize: 19 }} />
              : <BookmarkBorderIcon sx={{ fontSize: 19 }} />}
          </Box>
        </Tooltip>

        {/* Share */}
        <Tooltip title={copied ? "Link copied!" : "Share story"} placement="top" arrow>
          <Box onClick={handleShare} sx={btn(copied, "#10B981")}>
            {shareLoading
              ? <CircularProgress size={14} sx={{ color: "inherit" }} />
              : copied
                ? <CheckIcon         sx={{ fontSize: 17 }} />
                : <ShareOutlinedIcon sx={{ fontSize: 17 }} />}
           <Typography sx={countStyle}>
             {localShares.toLocaleString()}
           </Typography>
          </Box>
        </Tooltip>
      </Stack>
    </Stack>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PostComposer
// ─────────────────────────────────────────────────────────────────────────────

const PostComposer: React.FC<PostComposerProps> = ({
  user,
  placeholder      = "Express your feelings here?",
  accentColor      = "#7C3AED",
  onPost,
  onDelete,
  disabled         = false,
  initialTitle,
  initialText,
  currentImageUrl,
  editMode         = false,
  onCancel,
  canDelete        = false,
  loading          = false,
  sx               = {},
}) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [open,          setOpen]          = useState(editMode);
  const [title,         setTitle]         = useState(initialTitle ?? "");
  const [text,          setText]          = useState(initialText ?? "");
  const [mediaFiles,    setMediaFiles]    = useState<File[]>([]);
  const [previews,      setPreviews]      = useState<string[]>([]);
  const [deleteDialog,  setDeleteDialog]  = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: "success" | "error" }>({
    open: false, msg: "", sev: "success",
  });

  const coverPreview = previews[0] ?? currentImageUrl ?? null;

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editMode) {
      setTitle(initialTitle ?? "");
      setText(initialText ?? "");
      setOpen(true);
    }
  }, [editMode, initialTitle, initialText]);

  // ── Media helpers ─────────────────────────────────────────────────────────
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setMediaFiles(prev => [...prev, ...files]);
    files.forEach(f => setPreviews(prev => [...prev, URL.createObjectURL(f)]));
    e.target.value = "";
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previews[0]) URL.revokeObjectURL(previews[0]);
    const newUrl = URL.createObjectURL(file);
    setMediaFiles(prev => { const n = [...prev]; n[0] = file; return n; });
    setPreviews(prev => { const n = [...prev]; n[0] = newUrl; return n; });
    e.target.value = "";
  };

  const removePreview = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setMediaFiles(p => p.filter((_, i) => i !== idx));
    setPreviews(p => p.filter((_, i) => i !== idx));
  };

  // ── Post / save ───────────────────────────────────────────────────────────
  const handlePost = () => {
    if (!title.trim() && !text.trim() && mediaFiles.length === 0) return;
    onPost?.({ title, text, mediaFiles });
    if (!editMode) {
      setTitle("");
      setText("");
      setMediaFiles([]);
      setPreviews([]);
      setOpen(false);
    }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = () => {
    setTitle(initialTitle ?? "");
    setText(initialText ?? "");
    setMediaFiles([]);
    setPreviews([]);
    if (!editMode) setOpen(false);
    onCancel?.();
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await onDelete?.();
      setSnack({ open: true, msg: "Story deleted.", sev: "success" });
    } catch {
      setSnack({ open: true, msg: "Could not delete. Try again.", sev: "error" });
    } finally {
      setDeleteLoading(false);
      setDeleteDialog(false);
    }
  };

  // ── Colors ────────────────────────────────────────────────────────────────
  const borderIdle   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const bgIdle       = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
  const bgIdleHover  = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const expandedBg   = isDark ? "#111111" : theme.palette.background.paper;
  const dividerColor = theme.palette.divider;

  return (
    <>
      <Box sx={{ width: "100%", ...sx }}>

        {/* Collapsed bar */}
        {!editMode && (
          <Collapse in={!open}>
            <Box
              onClick={() => setOpen(true)}
              sx={{
                display: "flex", alignItems: "center", gap: 1.5,
                px: 2, py: 1.2, borderRadius: "12px",
                border: `1px solid ${borderIdle}`,
                background: bgIdle,
                cursor: "text",
                transition: "border-color 0.2s, background 0.2s",
                "&:hover": { border: `1px solid ${accentColor}55`, background: bgIdleHover },
              }}
            >
              <Avatar
                src={user.avatarSrc}
                sx={{
                  width: 40, height: 40, bgcolor: user.color ?? accentColor,
                  fontFamily: SERIF, fontSize: "0.75rem",
                  border: `2px solid ${accentColor}55`, flexShrink: 0,
                }}
              >
                {user.initials}
              </Avatar>
              <Typography sx={{
                fontFamily: SERIF, color: theme.palette.text.disabled,
                fontSize: "0.92rem", userSelect: "none",
              }}>
                {placeholder}
              </Typography>
            </Box>
          </Collapse>
        )}

        {/* Expanded card */}
        <Collapse in={open}>
          <Box sx={{
            borderRadius: "14px",
            border: `1px solid ${accentColor}44`,
            background: expandedBg,
            boxShadow: isDark
              ? `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px ${accentColor}22`
              : `0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px ${accentColor}22`,
            overflow: "hidden",
          }}>

            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between"
              sx={{ px: 2.5, pt: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  src={user.avatarSrc}
                  sx={{
                    width: 44, height: 44, bgcolor: user.color ?? accentColor,
                    fontFamily: SERIF, fontSize: "0.78rem",
                    border: `2px solid ${accentColor}66`,
                  }}
                >
                  {user.initials}
                </Avatar>
                <Box>
                  <Typography sx={{
                    fontFamily: SERIF, fontWeight: 700,
                    color: theme.palette.text.primary, fontSize: "0.95rem", letterSpacing: 0.3,
                  }}>
                    {user.name}
                  </Typography>
                  <Typography sx={{
                    fontFamily: SERIF, color: theme.palette.text.disabled, fontSize: "0.75rem",
                  }}>
                    {editMode ? "Editing story…" : placeholder}
                  </Typography>
                </Box>
              </Stack>

              {/* Delete button */}
              {canDelete && editMode && (
                <Tooltip title="Delete story" placement="left" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteDialog(true)}
                    sx={{
                      color: theme.palette.error.main,
                      borderRadius: "8px", p: 1,
                      border: `1px solid ${theme.palette.error.main}33`,
                      "&:hover": {
                        bgcolor: `${theme.palette.error.main}18`,
                        borderColor: theme.palette.error.main,
                      },
                      transition: "all 0.18s ease",
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            {/* Cover image preview (edit mode) */}
            {editMode && coverPreview && (
              <Box sx={{ px: 2.5, pt: 1.5, position: "relative" }}>
                <Box sx={{
                  borderRadius: "10px", overflow: "hidden",
                  border: `1px solid ${dividerColor}`,
                  position: "relative", maxHeight: 220,
                }}>
                  <img
                    src={coverPreview}
                    alt="Cover"
                    style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
                  />
                  <Tooltip title="Change cover image" placement="top" arrow>
                    <IconButton
                      size="small"
                      onClick={() => coverInputRef.current?.click()}
                      sx={{
                        position: "absolute", bottom: 8, right: 8,
                        bgcolor: "rgba(0,0,0,0.62)", color: "#fff",
                        backdropFilter: "blur(4px)", borderRadius: "8px", p: "6px",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
                      }}
                    >
                      <SwapHorizIcon sx={{ fontSize: 18 }} />
                      <Typography sx={{ fontFamily: SERIF, fontSize: "0.7rem", ml: 0.5, fontWeight: 600 }}>
                        Change photo
                      </Typography>
                    </IconButton>
                  </Tooltip>
                </Box>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleCoverChange}
                />
              </Box>
            )}

            {/* ── Title input ── NEW ───────────────────────────────────────── */}
            <Box sx={{ px: 2.5, pt: 2, pb: 0 }}>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Story title…"
                maxLength={120}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${accentColor}33`,
                  outline: "none",
                  color: theme.palette.text.primary,
                  fontFamily: SERIF,
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  lineHeight: 1.4,
                  paddingBottom: "8px",
                  caretColor: accentColor,
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderBottomColor = accentColor)}
                onBlur={e => (e.target.style.borderBottomColor = `${accentColor}33`)}
              />
            </Box>

            {/* ── Body textarea ─────────────────────────────────────────────── */}
            <Box sx={{ px: 2.5, pt: 1.5 }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Tell your story here…"
                rows={5}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none", outline: "none", resize: "none",
                  color: theme.palette.text.primary,
                  fontFamily: SERIF,
                  fontSize: "0.93rem", lineHeight: 1.65,
                  caretColor: accentColor,
                  boxSizing: "border-box",
                }}
              />
            </Box>

            {/* Extra media previews (create mode) */}
            {!editMode && previews.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ px: 2.5, pb: 1 }}>
                {previews.map((src, i) => (
                  <Box key={i} sx={{
                    position: "relative", width: 72, height: 72,
                    borderRadius: "8px", overflow: "hidden",
                    border: `1px solid ${dividerColor}`,
                  }}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <IconButton
                      size="small"
                      onClick={() => removePreview(i)}
                      sx={{
                        position: "absolute", top: 2, right: 2,
                        bgcolor: "rgba(0,0,0,0.65)", color: "#fff", p: "2px",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.85)" },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}

            {/* Divider */}
            <Box sx={{ mx: 2.5, borderTop: `1px solid ${dividerColor}` }} />

            {/* Footer */}
            <Stack direction="row" alignItems="center" justifyContent="space-between"
              sx={{ px: 2, py: 1.5 }}>
              <Stack direction="row" spacing={0.5}>
                <input ref={imageInputRef} type="file" accept="image/*" multiple
                  style={{ display: "none" }} onChange={handleMediaChange} />
                <input ref={videoInputRef} type="file" accept="video/*" multiple
                  style={{ display: "none" }} onChange={handleMediaChange} />

                <Tooltip title="Add image" placement="top" arrow>
                  <IconButton size="small" onClick={() => imageInputRef.current?.click()} sx={{
                    color: theme.palette.text.secondary, borderRadius: "8px", p: 1,
                    "&:hover": { color: accentColor, bgcolor: `${accentColor}18` },
                    transition: "color 0.2s",
                  }}>
                    <ImageOutlinedIcon sx={{ fontSize: 22 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Add video" placement="top" arrow>
                  <IconButton size="small" onClick={() => videoInputRef.current?.click()} sx={{
                    color: theme.palette.text.secondary, borderRadius: "8px", p: 1,
                    "&:hover": { color: accentColor, bgcolor: `${accentColor}18` },
                    transition: "color 0.2s",
                  }}>
                    <VideocamOutlinedIcon sx={{ fontSize: 22 }} />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined" size="small"
                  onClick={handleCancel}
                  disabled={loading}
                  sx={{
                    fontFamily: SERIF, fontWeight: 600,
                    textTransform: "none", fontSize: "0.82rem",
                    color: theme.palette.text.secondary,
                    borderColor: dividerColor, borderRadius: "8px", px: 2,
                    "&:hover": { borderColor: theme.palette.text.primary, background: theme.palette.action.hover },
                  }}
                >
                  Cancel
                </Button>

                <Button
                  variant="contained" size="small"
                  onClick={handlePost}
                  disabled={disabled || loading || (!title.trim() && !text.trim() && mediaFiles.length === 0)}
                  sx={{
                    fontFamily: SERIF, fontWeight: 700,
                    textTransform: "none", fontSize: "0.82rem",
                    bgcolor: accentColor, borderRadius: "8px", px: 2.5,
                    minWidth: 80,
                    "&:hover": { bgcolor: `${accentColor}cc` },
                    "&.Mui-disabled": { bgcolor: `${accentColor}44`, color: theme.palette.text.disabled },
                  }}
                >
                  {loading
                    ? <CircularProgress size={14} sx={{ color: "inherit" }} />
                    : editMode ? "Save" : "Post"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Collapse>
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => !deleteLoading && setDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: "14px",
            background: isDark ? "#111" : "#fff",
            border: `1px solid ${theme.palette.error.main}33`,
            maxWidth: 380,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: SERIF, fontWeight: 700, pb: 0.5 }}>
          Delete this story?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{
            fontFamily: SERIF, color: theme.palette.text.secondary,
            fontSize: "0.9rem", lineHeight: 1.6,
          }}>
            This action is permanent and cannot be undone. Your story and all its engagement will be removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteDialog(false)}
            disabled={deleteLoading}
            sx={{ fontFamily: SERIF, textTransform: "none", color: theme.palette.text.secondary }}
          >
            Keep it
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
            sx={{
              fontFamily: SERIF, textTransform: "none", fontWeight: 700,
              bgcolor: theme.palette.error.main, borderRadius: "8px", px: 2.5,
              "&:hover": { bgcolor: theme.palette.error.dark },
            }}
          >
            {deleteLoading
              ? <CircularProgress size={14} sx={{ color: "#fff" }} />
              : "Yes, delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.sev}
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          sx={{ fontFamily: SERIF, borderRadius: "10px" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
};
export default PostComposer;