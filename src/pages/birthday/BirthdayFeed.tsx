// src/pages/birthday/BirthdayFeed.tsx
//
// Drop this in as the "feed" route rendered inside <BirthdayLayout />'s <Outlet />.
// It does NOT touch your header/bottom tab navigation — that lives in
// BirthdayLayout.tsx and is left exactly as it was.
//
// Fetches real data from the Django API. Background removal has been
// dropped server-side, so photos now render as full images inside a
// torn-paper frame instead of floating cutouts.
//
// DECOR ASSETS: drop transparent PNGs at:
//   public/decor/palm-leaf.png
//   public/decor/flower.png
// (swap filenames below if you name them differently)
//
// CHANGES in this version (date filtering):
//  - The carousel now ONLY shows people whose birthday is TODAY (comparing
//    birth_month/birth_day against the current date), instead of showing
//    the entire roster.
//  - A 1-hour grace period after midnight keeps yesterday's celebrant
//    visible for a bit, so the card doesn't hard-vanish at exactly 00:00
//    for anyone checking the app right after midnight.
//  - Search still works, but only searches within today's (+ grace period)
//    birthdays — not the whole roster.
//  - Empty-state copy updated to reflect "no birthdays today" instead of
//    "no birthdays on the roster yet".
//  - Everything else (carousel mechanics, photo aspect handling, music
//    player, search bar, progress dots) is unchanged from before.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, InputBase, useTheme, GlobalStyles } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import MicNoneIcon from "@mui/icons-material/MicNone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { listCelebrants, type CelebrantDTO } from "../../api/birthdays"; // adjust path if needed
import BirthdayMusicPlayer from "./BirthdayMusicPlayer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BirthdayPerson {
  id: string;
  name: string;
  firstName: string;
  title: string;      // no backend field yet — defaults to ""
  ordinalDay: string; // e.g. "21st"
  monthLabel: string; // e.g. "July"
  message: string;
  photoUrl: string;
  location: string;   // from API, may be empty
  birthMonth: number; // raw numeric month, used for "is today" filtering
  birthDay: number;   // raw numeric day, used for "is today" filtering
}

const PLACEHOLDER_PHOTO = "/person1.jpg";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// A birthday counts as "active" (visible on the feed) if it's today, OR if
// it was yesterday and we're still within the first GRACE_PERIOD_HOURS of
// the new day — so the celebration doesn't hard-cut at exactly midnight for
// anyone checking the app just before bed or right after waking up.
const GRACE_PERIOD_HOURS = 1;

function isBirthdayActive(month: number, day: number, now: Date = new Date()): boolean {
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  if (month === todayMonth && day === todayDay) return true;

  if (now.getHours() < GRACE_PERIOD_HOURS) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (month === yesterday.getMonth() + 1 && day === yesterday.getDate()) {
      return true;
    }
  }
  return false;
}

function toBirthdayPerson(c: CelebrantDTO): BirthdayPerson {
  const fullName = c.full_name?.trim() || "";
  return {
    id: String(c.id),
    name: fullName,
    firstName: fullName.split(" ")[0] || fullName,
    title: "",
    ordinalDay: ordinal(c.birth_day),
    monthLabel: MONTH_NAMES[c.birth_month],
    message: c.big_wish?.trim() || `Wishing you joy, love, and laughter today and always.`,
    photoUrl: c.photo ?? PLACEHOLDER_PHOTO,
    location: c.location?.trim() || "",
    birthMonth: c.birth_month,
    birthDay: c.birth_day,
  };
}

// ---------------------------------------------------------------------------
// Decor assets — swap these paths for your own files any time
// ---------------------------------------------------------------------------

const PALM_LEAF_SRC = "/flower.png";
const FLOWER_SRC = "/flower.png";

// ---------------------------------------------------------------------------
// Design tokens — blended teal/gold (reference) + your existing navy/orange
// ---------------------------------------------------------------------------

const TEAL = "#1FAEC0";
const TEAL_DARK = "#127D8C";
const ORANGE = "#EE5B2B";
const GOLD = "#F4C94B";
const CREAM = "#FFF6E8";    // used for text sitting directly on the teal background

const CARD_BG = `linear-gradient(160deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`;

const CYCLE_INTERVAL = 5200;
const RESUME_AFTER_INTERACTION_MS = 4000;

// Full-bleed on mobile, gently capped on larger screens.
const CARD_MAX_WIDTH = "min(100%, 480px)";

// Below this width/height ratio a photo is treated as "portrait" and
// switched to objectFit: cover so it fills the frame instead of
// leaving blurred pillarbox bars on either side.
const PORTRAIT_ASPECT_THRESHOLD = 0.9;

// Torn-paper edge, reused for the outer white backing and the photo itself.
const TORN_PAPER_CLIP =
  "polygon(2% 4%,10% 1%,18% 5%,28% 2%,38% 4%,48% 1%,58% 4%,68% 2%,78% 5%,88% 1%,98% 4%," +
  "99% 12%,97% 22%,99% 32%,96% 42%,99% 52%,97% 62%,99% 72%,96% 82%,99% 92%,97% 98%," +
  "88% 99%,78% 96%,68% 99%,58% 97%,48% 99%,38% 96%,28% 99%,18% 97%,8% 99%,2% 96%," +
  "1% 88%,3% 78%,1% 68%,4% 58%,1% 48%,3% 38%,1% 28%,4% 18%,1% 8%)";

// Scattered gold glitter speckles — fixed positions so there's no
// hydration mismatch and no per-render randomness.
const GLITTER_DOTS = [
  [4, 8], [12, 22], [8, 40], [15, 58], [6, 74], [11, 90],
  [92, 6], [88, 18], [95, 34], [90, 50], [96, 66], [89, 82], [93, 95],
  [50, 3], [60, 96], [30, 5], [70, 94],
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const BirthdayFeed: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === "dark";
  const gold = theme.palette.gold?.main ?? GOLD;

  // ---- live data ----------------------------------------------------------
  const [people, setPeople] = useState<BirthdayPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listCelebrants()
      .then((data) => {
        if (!cancelled) setPeople(data.map(toBirthdayPerson));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load birthdays.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- today-only filtering (+ 1hr grace period into the next day) --------
  // This runs BEFORE search, so search only ever narrows within today's
  // birthdays — it never resurfaces someone whose birthday isn't active.
  const todaysPeople = useMemo(
    () => people.filter((p) => isBirthdayActive(p.birthMonth, p.birthDay)),
    [people]
  );

  // ---- search -----------------------------------------------------------
  const [query, setQuery] = useState("");
  const isSearching = query.trim().length > 0;
  const matches = useMemo(
    () => todaysPeople.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())),
    [todaysPeople, query]
  );

  // ---- which person the hero is currently showing ------------------------
  const [index, setIndex] = useState(0);
  const list = matches.length > 0 ? matches : todaysPeople;
  const person = list.length > 0 ? list[index % list.length] : null;

  // jump straight to a search match instead of waiting for the timer
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional carousel reset when the search query changes
    if (query.trim() && matches.length > 0) setIndex(0);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- per-photo aspect ratio, keyed by person id -------------------------
  // Populated as each photo loads. Drives whether we show it with
  // objectFit "cover" (portrait — fills frame) or "contain" (landscape
  // — shows the whole image with blurred fill behind it).
  const [photoAspects, setPhotoAspects] = useState<Record<string, number>>({});
  const handlePhotoLoad = (id: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    setPhotoAspects((prev) => (prev[id] === ratio ? prev : { ...prev, [id]: ratio }));
  };

  // ---- carousel scroll + interaction handling -----------------------------
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [userInteracting, setUserInteracting] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markUserInteraction = () => {
    setUserInteracting(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setUserInteracting(false);
    }, RESUME_AFTER_INTERACTION_MS);
  };

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (list.length <= 1) return;
    timerRef.current = setInterval(() => {
      if (userInteracting || isSearching) return;
      setIndex((i) => (i + 1) % list.length);
    }, CYCLE_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [list.length, userInteracting, isSearching]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ left: index * container.clientWidth, behavior: "smooth" });
  }, [index, list.length]);

  useEffect(() => {
    const handleResize = () => {
      const container = scrollRef.current;
      if (!container) return;
      container.scrollTo({ left: index * container.clientWidth, behavior: "auto" });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [index]);

  // ---- navigation ----------------------------------------------------------
  const goWriteWish = (p?: BirthdayPerson) => {
    navigate("/birthdays/ai-wish", p ? { state: { to: p.name, toId: p.id } } : undefined);
  };
  const goAllBirthdays = () => navigate("/birthdays/celeb");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Cursive font for "Happy Birthday" script text + text-rendering hints */}
      <GlobalStyles
        styles={`
          @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
          .birthday-card-text {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
        `}
      />

      <BirthdayMusicPlayer />

      {/* ------------------------------------------------------------------ */}
      {/* Search bar — unchanged                                             */}
      {/* ------------------------------------------------------------------ */}
      {/* Search bar */}
        <Box
          sx={{
            position: "sticky",
            top: { xs: 64, md: 72 },
            zIndex: 4,
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            borderRadius: 999,
            px: 1,
            py: 0.5,
            backdropFilter: "blur(8px)",
          }}
        >
          <IconButton size="small" sx={{ color: theme.palette.text.secondary }} aria-label="Voice search">
            <MicNoneIcon fontSize="small" />
          </IconButton>
          <InputBase
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search birthdays or send a voice wish…"
            sx={{
              flex: 1,
              fontFamily: theme.typography.fontFamily,
              fontSize: "0.9rem",
              color: theme.palette.text.primary,
            }}
          />
          <IconButton
            size="small"
            onClick={() => setQuery("")}
            sx={{ bgcolor: gold, color: "#1a1a1a", "&:hover": { bgcolor: gold, opacity: 0.9 } }}
            aria-label={query ? "Clear search" : "Search"}
          >
            <SearchIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Section header */}
        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <Box>
            <Typography
              sx={{ fontFamily: theme.typography.fontFamily, fontSize: "0.72rem", fontWeight: 700, letterSpacing: 1.2, color: theme.palette.text.secondary, textTransform: "uppercase" }}
            >
              Happening Now
            </Typography>
            <Typography sx={{ fontFamily: theme.typography.fontFamily, fontSize: "1.5rem", fontWeight: 800, color: theme.palette.text.primary }}>
              Birthdays Today
            </Typography>
          </Box>
          <Typography
            onClick={goAllBirthdays}
            sx={{ fontFamily: theme.typography.fontFamily, fontSize: "0.8rem", fontWeight: 700, color: theme.palette.text.primary, cursor: "pointer" }}
          >
            View All →
          </Typography>
        </Box>
      {/* ------------------------------------------------------------------ */}
      {/* POSTER HERO — full-bleed carousel                                  */}
      {/* ------------------------------------------------------------------ */}
      {loading ? (
        <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.85rem", py: 4, textAlign: "center" }}>
          Loading birthdays…
        </Typography>
      ) : loadError ? (
        <Typography sx={{ color: "error.main", fontSize: "0.85rem", py: 4, textAlign: "center" }}>
          {loadError}
        </Typography>
      ) : list.length === 0 || !person ? (
        <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.85rem", py: 4, textAlign: "center" }}>
          {query ? `No birthdays match "${query}"` : "No birthdays today — check back tomorrow!"}
        </Typography>
      ) : (
        <Box sx={{ position: "relative", width: "100%", maxWidth: CARD_MAX_WIDTH, mx: "auto" }}>
          <Box
            ref={scrollRef}
            onTouchStart={markUserInteraction}
            onWheel={markUserInteraction}
            onPointerDown={markUserInteraction}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              width: "100%",
              overflowX: "auto",
              overflowY: "hidden",
              scrollSnapType: "x mandatory",
              borderRadius: 3,
              boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {list.map((p, i) => {
              const ratio = photoAspects[p.id];
              // Unknown until the image fires onLoad — default to "contain"
              // (safe: never crops) until we know better.
              const isPortrait = ratio !== undefined && ratio < PORTRAIT_ASPECT_THRESHOLD;

              return (
                <Box
                  key={p.id}
                  ref={(el: HTMLDivElement | null) => {cardRefs.current[i] = el;}}
                  onClick={() => goWriteWish(p)}
                  sx={{
                    position: "relative",
                    flex: "0 0 100%",
                    width: "100%",
                    // NOTE: no forced aspectRatio here anymore — the card's
                    // total height is now the photo poster (fixed aspect)
                    // PLUS the caption block below it (natural height).
                    // This is what lets the caption grow instead of
                    // overlapping/clipping on short or narrow screens.
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    cursor: "pointer",
                    background: CARD_BG,
                  }}
                >
                  {/* ================================================== */}
                  {/* 1) PHOTO POSTER — fixed aspect, photo + name only    */}
                  {/* ================================================== */}
                  <Box sx={{ position: "relative", width: "100%", aspectRatio: "4 / 3.6", flexShrink: 0 }}>
                    {/* ---- subtle wave texture over the poster ---- */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0.5,
                        pointerEvents: "none",
                        backgroundImage:
                          "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 14px)",
                      }}
                    />

                    {/* ---- gold glitter speckles ---- */}
                    {GLITTER_DOTS.map(([x, y], gi) => (
                      <Box
                        key={gi}
                        sx={{
                          position: "absolute",
                          left: `${x}%`,
                          top: `${y}%`,
                          width: gi % 3 === 0 ? 4 : 2,
                          height: gi % 3 === 0 ? 4 : 2,
                          borderRadius: "50%",
                          bgcolor: GOLD,
                          opacity: 0.6,
                          pointerEvents: "none",
                        }}
                      />
                    ))}

                    {/* ---- palm leaf, top-left corner (real image asset) ---- */}
                    <Box
                      component="img"
                      src={PALM_LEAF_SRC}
                      alt=""
                      aria-hidden="true"
                      sx={{
                        position: "absolute",
                        zIndex: 2,
                        top: -8,
                        left: -10,
                        width: "40%",
                        maxWidth: 160,
                        height: "auto",
                        pointerEvents: "none",
                        objectFit: "contain",
                      }}
                    />

                    {/* ---- flower, bottom-left corner (real image asset) ---- */}
                    <Box
                      component="img"
                      src={FLOWER_SRC}
                      alt=""
                      aria-hidden="true"
                      sx={{
                        position: "absolute",
                        zIndex: 2,
                        bottom: -6,
                        left: -8,
                        width: "26%",
                        maxWidth: 110,
                        height: "auto",
                        pointerEvents: "none",
                        objectFit: "contain",
                      }}
                    />

                    {/* ---- torn-paper photo frame -------------------------- */}
                    <Box
                      sx={{
                        position: "absolute",
                        zIndex: 3,
                        top: "6%",
                        left: "18%",
                        right: "18%",
                        height: "76%",
                        transform: "rotate(-2.5deg)",
                      }}
                    >
                      {/* white torn-paper backing */}
                      <Box
                        sx={{
                          position: "absolute",
                          inset: -6,
                          bgcolor: "#fff",
                          clipPath: TORN_PAPER_CLIP,
                          boxShadow: "0 10px 24px rgba(0,0,0,0.3)",
                        }}
                      />

                      {/* photo layer: blurred backdrop fill (only visible for
                          landscape photos, where the sharp image is "contain"
                          and doesn't fill the frame) + the actual photo on top */}
                      <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", clipPath: TORN_PAPER_CLIP }}>
                        {!isPortrait && (
                          <Box
                            component="img"
                            src={p.photoUrl}
                            alt=""
                            aria-hidden="true"
                            sx={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              filter: "blur(18px) brightness(0.9)",
                              transform: "scale(1.15)",
                            }}
                          />
                        )}
                        <Box
                          component="img"
                          src={p.photoUrl}
                          alt={p.name}
                          onLoad={handlePhotoLoad(p.id)}
                          sx={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: isPortrait ? "cover" : "contain",
                            // bias the crop toward the top of the photo so heads aren't cut off
                            objectPosition: isPortrait ? "center 15%" : "center",
                          }}
                        />
                      </Box>

                      {/* sparkle stars near the top-right of the photo */}
                      <Typography sx={{ position: "absolute", top: "-10%", right: "-6%", fontSize: "1.6rem", color: GOLD, transform: "rotate(12deg)" }}>
                        ✦
                      </Typography>
                      <Typography sx={{ position: "absolute", top: "6%", right: "-14%", fontSize: "1rem", color: GOLD }}>
                        ✧
                      </Typography>
                      <Typography sx={{ position: "absolute", top: "22%", right: "-10%", fontSize: "1.3rem", color: ORANGE, transform: "rotate(-10deg)" }}>
                        ✦
                      </Typography>
                    </Box>
                  </Box>

                  {/* ================================================== */}
                  {/* 2) CAPTION — normal document flow, stacks below the  */}
                  {/*    poster based on real content height, so it can    */}
                  {/*    never overlap the photo/name or bleed off-card.   */}
                  {/* ================================================== */}
                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 3,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      px: 2.5,
                      pt: 1,
                      pb: 4.5, // leaves room for the + button in the corner
                      gap: 0.75,
                    }}
                  >
                    {/* ---- cursive "Happy Birthday, [Name]" ---- */}
                    <Typography
                      className="birthday-card-text"
                      sx={{
                        fontFamily: "'Pacifico', cursive",
                        fontSize: "clamp(1.6rem, 7vw, 2.1rem)",
                        color: ORANGE,
                        textShadow: "0 2px 0 rgba(0,0,0,0.15)",
                        lineHeight: 1.15,
                      }}
                    >
                      Happy Birthday, {p.firstName}
                    </Typography>

                    {/* ---- quote / message — cream so it reads on the teal bg ---- */}
                    <Typography
                      className="birthday-card-text"
                      sx={{
                        fontStyle: "italic",
                        fontFamily: theme.typography.fontFamily,
                        fontSize: "clamp(0.85rem, 3.5vw, 0.95rem)",
                        color: CREAM,
                        lineHeight: 1.4,
                        maxWidth: "34ch",
                      }}
                    >
                      "{p.message}"
                    </Typography>

                    {/* ---- location, if provided ---- */}
                    {p.location && (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.4 }}>
                        <LocationOnIcon sx={{ fontSize: "0.85rem", color: CREAM, opacity: 0.85 }} />
                        <Typography className="birthday-card-text" sx={{ fontFamily: theme.typography.fontFamily, fontSize: "0.7rem", fontWeight: 600, color: CREAM, opacity: 0.85 }}>
                          {p.location}
                        </Typography>
                      </Box>
                    )}

                    {/* ---- taped date sticker ---- */}
                    <Box
                      sx={{
                        mt: 0.75,
                        transform: "rotate(-2deg)",
                        bgcolor: "#111",
                        color: "#fff",
                        px: 2.4,
                        py: 0.8,
                        boxShadow: "0 8px 16px rgba(0,0,0,0.35)",
                      }}
                    >
                      <Typography className="birthday-card-text" sx={{ fontFamily: theme.typography.fontFamily, fontWeight: 800, fontSize: "clamp(0.95rem, 4vw, 1.2rem)", whiteSpace: "nowrap" }}>
                        {p.ordinalDay} {p.monthLabel}
                      </Typography>
                    </Box>
                  </Box>

                  {/* + button — write a wish for anyone, not just the one showing */}
                  <IconButton
                    aria-label="Write a new wish"
                    onClick={(e) => {
                      e.stopPropagation();
                      goWriteWish();
                    }}
                    sx={{
                      position: "absolute",
                      zIndex: 5,
                      bottom: 10,
                      right: 12,
                      width: "clamp(30px, 5vw, 40px)",
                      height: "clamp(30px, 5vw, 40px)",
                      bgcolor: gold,
                      color: "#1a1a1a",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
                      "&:hover": { bgcolor: gold, opacity: 0.9 },
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Box>

          {/* progress dots — unchanged */}
          {list.length > 1 && (
            <Box sx={{ display: "flex", gap: 0.8, justifyContent: "center", mt: 1.4 }}>
              {list.map((p, i) => (
                <Box
                  key={p.id}
                  onClick={() => setIndex(i)}
                  sx={{
                    width: i === index % list.length ? 18 : 6,
                    height: 6,
                    borderRadius: 999,
                    cursor: "pointer",
                    transition: "width 0.25s ease, background-color 0.25s ease",
                    bgcolor: i === index % list.length ? gold : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default BirthdayFeed;