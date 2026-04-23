import React, { useState, useMemo } from "react";
import { keyframes } from "@emotion/react";
import {
  Box, Typography, Button, Select, MenuItem,
  Chip, Pagination, Card, CardContent, Stack,
  FormControl, InputLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import IosShareIcon     from "@mui/icons-material/IosShare";
import StarIcon         from "@mui/icons-material/Star";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CakeIcon         from "@mui/icons-material/Cake";
import { SERIF }            from "../components/shared/constants";
import { CelebArticleCard } from "../components/shared/CelebArticleCard";
import { ArticleModal }     from "../components/shared/ArticleModal";
import { useAudio }         from "../hooks/useAudio";
import { CELEB_ARTICLES }   from "../data/celebArticles";
import type { Article }     from "../types/article";
import WishComposer         from "./WishComposer";
import HeroBirthdayCanvas   from "../components/HeroBirthdayCanvas";
import beyonceImg from "../assets/beyoncé.jpg";
import chrisImg   from "../assets/kingofpop.png";
import selenaImg  from "../assets/gomez.jpg";
import lebronjImg from "../assets/lebron.jpg";
import adeleImg   from "../assets/adele.jpg";
import elonImg    from "../assets/elonemask.jpg";

// ── Data ──────────────────────────────────────────────────────────────────────
const CELEBRITIES = [
  { id: 1, name: "Beyoncé",         dob: "Sep 4",  category: "Music",  location: "Houston, TX",            rating: 5.0,  reviews: 2840, priceLabel: "Iconic Performer",  image: beyonceImg },
  { id: 2, name: "Michael Jackson", dob: "Aug 29", category: "Music",  location: "Gary, Indiana",          rating: 5.0,  reviews: 5100, priceLabel: "King of Pop",       image: chrisImg   },
  { id: 3, name: "Selena Gomez",    dob: "Jul 22", category: "Music",  location: "Grand Prairie, TX",      rating: 5.0,  reviews: 3100, priceLabel: "Pop Sensation",     image: selenaImg  },
  { id: 4, name: "LeBron James",    dob: "Dec 30", category: "Sports", location: "Akron, OH",              rating: 5.0,  reviews: 4200, priceLabel: "Basketball Legend", image: lebronjImg },
  { id: 5, name: "Adele",           dob: "May 5",  category: "Music",  location: "London, UK",             rating: 4.99, reviews: 2610, priceLabel: "Grammy Winner",     image: adeleImg   },
  { id: 6, name: "Elon Musk",       dob: "Jun 28", category: "Tech",   location: "Pretoria, South Africa", rating: 4.85, reviews: 980,  priceLabel: "Tech Visionary",    image: elonImg    },
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const TOTAL_CELEBRITIES = 480;
const PER_PAGE          = 6;
const GOLD   = "#F5A623";
const GOLD2  = "#FFD580";
const SILVER = "#E0E0E0";
const ROSE   = "#FF8FAB";
const COLORS = [GOLD, GOLD, GOLD2, GOLD, SILVER, ROSE, GOLD2, GOLD];

// ── CelebCard keyframes ────────────────────────────────────────────────────────
const floatUp = keyframes`
  0%   { transform: translateY(0)      rotate(0deg)   scale(1);   opacity: 0;   }
  8%   { opacity: 1; }
  85%  { opacity: 0.6; }
  100% { transform: translateY(-300px) rotate(540deg) scale(0.4); opacity: 0;   }
`;
const twinkle = keyframes`
  0%, 100% { opacity: 0.15; transform: scale(0.7) rotate(0deg);  }
  40%      { opacity: 1;    transform: scale(1.3) rotate(20deg);  }
  70%      { opacity: 0.5;  transform: scale(0.9) rotate(-10deg); }
`;
const tumble = keyframes`
  0%   { transform: translateY(0)      rotate(0deg)   scaleX(1);  opacity: 0;   }
  6%   { opacity: 1; }
  90%  { opacity: 0.55; }
  100% { transform: translateY(-280px) rotate(420deg) scaleX(-1); opacity: 0;   }
`;
const haloPulse = keyframes`
  0%, 100% { opacity: 0.18; transform: scaleX(1);    }
  50%      { opacity: 0.38; transform: scaleX(1.08); }
`;
const shimmerBorder = keyframes`
  0%   { opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; }
`;

// ── Particle types ─────────────────────────────────────────────────────────────
type ParticleType = "orb" | "star" | "ribbon" | "dot";
interface Particle {
  id: number; left: string; bottom: string;
  size: number; delay: number; duration: number;
  color: string; type: ParticleType;
}

function buildParticles(): Particle[] {
  return Array.from({ length: 18 }, (_, i) => ({
    id:       i,
    left:     `${4 + (i * 73 + 11) % 90}%`,
    bottom:   `${(i * 37) % 40}%`,
    size:     i % 3 === 0 ? 5 : i % 3 === 1 ? 7 : 4,
    delay:    (i * 0.38) % 4.2,
    duration: 3.2 + (i * 0.27) % 2.6,
    color:    COLORS[i % COLORS.length],
    type:     (["orb", "star", "ribbon", "dot"] as ParticleType[])[i % 4],
  }));
}

const BirthdayParticle: React.FC<Particle> = ({
  left, bottom, size, delay, duration, color, type,
}) => {
  const base = {
    position: "absolute" as const,
    left, bottom,
    pointerEvents: "none" as const,
    zIndex: 2,
    animationFillMode: "both" as const,
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };
  if (type === "orb") return (
    <Box sx={{
      ...base,
      width: size + 2, height: size + 2,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      boxShadow: `0 0 ${size * 3}px ${size}px ${color}55`,
      animationName: `${floatUp}`,
    }} />
  );
  if (type === "star") return (
    <Box sx={{
      ...base,
      width: size * 2, height: size * 2,
      animationName: `${twinkle}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 2, lineHeight: 1,
      userSelect: "none",
      filter: `drop-shadow(0 0 ${size}px ${color})`,
      color,
    }}>✦</Box>
  );
  if (type === "ribbon") return (
    <Box sx={{
      ...base,
      width: size - 1, height: size * 3.5,
      borderRadius: "2px",
      background: `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`,
      animationName: `${tumble}`,
    }} />
  );
  return (
    <Box sx={{
      ...base,
      width: size - 1, height: size - 1,
      borderRadius: "50%",
      bgcolor: color,
      animationName: `${floatUp}`,
    }} />
  );
};

const BirthdayBackground: React.FC = () => {
  const theme     = useTheme();
  const particles = useMemo(buildParticles, []);
  const isDark    = theme.palette.mode === "dark";
  const bgColor   = isDark ? "#1A1A2E" : "#F5F5F7";
  return (
    <>
      <Box sx={{
        position: "absolute", inset: 0, zIndex: 1,
        borderRadius: "16px",
        background: isDark
          ? `radial-gradient(ellipse 90% 60% at 50% 110%, ${GOLD}18 0%, transparent 70%),
             radial-gradient(ellipse 50% 30% at 20% 0%,   #FF8FAB0D 0%, transparent 60%)`
          : `radial-gradient(ellipse 90% 60% at 50% 110%, ${GOLD}22 0%, transparent 70%),
             radial-gradient(ellipse 50% 30% at 80% 0%,   #FF8FAB14 0%, transparent 60%)`,
        pointerEvents: "none",
      }} />
      <Box sx={{
        position: "absolute", bottom: "12%", left: "5%",
        width: "90%", height: 60, zIndex: 1,
        borderRadius: "50%",
        background: `radial-gradient(ellipse, ${GOLD}55 0%, transparent 70%)`,
        filter: "blur(14px)",
        animationName: `${haloPulse}`,
        animationDuration: "3s",
        animationIterationCount: "infinite",
        animationTimingFunction: "ease-in-out",
        pointerEvents: "none",
      }} />
      {particles.map((p) => <BirthdayParticle key={p.id} {...p} />)}
      <Box sx={{
        position: "absolute", inset: 0, zIndex: 3,
        borderRadius: "16px",
        border: "1.5px solid transparent",
        background: `
          linear-gradient(${bgColor}, ${bgColor}) padding-box,
          linear-gradient(135deg, transparent 20%, ${GOLD}88 50%, transparent 80%) border-box
        `,
        animationName: `${shimmerBorder}`,
        animationDuration: "4s",
        animationDelay: "1s",
        animationIterationCount: "infinite",
        animationTimingFunction: "ease-in-out",
        pointerEvents: "none",
      }} />
    </>
  );
};

// ── CelebCard ──────────────────────────────────────────────────────────────────
const CelebCard: React.FC<(typeof CELEBRITIES)[0]> = ({
  name, dob, category, location, rating, priceLabel, image,
}) => {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "16px", overflow: "hidden",
        border: "none", bgcolor: "transparent", cursor: "pointer",
        position: "relative",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover .celeb-img": { transform: "scale(1.04)" },
        "&:hover .share-btn": { opacity: 1 },
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 12px 40px ${GOLD}28`,
        },
      }}
    >
      <BirthdayBackground />
      <Box sx={{ position: "relative", borderRadius: "16px", overflow: "hidden", zIndex: 4 }}>
        <Box sx={{
          height: { xs: 220, sm: 240, md: 270 },
          overflow: "hidden", borderRadius: "16px",
          bgcolor: theme.palette.action.hover,
        }}>
          <Box
            className="celeb-img"
            component="img"
            src={image}
            alt={name}
            sx={{
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center 10%",
              transition: "transform 0.4s ease", display: "block",
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.style.backgroundColor =
                theme.palette.action.selected;
            }}
          />
        </Box>
        <Box
          className="share-btn"
          sx={{
            position: "absolute", top: 10, right: 10,
            width: 32, height: 32, borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0, transition: "opacity 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            cursor: "pointer", "&:hover": { bgcolor: "#fff" },
          }}
        >
          <IosShareIcon sx={{ fontSize: 15, color: "#1a1a1a" }} />
        </Box>
      </Box>
      <CardContent sx={{ px: 0, pt: 1.5, pb: "8px !important", position: "relative", zIndex: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.3}>
          <Typography sx={{
            fontFamily: SERIF, fontWeight: 700,
            fontSize: { xs: "0.97rem", md: "1.05rem" },
            color: theme.palette.text.primary,
            lineHeight: 1.3, flex: 1, pr: 1,
          }}>
            {name}
          </Typography>
          <Box display="flex" alignItems="center" gap={0.3} flexShrink={0}>
            <StarIcon sx={{ fontSize: 13, color: theme.palette.primary.main }} />
            <Typography sx={{
              fontFamily: SERIF, fontWeight: 700,
              fontSize: "0.82rem", color: theme.palette.text.primary,
            }}>
              {rating.toFixed(2)}
            </Typography>
          </Box>
        </Box>
        <Typography sx={{
          fontFamily: SERIF, fontSize: "0.82rem",
          color: theme.palette.text.secondary, mb: 0.2,
        }}>
          {location}
        </Typography>
        <Typography sx={{
          fontFamily: SERIF, fontSize: "0.82rem",
          color: GOLD, fontWeight: 600, mb: 0.8,
          textShadow: `0 0 10px ${GOLD}66`,
        }}>
          🎂 Born {dob}
        </Typography>
        <Box display="flex" alignItems="center" gap={0.8}>
          <Chip
            label={category}
            size="small"
            sx={{
              bgcolor: theme.palette.action.hover,
              color: theme.palette.text.primary,
              fontFamily: SERIF, fontWeight: 700,
              fontSize: "0.68rem", height: 22, borderRadius: "6px",
            }}
          />
          <Typography sx={{
            fontFamily: SERIF, fontSize: "0.8rem",
            color: theme.palette.text.disabled,
          }}>
            · {priceLabel}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────────
const Birthdays: React.FC = () => {
  const theme = useTheme();
  const [month,         setMonth]         = useState("");
  const [day,           setDay]           = useState("");
  const [searched,      setSearched]      = useState(false);
  const [page,          setPage]          = useState(1);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [wishOpen,      setWishOpen]      = useState(false);

  const audio      = useAudio();
  const totalPages = Math.ceil(TOTAL_CELEBRITIES / PER_PAGE);

  const handleSearch = () => {
    if (month || day) setSearched(true);
  };

  const handleReset = () => {
    setMonth("");
    setDay("");
    setSearched(false);
  };

  const selectSx = {
    bgcolor: "#FFFFFF",
    borderRadius: "10px",
    fontFamily: SERIF,
    fontWeight: 600,
    fontSize: "0.9rem",
    color: "#0D0D0D",
    height: 46,
    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: `2px solid ${theme.palette.primary.main}`,
    },
    "& .MuiSelect-icon": { color: "#555" },
    boxShadow: "0 2px 12px rgba(0,0,0,0.20)",
  };

  const labelSx = {
    fontFamily: SERIF, fontWeight: 600, fontSize: "0.82rem",
    color: "rgba(0,0,0,0.45)",
    "&.MuiInputLabel-shrink": { color: theme.palette.primary.main },
  };

  const menuPaperSx = {
    borderRadius: "12px", mt: 0.5, maxHeight: 280,
    boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
    "& .MuiMenuItem-root": {
      fontFamily: SERIF, fontSize: "0.88rem",
      fontWeight: 600, color: "#0D0D0D",
      "&:hover":        { bgcolor: `${theme.palette.primary.main}22` },
      "&.Mui-selected": { bgcolor: `${theme.palette.primary.main}33`, fontWeight: 800 },
    },
  };

  // Shared dropdown + button controls — used in both hero and compact bar
  const SearchControls = ({ compact = false }: { compact?: boolean }) => (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      justifyContent={compact ? "flex-start" : "center"}
      alignItems="center"
      flexWrap="nowrap"
      sx={{ maxWidth: compact ? "none" : 600, mx: compact ? 0 : "auto", px: compact ? 0 : { xs: 1, sm: 0 } }}
    >
      <FormControl sx={{ width: { xs: "100%", sm: 175 } }} size="small">
        <InputLabel sx={compact ? { ...labelSx, color: "rgba(0,0,0,0.45)" } : labelSx}>
          Month
        </InputLabel>
        <Select
          value={month} label="Month"
          onChange={e => setMonth(e.target.value)}
          sx={selectSx}
          MenuProps={{ PaperProps: { sx: menuPaperSx } }}
        >
          {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl sx={{ width: { xs: "100%", sm: 120 } }} size="small">
        <InputLabel sx={compact ? { ...labelSx, color: "rgba(0,0,0,0.45)" } : labelSx}>
          Day
        </InputLabel>
        <Select
          value={day} label="Day"
          onChange={e => setDay(e.target.value)}
          sx={selectSx}
          MenuProps={{ PaperProps: { sx: menuPaperSx } }}
        >
          {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        size="large"
        endIcon={<ArrowForwardIcon sx={{ fontSize: "18px !important" }} />}
        onClick={handleSearch}
        sx={{
          width: { xs: "100%", sm: "auto" },
          bgcolor: theme.palette.primary.main,
          color:   theme.palette.primary.contrastText,
          fontFamily: SERIF, fontWeight: 800, fontSize: "0.9rem",
          textTransform: "none", height: 46, px: 3,
          borderRadius: "10px", whiteSpace: "nowrap", lineHeight: 1,
          position: "relative", zIndex: 2,
          boxShadow: compact ? "0 2px 12px rgba(0,0,0,0.20)" : "0 4px 20px rgba(0,0,0,0.40)",
          border: `2px solid ${theme.palette.primary.main}`,
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: "#FBBF24",
            boxShadow: "0 6px 28px rgba(0,0,0,0.50)",
            transform: "translateY(-1px)",
          },
          "&:active": { transform: "translateY(0)" },
        }}
      >
        Find My Celebrities
      </Button>

      {compact && (
        <Button
          size="small"
          onClick={handleReset}
          sx={{
            fontFamily: SERIF, fontWeight: 600, fontSize: "0.82rem",
            color: theme.palette.text.secondary,
            textTransform: "none",
            whiteSpace: "nowrap",
            "&:hover": { color: theme.palette.primary.main },
          }}
        >
          ← Back
        </Button>
      )}
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: theme.palette.background.default }}>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — hidden once user has searched
      ══════════════════════════════════════════════════════════════════ */}
      {!searched && (
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            minHeight: { xs: 440, md: 520 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: { xs: 7, md: 10 },
            px: { xs: 2, md: 4 },
            textAlign: "center",
          }}
        >
          {/* 🎂 Animated canvas — z-index 0, fills the hero */}
          <HeroBirthdayCanvas />

          {/* All text + controls float above canvas at z-index 2 */}
          <Box sx={{ position: "relative", zIndex: 2, width: "100%" }}>
            <Typography variant="h4" sx={{
              fontFamily: SERIF, fontWeight: 900,
              fontSize: { xs: "1.85rem", sm: "2.2rem", md: "2.7rem" },
              color: "#FFFFFF", mb: 1,
              textShadow: "0 2px 20px rgba(0,0,0,0.55)",
            }}>
              🎂 Celebrity Birthdays
            </Typography>
            <Typography sx={{
              fontFamily: SERIF,
              fontSize: { xs: "0.88rem", md: "1rem" },
              color: "rgba(255,255,255,0.68)",
              mb: 4, maxWidth: 440, mx: "auto", lineHeight: 1.65,
            }}>
              Discover which famous celebrities share your birthday.
              Enter your date of birth below.
            </Typography>

            {/* Date dropdowns + search */}
            <SearchControls compact={false} />

            {/* Write a Birthday Wish */}
            <Box sx={{ mt: 3.5, display: "flex", justifyContent: "center" }}>
              <Button
                variant="outlined"
                startIcon={<CakeIcon sx={{ fontSize: "18px !important" }} />}
                onClick={() => setWishOpen(true)}
                sx={{
                  fontFamily: SERIF, fontWeight: 700, fontSize: "0.88rem",
                  textTransform: "none", borderRadius: "100px",
                  px: 3.5, py: 1.1,
                  color: "#FFFFFF",
                  borderColor: "rgba(255,255,255,0.45)",
                  bgcolor: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(8px)",
                  whiteSpace: "nowrap", position: "relative", zIndex: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: `${theme.palette.primary.main}22`,
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    transform: "translateY(-1px)",
                    boxShadow: `0 0 20px ${theme.palette.primary.main}33`,
                  },
                  "&:active": { transform: "translateY(0)" },
                }}
              >
                Write a Birthday Wish for a Friend
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ARTICLES — shown after search, replaces hero
      ══════════════════════════════════════════════════════════════════ */}
      {searched && (
        <Box sx={{
          bgcolor: theme.palette.background.paper,
          px: { xs: 2, sm: 3, md: 5, lg: 8 },
          py: { xs: 4, md: 6 },
        }}>
          {/* Compact search bar replaces the hero */}
          <Box sx={{ mb: 3 }}>
            <SearchControls compact={true} />
          </Box>

          {/* Section header */}
          <Box
            display="flex" justifyContent="space-between" alignItems="center"
            mb={3}
            sx={{
              borderTop:    `1px solid ${theme.palette.divider}`,
              borderBottom: `1px solid ${theme.palette.divider}`,
              py: "0.6rem",
            }}
          >
            <Box>
              <Typography sx={{
                fontFamily: SERIF, fontWeight: 800,
                fontSize: { xs: "1.3rem", md: "1.6rem" },
                color: theme.palette.text.primary,
              }}>
                🎂 Celebrities Born on {month} {day}
              </Typography>
              <Typography sx={{
                fontFamily: SERIF,
                color: theme.palette.text.secondary,
                fontSize: "0.85rem", mt: 0.4,
              }}>
                Stories, profiles and milestones from stars who share your day
              </Typography>
            </Box>
            <Button
              endIcon={<ArrowForwardIcon />}
              sx={{
                fontFamily: SERIF, fontWeight: 700, fontSize: "0.82rem",
                color: theme.palette.text.secondary,
                textTransform: "none",
                "&:hover": { color: theme.palette.primary.main },
              }}
            >
              See all
            </Button>
          </Box>

          {/* Articles grid */}
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" },
            gap: { xs: "24px 16px", md: "32px 20px" }, mb: 4,
          }}>
            {CELEB_ARTICLES.map(article => (
              <CelebArticleCard
                key={article.id} article={article}
                onOpen={setActiveArticle} audio={audio}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ALL CELEBRITIES GRID — always visible
      ══════════════════════════════════════════════════════════════════ */}
      <Box sx={{
        px: { xs: 2, sm: 3, md: 5, lg: 8 },
        py: { xs: 4, md: 6 },
        bgcolor: theme.palette.background.default,
      }}>
        <Box
          display="flex" justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}
          gap={0.5} mb={0.5}
        >
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h5" sx={{
                fontFamily: SERIF, fontWeight: 800,
                fontSize: { xs: "1.3rem", md: "1.55rem" },
                color: theme.palette.text.primary,
              }}>
                All Celebrity Birthday Articles
              </Typography>
              <ArrowForwardIcon sx={{ fontSize: 22, color: theme.palette.primary.main, mt: "2px" }} />
            </Box>
            <Typography sx={{
              fontFamily: SERIF,
              fontSize: { xs: "0.8rem", md: "0.88rem" },
              color: theme.palette.text.secondary, mt: 0.3,
            }}>
              Featuring the world's most celebrated personalities
            </Typography>
          </Box>
          <Typography sx={{
            fontFamily: SERIF,
            fontSize: { xs: "0.75rem", md: "0.82rem" },
            color: theme.palette.text.disabled,
          }}>
            Showing {PER_PAGE} of {TOTAL_CELEBRITIES.toLocaleString()} celebrities
          </Typography>
        </Box>
        <Box sx={{ height: "1px", bgcolor: theme.palette.divider, mb: 3 }} />
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" },
          gap: { xs: "24px 16px", md: "32px 20px" }, mb: 5,
        }}>
          {CELEBRITIES.map(celeb => <CelebCard key={celeb.id} {...celeb} />)}
        </Box>
        <Box display="flex" justifyContent="center">
          <Pagination
            count={totalPages} page={page}
            onChange={(_, val) => setPage(val)}
            shape="rounded" siblingCount={1} boundaryCount={1}
            sx={{
              "& .MuiPaginationItem-root": {
                fontFamily: SERIF, fontWeight: 600, fontSize: "0.85rem",
                color: theme.palette.text.secondary,
              },
              "& .Mui-selected": {
                bgcolor: `${theme.palette.primary.main} !important`,
                color: theme.palette.primary.contrastText,
                fontWeight: 800,
              },
            }}
          />
        </Box>
      </Box>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {activeArticle && (
        <ArticleModal
          article={activeArticle}
          onClose={() => setActiveArticle(null)}
          audio={audio}
        />
      )}
      {wishOpen && <WishComposer onClose={() => setWishOpen(false)} />}
    </Box>
  );
};

export default Birthdays;