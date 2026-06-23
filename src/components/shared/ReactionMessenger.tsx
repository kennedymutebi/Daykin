import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box, Typography, IconButton, TextField, Avatar,
  Stack, Divider, Fade, Slide, CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ChatBubbleOutlineIcon     from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon                 from "@mui/icons-material/Close";
import SendIcon                  from "@mui/icons-material/Send";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Comment {
  id:           number | string;
  author:       string;
  initials:     string;
  avatarColor?: string;
  text:         string;
  timestamp:    string;
}

export interface ReactionMessengerProps {
  postId:               number | string;
  initialCommentCount?: number;
  accentColor?:         string;
  currentUser?:         { name: string; initials: string; avatarColor?: string };
  /** Called when user submits a comment — should POST to API */
  onCommentSubmit?:     (postId: number | string, text: string) => Promise<Comment> | void;
  /**
   * Called to fetch existing comments from the API when the panel first opens.
   * Should hit GET /love-stories/{id}/comments/
   */
  onFetchComments?:     (postId: number | string) => Promise<Comment[]>;
  iconSize?:            "small" | "medium";
  sx?:                  object;
}

const SERIF = "'Playfair Display', Georgia, serif";

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const num = parseInt(
    clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean,
    16,
  );
  return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`;
}

// ── Component ──────────────────────────────────────────────────────────────────
export const ReactionMessenger: React.FC<ReactionMessengerProps> = ({
  postId,
  initialCommentCount = 0,
  accentColor         = "#6366F1",
  currentUser         = { name: "You", initials: "YO", avatarColor: "#7C3AED" },
  onCommentSubmit,
  onFetchComments,          // ← wired from MediumReactionBar → ArticleCard → LoveStoriesPage
  iconSize            = "small",
  sx                  = {},
}) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [open,       setOpen]       = useState(false);
  const [comments,   setComments]   = useState<Comment[]>([]);
  const [fetching,   setFetching]   = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [text,       setText]       = useState("");
  const [sending,    setSending]    = useState(false);
  const [sendError,  setSendError]  = useState<string | null>(null);

  // Track whether we've already fetched for this postId
  const fetchedRef = useRef(false);

  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  // Live count: once fetched, use real array length; otherwise seed from API count
  const displayCount = fetchedRef.current ? comments.length : initialCommentCount;

  // ── Fetch comments from API when panel first opens ─────────────────────────
  useEffect(() => {
    if (!open || fetchedRef.current || !onFetchComments) return;

    setFetching(true);
    setFetchError(false);

    onFetchComments(postId)
      .then(data => {
        setComments(data);
        fetchedRef.current = true;
      })
      .catch(() => setFetchError(true))
      .finally(() => setFetching(false));
  }, [open, postId, onFetchComments]);

  // Scroll to bottom whenever comments change while panel is open
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments, open]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // ── Submit comment ─────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSendError(null);
    setSending(true);

    // Optimistic add
    const tempId = `temp-${Date.now()}`;
    const newComment: Comment = {
      id:          tempId,
      author:      currentUser.name,
      initials:    currentUser.initials,
      avatarColor: currentUser.avatarColor,
      text:        trimmed,
      timestamp:   new Date().toISOString(),
    };
    setComments(prev => [...prev, newComment]);
    setText("");

    try {
      await onCommentSubmit?.(postId, trimmed);
    } catch {
      // Revert optimistic comment and restore text so user can retry
      setComments(prev => prev.filter(c => c.id !== tempId));
      setText(trimmed);
      setSendError("Failed to post. Try again.");
    } finally {
      setSending(false);
    }
  }, [text, sending, currentUser, postId, onCommentSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Retry fetch: reset flag and re-open panel
  const handleRetry = useCallback(() => {
    fetchedRef.current = false;
    setFetchError(false);
    setOpen(false);
    setTimeout(() => setOpen(true), 50);
  }, []);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const panelBg = isDark ? "#1a1a2e" : "#fff";
  const border  = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const subtle  = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  return (
    <Box sx={{ position: "relative", display: "inline-flex", ...sx }}>

      {/* Trigger button */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <IconButton
          size={iconSize}
          onClick={() => setOpen(p => !p)}
          sx={{
            color: open ? accentColor : theme.palette.text.secondary,
            transition: "all 0.2s",
            "&:hover": { color: accentColor, bgcolor: `${accentColor}18` },
          }}
        >
          <ChatBubbleOutlineIcon sx={{ fontSize: iconSize === "small" ? 18 : 22 }} />
        </IconButton>
        {displayCount > 0 && (
          <Typography sx={{
            fontSize: "0.72rem", fontFamily: SERIF,
            color: theme.palette.text.secondary, lineHeight: 1,
          }}>
            {displayCount}
          </Typography>
        )}
      </Box>

      {/* Sliding panel */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Box
          ref={panelRef}
          sx={{
            position:  "fixed",
            bottom:    { xs: 0,    sm: 24 },
            right:     { xs: 0,    sm: 24 },
            width:     { xs: "100vw", sm: 380 },
            maxHeight: { xs: "80vh", sm: 540 },
            zIndex:    1300,
            bgcolor:   panelBg,
            borderRadius: { xs: "20px 20px 0 0", sm: "16px" },
            border:    `1px solid ${border}`,
            boxShadow: isDark
              ? "0 -8px 40px rgba(0,0,0,0.6)"
              : "0 -4px 40px rgba(0,0,0,0.14)",
            display:       "flex",
            flexDirection: "column",
            overflow:      "hidden",
          }}
        >
          {/* Header */}
          <Box sx={{
            px: 2.5, py: 1.8,
            borderBottom: `1px solid ${border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: isDark
              ? `linear-gradient(135deg, rgba(${hexToRgb(accentColor)},0.15) 0%, transparent 60%)`
              : `linear-gradient(135deg, rgba(${hexToRgb(accentColor)},0.08) 0%, transparent 60%)`,
          }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: accentColor }} />
              <Typography sx={{
                fontFamily: SERIF, fontWeight: 700,
                fontSize: "0.95rem", color: theme.palette.text.primary,
              }}>
                Comments
                {displayCount > 0 && (
                  <Typography component="span" sx={{
                    fontFamily: SERIF, fontSize: "0.75rem",
                    color: theme.palette.text.secondary, ml: 0.8,
                  }}>
                    ({displayCount})
                  </Typography>
                )}
              </Typography>
            </Stack>
            <IconButton size="small" onClick={() => setOpen(false)}
              sx={{ color: theme.palette.text.secondary }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Comments list */}
          <Box sx={{
            flex: 1, overflowY: "auto",
            px: 2.5, py: 1.5,
            display: "flex", flexDirection: "column", gap: 1.5,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: `${accentColor}40`, borderRadius: 2 },
          }}>

            {/* Loading */}
            {fetching && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} sx={{ color: accentColor }} />
              </Box>
            )}

            {/* Fetch error */}
            {fetchError && !fetching && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <Typography sx={{
                  fontFamily: SERIF, fontSize: "0.8rem",
                  color: theme.palette.error.main,
                }}>
                  Could not load comments.{" "}
                  <Box
                    component="span"
                    onClick={handleRetry}
                    sx={{ cursor: "pointer", textDecoration: "underline" }}
                  >
                    Retry
                  </Box>
                </Typography>
              </Box>
            )}

            {/* Empty state — only show after a successful fetch */}
            {!fetching && !fetchError && fetchedRef.current && comments.length === 0 && (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <EmojiEmotionsOutlinedIcon sx={{
                  fontSize: 36, color: theme.palette.action.disabled, mb: 1,
                }} />
                <Typography sx={{
                  fontFamily: SERIF, fontSize: "0.8rem",
                  color: theme.palette.text.disabled,
                }}>
                  Be the first to comment!
                </Typography>
              </Box>
            )}

            {/* Comment bubbles */}
            {!fetching && comments.map(c => (
              <Fade key={c.id} in timeout={300}>
                <Box sx={{ display: "flex", gap: 1.2, alignItems: "flex-start" }}>
                  <Avatar sx={{
                    width: 30, height: 30, flexShrink: 0,
                    bgcolor: c.avatarColor ?? accentColor,
                    fontSize: "0.62rem", fontFamily: SERIF, fontWeight: 700,
                  }}>
                    {c.initials}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{
                      bgcolor: subtle,
                      borderRadius: "4px 14px 14px 14px",
                      px: 1.5, py: 1,
                      border: `1px solid ${border}`,
                    }}>
                      <Typography sx={{
                        fontFamily: SERIF, fontSize: "0.75rem",
                        fontWeight: 700, color: accentColor, mb: 0.3,
                      }}>
                        {c.author}
                      </Typography>
                      <Typography sx={{
                        fontFamily: SERIF, fontSize: "0.83rem",
                        color: theme.palette.text.primary,
                        lineHeight: 1.5, wordBreak: "break-word",
                      }}>
                        {c.text}
                      </Typography>
                    </Box>
                    <Typography sx={{
                      fontFamily: SERIF, fontSize: "0.67rem",
                      color: theme.palette.text.disabled,
                      mt: 0.4, ml: 0.5,
                    }}>
                      {relativeTime(c.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              </Fade>
            ))}

            <div ref={bottomRef} />
          </Box>

          <Divider sx={{ borderColor: border }} />

          {/* Send error */}
          {sendError && (
            <Typography sx={{
              fontFamily: SERIF, fontSize: "0.75rem",
              color: theme.palette.error.main,
              px: 2.5, pt: 1, textAlign: "center",
            }}>
              {sendError}
            </Typography>
          )}

          {/* Input row */}
          <Box sx={{
            px: 2, py: 1.5,
            display: "flex", alignItems: "center", gap: 1,
            bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          }}>
            <Avatar sx={{
              width: 28, height: 28, flexShrink: 0,
              bgcolor: currentUser.avatarColor ?? accentColor,
              fontSize: "0.6rem", fontFamily: SERIF, fontWeight: 700,
            }}>
              {currentUser.initials}
            </Avatar>
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={3}
              size="small"
              placeholder="Write a comment…"
              value={text}
              onChange={e => { setText(e.target.value); setSendError(null); }}
              onKeyDown={handleKeyDown}
              disabled={sending}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "20px",
                  fontSize: "0.82rem",
                  fontFamily: SERIF,
                  bgcolor: subtle,
                  "& fieldset": { borderColor: border },
                  "&:hover fieldset": { borderColor: `${accentColor}60` },
                  "&.Mui-focused fieldset": { borderColor: accentColor },
                },
                "& .MuiInputBase-input": {
                  py: "6px",
                  color: theme.palette.text.primary,
                },
              }}
            />
            <IconButton
              size="small"
              onClick={handleSend}
              disabled={!text.trim() || sending}
              sx={{
                color: text.trim() && !sending ? accentColor : theme.palette.action.disabled,
                transition: "all 0.2s",
                "&:hover": { bgcolor: `${accentColor}18`, transform: "scale(1.1)" },
                "&:active": { transform: "scale(0.95)" },
              }}
            >
              {sending
                ? <CircularProgress size={16} sx={{ color: accentColor }} />
                : <SendIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Box>
        </Box>
      </Slide>

      {/* Mobile backdrop */}
      <Fade in={open}>
        <Box
          onClick={() => setOpen(false)}
          sx={{
            display: { xs: "block", sm: "none" },
            position: "fixed", inset: 0,
            bgcolor: "rgba(0,0,0,0.45)",
            zIndex: 1299,
          }}
        />
      </Fade>
    </Box>
  );
};

export default ReactionMessenger;