// src/pages/birthday/CelebTwinsPage.tsx
import React, { useState } from "react";
import {
  Box, Typography, TextField, MenuItem, Button, Chip, Avatar, IconButton, useTheme,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SearchIcon from "@mui/icons-material/Search";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SERIF = "'Playfair Display', Georgia, serif";

// ---------------------------------------------------------------------------
// Dummy data — styled after the Substack-style article cards on the Love
// Stories page. Swap `image` for your real /public asset paths and the
// names/titles/excerpts for the real people once you have them; the shape
// (title, excerpt, image, category, readTime, date, author, likes, comments)
// is all the card needs.
// ---------------------------------------------------------------------------
interface CelebArticle {
  id: string;
  title: string;
  excerpt: string;
  image: string; // path under /public, e.g. "/images/celebs/gandhi.jpg"
  category: string;
  readTime: string;
  date: string;
  author: { name: string; initials: string; verified?: boolean };
  likes: number;
  comments: number;
}

const CELEBRITY_ARTICLES: CelebArticle[] = [
  {
    id: "c1",
    title: "Wangari Maathai: Planting a Movement, One Tree at a Time",
    excerpt:
      "Before she became the first African woman to win the Nobel Peace Prize, she was planting seedlings in her backyard — one small act that grew into a continent-wide movement for reforestation and civic courage.",
    image: "/elonemask.jpg",
    category: "Nobel Laureates",
    readTime: "4 min read",
    date: "15 Oct 2026",
    author: { name: "Editorial Team", initials: "ET", verified: true },
    likes: 312,
    comments: 28,
  },
  {
    id: "c2",
    title: "Friedrich Nietzsche: The Philosopher Who Rewrote the Rules",
    excerpt:
      "Born the same week as reformers and revolutionaries across two centuries, Nietzsche spent his life questioning the ideas everyone else took for granted — and paid for it with the loneliness that came with being early.",
    image: "/mj.png",
    category: "Philosophy",
    readTime: "6 min read",
    date: "15 Oct 2026",
    author: { name: "Editorial Team", initials: "ET", verified: true },
    likes: 198,
    comments: 41,
  },
  {
    id: "c3",
    title: "Mariah Carey and the Birthdays That Made Pop History",
    excerpt:
      "A handful of chart-topping icons share this date, and it's no coincidence how many of them credit an October birthday with a certain restless, ambitious streak.",
    image: "/gomez.jpg",
    category: "Music",
    readTime: "3 min read",
    date: "15 Oct 2026",
    author: { name: "Editorial Team", initials: "ET" },
    likes: 456,
    comments: 63,
  },
  {
    id: "c4",
    title: "Virgil Abloh: Designing a Decade in Fifteen Years",
    excerpt:
      "He treated fashion like architecture and streetwear like fine art, compressing a career's worth of influence into a run that ended far too soon — but changed how an entire industry thinks about taste.",
    image: "/Hero.png",
    category: "Design",
    readTime: "5 min read",
    date: "15 Oct 2026",
    author: { name: "Editorial Team", initials: "ET", verified: true },
    likes: 271,
    comments: 19,
  },
];

const CelebTwinsPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gold = theme.palette.gold.main;
  const paper = theme.palette.background.paper;
  const textMuted = theme.palette.text.secondary;

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");

  // local, optimistic like/bookmark state — swap for real API calls later
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const toggleLiked = (id: string) => setLiked((p) => ({ ...p, [id]: !p[id] }));
  const toggleSaved = (id: string) => setSaved((p) => ({ ...p, [id]: !p[id] }));

  const fieldSx = {
    "& .MuiOutlinedInput-root": { bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F7F7F9", borderRadius: 2 },
  };

  return (
    <Box display="flex" flexDirection="column" gap={3} sx={{ maxWidth: { md: 1000 }, mx: { md: "auto" } }}>
      <Box>
        <Chip
          label="ARCHIVE OF LUMINARIES"
          size="small"
          sx={{ bgcolor: `${gold}22`, color: gold, fontWeight: 700, mb: 1.5 }}
        />
        <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: theme.palette.text.primary }}>
          Celebrity Birthday Twins
        </Typography>
        <Typography sx={{ fontSize: "0.85rem", color: textMuted, mt: 1 }}>
          Explore our scholarly database of historical figures, artists, and modern icons. Uncover the cosmic alignment
          of those who share your day of birth through meticulously curated biographical articles.
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: paper, borderRadius: 3, p: 2.2,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
          display: "flex", flexDirection: "column", gap: 1.5,
          maxWidth: { md: 420 },
        }}
      >
        <TextField
          select fullWidth size="small" label="Day (1-31)" value={day}
          onChange={(e) => setDay(e.target.value)} sx={fieldSx}
          InputProps={{ startAdornment: <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} /> }}
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <MenuItem key={d} value={d}>{d}</MenuItem>
          ))}
        </TextField>
        <TextField
          select fullWidth size="small" label="Select Month" value={month}
          onChange={(e) => setMonth(e.target.value)} sx={fieldSx}
        >
          {MONTHS.map((m) => (
            <MenuItem key={m} value={m}>{m}</MenuItem>
          ))}
        </TextField>
        <Button
          fullWidth startIcon={<SearchIcon />}
          sx={{ bgcolor: gold, color: "#0D0D0D", fontWeight: 700, borderRadius: 2, py: 1 }}
        >
          Find Twins
        </Button>
      </Box>

      {/* ------------------------------------------------------------------ */}
      {/* Celebrity articles — Substack-style full-width cards: serif title, */}
      {/* clamped excerpt, natural-ratio image, then a byline row with an    */}
      {/* avatar, date/read-time, and a quiet like + bookmark footer.        */}
      {/* ------------------------------------------------------------------ */}
      <Box>
        <Chip
          label="OCTOBER 15"
          size="small"
          sx={{ bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#EEE", fontWeight: 700, mb: 2 }}
        />

        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {CELEBRITY_ARTICLES.map((a) => {
            const isLiked = !!liked[a.id];
            const isSaved = !!saved[a.id];
            const likeCount = a.likes + (isLiked ? 1 : 0);

            return (
              <Box
                key={a.id}
                sx={{
                  borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                  py: 3,
                }}
              >
                {/* Title */}
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontSize: { xs: "1.05rem", sm: "1.2rem" },
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: theme.palette.text.primary,
                    mb: 0.75,
                    cursor: "pointer",
                    transition: "color 0.18s",
                    "&:hover": { color: gold },
                  }}
                >
                  {a.title}
                </Typography>

                {/* Excerpt */}
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontSize: "0.88rem",
                    color: textMuted,
                    lineHeight: 1.65,
                    mb: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {a.excerpt}
                </Typography>

                {/* Cover image — natural ratio, capped height, from /public */}
                <Box
                    sx={{
                      width: "100%",
                      mb: 2,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                  <Box
                    component="img"
                    src={a.image}
                    alt={a.title}
                    sx={{
                      display: "block",
                      width: "100%",
                     height: "auto",
                     maxHeight: "420px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                </Box>

                {/* Byline row */}
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap"  mb={1.2}>
                  <Avatar sx={{
                    width: 24, height: 24, bgcolor: gold,
                    fontFamily: SERIF, fontSize: "0.55rem", fontWeight: 700, flexShrink: 0,
                  }}>
                    {a.author.initials}
                  </Avatar>
                  <Typography sx={{
                    fontFamily: SERIF, fontSize: "0.78rem", fontWeight: 600,
                    color: theme.palette.text.primary, whiteSpace: "nowrap",
                  }}>
                    {a.author.name}
                  </Typography>
                  {a.author.verified && (
                    <Box sx={{
                      width: 13, height: 13, bgcolor: gold, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Typography sx={{ fontSize: "0.45rem", color: "#0D0D0D", lineHeight: 1 }}>✓</Typography>
                    </Box>
                  )}
                  <Typography sx={{ fontSize: "0.7rem", color: theme.palette.text.disabled }}>·</Typography>
                  <Typography sx={{ fontFamily: SERIF, fontSize: "0.7rem", color: textMuted, whiteSpace: "nowrap" }}>
                    {a.category} · {a.date} · {a.readTime}
                  </Typography>
                </Box>

                {/* Footer: like + comment count on the left, save + read more on the right */}
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      onClick={() => toggleLiked(a.id)}
                      sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }}
                    >
                      <IconButton size="small" sx={{ p: 0.3, color: isLiked ? gold : textMuted }}>
                        {isLiked ? <FavoriteIcon sx={{ fontSize: 17 }} /> : <FavoriteBorderIcon sx={{ fontSize: 17 }} />}
                      </IconButton>
                      <Typography sx={{ fontFamily: SERIF, fontSize: "0.78rem", color: isLiked ? gold : textMuted }}>
                        {likeCount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <ChatBubbleOutlineIcon sx={{ fontSize: 15, color: textMuted }} />
                      <Typography sx={{ fontFamily: SERIF, fontSize: "0.78rem", color: textMuted }}>
                        {a.comments}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography sx={{ fontFamily: SERIF, fontSize: "0.8rem", fontWeight: 700, color: gold, cursor: "pointer" }}>
                      Read More →
                    </Typography>
                    <IconButton size="small" onClick={() => toggleSaved(a.id)} sx={{ p: 0.3, color: isSaved ? gold : textMuted }}>
                      {isSaved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: theme.palette.text.primary }}>
              Curated Collections
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: textMuted }}>
              Hand-picked articles for specific celebratory themes.
            </Typography>
          </Box>
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: gold, whiteSpace: "nowrap", cursor: "pointer" }}>
            View All
          </Typography>
        </Box>

        <Box
          sx={{
            position: "relative", borderRadius: 3, height: 150, overflow: "hidden",
            background: "linear-gradient(135deg, #2A2A3E, #1A1A2E)", mb: 2,
          }}
        >
          <Box sx={{ position: "absolute", bottom: 14, left: 16 }}>
            <Typography sx={{ color: gold, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px" }}>
              FEATURED SERIES
            </Typography>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.15rem" }}>
              Royal Birthdays & Courtly Celebrations
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1.5}>
          <Box
            sx={{
              flex: 1, borderRadius: 3, p: 1.8,
              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#EDEDF2",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: theme.palette.text.primary }}>
              Astrological Luminaries
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1, borderRadius: 3, p: 1.8,
              bgcolor: isDark ? "rgba(245,166,35,0.1)" : "#FBF3E2",
              border: `1px solid ${gold}40`,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: theme.palette.text.primary }}>
              Scientific Pioneers
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CelebTwinsPage;