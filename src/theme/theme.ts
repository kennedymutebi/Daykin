import { createTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles"; // ← type-only import fixes ts(1484)

declare module "@mui/material/styles" {
  interface Palette {
    gold: Palette["primary"];
  }
  interface PaletteOptions {
    gold?: PaletteOptions["primary"];
  }
}

const shared = {
  typography: {
    fontFamily: '"Sora", "Helvetica Neue", sans-serif',
    h1: { fontSize: "3.25rem", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" },
    h2: { fontSize: "2.25rem", fontWeight: 700, lineHeight: 1.2 },
    h3: { fontSize: "1.5rem",  fontWeight: 700 },
    body1:   { fontSize: "0.9375rem" },
    body2:   { fontSize: "1.125rem"  },
    caption: { fontSize: "0.6875rem" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none" as const,
          fontWeight: 700,
          borderRadius: 8,
          padding: "10px 22px",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 20 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: "0 1px 0 rgba(0,0,0,0.08)" },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Palette rationale (matches the teal / marigold / orange identity already
// established by the birthday-card poster in BirthdayFeed.tsx):
//
//  - Gold is no longer a flat pasted-in amber (#F5A623 in both modes). It's
//    deepened and de-saturated slightly for light mode (sits on off-white —
//    needs weight to read as "gold" rather than "traffic-cone orange"), and
//    kept brighter for dark mode (needs to pop off near-black). Same hue
//    family, tuned per background instead of copy-pasted.
//  - Secondary was previously just background.default restated — an unused
//    slot. It's now the teal from the birthday poster, giving the app an
//    actual second color to create contrast/tension against the gold,
//    instead of a single accent floating on neutral gray/near-black.
//  - Backgrounds warmed very slightly off pure gray/near-black so they don't
//    read as generic dashboard neutrals.
// ---------------------------------------------------------------------------

export const darkTheme: Theme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary:    { main: "#F0B429", contrastText: "#0D0D0D" },
    secondary:  { main: "#1FAEC0", contrastText: "#0D0D0D" },
    background: { default: "#161B2E", paper: "#232840" },
    text:       { primary: "#F5F5F7", secondary: "#9E9E9E" },
    gold:       { main: "#F0B429" },
  },
});

export const lightTheme: Theme = createTheme({
  ...shared,
  palette: {
    mode: "light",
    primary:    { main: "#C97F0E", contrastText: "#FFFFFF" },
    secondary:  { main: "#127D8C", contrastText: "#FFFFFF" },
    background: { default: "#FAF7F2", paper: "#FFFFFF" },
    text:       { primary: "#0D0D0D", secondary: "#6B6B6B" },
    gold:       { main: "#C97F0E" },
  },
});

export default darkTheme;