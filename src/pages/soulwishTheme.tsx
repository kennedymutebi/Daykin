// soulwishTheme.ts
// Design tokens for the "SoulWish Aura" look — dark celestial navy + glowing gold,
// glassmorphism panels, Sora type. Pulled from the SoulWish Stitch design kit.
// Import from here instead of re-declaring colors/fonts in every component.

export const FONT = "'Sora', sans-serif";

export const SOUL = {
  bg: "#111125",
  bgDeep: "#0c0c1f",
  surface: "#1a1a2e",
  surfaceHigh: "#1e1e32",
  surfaceHighest: "#28283d",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.18)",
  text: "#e2e0fc",
  textMuted: "rgba(226,224,252,0.55)",
  textFaint: "rgba(226,224,252,0.32)",
  gold: "#F5A623",
  goldLight: "#FFD580",
  onGold: "#1A1A2E",
  success: "#5AC86A",
  error: "#E05A5A",
};

// Kept for call sites that still expect the old names
export const GOLD = SOUL.gold;
export const GOLD2 = SOUL.goldLight;

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };

export const glow = (alpha = 0.32) => `0 0 20px rgba(245,166,35,${alpha})`;

// Keeps content from edge-to-edge stretching on wide/desktop screens
export const containerSx = {
  maxWidth: 1200,
  mx: "auto",
  px: { xs: 2, md: 6 },
};

// Glassmorphism panel — modals, floating overlays
export const glassSx = (radius: number = RADIUS.lg) => ({
  bgcolor: "rgba(10,10,24,0.82)",
  backdropFilter: "blur(20px)",
  border: `1px solid ${SOUL.border}`,
  borderRadius: `${radius}px`,
});

export const dialogPaperSx = {
  borderRadius: `${RADIUS.xl}px`,
  bgcolor: SOUL.bg,
  border: `1px solid ${SOUL.border}`,
  backgroundImage: "none",
};

// Primary CTA — solid gold with navy text + soft glow, per DESIGN.md
export const goldButtonSx = (size: "sm" | "md" = "md") => ({
  fontFamily: FONT,
  fontWeight: 800,
  textTransform: "none" as const,
  borderRadius: `${RADIUS.sm}px`,
  bgcolor: SOUL.gold,
  color: SOUL.onGold,
  fontSize: size === "sm" ? "0.82rem" : "0.9rem",
  height: size === "sm" ? 38 : 46,
  boxShadow: glow(0.3),
  "&:hover": { bgcolor: SOUL.goldLight },
  "&.Mui-disabled": { bgcolor: "rgba(245,166,35,0.22)", color: "rgba(226,224,252,0.3)" },
});

// Secondary — ghost gold outline
export const ghostButtonSx = {
  fontFamily: FONT,
  fontWeight: 800,
  textTransform: "none" as const,
  borderRadius: `${RADIUS.full}px`,
  border: `1.5px solid ${SOUL.gold}`,
  color: SOUL.gold,
  "&:hover": { bgcolor: "rgba(245,166,35,0.10)" },
};

// Floating pill toggle used by the two search panels in the hero
export const pillToggleSx = (active: boolean) => ({
  fontFamily: FONT,
  fontWeight: 800,
  fontSize: "0.78rem",
  textTransform: "none" as const,
  borderRadius: `${RADIUS.full}px`,
  px: 2.2,
  py: 0.9,
  whiteSpace: "nowrap" as const,
  bgcolor: active ? "rgba(245,166,35,0.95)" : "rgba(0,0,0,0.55)",
  backdropFilter: "blur(14px)",
  color: active ? SOUL.onGold : "#fff",
  border: `1.5px solid ${active ? SOUL.gold : "rgba(255,255,255,0.28)"}`,
  transition: "all 0.25s ease",
  "&:hover": { bgcolor: active ? SOUL.gold : "rgba(0,0,0,0.72)" },
});

// Text field / select — illuminates gold on focus, per DESIGN.md component spec
export const fieldSx = (error?: boolean) => ({
  "& .MuiInputBase-root": {
    bgcolor: "rgba(255,255,255,0.06)",
    borderRadius: `${RADIUS.sm}px`,
    color: SOUL.text,
    fontFamily: FONT,
    fontSize: "0.9rem",
    "& fieldset": { border: `1px solid ${error ? "rgba(224,90,90,0.5)" : SOUL.border}` },
    "&:hover fieldset": { border: `1px solid ${error ? SOUL.error : SOUL.gold}80` },
    "&.Mui-focused fieldset": { border: `2px solid ${error ? SOUL.error : SOUL.gold}` },
  },
  "& .MuiInputBase-input::placeholder": { color: SOUL.textFaint, fontFamily: FONT },
});

export const selectSx = {
  ...fieldSx(),
  "& .MuiInputBase-root": { ...fieldSx()["& .MuiInputBase-root"], height: 46 },
  "& .MuiSelect-icon": { color: SOUL.textMuted },
};

export const menuPaperSx = {
  bgcolor: SOUL.surfaceHigh,
  borderRadius: `${RADIUS.md}px`,
  border: `1px solid ${SOUL.border}`,
  mt: 0.5,
  "& .MuiMenuItem-root": {
    fontFamily: FONT,
    fontSize: "0.88rem",
    fontWeight: 600,
    color: SOUL.text,
    "&:hover": { bgcolor: "rgba(245,166,35,0.12)" },
    "&.Mui-selected": { bgcolor: "rgba(245,166,35,0.18)", fontWeight: 800 },
  },
};

export const labelSx = {
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: "0.7rem",
  letterSpacing: "0.08em",
  color: SOUL.gold,
};

export const avatarRingSx = (size = 52) => ({
  width: size,
  height: size,
  border: `2px solid ${SOUL.gold}`,
  bgcolor: "rgba(245,166,35,0.2)",
  fontFamily: FONT,
  fontWeight: 800,
  color: SOUL.gold,
});