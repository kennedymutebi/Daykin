// src/pages/ArticlePage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Standalone, deep-linkable article page — the redirect target for shared
// links (backend's article_og_view sends users to /article/<source>/<id>).
// Fetches the single item via getArticle/getLoveStory (not the full feed),
// then reuses ArticleModal to render it, plus the same ShareMenu used on Home.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { ArticleModal } from "../components/shared/ArticleModal";
import { ShareMenu } from "../components/shared/ShareMenu";
import { useAudio } from "../hooks/useAudio";
import { mapApiArticle, mapLoveStoryToArticle } from "../utils/mapArticle";
import { API_BASE_URL } from "../config/api.config";
import { getArticle, likeArticle, shareArticle } from "../services";
import { getLoveStory, likeLoveStory, shareLoveStory } from "../services/loveStories.service";
import { ApiError } from "../services/api.service";
import type { Article } from "../types/article";

type Source = "article" | "love_story";

export default function ArticlePage() {
  const { source, id } = useParams<{ source: string; id: string }>();
  const navigate = useNavigate();
  const theme    = useTheme();
  const gold     = theme.palette.gold?.main ?? "#F5A623";
  const audio    = useAudio();

  const validSource: Source | null =
    source === "article" || source === "love_story" ? source : null;
  const apiId = id ? Number(id) : NaN;

  const [article, setArticle]     = useState<Article | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const fetchArticle = useCallback(async () => {
    if (!validSource || Number.isNaN(apiId)) {
      setError("This link doesn't point to a valid article.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (validSource === "article") {
        const a = await getArticle(apiId);
        setArticle(mapApiArticle(a, gold));
      } else {
        const s = await getLoveStory(apiId);
        setArticle(mapLoveStoryToArticle(s, gold));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError : "This article couldn't be found.");
    } finally {
      setLoading(false);
    }
  }, [validSource, apiId, gold]);

  useEffect(() => { fetchArticle(); }, [fetchArticle]);

  // Captured into a plain local `likes` variable before the typeof check —
  // narrowing a union response's property directly inside a setState updater
  // doesn't always propagate, but a local variable narrows cleanly.
  const handleLike = useCallback(async () => {
    if (!validSource) return;
    let likes: number | undefined;
    if (validSource === "love_story") {
      const res = await likeLoveStory(apiId);
      likes = res.likes;
    } else {
      const res = await likeArticle(apiId);
      likes = res.likes;
    }
    if (typeof likes !== "number") return;
    const confirmedLikes = likes;
    setArticle((prev) => prev ? { ...prev, engagement: { ...prev.engagement, likes: confirmedLikes } } : prev);
  }, [validSource, apiId]);

  // Opens the share menu instead of instantly hitting the counter endpoint —
  // the count only increases once a platform is actually chosen (bumpShareCount).
  // Async/returns Promise<void> to match MediumReactionBar's onShare contract.
  const handleShareClick = useCallback(async () => {
    setShareOpen(true);
  }, []);

  const bumpShareCount = useCallback(async () => {
    if (!validSource) return;
    try {
      let shares: number | undefined;
      if (validSource === "love_story") {
        const res = await shareLoveStory(apiId);
        shares = res.shares;
      } else {
        const res = await shareArticle(apiId);
        shares = res.shares;
      }
      if (typeof shares !== "number") return;
      const confirmedShares = shares;
      setArticle((prev) => prev ? { ...prev, engagement: { ...prev.engagement, shares: confirmedShares } } : prev);
    } catch {
      // Best-effort — the platform share/copy already happened for the user.
    }
  }, [validSource, apiId]);

  // Points at the backend's article_og_view (Django route /api/article/<source>/<id>/),
  // which serves real OG meta tags (title/description/image) for link-preview
  // crawlers, then redirects a real browser on to /article/<source>/<id>.
  const shareUrl = validSource && !Number.isNaN(apiId)
    ? `${API_BASE_URL}/article/${validSource}/${apiId}/`
    : "";

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !article) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2}>
        <Typography color="text.secondary">{error ?? "This article couldn't be found."}</Typography>
        <Button variant="outlined" onClick={() => navigate("/")}>Back to Home</Button>
      </Box>
    );
  }

  return (
    <>
      <ArticleModal
        article={article}
        onClose={() => navigate("/")}
        audio={audio}
        source={validSource ?? undefined}
        onLike={handleLike}
        onShare={handleShareClick}
      />
      <ShareMenu
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shareUrl={shareUrl}
        title={article.title}
        onShared={bumpShareCount}
      />
    </>
  );
}