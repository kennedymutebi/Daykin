// src/pages/Home.tsx
import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box, Typography, Button, Stack,
  Avatar, AvatarGroup, Divider,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { CreatorHeader } from "../components/shared/CreatorHeader";
import { EngagementBar } from "../components/shared/EngagementBar";
import { AudioControls } from "../components/shared/AudioControls";
import { ArticleModal } from "../components/shared/ArticleModal";
import { useAudio } from "../hooks/useAudio";
import { ARTICLES } from "../data/articles";
import type { Article } from "../types/article";
import type { Writer } from "../types";

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

// ── ArticleCard ───────────────────────────────────────────────────────────────
const ArticleCard: React.FC<{
  article: Article;
  onOpen: (a: Article) => void;
  audio: ReturnType<typeof useAudio>;
}> = ({ article, onOpen, audio }) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gold   = theme.palette.gold.main;
  const accent = article.categoryColor ?? gold;

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        padding: "1.5rem",
      }}
    >
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
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", display: "block",
            transition: "transform 0.4s ease",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLImageElement>) => {
            e.currentTarget.style.transform = "scale(1.03)";
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLImageElement>) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        />
        <div
          style={{
            position: "absolute", top: 10, right: 10,
            background: `${gold}26`,
            borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={gold}>
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </div>
      </div>

      {/* Category */}
      <span
        style={{
          fontFamily: theme.typography.fontFamily,
          fontSize: "0.72rem",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: accent,
          marginBottom: "0.5rem",
          display: "flex", alignItems: "center", gap: "0.4rem",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={accent}>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
        {article.category}
      </span>

      {/* Title */}
      <h2
        onClick={() => onOpen(article)}
        style={{
          fontFamily: theme.typography.fontFamily,
          fontSize: "1.2rem", fontWeight: 700, lineHeight: 1.3,
          color: theme.palette.text.primary,
          marginBottom: "0.6rem",
          cursor: "pointer", transition: "color 0.15s",
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLHeadingElement>) => {
          e.currentTarget.style.color = accent;
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLHeadingElement>) => {
          e.currentTarget.style.color = theme.palette.text.primary;
        }}
      >
        {article.title}
      </h2>

      {/* Excerpt */}
      <p
        onClick={() => onOpen(article)}
        style={{
          fontFamily: theme.typography.fontFamily,
          fontSize: "0.9rem",
          color: theme.palette.text.secondary,
          lineHeight: 1.58, marginBottom: "0.9rem",
          cursor: "pointer",
          display: "-webkit-box",
          WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {article.excerpt}
      </p>

      <p style={{
        fontFamily: theme.typography.fontFamily,
        fontSize: "0.82rem",
        color: theme.palette.text.secondary,
        marginBottom: "0.75rem",
        opacity: 0.6,
      }}>
        {article.readTime}
      </p>

      <AudioControls articleId={article.id} audio={audio} color={accent} />
      <EngagementBar engagement={article.engagement} color={accent} />
    </article>
  );
};

// ── Hero ──────────────────────────────────────────────────────────────────────
const Hero: React.FC = () => {
  const theme = useTheme();
  const gold  = theme.palette.gold.main; // accent still from theme

  // ── Hero is always dark regardless of light/dark toggle ──
  const HERO_BG       = "#1A1A2E";
  const HERO_TEXT     = "#F5F5F7";
  const HERO_MUTED    = "rgba(245,245,247,0.55)";
  const HERO_DIVIDER  = "rgba(255,255,255,0.12)";

  return (
    <Box
      sx={{
        position: "relative",
        py: { xs: 6, sm: 8, md: 12, lg: 16 },
        px: { xs: 2, sm: 4, md: 6, lg: 10 },
        textAlign: "center", overflow: "hidden",
        minHeight: { xs: "85vh", md: "92vh" },
        display: "flex", alignItems: "center", justifyContent: "center",
        // Always dark — never reads from theme.palette.background
        backgroundColor: HERO_BG,
        backgroundImage: "url('/Hero.png')",
        backgroundSize: "cover", backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        "&::before": {
          content: '""', position: "absolute", inset: 0,
          backgroundColor: "rgba(26,26,46,0.55)",
          zIndex: 1,
        },
        "&::after": {
          content: '""', position: "absolute", inset: 0,
          background: `
            linear-gradient(to right,  ${HERO_BG} 0%, transparent 30%, transparent 80%, ${HERO_BG} 100%),
            linear-gradient(to bottom, ${HERO_BG} 0%, transparent 12%, transparent 72%, ${HERO_BG} 100%)
          `,
          zIndex: 2,
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 3, maxWidth: "100%" }}>

        {/* Headline — gold accent, always visible on dark */}
        <Typography
          variant="h1"
          sx={{
            fontFamily: theme.typography.fontFamily,
            fontWeight: 900,
            fontSize: { xs: "1.85rem", sm: "2.6rem", md: "3.5rem", lg: "4.2rem", xl: "5rem" },
            color: gold,
            maxWidth: { xs: "100%", md: 700, lg: 860 },
            mx: "auto", mb: { xs: 1.5, md: 2 }, lineHeight: 1.1,
          }}
        >
          Stories, Birthdays,<br />Sports &amp; Community
        </Typography>

        {/* Subhead */}
        <Typography
          sx={{
            fontFamily: theme.typography.fontFamily,
            color: HERO_MUTED,
            mb: { xs: 3, md: 4 },
            maxWidth: { xs: "100%", sm: 440, md: 520 },
            mx: "auto",
            fontSize: { xs: "0.85rem", sm: "0.9rem", md: "1rem", lg: "1.05rem" },
            px: { xs: 1, sm: 0 },
          }}
        >
          Your home for celebrity birthdays, love stories, sports action and community support.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.5, sm: 2 }}
          justifyContent="center" alignItems="center"
          sx={{ px: { xs: 3, sm: 0 } }}
        >
          {/* Primary CTA — gold, always works on dark bg */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{
              width: { xs: "100%", sm: "auto" },
              px: { xs: 3, sm: 4, md: 5 }, py: { xs: 1.2, md: 1.5 },
              fontFamily: theme.typography.fontFamily,
              fontWeight: 700,
              fontSize: { xs: "0.9rem", md: "1rem" },
            }}
          >
            Start Reading
          </Button>

          {/* Secondary CTA — always white border on dark hero */}
          <Button
            variant="outlined"
            size="large"
            sx={{
              width: { xs: "100%", sm: "auto" },
              px: { xs: 3, sm: 4, md: 5 }, py: { xs: 1.2, md: 1.5 },
              fontFamily: theme.typography.fontFamily,
              fontWeight: 700,
              fontSize: { xs: "0.9rem", md: "1rem" },
              borderColor: "rgba(255,255,255,0.3)",
              color: HERO_TEXT,
              "&:hover": {
                borderColor: HERO_TEXT,
                bgcolor: "rgba(255,255,255,0.06)",
              },
            }}
          >
            Share Your Story
          </Button>
        </Stack>

        {/* Stats */}
        <Stack
          direction="row" spacing={{ xs: 2, sm: 4 }}
          justifyContent="center" mt={{ xs: 4, md: 6 }}
          flexWrap="wrap" gap={2}
          divider={
            <Divider
              orientation="vertical" flexItem
              sx={{ borderColor: HERO_DIVIDER }}
            />
          }
        >
          {STATS.map(s => (
            <Box key={s.label} textAlign="center">
              <Typography
                sx={{
                  fontFamily: theme.typography.fontFamily,
                  fontWeight: 800,
                  fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.7rem", lg: "2rem" },
                  color: HERO_TEXT,
                }}
              >
                {s.value}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: theme.typography.fontFamily,
                  color: HERO_MUTED,
                }}
              >
                {s.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* Writer avatars */}
        <Box mt={{ xs: 3, md: 4 }} display="flex" justifyContent="center" alignItems="center" gap={1.5}>
          <AvatarGroup
            max={5}
            sx={{
              "& .MuiAvatar-root": {
                width: { xs: 28, sm: 32, md: 38 },
                height: { xs: 28, sm: 32, md: 38 },
                fontSize: { xs: "0.6rem", md: "0.72rem" },
                border: `2px solid ${HERO_BG}`,
              },
            }}
          >
            {WRITERS.map(w => (
              <Avatar key={w.id} sx={{ bgcolor: w.color, fontFamily: theme.typography.fontFamily }}>
                {w.initials}
              </Avatar>
            ))}
          </AvatarGroup>
          <Typography
            variant="caption"
            sx={{
              fontFamily: theme.typography.fontFamily,
              color: HERO_MUTED,
            }}
          >
            Join 12,000+ writers
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AeonFeed() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gold   = theme.palette.gold.main;
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const audio = useAudio();

  return (
    // ✅ theme.palette.background.default — switches with toggle
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
      <Hero />

      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          py: { xs: 5, sm: 6, md: 8, lg: 10 },
          px: { xs: 2, sm: 3, md: 6, lg: 10 },
        }}
      >
        {/* Section header */}
        <Box
          display="flex" justifyContent="space-between" alignItems="center"
          mb={{ xs: 3, md: 4 }}
          sx={{
            borderTop:    `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            py: "0.6rem",
          }}
        >
          <Box>
            <Typography
              variant="h2"
              sx={{
                fontFamily: theme.typography.fontFamily,
                fontWeight: 800,
                fontSize: { xs: "1.3rem", sm: "1.6rem", md: "2rem", lg: "2.4rem" },
                color: theme.palette.text.primary,
              }}
            >
              Latest Articles
            </Typography>
            <Typography
              sx={{
                fontFamily: theme.typography.fontFamily,
                color: theme.palette.text.secondary,
                fontSize: { xs: "0.78rem", md: "0.87rem" },
                mt: 0.5,
              }}
            >
              Fresh stories from our community.
            </Typography>
          </Box>
          <Button
            endIcon={<ArrowForwardIcon />}
            sx={{
              fontFamily: theme.typography.fontFamily,
              fontWeight: 700,
              fontSize: { xs: "0.75rem", md: "0.87rem" },
              color: theme.palette.text.secondary,
              textTransform: "none",
              "&:hover": { color: gold },
            }}
          >
            See all
          </Button>
        </Box>

        {/* Article grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "2rem",
            paddingBottom: "4rem",
          }}
        >
          {ARTICLES.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              onOpen={setActiveArticle}
              audio={audio}
            />
          ))}
        </div>
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