// ── BirthdayWishBoard (scrollable + searchable) ───────────────────────────
// Cards scroll horizontally. A search bar at the top filters by name/location.
// Drop this into BirthdayHero.tsx replacing the existing BirthdayWishBoard.
// ─────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from "react";
import {
  Box, Typography, Button, TextField, InputAdornment,
  Chip, Divider, Badge, Tooltip, IconButton,
} from "@mui/material";
import CakeIcon      from "@mui/icons-material/Cake";
import InboxIcon     from "@mui/icons-material/Inbox";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon    from "@mui/icons-material/Search";
import CloseIcon     from "@mui/icons-material/Close";
import ChevronLeftIcon  from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import {
  FONT, SOUL, RADIUS, containerSx, goldButtonSx, ghostButtonSx,
} from "./soulwishTheme";
import { fadeSlideUp } from "./birthdayData";
import type { BirthdayPerson, WishEntry } from "./birthdayData";

// ─────────────────────────────────────────────────────────────────────────

interface BirthdayWishBoardProps {
  people: BirthdayPerson[];
  wishes: WishEntry[];
  onWish: (person: BirthdayPerson) => void;
  onViewWishes: (person: BirthdayPerson) => void;
  onRegister: () => void;
}

export const BirthdayWishBoard: React.FC<BirthdayWishBoardProps> = ({
  people, wishes, onWish, onViewWishes, onRegister,
}) => {
  const [query, setQuery] = useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Filter people by name or location
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q),
    );
  }, [people, query]);

  // Arrow scroll helpers
  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  };

  return (
    <Box sx={{ py: { xs: 4, md: 7 }, bgcolor: SOUL.bg }}>

      {/* ── Header row ──────────────────────────────────────────────── */}
      <Box sx={{
        ...containerSx,
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        gap: 2,
        mb: 2.5,
      }}>
        <Box>
          <Typography sx={{
            fontFamily: FONT, fontWeight: 800,
            fontSize: { xs: "1.6rem", md: "2.25rem" },
            color: SOUL.text, lineHeight: 1.2,
          }}>
            🎉 Celebrate with Them
          </Typography>
          <Typography sx={{ fontFamily: FONT, fontSize: "0.88rem", color: SOUL.textMuted, mt: 0.5 }}>
            Send a wish to anyone celebrating today — or add yourself to the list
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={onRegister}
          startIcon={<PersonAddIcon />}
          sx={{ ...ghostButtonSx, px: 2.8, py: 1.1, fontSize: "0.88rem", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          Add a Birthday
        </Button>
      </Box>

      {/* ── Search bar ──────────────────────────────────────────────── */}
      <Box sx={{ ...containerSx, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name or location…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: SOUL.textMuted }} />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setQuery("")} sx={{ color: SOUL.textMuted, "&:hover": { color: SOUL.text } }}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            maxWidth: { sm: 420 },
            "& .MuiOutlinedInput-root": {
              fontFamily: FONT,
              fontSize: "0.9rem",
              color: SOUL.text,
              bgcolor: SOUL.surfaceHigh,
              borderRadius: `${RADIUS.md}px`,
              "& fieldset": { borderColor: SOUL.border },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.22)" },
              "&.Mui-focused fieldset": { borderColor: SOUL.gold, borderWidth: "1.5px" },
            },
            "& .MuiInputBase-input::placeholder": { color: SOUL.textFaint, opacity: 1 },
          }}
        />

        {/* Result count hint */}
        {query.trim() && (
          <Typography sx={{ fontFamily: FONT, fontSize: "0.72rem", color: SOUL.textMuted, mt: 1 }}>
            {filtered.length === 0
              ? "No matches found"
              : `${filtered.length} ${filtered.length === 1 ? "person" : "people"} found`}
          </Typography>
        )}
      </Box>

      {/* ── Scroll wrapper ───────────────────────────────────────────── */}
      <Box sx={{ position: "relative" }}>

        {/* Left arrow */}
        <IconButton
          onClick={() => scroll("left")}
          sx={{
            display: { xs: "none", md: "flex" },
            position: "absolute", left: 8, top: "50%",
            transform: "translateY(-50%)", zIndex: 5,
            bgcolor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(6px)",
            color: SOUL.text,
            border: `1px solid ${SOUL.border}`,
            "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        {/* Right arrow */}
        <IconButton
          onClick={() => scroll("right")}
          sx={{
            display: { xs: "none", md: "flex" },
            position: "absolute", right: 8, top: "50%",
            transform: "translateY(-50%)", zIndex: 5,
            bgcolor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(6px)",
            color: SOUL.text,
            border: `1px solid ${SOUL.border}`,
            "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
          }}
        >
          <ChevronRightIcon />
        </IconButton>

        {/* Horizontal scroll track */}
        <Box
          ref={scrollRef}
          sx={{
            display: "flex",
            gap: 2.5,
            overflowX: "auto",
            overflowY: "visible",
            px: { xs: 2, md: 7 },           // space for arrows on desktop
            pb: 2,                            // room for card shadow
            scrollSnapType: "x mandatory",
            "&::-webkit-scrollbar": { height: 5 },
            "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: SOUL.border,
              borderRadius: 3,
            },
          }}
        >
          {filtered.length === 0 ? (
            <Box sx={{ minWidth: 280, py: 6, px: 3, textAlign: "center", color: SOUL.textFaint, fontFamily: FONT, fontSize: "0.88rem" }}>
              No one matches "{query}"
            </Box>
          ) : (
            filtered.map((person, idx) => {
              const personWishes = wishes.filter(w => w.recipientId === person.id);
              return (
                <WishCard
                  key={person.id}
                  person={person}
                  personWishes={personWishes}
                  idx={idx}
                  onWish={onWish}
                  onViewWishes={onViewWishes}
                />
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
};

// ── Individual wish card ──────────────────────────────────────────────────
interface WishCardProps {
  person: BirthdayPerson;
  personWishes: WishEntry[];
  idx: number;
  onWish: (p: BirthdayPerson) => void;
  onViewWishes: (p: BirthdayPerson) => void;
}

const WishCard: React.FC<WishCardProps> = ({ person, personWishes, idx, onWish, onViewWishes }) => (
  <Box
    component="article"
    sx={{
      // Fixed card size — scrolls horizontally
      minWidth: { xs: 260, sm: 280 },
      maxWidth: { xs: 260, sm: 280 },
      scrollSnapAlign: "start",
      flexShrink: 0,

      borderRadius: `${RADIUS.lg}px`,
      overflow: "hidden",
      bgcolor: SOUL.surfaceHigh,
      border: `1px solid ${SOUL.border}`,
      transition: "transform 0.25s ease, box-shadow 0.25s ease",
      animation: `${fadeSlideUp} 0.5s ${idx * 0.06}s both`,
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
      },
    }}
  >
    {/* Photo */}
    <Box sx={{ height: 180, overflow: "hidden", bgcolor: SOUL.surface, position: "relative" }}>
      <Box
        component="img"
        src={person.photo}
        alt={person.name}
        sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%", display: "block" }}
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; }}
      />
      {person.addedBy && person.addedBy !== "admin" && (
        <Chip
          label={person.addedBy === "friend" ? "Added by friend" : "Self-registered"}
          size="small"
          sx={{
            position: "absolute", top: 10, left: 10,
            fontFamily: FONT, fontSize: "0.60rem", fontWeight: 700,
            bgcolor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
            color: "rgba(255,255,255,0.75)", height: 20,
          }}
        />
      )}
    </Box>

    {/* Body */}
    <Box sx={{ px: 2, pt: 1.8, pb: 1.5 }}>
      <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: "1rem", color: SOUL.text, mb: 0.2 }}>
        {person.name}
      </Typography>
      <Typography sx={{ fontFamily: FONT, fontSize: "0.75rem", color: SOUL.textMuted, mb: 0.8 }}>
        📍 {person.location}
        {person.birthMonth && person.birthDay ? ` · 🎂 ${person.birthMonth} ${person.birthDay}` : ""}
      </Typography>
      <Typography sx={{
        fontFamily: FONT, fontSize: "0.78rem", color: SOUL.textMuted,
        lineHeight: 1.6, fontStyle: "italic", mb: 1.8,
        display: "-webkit-box", WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        "{person.wishMessage}"
      </Typography>

      <Divider sx={{ borderColor: SOUL.border, mb: 1.8 }} />

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={() => onWish(person)}
          startIcon={<CakeIcon sx={{ fontSize: "14px !important" }} />}
          sx={{ flex: 1, ...goldButtonSx("sm") }}
        >
          Wish Them
        </Button>

        <Tooltip
          title={`${personWishes.length} ${personWishes.length === 1 ? "wish" : "wishes"} received`}
          placement="top"
        >
          <Button
            variant="outlined"
            size="small"
            onClick={() => onViewWishes(person)}
            sx={{
              minWidth: 0, width: 38, height: 38, p: 0,
              borderRadius: `${RADIUS.sm}px`,
              border: `1.5px solid ${SOUL.border}`,
              color: SOUL.textMuted,
              "&:hover": {
                border: `1.5px solid ${SOUL.gold}`,
                color: SOUL.gold,
                bgcolor: "rgba(245,166,35,0.08)",
              },
            }}
          >
            <Badge
              badgeContent={personWishes.length}
              sx={{
                "& .MuiBadge-badge": {
                  bgcolor: SOUL.gold, color: SOUL.onGold,
                  fontFamily: FONT, fontWeight: 800,
                  fontSize: "0.60rem", minWidth: 16, height: 16,
                },
              }}
            >
              <InboxIcon sx={{ fontSize: 18 }} />
            </Badge>
          </Button>
        </Tooltip>
      </Box>
    </Box>
  </Box>
);