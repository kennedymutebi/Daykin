import React, { useRef, useState } from "react";
import {
  Avatar, Box, Button, Collapse, IconButton,
  Stack, Tooltip, Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import CloseIcon from "@mui/icons-material/Close";

export interface PostComposerUser {
  name: string;
  initials: string;
  avatarSrc?: string;
  color?: string;
}

export interface PostData {
  text: string;
  mediaFiles: File[];
}

export interface PostComposerProps {
  user: PostComposerUser;
  placeholder?: string;
  accentColor?: string;
  onPost?: (data: PostData) => void;
  sx?: object;
}

const SERIF = "'Playfair Display', Georgia, serif";

const PostComposer: React.FC<PostComposerProps> = ({
  user,
  placeholder = "Express your feelings here?",
  accentColor = "#7C3AED",
  onPost,
  sx = {},
}) => {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === "dark";

  const [open,       setOpen]       = useState(false);
  const [text,       setText]       = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previews,   setPreviews]   = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ── helpers ────────────────────────────────────────────────────────────────
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setMediaFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      setPreviews(prev => [...prev, URL.createObjectURL(f)]);
    });
    e.target.value = "";
  };

  const removePreview = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setMediaFiles(p => p.filter((_, i) => i !== idx));
    setPreviews(p => p.filter((_, i) => i !== idx));
  };

  const handlePost = () => {
    if (!text.trim() && mediaFiles.length === 0) return;
    onPost?.({ text, mediaFiles });
    setText(""); setMediaFiles([]); setPreviews([]); setOpen(false);
  };

  const handleCancel = () => {
    setText(""); setMediaFiles([]); setPreviews([]); setOpen(false);
  };

  // Derived surface values — flip cleanly between modes
  const borderIdle   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const bgIdle       = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
  const bgIdleHover  = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const expandedBg   = isDark ? "#111111" : theme.palette.background.paper;
  const dividerColor = theme.palette.divider;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ width: "100%", ...sx }}>

      {/* ── Collapsed bar ── */}
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
            "&:hover": {
              border: `1px solid ${accentColor}55`,
              background: bgIdleHover,
            },
          }}
        >
          <Avatar
            src={user.avatarSrc}
            sx={{
              width: 40, height: 40,
              bgcolor: user.color ?? accentColor,
              fontFamily: SERIF, fontSize: "0.75rem",
              border: `2px solid ${accentColor}55`,
              flexShrink: 0,
            }}
          >
            {user.initials}
          </Avatar>

          <Typography
            sx={{
              fontFamily: SERIF,
              color: theme.palette.text.disabled,
              fontSize: "0.92rem",
              userSelect: "none",
            }}
          >
            {placeholder}
          </Typography>
        </Box>
      </Collapse>

      {/* ── Expanded card ── */}
      <Collapse in={open}>
        <Box
          sx={{
            borderRadius: "14px",
            border: `1px solid ${accentColor}44`,
            background: expandedBg,
            boxShadow: isDark
              ? `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px ${accentColor}22`
              : `0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px ${accentColor}22`,
            overflow: "hidden",
          }}
        >
          {/* Header row */}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.5, pt: 2.5 }}>
            <Avatar
              src={user.avatarSrc}
              sx={{
                width: 44, height: 44,
                bgcolor: user.color ?? accentColor,
                fontFamily: SERIF, fontSize: "0.78rem",
                border: `2px solid ${accentColor}66`,
              }}
            >
              {user.initials}
            </Avatar>
            <Box>
              <Typography
                sx={{
                  fontFamily: SERIF, fontWeight: 700,
                  color: theme.palette.text.primary,
                  fontSize: "0.95rem", letterSpacing: 0.3,
                }}
              >
                {user.name}
              </Typography>
              <Typography
                sx={{
                  fontFamily: SERIF,
                  color: theme.palette.text.disabled,
                  fontSize: "0.75rem",
                }}
              >
                {placeholder}
              </Typography>
            </Box>
          </Stack>

          {/* Textarea */}
          <Box sx={{ px: 2.5, pt: 1.5 }}>
            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              style={{
                width: "100%",
                background: "transparent",
                border: "none", outline: "none", resize: "none",
                // Typed text and placeholder both use theme tokens
                color: theme.palette.text.primary,
                fontFamily: SERIF,
                fontSize: "0.93rem", lineHeight: 1.65,
                caretColor: accentColor,
                boxSizing: "border-box",
              }}
            />
          </Box>

          {/* Media previews */}
          {previews.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ px: 2.5, pb: 1 }}>
              {previews.map((src, i) => (
                <Box
                  key={i}
                  sx={{
                    position: "relative", width: 72, height: 72,
                    borderRadius: "8px", overflow: "hidden",
                    border: `1px solid ${dividerColor}`,
                  }}
                >
                  <img src={src} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <IconButton
                    size="small"
                    onClick={() => removePreview(i)}
                    sx={{
                      position: "absolute", top: 2, right: 2,
                      // Overlay on image — always dark pill regardless of mode
                      bgcolor: "rgba(0,0,0,0.65)",
                      color: "#fff", p: "2px",
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
          <Box sx={{ mx: 2.5, borderTop: `1px solid ${dividerColor}`, mb: 0 }} />

          {/* Footer row */}
          <Stack
            direction="row" alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, py: 1.5 }}
          >
            {/* Media buttons */}
            <Stack direction="row" spacing={0.5}>
              <input ref={imageInputRef} type="file" accept="image/*"
                multiple style={{ display: "none" }} onChange={handleMediaChange} />
              <input ref={videoInputRef} type="file" accept="video/*"
                multiple style={{ display: "none" }} onChange={handleMediaChange} />

              <Tooltip title="Add image" placement="top">
                <IconButton size="small"
                  onClick={() => imageInputRef.current?.click()}
                  sx={{
                    color: theme.palette.text.secondary,
                    borderRadius: "8px", p: 1,
                    "&:hover": { color: accentColor, bgcolor: `${accentColor}18` },
                    transition: "color 0.2s",
                  }}
                >
                  <ImageOutlinedIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Add video" placement="top">
                <IconButton size="small"
                  onClick={() => videoInputRef.current?.click()}
                  sx={{
                    color: theme.palette.text.secondary,
                    borderRadius: "8px", p: 1,
                    "&:hover": { color: accentColor, bgcolor: `${accentColor}18` },
                    transition: "color 0.2s",
                  }}
                >
                  <VideocamOutlinedIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Action buttons */}
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined" size="small"
                onClick={handleCancel}
                sx={{
                  fontFamily: SERIF, fontWeight: 600,
                  textTransform: "none", fontSize: "0.82rem",
                  color: theme.palette.text.secondary,
                  borderColor: dividerColor,
                  borderRadius: "8px", px: 2,
                  "&:hover": {
                    borderColor: theme.palette.text.primary,
                    background: theme.palette.action.hover,
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained" size="small"
                onClick={handlePost}
                disabled={!text.trim() && mediaFiles.length === 0}
                sx={{
                  fontFamily: SERIF, fontWeight: 700,
                  textTransform: "none", fontSize: "0.82rem",
                  bgcolor: accentColor, borderRadius: "8px", px: 2.5,
                  "&:hover": { bgcolor: `${accentColor}cc` },
                  "&.Mui-disabled": {
                    bgcolor: `${accentColor}44`,
                    color: theme.palette.text.disabled,
                  },
                }}
              >
                Post
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default PostComposer;