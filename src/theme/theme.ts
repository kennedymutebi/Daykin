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

export const darkTheme: Theme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary:    { main: "#F5A623", contrastText: "#0D0D0D" },
    secondary:  { main: "#1A1A2E", contrastText: "#F5F5F7" },
    background: { default: "#1A1A2E", paper: "#2A2A3E" },
    text:       { primary: "#F5F5F7", secondary: "#9E9E9E" },
    gold:       { main: "#F5A623" },
  },
});

export const lightTheme: Theme = createTheme({
  ...shared,
  palette: {
    mode: "light",
    primary:    { main: "#F5A623", contrastText: "#0D0D0D" },
    secondary:  { main: "#F5F5F7", contrastText: "#0D0D0D" },
    background: { default: "#F5F5F7", paper: "#FFFFFF" },
    text:       { primary: "#0D0D0D", secondary: "#6B6B6B" },
    gold:       { main: "#F5A623" },
  },
});

export default darkTheme;