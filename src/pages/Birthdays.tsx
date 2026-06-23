import React, { useState, useCallback } from "react";
import {
  Box, Typography, Button, Select, MenuItem,
  Pagination, Stack, FormControl, InputLabel,
  Skeleton, Alert, Collapse,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RefreshIcon      from "@mui/icons-material/Refresh";
import {
  BirthdayHeroSlider, BirthdayWishBoard, WishInboxModal, RegisterModal,
  FamousCelebCard, FAMOUS_MATCHES, MONTHS, DAYS, TODAY_BIRTHDAYS,
  type BirthdayPerson, type WishEntry,
} from "./BirthdayHero";

import { FONT, SOUL, RADIUS, containerSx, goldButtonSx, selectSx, labelSx, menuPaperSx } from "./soulwishTheme";
import { CelebArticleCard } from "../components/shared/CelebArticleCard";
import { ArticleModal }     from "../components/shared/ArticleModal";
import { useAudio }         from "../hooks/useAudio";
import { getArticles }      from "../services";
import { ApiError }         from "../services/api.service";
import type { Article as ApiArticle } from "../types/api";
import type { Article }     from "../types/article";
import WishDrawer from "./Wishdrawer";

// ── Helpers ───────────────────────────────────────────────────────────────
function mapApiArticle(a: ApiArticle): Article {
  return {
    id: a.id,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    category: a.category,
    categoryColor: SOUL.gold,
    img: a.image ?? "/birthday.jpg",
    audio: a.audio ?? undefined,
    readTime: `${Math.ceil(a.content.split(" ").length / 200)} min read`,
    createdAt: a.created_at,
    date: new Date(a.created_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    }),
    author: {
      name:
        `${a.author.first_name} ${a.author.last_name}`.trim() ||
        a.author.username,
      initials:
        ((a.author.first_name?.[0] ?? "") + (a.author.last_name?.[0] ?? ""))
          .toUpperCase() ||
        a.author.username.slice(0, 2).toUpperCase(),
      role: "Writer",
      verified: false,
    },
    engagement: { likes: a.likes, shares: a.shares, comments: a.comments },
    isEditorsPick: a.is_editors_pick,
  };
}

// ── Skeleton ──────────────────────────────────────────────────────────────
const CardSkeleton: React.FC = () => (
  <Box sx={{ pb: "2rem", borderBottom: `1px solid ${SOUL.border}` }}>
    <Box display="flex" alignItems="center" gap={1} mb={2}>
      <Skeleton variant="circular" width={38} height={38} sx={{ bgcolor: SOUL.surfaceHigh }} />
      <Box flex={1}>
        <Skeleton width="50%" height={14} sx={{ bgcolor: SOUL.surfaceHigh }} />
        <Skeleton width="35%" height={12} sx={{ mt: 0.5, bgcolor: SOUL.surfaceHigh }} />
      </Box>
    </Box>
    <Skeleton
      variant="rectangular" width="100%"
      sx={{ aspectRatio: "16/9", borderRadius: 1, mb: 1.5, bgcolor: SOUL.surfaceHigh }}
    />
    <Skeleton width="30%" height={12} sx={{ mb: 0.5, bgcolor: SOUL.surfaceHigh }} />
    <Skeleton width="80%" height={20} sx={{ mb: 0.5, bgcolor: SOUL.surfaceHigh }} />
    <Skeleton width="60%" height={20} sx={{ mb: 1.5, bgcolor: SOUL.surfaceHigh }} />
    <Skeleton width="100%" height={12} sx={{ bgcolor: SOUL.surfaceHigh }} />
    <Skeleton width="90%"  height={12} sx={{ bgcolor: SOUL.surfaceHigh }} />
  </Box>
);

// ── Shared layout helpers ─────────────────────────────────────────────────
const sectionLabelSx = { ...labelSx, fontSize: "0.65rem", mb: 0.5 };
const gridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" },
  gap: { xs: "24px 16px", md: "32px 20px" },
  mb: 4,
};

// ── Page ──────────────────────────────────────────────────────────────────
const Birthdays: React.FC = () => {
  // ── Birthday list + wishes state ─────────────────────────────────────
  const [people, setPeople] = useState<BirthdayPerson[]>(TODAY_BIRTHDAYS);
  const [wishes, setWishes] = useState<WishEntry[]>([]);

  // ── Celebrity search state ────────────────────────────────────────────
  const [month,    setMonth]    = useState("");
  const [day,      setDay]      = useState("");
  const [searched, setSearched] = useState(false);

  // ── Articles state ────────────────────────────────────────────────────
  const [articles,        setArticles]        = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError,   setArticlesError]   = useState<string | null>(null);

  // ── Modal / drawer state ──────────────────────────────────────────────
  const [wishTarget,    setWishTarget]    = useState<BirthdayPerson | null>(null);
  const [inboxTarget,   setInboxTarget]   = useState<BirthdayPerson | null>(null);
  const [registerOpen,  setRegisterOpen]  = useState(false);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  // ── Pagination ────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const TOTAL    = 480;
  const PER_PAGE = 6;

  const audio = useAudio();

  // ── Fetch articles ────────────────────────────────────────────────────
  const fetchBirthdayArticles = useCallback(async () => {
    setArticlesLoading(true);
    setArticlesError(null);
    try {
      const res = await getArticles({ category: "birthday", ordering: "-created_at" });
      setArticles(res.results.map(mapApiArticle));
    } catch (err: unknown) {
      setArticlesError(
        err instanceof ApiError ? err.firstError : "Failed to load articles.",
      );
    } finally {
      setArticlesLoading(false);
    }
  }, []);

  const handleSearch = () => {
    if (month || day) {
      setSearched(true);
      fetchBirthdayArticles();
    }
  };

  const handleReset = () => {
    setMonth("");
    setDay("");
    setSearched(false);
    setArticles([]);
    setArticlesError(null);
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: SOUL.bg }}>

      {/* ── Hero slider ─────────────────────────────────────────────── */}
      <BirthdayHeroSlider
        people={people}
        month={month}
        day={day}
        onMonthChange={setMonth}
        onDayChange={setDay}
        onSearch={handleSearch}
      />

      {/* ── Wish board ──────────────────────────────────────────────── */}
      <BirthdayWishBoard
        people={people}
        wishes={wishes}
        onWish={setWishTarget}
        onViewWishes={setInboxTarget}
        onRegister={() => setRegisterOpen(true)}
      />

      {/* ── Celebrity search results ─────────────────────────────────── */}
      {searched && (
        <Box sx={{ ...containerSx, py: { xs: 4, md: 6 } }}>

          {/* Search controls */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems="center"
            mb={4}
          >
            <FormControl sx={{ width: { xs: "100%", sm: 175 } }} size="small">
              <InputLabel sx={labelSx}>Month</InputLabel>
              <Select
                value={month}
                label="Month"
                onChange={e => setMonth(e.target.value)}
                sx={selectSx}
                MenuProps={{ PaperProps: { sx: menuPaperSx } }}
              >
                {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl sx={{ width: { xs: "100%", sm: 110 } }} size="small">
              <InputLabel sx={labelSx}>Day</InputLabel>
              <Select
                value={day}
                label="Day"
                onChange={e => setDay(e.target.value)}
                sx={selectSx}
                MenuProps={{ PaperProps: { sx: menuPaperSx } }}
              >
                {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleSearch}
              endIcon={<ArrowForwardIcon sx={{ fontSize: "18px !important" }} />}
              sx={{ ...goldButtonSx(), px: 3 }}
            >
              Search
            </Button>

            <Button
              size="small"
              onClick={handleReset}
              sx={{
                fontFamily: FONT, fontWeight: 600, fontSize: "0.82rem",
                color: SOUL.textMuted, textTransform: "none",
                "&:hover": { color: SOUL.gold },
              }}
            >
              Back
            </Button>
          </Stack>

          {/* Section header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
            sx={{
              borderTop:    `1px solid ${SOUL.border}`,
              borderBottom: `1px solid ${SOUL.border}`,
              py: "0.6rem",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: FONT, fontWeight: 800,
                  fontSize: { xs: "1.3rem", md: "1.6rem" },
                  color: SOUL.text,
                }}
              >
                {`Celebrities Born on ${month} ${day}`}
              </Typography>
              <Typography
                sx={{ fontFamily: FONT, color: SOUL.textMuted, fontSize: "0.85rem", mt: 0.4 }}
              >
                Stories, profiles and milestones from stars who share your day
              </Typography>
            </Box>
          </Box>

          {/* Error banner */}
          <Collapse in={!!articlesError}>
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              action={
                <Button size="small" startIcon={<RefreshIcon />} onClick={fetchBirthdayArticles}>
                  Retry
                </Button>
              }
              onClose={() => setArticlesError(null)}
            >
              {articlesError}
            </Alert>
          </Collapse>

          {/* Article grid */}
          <Box sx={gridSx}>
            {articlesLoading
              ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              : articles.length > 0
                ? articles.map(article => (
                    <CelebArticleCard
                      key={article.id}
                      article={article}
                      onOpen={setActiveArticle}
                      audio={audio}
                    />
                  ))
                : !articlesError && (
                    <Box sx={{ gridColumn: "1/-1", textAlign: "center", py: 8 }}>
                      <Typography sx={{ fontFamily: FONT, color: SOUL.textMuted }}>
                        {`No birthday articles found for ${month} ${day}.`}
                      </Typography>
                    </Box>
                  )}
          </Box>
        </Box>
      )}

      {/* ── Famous celebrities section ───────────────────────────────── */}
      <Box sx={{ ...containerSx, py: { xs: 5, md: 7 } }}>

        <Box mb={3}>
          <Typography sx={sectionLabelSx}>FAMOUS BIRTHDAYS TODAY</Typography>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography
              sx={{
                fontFamily: FONT, fontWeight: 800,
                fontSize: { xs: "1.4rem", md: "1.7rem" },
                color: SOUL.text,
              }}
            >
              They share your birthday
            </Typography>
            <ArrowForwardIcon sx={{ fontSize: 22, color: SOUL.gold, mt: "2px" }} />
          </Box>
          <Typography
            sx={{ fontFamily: FONT, fontSize: { xs: "0.8rem", md: "0.88rem" }, color: SOUL.textMuted }}
          >
            Celebrities and icons born on the same day as you
          </Typography>
        </Box>

        <Box sx={{ height: "1px", bgcolor: SOUL.border, mb: 3 }} />

        <Box sx={gridSx}>
          {FAMOUS_MATCHES.map(celeb => (
            <FamousCelebCard key={celeb.id} {...celeb} />
          ))}
        </Box>

        {/* Articles about today's birthday stars */}
        <Box sx={{ mt: 2, pt: 5, borderTop: `1px solid ${SOUL.border}` }}>
          <Typography
            sx={{
              fontFamily: FONT, fontWeight: 800,
              fontSize: { xs: "1.2rem", md: "1.45rem" },
              color: SOUL.text, mb: 0.5,
            }}
          >
            Articles about today's birthday stars
          </Typography>
          <Typography sx={{ fontFamily: FONT, fontSize: "0.82rem", color: SOUL.textMuted, mb: 3 }}>
            Read more about the celebrities celebrating today
          </Typography>

          <Box sx={gridSx}>
            {articlesLoading
              ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              : articles.slice(0, 6).map(article => (
                  <CelebArticleCard
                    key={article.id}
                    article={article}
                    onOpen={setActiveArticle}
                    audio={audio}
                  />
                ))}
          </Box>

          <Box display="flex" justifyContent="center">
            <Pagination
              count={Math.ceil(TOTAL / PER_PAGE)}
              page={page}
              onChange={(_, val) => setPage(val)}
              shape="rounded"
              siblingCount={1}
              boundaryCount={1}
              sx={{
                "& .MuiPaginationItem-root": {
                  fontFamily: FONT, fontWeight: 600,
                  fontSize: "0.85rem", color: SOUL.textMuted,
                },
                "& .Mui-selected": {
                  bgcolor: `${SOUL.gold} !important`,
                  color: SOUL.onGold,
                  fontWeight: 800,
                },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* ── Article modal ────────────────────────────────────────────── */}
      {activeArticle && (
        <ArticleModal
          article={activeArticle}
          onClose={() => setActiveArticle(null)}
          audio={audio}
        />
      )}

      {/* ── Wish drawer (slides in from right) ──────────────────────── */}
      <WishDrawer
        open={!!wishTarget}
        person={wishTarget}
        onClose={() => setWishTarget(null)}
        onSubmit={wish => {
          setWishes(prev => [wish, ...prev]);
          setWishTarget(null);
        }}
      />

      {/* ── Inbox modal ──────────────────────────────────────────────── */}
      <WishInboxModal
        open={!!inboxTarget}
        person={inboxTarget}
        wishes={wishes}
        onClose={() => setInboxTarget(null)}
      />

      {/* ── Register modal ───────────────────────────────────────────── */}
      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegister={newPerson =>
          setPeople(prev => [...prev, { ...newPerson, id: Date.now() }])
        }
      />
    </Box>
  );
};

export default Birthdays;