import React, { useState, useMemo } from "react";
import {
  Avatar, Box, Button, Chip, Stack, Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import VisibilityIcon from "@mui/icons-material/Visibility";

import PostComposer from "../components/shared/PostComposer";
import ArticleSearchBar from "../components/shared/ArticleSearchBar";
import { AudioControls } from "../components/shared/AudioControls";
import { EngagementBar } from "../components/shared/EngagementBar";
import { ArticleModal } from "../components/shared/ArticleModal";
import { useAudio } from "../hooks/useAudio";
import { SPORTS_ARTICLES } from "../data/sportsArticles";
import type { Article } from "../types/article";

const SERIF            = "'Playfair Display', Georgia, serif";
const ACCENT           = "#F97316";
const COMPOSER_ACCENT  = "#1D4ED8";

const CURRENT_USER = {
  name: "Mutebi Kennedy", initials: "MK",
  avatarSrc: "/me.jpg",   color: "#1D4ED8",
};

const CATEGORY_COLORS: Record<string, string> = {
  Football:   "#F59E0B",
  Basketball: "#F59E0B",
  Tennis:     "#F59E0B",
  Athletics:  "#F59E0B",
  Cricket:    "#F59E0B",
  Swimming:   "#F59E0B",
  Rugby:      "#F59E0B",
};

const FILTERS = ["All", "Recent", "Most Liked", "Editor's Pick", "Live"];

function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? ACCENT;
}

// ── ArticleCard ───────────────────────────────────────────────────────────────
const ArticleCard: React.FC<{
  article: Article;
  onOpen: (a: Article) => void;
  audio: ReturnType<typeof useAudio>;
}> = ({ article, onOpen, audio }) => {
  const theme    = useTheme();
  const catColor = categoryColor(article.category);

  return (
    <article
      style={{
        display: "flex", flexDirection: "column",
        borderBottom: `1px solid ${theme.palette.divider}`,
        paddingBottom: "2rem",
      }}
    >
      {/* Author row */}
      <Stack direction="row" alignItems="center" spacing={1.2} mb={1.2}>
        <Avatar
          sx={{
            width: 34, height: 34,
            bgcolor: article.authorColor ?? ACCENT,
            fontFamily: SERIF, fontSize: "0.68rem", fontWeight: 700,
            border: `2px solid ${theme.palette.divider}`,
          }}
        >
          {article.authorInitials ?? article.author?.slice(0, 2)}
        </Avatar>

        <Box>
          <Stack direction="row" alignItems="center" spacing={0.6}>
            <Typography sx={{
              fontFamily: SERIF, fontSize: "0.8rem", fontWeight: 700,
              color: theme.palette.text.primary,
            }}>
              {article.author}
            </Typography>
            {article.verified && (
              <Box sx={{
                width: 14, height: 14, bgcolor: ACCENT, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Typography sx={{ fontSize: "0.5rem", color: "#fff", lineHeight: 1 }}>✓</Typography>
              </Box>
            )}
          </Stack>
          <Typography sx={{
            fontFamily: SERIF, fontSize: "0.7rem",
            color: theme.palette.text.disabled,
          }}>
            {article.date} · {article.readTime}
          </Typography>
        </Box>
      </Stack>

      {/* Hero image */}
      <Box
        onClick={() => onOpen(article)}
        sx={{
          width: "100%", aspectRatio: "16/9",
          overflow: "hidden", mb: 1.2,
          position: "relative", cursor: "pointer",
          borderRadius: "10px",
          "&:hover img": { transform: "scale(1.04)" },
        }}
      >
        <img
          src={article.img} alt={article.title}
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", display: "block",
            transition: "transform 0.45s ease",
          }}
        />

        {/* Sport icon badge — overlay on image, always semi-transparent */}
        <Box sx={{
          position: "absolute", top: 10, right: 10,
          bgcolor: `${catColor}22`, backdropFilter: "blur(6px)",
          borderRadius: "50%", width: 34, height: 34,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${catColor}44`,
        }}>
          <SportsSoccerIcon sx={{ fontSize: 15, color: catColor }} />
        </Box>

        {/* Likes badge — dark pill on image, intentionally fixed */}
        <Box sx={{
          position: "absolute", bottom: 10, left: 10,
          bgcolor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
          borderRadius: "20px", px: 1.2, py: 0.4,
          display: "flex", alignItems: "center", gap: 0.5,
        }}>
          <LocalFireDepartmentIcon sx={{ fontSize: 11, color: ACCENT }} />
          <Typography sx={{ fontFamily: SERIF, fontSize: "0.7rem", color: "rgba(255,255,255,0.75)" }}>
            {article.engagement.likes.toLocaleString()}
          </Typography>
        </Box>

        {/* View count badge — dark pill on image, intentionally fixed */}
        {article.engagement.views !== undefined && (
          <Box sx={{
            position: "absolute", bottom: 10, right: 10,
            bgcolor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
            borderRadius: "20px", px: 1.2, py: 0.4,
            display: "flex", alignItems: "center", gap: 0.5,
          }}>
            <VisibilityIcon sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
            <Typography sx={{ fontFamily: SERIF, fontSize: "0.7rem", color: "rgba(255,255,255,0.55)" }}>
              {(article.engagement.views / 1000).toFixed(0)}K
            </Typography>
          </Box>
        )}
      </Box>

      {/* Category pill */}
      <Box mb={0.8}>
        <Chip
          icon={<SportsSoccerIcon sx={{ fontSize: "11px !important", color: `${catColor} !important` }} />}
          label={article.category}
          size="small"
          sx={{
            fontFamily: SERIF, fontSize: "0.65rem", letterSpacing: "0.05em",
            bgcolor: `${catColor}1A`, color: catColor,
            border: `1px solid ${catColor}33`,
            height: 22, textTransform: "uppercase",
            "& .MuiChip-label": { px: 1 },
          }}
        />
      </Box>

      {/* Title */}
      <Typography
        onClick={() => onOpen(article)}
        sx={{
          fontFamily: SERIF, fontSize: { xs: "1.1rem", sm: "1.18rem" },
          fontWeight: 700, lineHeight: 1.3,
          color: theme.palette.text.primary,
          mb: 0.8, cursor: "pointer", transition: "color 0.18s",
          "&:hover": { color: ACCENT },
        }}
      >
        {article.title}
      </Typography>

      {/* Excerpt */}
      <Typography
        onClick={() => onOpen(article)}
        sx={{
          fontFamily: SERIF, fontSize: "0.88rem",
          color: theme.palette.text.secondary,
          lineHeight: 1.62, mb: 1, cursor: "pointer",
          display: "-webkit-box", WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}
      >
        {article.excerpt}
      </Typography>

      <AudioControls articleId={article.id} audio={audio} color={ACCENT} />
      <EngagementBar engagement={article.engagement} color={ACCENT} />
    </article>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SportsPage() {
  const theme = useTheme();

  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [activeFilter,  setActiveFilter]  = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const audio = useAudio();

  const displayed = useMemo(() => {
    let articles = [...SPORTS_ARTICLES];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(q)    ||
        a.excerpt.toLowerCase().includes(q)  ||
        a.author.toLowerCase().includes(q)   ||
        a.category.toLowerCase().includes(q)
      );
    }
    if (activeFilter === "Most Liked") {
      articles = [...articles].sort((a, b) => b.engagement.likes - a.engagement.likes);
    } else if (activeFilter === "Editor's Pick") {
      articles = articles.filter(a => a.verified);
    } else if (activeFilter === "Live") {
      articles = [...articles]
        .sort((a, b) => (b.engagement.views ?? 0) - (a.engagement.views ?? 0))
        .slice(0, 3);
    }
    return articles;
  }, [activeFilter, searchQuery]);

  const chipIcon = (filter: string, active: boolean) => {
    const iconColor = active ? "#fff" : theme.palette.text.secondary;
    const sx = { fontSize: "13px !important", color: `${iconColor} !important` };
    if (filter === "Most Liked")    return <LocalFireDepartmentIcon sx={sx} />;
    if (filter === "Editor's Pick") return <EmojiEventsIcon sx={sx} />;
    if (filter === "Live")          return <LiveTvIcon sx={sx} />;
    return undefined;
  };

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>

      {/* ── ① Compose + Search ── */}
      <Box sx={{
        px: { xs: 2, sm: 4, md: 6, lg: 10 },
        pt: { xs: 3, md: 4 }, pb: 2.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}>
        <PostComposer
          user={CURRENT_USER}
          placeholder="Share your sports hot take..."
          accentColor={COMPOSER_ACCENT}
          onPost={(data) => console.log("New sports article:", data)}
          sx={{ mb: 1.5 }}
        />
        <ArticleSearchBar
          placeholder="Search by sport, team, or athlete..."
          accentColor={ACCENT}
          onSearch={setSearchQuery}
        />
      </Box>

      {/* ── ② Section header + filter chips ── */}
      <Box sx={{ px: { xs: 2, sm: 4, md: 6, lg: 10 }, pt: 4, pb: 2 }}>
        <Box
          display="flex" justifyContent="space-between"
          alignItems="flex-start" mb={2}
          sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 2.5 }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <SportsSoccerIcon sx={{ color: ACCENT, fontSize: 20 }} />
              <Typography variant="h2" sx={{
                fontFamily: SERIF, fontWeight: 800,
                fontSize: { xs: "1.4rem", md: "2rem" },
                color: theme.palette.text.primary, lineHeight: 1,
              }}>
                Sports
              </Typography>
            </Stack>
            <Typography sx={{
              fontFamily: SERIF,
              color: theme.palette.text.secondary,
              fontSize: "0.83rem",
            }}>
              {displayed.length} article{displayed.length === 1 ? "" : "s"} from around the world
            </Typography>
          </Box>

          <Button
            endIcon={<ArrowForwardIcon />}
            sx={{
              fontFamily: SERIF, fontWeight: 700, fontSize: "0.82rem",
              color: theme.palette.text.secondary,
              textTransform: "none", mt: 0.5,
              "&:hover": { color: theme.palette.text.primary },
            }}
          >
            See all
          </Button>
        </Box>

        {/* Filter chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            return (
              <Chip
                key={f} label={f}
                onClick={() => setActiveFilter(f)}
                icon={chipIcon(f, active)}
                size="small"
                sx={{
                  fontFamily: SERIF, fontSize: "0.75rem",
                  height: 28, cursor: "pointer",
                  bgcolor: active ? ACCENT : theme.palette.action.hover,
                  color: active ? "#fff" : theme.palette.text.secondary,
                  border: `1px solid ${active ? ACCENT : theme.palette.divider}`,
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: active ? ACCENT : theme.palette.action.selected,
                    color: active ? "#fff" : theme.palette.text.primary,
                  },
                  "& .MuiChip-label": { px: 1.2 },
                }}
              />
            );
          })}
        </Stack>
      </Box>

      {/* ── ③ Article grid ── */}
      <Box sx={{ px: { xs: 2, sm: 4, md: 6, lg: 10 }, pb: { xs: 6, md: 10 }, pt: 2 }}>
        {displayed.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <SportsSoccerIcon sx={{ fontSize: 48, color: theme.palette.action.disabled, mb: 2 }} />
            <Typography sx={{
              fontFamily: SERIF, fontSize: "1rem",
              color: theme.palette.text.disabled,
            }}>
              {searchQuery
                ? `No articles found for "${searchQuery}"`
                : "No articles in this category yet"}
            </Typography>
          </Box>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "2.5rem 2rem",
          }}>
            {displayed.map(article => (
              <ArticleCard
                key={article.id} article={article}
                onOpen={setActiveArticle} audio={audio}
              />
            ))}
          </div>
        )}
      </Box>

      {activeArticle && (
        <ArticleModal
          article={activeArticle}
          onClose={() => setActiveArticle(null)}
          audio={audio}
        />
      )}
    </Box>
  );
}